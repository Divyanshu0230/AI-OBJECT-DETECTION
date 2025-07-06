// AI Object Detection Pro - Production Version

// Set your Render backend URL here
const API_BASE_URL = window.location.hostname === "localhost"
  ? ""
  : "https://ai-object-detection-9nez.onrender.com"; // Updated with your Render backend URL

// Global variables
let modelIsLoaded = false;
let cameraAvailable = false;
let aiEnabled = false;
let fps = 16;
let confidence = 0.35;
let sessionId;
let objectDetector;
let isDetecting = false;
let lastDetectionTime = 0;
let detectionInterval = 800;
let lastResults = [];
let detectionCounter = 0;
let maxDetections = 12;
let detectionHistory = [];
let historyLength = 2;
let minDetectionCount = 1;
let sessionStartTime = null;

// DOM elements - will be initialized after DOM loads
let video, c1, ctx1, loadingScreen, loadingText, cameraStatus, aiStatus, detectionInfo;

// Check authentication on page load
document.addEventListener('DOMContentLoaded', function () {
    // Check if user is authenticated
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }
    
    // Initialize DOM elements
    initializeDOMElements();
    
    // Set up all event listeners
    setupEventListeners();
    
    // Generate session ID
    sessionId = generateSessionId();
    
    // Check if ML5.js is available
    if (typeof ml5 === 'undefined') {
        console.error("❌ ML5.js not loaded!");
        loadingText.textContent = "Error: ML5.js failed to load. Please check your internet connection and refresh.";
        return;
    }
    
    initializeAI();
    initializeCamera();
});

// Initialize DOM elements
function initializeDOMElements() {
    video = document.getElementById("video");
    c1 = document.getElementById('c1');
    ctx1 = c1.getContext('2d');
    loadingScreen = document.getElementById("loadingScreen");
    loadingText = document.getElementById("loadingText");
    cameraStatus = document.getElementById("cameraStatus");
    aiStatus = document.getElementById("aiStatus");
    detectionInfo = document.getElementById("detectionInfo");
}

// Initialize ML5.js Object Detector with optimized parameters
function initializeAI() {
    loadingText.textContent = "Loading AI Model...";
    
    // Use optimized parameters for faster, better multi-object detection
    if (typeof ml5 !== 'undefined') {
        objectDetector = ml5.objectDetector('cocossd', { 
            threshold: 0.35,
            maxNumBoxes: maxDetections,
            iouThreshold: 0.4,
            scoreThreshold: 0.35
        }, modelLoaded);
    } else {
        console.error("❌ ML5.js not loaded!");
        loadingText.textContent = "Error: ML5.js failed to load. Please refresh the page.";
        setTimeout(initializeAI, 2000);
    }
}

// Model loaded callback
function modelLoaded() {
    modelIsLoaded = true;
    loadingText.textContent = "AI Model Loaded!";
    aiStatus.textContent = "AI: Ready";
    aiStatus.className = "status ready";
    checkReady();
}

// Generate unique session ID
function generateSessionId() {
    sessionStartTime = new Date();
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Camera setup with better error handling
const constraints = {
    audio: false,
    video: {
        facingMode: "environment",
        width: { ideal: 1280 },
        height: { ideal: 720 }
    }
};

function initializeCamera() {
    loadingText.textContent = "Initializing Camera...";
    
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: 'environment'
            } 
        })
        .then(function(stream) {
            video.srcObject = stream;
            video.onloadedmetadata = function() {
                video.play();
                cameraAvailable = true;
                loadingText.textContent = "Camera Ready!";
                cameraStatus.textContent = "Camera: Active";
                cameraStatus.className = "status ready";
                checkReady();
            };
        })
        .catch(function(error) {
            console.error("❌ Camera error:", error);
            loadingText.textContent = "Camera Error: " + error.message;
            cameraStatus.textContent = "Camera: Error";
            cameraStatus.className = "status error";
        });
    } else {
        console.error("❌ Camera not supported");
        loadingText.textContent = "Camera not supported in this browser";
        cameraStatus.textContent = "Camera: Not Supported";
        cameraStatus.className = "status error";
    }
}

