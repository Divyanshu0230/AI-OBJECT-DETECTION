# 🤖 AI Object Detection

[![Deployed Link](https://img.shields.io/badge/Live%20Demo-Click%20Here-brightgreen)](https://ai-object-detection-9nez.onrender.com)

---

## 🚀 Deployed Link
**Live Demo:** [https://ai-object-detection-9nez.onrender.com](https://ai-object-detection-9nez.onrender.com)

---

## 📚 Overview
AI Object Detection is a real-time, web-based application that uses machine learning (ml5.js, COCO-SSD) to detect objects from your device camera. It features user authentication, live statistics, detection history, and a modern, responsive UI.

---

## ✨ Features
- Real-time object detection (COCO-SSD, ml5.js)
- Multi-object, multi-class support
- User authentication (email/password)
- Live statistics and analytics
- Detection history and image capture
- Responsive design (desktop/mobile)
- Secure backend (Node.js, Express, MongoDB)

---

## 🏗️ System Architecture
**High-level overview of the application flow:**

```mermaid
graph TD
  User[User (Browser)]
  Frontend[Frontend (HTML/JS/CSS, ml5.js)]
  Backend[Backend (Node.js/Express)]
  DB[(MongoDB Atlas)]

  User -->|Camera Stream| Frontend
  Frontend -->|API Calls| Backend
  Backend -->|User Data| DB
  Frontend -->|Static Files| Backend
```

---

## 🏛️ System Design
**Main modules and their relationships:**

```mermaid
graph TD
  UI[UI (HTML/CSS/JS)]
  ML[ml5.js (COCO-SSD)]
  Camera[Camera Access]
  APIClient[API Client]
  Express[Express Server]
  Auth[Auth Module]
  Detect[Detection API]
  Stats[Stats/History API]
  Mongo[MongoDB Client]

  UI --> ML
  UI --> Camera
  UI --> APIClient
  APIClient --> Express
  Express --> Auth
  Express --> Detect
  Express --> Stats
  Auth --> Mongo
  Detect --> Mongo
  Stats --> Mongo
```

---

## 📝 Low Level Design (LLD)
**Detailed flow for authentication and detection:**

```mermaid
graph TD;
  subgraph User Flow
    U1[User: Sign Up / Login]
    U2[Frontend: Send Email/Password]
    U3[Backend: Validate & Hash Password]
    U4[Backend: Store/Retrieve User in MongoDB]
    U5[Backend: Generate Token]
    U6[Frontend: Store Token]
    U7[User: Enable Camera]
    U8[Frontend: Start Video Stream]
    U9[Frontend: Run ml5.js Detection]
    U10[Frontend: Show Results, Call /api/detections]
    U11[Backend: Save Detection, Update Stats]
    U12[Frontend: Show Stats/History]
  end
  U1 --> U2 --> U3 --> U4 --> U5 --> U6
  U7 --> U8 --> U9 --> U10 --> U11 --> U12
```

---

## 🗂️ Tech Stack
- **Frontend:** HTML5, CSS3, JavaScript, ml5.js, COCO-SSD
- **Backend:** Node.js, Express.js, MongoDB Atlas
- **Deployment:** Render.com (full-stack)

---

## ⚙️ Installation

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Git

### Local Setup
```bash
git clone <your-repo-url>
cd ai-object-detection
npm install
cp env.example .env # Add your MongoDB URI to .env
npm start
# Visit http://localhost:3000
```

---

## 🌐 Deployment
- **Backend & Frontend:** [Render.com](https://render.com)
- Add `MONGODB_URI` as environment variable
- Deploy and get your live link

---

## 🖥️ Usage
1. Sign up or log in with your email
2. Allow camera access
3. Enable AI detection
4. View real-time object detection
5. Capture images, view stats/history

---

## 🔒 Security
- Email/password authentication (bcrypt)
- CORS protection
- Environment variables for secrets
- HTTPS by default (Render)

---

## 🏛️ System Design Highlights
- **Stateless API**: All user state is in token/cookies
- **Scalable**: Can be containerized, deployed to cloud
- **Modular**: Frontend and backend can be split if needed

---

## 🤝 Contributing
1. Fork the repo
2. Create a feature branch
3. Commit changes
4. Open a pull request

---

## 📄 License
MIT License

---

## 🆘 Support
- [Open an issue](https://github.com/Divyanshu0230/AI-OBJECT-DETECTION/issues)
- [Live Demo](https://ai-object-detection-9nez.onrender.com)

---

**Built with ❤️ using AI and modern web technologies**
