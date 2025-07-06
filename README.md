# 🤖 AI Object Detection

A real-time AI-powered object detection application using ml5.js, COCO-SSD model, and modern web technologies.

## ✨ Features

- **Real-time AI Detection**: Uses Google's COCO-SSD model for object recognition
- **Multi-object Detection**: Detects multiple objects simultaneously
- **User Authentication**: Sign up/Sign in with JWT tokens
- **Live Statistics**: Real-time detection stats and analytics
- **Capture & Download**: Save and download detected images
- **Detection History**: View past detections and captures
- **Responsive Design**: Works on desktop and mobile devices
- **Session Management**: Track user sessions and data

## 🚀 Live Demo

- **Frontend**: [Your Vercel URL]
- **Backend**: [Your Render URL]

## 🛠️ Tech Stack

### Frontend
- **HTML5/CSS3/JavaScript**
- **ml5.js** - Machine Learning library
- **COCO-SSD** - Pre-trained object detection model
- **Canvas API** - Real-time video processing

### Backend
- **Node.js** - Server runtime
- **Express.js** - Web framework
- **MongoDB** - Database (Atlas)
- **JWT** - Authentication

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas account
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ai-object-detection
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your MongoDB Atlas connection string
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

## 🌐 Deployment

### Step 1: MongoDB Atlas Setup

1. **Create MongoDB Atlas Account**
   - Go to [mongodb.com/atlas](https://mongodb.com/atlas)
   - Sign up for free account
   - Choose "FREE" tier (M0)

2. **Create Database Cluster**
   - Click "Build a Database"
   - Choose "FREE" tier
   - Select cloud provider and region
   - Click "Create"

3. **Set Up Database Access**
   - Go to "Database Access"
   - Click "Add New Database User"
   - Create username/password
   - Select "Read and write to any database"

4. **Set Up Network Access**
   - Go to "Network Access"
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)

5. **Get Connection String**
   - Go to "Database" → "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database password

### Step 2: Backend Deployment (Render)

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Deploy Backend**
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: `ai-object-detection-backend`
     - **Environment**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Plan**: Free

3. **Add Environment Variables**
   - Go to "Environment" tab
   - Add:
     - `MONGODB_URI`: Your MongoDB Atlas connection string
     - `JWT_SECRET`: Random secret string
     - `NODE_ENV`: `production`

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Copy your backend URL

### Step 3: Frontend Deployment (Vercel)

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub

2. **Deploy Frontend**
   - Click "New Project"
   - Import your GitHub repository
   - Configure:
     - **Framework Preset**: Other
     - **Root Directory**: `./`
     - **Build Command**: Leave empty
     - **Output Directory**: `public`

3. **Add Environment Variables**
   - Go to "Settings" → "Environment Variables"
   - Add:
     - `REACT_APP_API_URL`: Your Render backend URL

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Copy your frontend URL

### Step 4: Update Configuration

1. **Update Backend CORS**
   - In your Render dashboard
   - Add environment variable:
     - `CORS_ORIGIN`: Your Vercel frontend URL

2. **Update Frontend API URL**
   - In your Vercel dashboard
   - Update environment variable:
     - `REACT_APP_API_URL`: Your Render backend URL

## 🔧 Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-super-secret-key` |
| `PORT` | Server port (auto-set by hosting) | `3000` |
| `NODE_ENV` | Environment mode | `production` |
| `CORS_ORIGIN` | Allowed frontend domain | `https://your-app.vercel.app` |

## 📱 Usage

1. **Sign Up/Login**: Create account using the Sign Up form
2. **Enable Camera**: Allow camera access when prompted
3. **Toggle AI**: Click "AI" button to start detection
4. **Adjust Settings**: Modify FPS and confidence levels
5. **Capture Images**: Click "Capture" to save detected objects
6. **View Stats**: Check real-time statistics and history
7. **Download**: Save captured images to your device

## 🔒 Security Features

- **JWT Authentication**: Secure user sessions
- **CORS Protection**: Cross-origin request security
- **Input Validation**: Server-side data validation
- **Environment Variables**: Secure configuration management
- **HTTPS**: Encrypted data transmission

## 📊 AI Technology

This application uses **real AI technology**:

- **ml5.js**: JavaScript library for machine learning
- **COCO-SSD**: Google's pre-trained object detection model
- **TensorFlow.js**: Google's machine learning framework
- **Real-time Inference**: AI analysis of video frames
- **Confidence Scoring**: AI provides confidence levels for detections

**Detectable Objects**: 80+ categories including people, animals, vehicles, furniture, electronics, and more.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review deployment logs

---

**Built with ❤️ using AI and modern web technologies**