// Check if everything is ready
function checkReady() {
    if (modelIsLoaded && cameraAvailable) {
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
            document.getElementById("ai").disabled = false;
            startDetection();
            startSessionTimer();
        }, 1000);
    }
}

// Start real-time session timer
function startSessionTimer() {
    if (!sessionStartTime) return;
    
    // Update session duration every second
    setInterval(() => {
        updateSessionDuration();
    }, 1000);
    
    // Initial update
    updateSessionDuration();
}

// Update session duration display
function updateSessionDuration() {
    if (!sessionStartTime) return;
    
    const now = new Date();
    const durationMs = now - sessionStartTime;
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    const durationString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Update any session duration displays on the page
    const sessionDurationElements = document.querySelectorAll('[data-session-duration]');
    sessionDurationElements.forEach(el => {
        el.textContent = durationString;
    });
}

// Optimized detection loop with faster timing
function startDetection() {
    requestAnimationFrame(detectionLoop);
}

function detectionLoop() {
    if (isReady()) {
        // Only update canvas if video is ready
        if (video.videoWidth > 0 && video.videoHeight > 0) {
            setResolution();
            drawVideoFrame();
            
            // Draw last detection results if available
            if (lastResults.length > 0) {
                drawDetections(lastResults);
            }
            
            // Perform detection with faster throttling
            if (aiEnabled && !isDetecting && (Date.now() - lastDetectionTime) > detectionInterval) {
                performDetection();
            }
        }
    }
    
    // Use requestAnimationFrame for smooth performance
    setTimeout(() => requestAnimationFrame(detectionLoop), 1000 / fps);
}

function isReady() {
    return modelIsLoaded && cameraAvailable;
}

// Optimized canvas drawing
function drawVideoFrame() {
    try {
        ctx1.drawImage(video, 0, 0, c1.width, c1.height);
    } catch (error) {
        console.warn("Canvas drawing error:", error);
    }
}

// Set canvas resolution with better handling
function setResolution() {
    if (!video.videoWidth || !video.videoHeight) return;
    
    const maxWidth = Math.min(window.innerWidth * 0.9, 800);
    const maxHeight = Math.min(window.innerHeight * 0.6, 600);
    
    let targetWidth = video.videoWidth;
    let targetHeight = video.videoHeight;
    
    // Scale down if too large
    if (targetWidth > maxWidth) {
        const ratio = maxWidth / targetWidth;
        targetWidth = maxWidth;
        targetHeight = targetHeight * ratio;
    }
    
    if (targetHeight > maxHeight) {
        const ratio = maxHeight / targetHeight;
        targetHeight = maxHeight;
        targetWidth = targetWidth * ratio;
    }
    
    // Only update if dimensions changed
    if (c1.width !== targetWidth || c1.height !== targetHeight) {
        c1.width = targetWidth;
        c1.height = targetHeight;
    }
}

// Toggle AI detection
function toggleAi() {
    aiEnabled = document.getElementById("ai").checked;
    if (aiEnabled) {
        detectionInterval = 800; // 800ms between detections for faster response
        lastResults = []; // Clear previous results
        detectionHistory = []; // Clear detection history
    } else {
        // Clear any existing detections
        drawVideoFrame();
        lastResults = [];
        detectionHistory = [];
        updateDetectionInfo([]);
    }
}

// Change FPS with performance optimization
function changeFps() {
    const fpsSlider = document.getElementById("fps");
    fps = parseInt(fpsSlider.value);
    document.getElementById("fpsValue").textContent = fps;
}

// Change confidence threshold
function changeConfidence() {
    const confidenceSlider = document.getElementById("confidence");
    confidence = confidenceSlider.value / 100;
    document.getElementById("confidenceValue").textContent = confidenceSlider.value;
}

