const express = require('express');
const path = require('path');
const cors = require('cors');
const crypto = require('crypto');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
require('dotenv').config();
console.log('MongoDB URI:', process.env.MONGODB_URI);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://ai-object-detection-app.vercel.app"
  ],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'ai-object-detection';
let db, usersCollection;

// Connect to MongoDB
MongoClient.connect(MONGODB_URI, { useUnifiedTopology: true })
  .then(client => {
    db = client.db(DB_NAME);
    usersCollection = db.collection('users');
    console.log('✅ Connected to MongoDB for user storage');
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
  });

// Update generateToken and verifyToken to use role from DB
function generateToken(username, role) {
    const payload = {
        username: username,
        timestamp: Date.now(),
        role: role
    };
    return Buffer.from(JSON.stringify(payload)).toString('base64');
}

function verifyToken(token) {
    try {
        const payload = JSON.parse(Buffer.from(token, 'base64').toString());
        // No in-memory user check; trust token for now (can add DB check if needed)
        // Check if token is not too old (24 hours)
        if (Date.now() - payload.timestamp > 24 * 60 * 60 * 1000) {
            return null;
        }
        return payload;
    } catch (error) {
        return null;
    }
}

// Authentication middleware
function requireAuth(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                  req.cookies?.authToken ||
                  req.query.token;
    
    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    const payload = verifyToken(token);
    if (!payload) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    req.user = payload;
    next();
}

// Signup endpoint (MongoDB)
app.post('/api/signup', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    if (username.length < 3) {
        return res.status(400).json({ error: 'Username must be at least 3 characters long' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    try {
        // Check if user exists
        const existing = await usersCollection.findOne({ username });
        if (existing) {
            return res.status(409).json({ error: 'Username already exists' });
        }
        // Hash password
        const hashed = await bcrypt.hash(password, 10);
        const userDoc = {
            username,
            password: hashed,
            role: 'user',
            createdAt: new Date()
        };
        await usersCollection.insertOne(userDoc);
        console.log(`✅ New user registered: ${username}`);
        const token = generateToken(username, 'user');
        res.cookie('authToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000
        });
        res.json({ success: true, token, user: { username, role: 'user' } });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ error: 'Signup failed' });
    }
});

// Login endpoint (MongoDB)
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    try {
        const user = await usersCollection.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        const token = generateToken(username, user.role);
        res.cookie('authToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000
        });
        res.json({ success: true, token, user: { username, role: user.role } });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
    res.clearCookie('authToken');
    res.json({ success: true, message: 'Logged out successfully' });
});