// Calculate distance between two bounding boxes
function calculateBoxDistance(box1, box2) {
    const center1 = { x: box1.x + box1.width/2, y: box1.y + box1.height/2 };
    const center2 = { x: box2.x + box2.width/2, y: box2.y + box2.height/2 };
    return Math.sqrt(Math.pow(center1.x - center2.x, 2) + Math.pow(center1.y - center2.y, 2));
}

// Check if two detections are similar (same object)
function isSimilarDetection(det1, det2) {
    const distance = calculateBoxDistance(det1, det2);
    const sizeDiff = Math.abs(det1.width * det1.height - det2.width * det2.height) / (det1.width * det1.height);
    const labelMatch = det1.label === det2.label;
    
    // Consider similar if: same label, close position, similar size
    return labelMatch && distance < 100 && sizeDiff < 0.5;
}

// Lightweight smoothing for faster response
function smoothDetections(currentResults) {
    // Add current results to history
    detectionHistory.push(currentResults);
    
    // Keep only recent history
    if (detectionHistory.length > historyLength) {
        detectionHistory.shift();
    }
    
    // If not enough history, return current results
    if (detectionHistory.length < 1) {
        return currentResults;
    }
    
    // For faster response, use current results but filter by confidence
    const highConfidenceResults = currentResults.filter(result => result.confidence >= confidence);
    
    // Sort by confidence and limit
    highConfidenceResults.sort((a, b) => b.confidence - a.confidence);
    
    return highConfidenceResults.slice(0, maxDetections);
}

// Optimized object detection for speed and multi-object support
function performDetection() {
    if (isDetecting || !objectDetector) return;
    
    isDetecting = true;
    lastDetectionTime = Date.now();
    detectionCounter++;
    
    try {
        objectDetector.detect(c1, (err, results) => {
            isDetecting = false;
            
            if (err) {
                console.error("❌ Detection error:", err);
                return;
            }

            // Filter results by confidence
            const filteredResults = results
                .filter(result => result.confidence >= confidence)
                .slice(0, maxDetections);
            
            // Apply lightweight smoothing
            const smoothedResults = smoothDetections(filteredResults);
            
            // Update last results for stable display
            lastResults = smoothedResults;
            
            // Update detection info
            updateDetectionInfo(smoothedResults);

            // Save to database if objects detected
            if (smoothedResults.length > 0) {
                saveDetection(smoothedResults);
            } else {
                // Clear detection info if no objects
                if (detectionInfo) {
                    detectionInfo.textContent = "No objects detected";
                    detectionInfo.className = "detection-info";
                }
            }
        });
    } catch (error) {
        console.error("❌ Detection execution error:", error);
        isDetecting = false;
    }
}

// Optimized detection drawing with better visibility for multiple objects
function drawDetections(results) {
    if (!results || results.length === 0) return;
    
    // Use different colors for different objects
    const colors = ['#00ff00', '#ff0000', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff8800', '#8800ff', '#00ff88', '#ff0088', '#888888', '#444444'];
    
    results.forEach((element, index) => {
        const color = colors[index % colors.length];
        
        // Draw bounding box with thicker lines
        ctx1.beginPath();
        ctx1.strokeStyle = color;
        ctx1.lineWidth = 3; // Slightly thinner for multiple objects
        ctx1.rect(element.x, element.y, element.width, element.height);
        ctx1.stroke();

        // Draw label with better background
        const label = `${element.label} ${(element.confidence * 100).toFixed(0)}%`;
        const fontSize = 14; // Slightly smaller for multiple objects
        ctx1.font = `bold ${fontSize}px Inter`;
        const textWidth = ctx1.measureText(label).width;
        
        // Better background rectangle
        ctx1.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx1.fillRect(element.x, element.y - fontSize - 6, textWidth + 10, fontSize + 6);

        // Text with better contrast
        ctx1.fillStyle = color;
        ctx1.fillText(label, element.x + 5, element.y - 8);
        
        // Add object number for multiple objects
        if (results.length > 1) {
            ctx1.fillStyle = color;
            ctx1.font = `bold 12px Inter`;
            ctx1.fillText(`#${index + 1}`, element.x + element.width - 20, element.y + 15);
        }
    });
}

// Update detection info display with better formatting for multiple objects
function updateDetectionInfo(results) {
    if (results.length === 0) {
        detectionInfo.innerHTML = '<p>No objects detected</p>';
        return;
    }

    const infoHTML = results.map((result, index) => `
        <div class="detection-item">
            <strong>${index + 1}. ${result.label}</strong> - ${(result.confidence * 100).toFixed(1)}% confidence
        </div>
    `).join('');

    detectionInfo.innerHTML = `
        <div class="detection-header">
            Detected ${results.length} object${results.length > 1 ? 's' : ''}:
        </div>
        ${infoHTML}
    `;
}

// Save detection to server
async function saveDetection(objects) {
    try {
        const deviceInfo = {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screenResolution: `${screen.width}x${screen.height}`,
            timestamp: new Date().toISOString()
        };

        const response = await fetch(API_BASE_URL + '/api/detections', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                objects: objects,
                sessionId: sessionId,
                deviceInfo: deviceInfo
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error saving detection:', error);
        return null;
    }
}

// Show statistics modal
async function showStats() {
    try {
        const response = await fetch(API_BASE_URL + `/api/stats?sessionId=${sessionId}`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const stats = await response.json();

        // Update stats display
        const totalDetectionsEl = document.getElementById('totalDetections');
        const totalObjectsEl = document.getElementById('totalObjects');
        const avgConfidenceEl = document.getElementById('avgConfidence');
        const sessionDurationEl = document.getElementById('sessionDuration');
        const popularObjectsListEl = document.getElementById('popularObjectsList');

        if (totalDetectionsEl) totalDetectionsEl.textContent = stats.totalDetections;
        if (totalObjectsEl) totalObjectsEl.textContent = stats.totalObjects;
        if (avgConfidenceEl) avgConfidenceEl.textContent = `${stats.avgConfidence}%`;
        if (sessionDurationEl) sessionDurationEl.textContent = stats.sessionDuration;

        // Update popular objects list
        if (popularObjectsListEl) {
            popularObjectsListEl.innerHTML = '';
            stats.popularObjects.forEach(obj => {
                const li = document.createElement('li');
                li.textContent = `${obj._id}: ${obj.count} detections`;
                popularObjectsListEl.appendChild(li);
            });
        }

        showModal('statsModal');
        
        // Start real-time session duration updates while modal is open
        startStatsSessionTimer();
        
    } catch (error) {
        console.error('Error fetching stats:', error);
        alert('Failed to load statistics. Please try again.');
    }
}

// Start real-time session timer for stats modal
function startStatsSessionTimer() {
    if (!sessionStartTime) return;
    
    // Clear any existing timer
    if (window.statsSessionTimer) {
        clearInterval(window.statsSessionTimer);
    }
    
    // Add live indicator to session duration
    const sessionDurationEl = document.getElementById('sessionDuration');
    if (sessionDurationEl) {
        // Remove any existing live indicator first
        const existingIndicator = sessionDurationEl.querySelector('#liveIndicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        // Add a live indicator
        const liveIndicator = document.createElement('span');
        liveIndicator.id = 'liveIndicator';
        liveIndicator.innerHTML = ' <span class="live-dot">●</span>';
        liveIndicator.style.color = '#00ff00';
        liveIndicator.style.fontSize = '12px';
        liveIndicator.title = 'Live updating';
        sessionDurationEl.appendChild(liveIndicator);
    }
    
    // Start timer that updates every second
    window.statsSessionTimer = setInterval(() => {
        if (!sessionStartTime) return;
        
        const now = new Date();
        const durationMs = now - sessionStartTime;
        const minutes = Math.floor(durationMs / 60000);
        const seconds = Math.floor((durationMs % 60000) / 1000);
        const durationString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        const currentSessionDurationEl = document.getElementById('sessionDuration');
        if (currentSessionDurationEl && sessionStartTime) {
            const liveIndicator = currentSessionDurationEl.querySelector('#liveIndicator');
            currentSessionDurationEl.textContent = durationString;
            if (liveIndicator) {
                currentSessionDurationEl.appendChild(liveIndicator);
            }
        }
    }, 1000);
}

// Show history modal
async function showHistory() {
    try {
        const response = await fetch(API_BASE_URL + '/api/detections', {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const detections = await response.json();
        
        const historyListEl = document.getElementById('historyList');
        if (historyListEl) {
            historyListEl.innerHTML = '';
            
            if (detections.length === 0) {
                historyListEl.innerHTML = '<p>No detection history found.</p>';
            } else {
                detections.slice(0, 20).forEach(detection => {
                    const historyDiv = document.createElement('div');
                    historyDiv.className = 'history-item';
                    historyDiv.innerHTML = `
                        <div class="history-info">
                            <p><strong>Objects:</strong> ${detection.objects.length}</p>
                            <p><strong>Date:</strong> ${new Date(detection.timestamp).toLocaleString()}</p>
                            <p><strong>Session:</strong> ${detection.sessionId}</p>
                        </div>
                    `;
                    historyListEl.appendChild(historyDiv);
                });
            }
        }
        
        showModal('historyModal');
    } catch (error) {
        console.error('Error fetching history:', error);
        alert('Failed to load history. Please try again.');
    }
}

// Modal functions
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        
        // Add click outside to close
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal(modalId);
            }
        });
        
        // Add escape key to close
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeModal(modalId);
            }
        });
        
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        
        // Stop stats session timer if stats modal is being closed
        if (modalId === 'statsModal' && window.statsSessionTimer) {
            clearInterval(window.statsSessionTimer);
            window.statsSessionTimer = null;
        }
    }
}