// Serve login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Redirect root to login if not authenticated
app.get('/', (req, res) => {
    const token = req.cookies?.authToken || req.query.token;
    
    if (!token || !verifyToken(token)) {
        return res.redirect('/login');
    }
    
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// In-memory storage for production mode
let detections = [];
let captures = [];
let stats = {
    totalDetections: 0,
    totalCaptures: 0,
    uniqueSessions: new Set(),
    popularObjects: {},
    sessionStartTimes: {} // Track when each session started
};

// Save detection endpoint
app.post('/api/detections', requireAuth, (req, res) => {
    try {
        const { objects, sessionId, deviceInfo } = req.body;
        
        if (!objects || !Array.isArray(objects)) {
            return res.status(400).json({ error: 'Invalid detection data' });
        }

        const detection = {
            id: Date.now().toString(),
            objects: objects,
            sessionId: sessionId,
            deviceInfo: deviceInfo,
            timestamp: new Date(),
            userId: req.user.username
        };

        detections.push(detection);

        // Update stats
        stats.totalDetections++;
        stats.uniqueSessions.add(sessionId);
        
        // Track session start time if this is the first detection for this session
        if (!stats.sessionStartTimes[sessionId]) {
            stats.sessionStartTimes[sessionId] = new Date();
        }
        
        // Update popular objects
        objects.forEach(obj => {
            const label = obj.label;
            stats.popularObjects[label] = (stats.popularObjects[label] || 0) + 1;
        });

        res.json({ success: true, id: detection.id });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save detection' });
    }
});

// Optimized stats endpoint
app.get('/api/stats', requireAuth, (req, res) => {
    try {
        const { sessionId } = req.query;
        
        // Filter data for current user
        const userDetections = detections.filter(detection => detection.userId === req.user.username);
        const userCaptures = captures.filter(capture => capture.userId === req.user.username);
        
        const popularObjectsArray = Object.entries(stats.popularObjects)
            .map(([label, count]) => ({ _id: label, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // Calculate total objects detected for this user
        let totalObjects = 0;
        let totalConfidence = 0;
        let confidenceCount = 0;
        
        userDetections.forEach(detection => {
            detection.objects.forEach(obj => {
                totalObjects++;
                totalConfidence += obj.confidence;
                confidenceCount++;
            });
        });
        
        // Calculate average confidence
        const avgConfidence = confidenceCount > 0 ? (totalConfidence / confidenceCount * 100).toFixed(1) : 0;
        
        // Calculate session duration
        let sessionDuration = '0:00';
        if (sessionId && stats.sessionStartTimes[sessionId]) {
            const startTime = stats.sessionStartTimes[sessionId];
            const now = new Date();
            const durationMs = now - startTime;
            const minutes = Math.floor(durationMs / 60000);
            const seconds = Math.floor((durationMs % 60000) / 1000);
            sessionDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }

        const statsData = {
            totalDetections: userDetections.length,
            totalCaptures: userCaptures.length,
            totalObjects: totalObjects,
            avgConfidence: avgConfidence,
            sessionDuration: sessionDuration,
            popularObjects: popularObjectsArray
        };

        res.json(statsData);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Optimized history endpoint with better filtering
app.get('/api/detections', requireAuth, (req, res) => {
    try {
        const { sessionId, limit = 20, offset = 0 } = req.query;
        
        let filteredDetections = detections.filter(d => d.userId === req.user.username);
        
        // Filter by session if provided
        if (sessionId) {
            filteredDetections = filteredDetections.filter(d => d.sessionId === sessionId);
        }
        
        // Apply pagination
        const paginatedDetections = filteredDetections
            .slice(parseInt(offset), parseInt(offset) + parseInt(limit))
            .map(detection => ({
                id: detection.id,
                objects: detection.objects,
                timestamp: detection.timestamp,
                sessionId: detection.sessionId
            }));

        res.json(paginatedDetections);
        
    } catch (error) {
        console.error('❌ Error getting detections:', error);
        res.status(500).json({ error: 'Failed to get detection history' });
    }
});

// Save capture endpoint
app.post('/api/captures', requireAuth, (req, res) => {
    try {
        const { imageData, objects, sessionId, deviceInfo } = req.body;
        
        if (!imageData) {
            return res.status(400).json({ error: 'Image data is required' });
        }

        const capture = {
            id: Date.now().toString(),
            imageData: imageData,
            objects: objects || [],
            sessionId: sessionId,
            deviceInfo: deviceInfo,
            timestamp: new Date(),
            userId: req.user.username
        };

        captures.push(capture);
        stats.totalCaptures++;

        res.json({ success: true, id: capture.id });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save capture' });
    }
});

// Get captures endpoint
app.get('/api/captures', requireAuth, (req, res) => {
    try {
        const userCaptures = captures.filter(capture => capture.userId === req.user.username);
        res.json(userCaptures);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch captures' });
    }
});

// Get a specific capture by ID
app.get('/api/captures/:id', (req, res) => {
    try {
        const captureId = req.params.id;
        const capture = captures.find(c => c.id === captureId);
        
        if (!capture) {
            return res.status(404).json({ error: 'Capture not found' });
        }
        
        res.json(capture);
        
    } catch (error) {
        console.error('❌ Error getting capture:', error);
        res.status(500).json({ error: 'Failed to get capture' });
    }
});



// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 AI Object Detection Server running on port ${PORT}`);
    console.log(`📱 Open http://localhost:${PORT} to use the application`);
}); 