// Global close modal function
window.closeModal = closeModal;

// Set up all event listeners
function setupEventListeners() {
    // Main control event listeners
    const aiToggle = document.getElementById("ai");
    const fpsSlider = document.getElementById("fps");
    const confidenceSlider = document.getElementById("confidence");
    const captureBtn = document.getElementById("captureBtn");
    const capturesBtn = document.getElementById("capturesBtn");
    const statsBtn = document.getElementById("statsBtn");
    const historyBtn = document.getElementById("historyBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    
    if (aiToggle) aiToggle.addEventListener("change", toggleAi);
    if (fpsSlider) fpsSlider.addEventListener("input", changeFps);
    if (confidenceSlider) confidenceSlider.addEventListener("input", changeConfidence);
    if (captureBtn) captureBtn.addEventListener("click", captureImage);
    if (capturesBtn) capturesBtn.addEventListener("click", showCaptures);
    if (statsBtn) statsBtn.addEventListener("click", showStats);
    if (historyBtn) historyBtn.addEventListener("click", showHistory);
    if (logoutBtn) logoutBtn.addEventListener("click", logout);
    
    // Modal event listeners
    setupModalEventListeners();
}

// Set up modal event listeners
function setupModalEventListeners() {
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                closeModal(modal.id);
            }
        });
    });

    // Close modal when pressing Escape
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            const openModals = document.querySelectorAll('.modal.show');
            openModals.forEach(modal => {
                closeModal(modal.id);
            });
        }
    });

    // Close modal when clicking close button
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('close-btn')) {
            const modalId = event.target.getAttribute('data-modal');
            if (modalId) {
                closeModal(modalId);
            }
        }
    });
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Logout function
async function logout() {
    try {
        const token = localStorage.getItem('authToken');
        await fetch(API_BASE_URL + '/api/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        // Clear local storage
        localStorage.removeItem('authToken');
        localStorage.removeItem('email');
        
        // Redirect to login
        window.location.href = '/login.html';
    }
}

// Helper function to get auth headers
function getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

// Handle page visibility changes
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // console.log("📱 Page hidden - pausing detection");
    } else {
        // console.log("📱 Page visible - resuming detection");
    }
});

// Handle window resize with debouncing
let resizeTimeout;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (isReady()) {
            setResolution();
        }
    }, 250);
}); 

// Capture image with detected objects
async function captureImage() {
    try {
        // Get canvas data
        const canvas = document.getElementById('c1');
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        
        // Get current detected objects
        const currentObjects = lastResults.length > 0 ? lastResults : [];
        
        const deviceInfo = {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screenResolution: `${screen.width}x${screen.height}`,
            timestamp: new Date().toISOString()
        };

        const response = await fetch(API_BASE_URL + '/api/captures', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                imageData: imageData,
                objects: currentObjects,
                sessionId: sessionId,
                deviceInfo: deviceInfo
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        
        // Show success notification
        showNotification('Image captured successfully!', 'success');
        
        return result;
    } catch (error) {
        console.error('Error capturing image:', error);
        showNotification('Failed to capture image', 'error');
        return null;
    }
}

// Draw detections on a specific canvas context
function drawDetectionsOnCanvas(ctx, results) {
    if (!results || results.length === 0) return;
    
    const colors = ['#00ff00', '#ff0000', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff8800', '#8800ff', '#00ff88', '#ff0088', '#888888', '#444444'];
    
    results.forEach((element, index) => {
        const color = colors[index % colors.length];
        
        // Draw bounding box
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.rect(element.x, element.y, element.width, element.height);
        ctx.stroke();

        // Draw label
        const label = `${element.label} ${(element.confidence * 100).toFixed(0)}%`;
        const fontSize = 14;
        ctx.font = `bold ${fontSize}px Inter`;
        const textWidth = ctx.measureText(label).width;
        
        // Background rectangle
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(element.x, element.y - fontSize - 6, textWidth + 10, fontSize + 6);

        // Text
        ctx.fillStyle = color;
        ctx.fillText(label, element.x + 5, element.y - 8);
        
        // Object number for multiple objects
        if (results.length > 1) {
            ctx.fillStyle = color;
            ctx.font = `bold 12px Inter`;
            ctx.fillText(`#${index + 1}`, element.x + element.width - 20, element.y + 15);
        }
    });
}

// Save capture to backend
async function saveCapture(captureData) {
    try {
        const response = await fetch(API_BASE_URL + '/api/captures', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(captureData)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        return result;
        
    } catch (error) {
        console.error('❌ Error saving capture:', error);
        throw error;
    }
}

// Show capture success message
function showCaptureSuccess() {
    
    try {
        // Create a temporary success message
        const successDiv = document.createElement('div');
        successDiv.className = 'capture-success';
        successDiv.innerHTML = `
            <div class="capture-success-content">
                <i class="fas fa-check-circle"></i>
                <div class="capture-success-text">
                    <div class="capture-success-title">Capture saved successfully!</div>
                    <div class="capture-success-subtitle">Click "Captures" to preview and download</div>
                </div>
                <button class="capture-success-btn" id="viewCapturesBtn">
                    <i class="fas fa-images"></i> View Captures
                </button>
            </div>
        `;
        
        // Add to page
        document.body.appendChild(successDiv);
        
        // Add event listener to the button
        const viewCapturesBtn = successDiv.querySelector('#viewCapturesBtn');
        if (viewCapturesBtn) {
            viewCapturesBtn.addEventListener('click', function() {
                showCaptures();
                successDiv.remove();
            });
        }
        
        // Remove after 8 seconds
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 8000);
        
    } catch (error) {
        console.error('❌ Error showing capture success notification:', error);
        // Fallback to simple alert
        alert('Capture saved successfully! Click "Captures" to view.');
    }
}

// Download image function - Fixed version
function downloadImage(base64Data, filename) {
    try {
        
        // Create a temporary link element
        const link = document.createElement('a');
        
        // Set the href to the base64 data
        link.href = base64Data;
        
        // Set the download attribute with the filename
        link.download = filename;
        
        // Set some additional attributes for better compatibility
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        
        // Append to body, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
    } catch (error) {
        console.error('❌ Download error:', error);
        alert('Download failed: ' + error.message);
    }
}

// Show download success message
function showDownloadSuccess(filename) {
    
    const downloadDiv = document.createElement('div');
    downloadDiv.className = 'download-success';
    downloadDiv.innerHTML = `
        <div class="download-success-content">
            <i class="fas fa-download"></i>
            <span>Downloading: ${filename}</span>
        </div>
    `;
    
    document.body.appendChild(downloadDiv);
    
    setTimeout(() => {
        if (downloadDiv.parentNode) {
            downloadDiv.parentNode.removeChild(downloadDiv);
        }
    }, 3000);
}

// Show captures modal
async function showCaptures() {
    try {
        const response = await fetch(API_BASE_URL + '/api/captures', {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const captures = await response.json();

        const capturesListEl = document.getElementById('capturesList');
        if (capturesListEl) {
            capturesListEl.innerHTML = '';
            
            if (captures.length === 0) {
                capturesListEl.innerHTML = `
                    <div class="no-captures-message">
                        <i class="fas fa-camera"></i>
                        <p>No captures available yet.</p>
                        <p class="no-captures-subtitle">Enable AI detection and use the Capture button to save detection images!</p>
                    </div>
                `;
            } else {
                captures.forEach(capture => {
                    const captureDiv = document.createElement('div');
                    captureDiv.className = 'capture-item';
                    captureDiv.innerHTML = `
                        <img src="${capture.imageData}" alt="Capture" onclick="downloadImage('${capture.imageData}', 'capture_${capture.id}.jpg')">
                        <div class="capture-info">
                            <p><strong>Objects:</strong> ${capture.objects.length}</p>
                            <p><strong>Date:</strong> ${new Date(capture.timestamp).toLocaleString()}</p>
                            <button onclick="downloadImage('${capture.imageData}', 'capture_${capture.id}.jpg')" class="btn btn-primary btn-sm">
                                <i class="fas fa-download"></i> Download
                            </button>
                        </div>
                    `;
                    capturesListEl.appendChild(captureDiv);
                });
            }
        }
        
        showModal('capturesModal');
    } catch (error) {
        console.error('Error fetching captures:', error);
        alert('Failed to load captures: ' + error.message);
    }
} 

// Download capture function - Simplified and fixed version
function downloadCapture(captureId, base64Data, filename, event) {
    
    try {
        // Validate the base64 data
        if (!base64Data || base64Data.length < 100) {
            throw new Error('Invalid image data');
        }
        
        // Create a temporary link element for direct download
        const link = document.createElement('a');
        link.href = base64Data;
        link.download = filename;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        
        // Append to body, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
    } catch (error) {
        console.error('❌ Download error:', error);
        
        // Fallback: Open in new window for manual download
        try {
            const newWindow = window.open(base64Data, '_blank');
            if (newWindow) {
                showDownloadSuccess(filename + ' (opened in new window)');
                
                // Update button to show success
                const button = event.target.closest('button');
                if (button) {
                    const originalText = button.innerHTML;
                    button.innerHTML = '<i class="fas fa-external-link-alt"></i> Opened!';
                    button.classList.add('download-success');
                    button.disabled = true;
                    
                    setTimeout(() => {
                        button.innerHTML = originalText;
                        button.classList.remove('download-success');
                        button.disabled = false;
                    }, 2000);
                }
            } else {
                throw new Error('Popup blocked. Please allow popups for this site.');
            }
        } catch (fallbackError) {
            console.error('❌ Fallback download error:', fallbackError);
            alert('Download failed: ' + error.message + '\n\nPlease right-click the image and select "Save image as..."');
            
            // Update button to show error
            const button = event.target.closest('button');
            if (button) {
                const originalText = button.innerHTML;
                button.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Failed';
                button.classList.add('download-error');
                button.disabled = true;
                
                setTimeout(() => {
                    button.innerHTML = originalText;
                    button.classList.remove('download-error');
                    button.disabled = false;
                }, 2000);
            }
        }
    }
} 