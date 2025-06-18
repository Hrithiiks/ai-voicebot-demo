# 🧠 Hrithik AI Voicebot

An interactive voicebot that simulates real-life personal Q&A for job interviews — built using React, Gemini API, and Netlify Functions.

🔗 **Live Demo:** [https://hrithik-ai-voicebot.netlify.app](https://hrithik-ai-voicebot.netlify.app)

![Screenshot of voicebot UI](./screenshot.png)

---

## 💡 Project Overview

This was built as part of Stage 1 of the Home.LLC interview process.  
It mimics my personality, answers reflective questions, and provides a realistic chatbot experience with voice and text input.

---

## 🎙 Features

- 🔁 Uses Gemini API to answer like *Hrithik* based on few-shot examples
- 🎤 Voice input (Web Speech API)
- 🗣 Voice output (SpeechSynthesis API)
- 💬 Text-based fallback chat interface
- 🚀 Fully deployed on Netlify with serverless backend

---

## ⚙️ Tech Stack

| Frontend | Backend         | AI Model     | Hosting    |
|----------|------------------|--------------|------------|
| React    | Netlify Functions | Gemini Pro API | Netlify     |

---

## 🧠 Sample Questions It Can Answer

- What’s your life story?
- What’s your superpower?
- How do you handle failure?
- Where do you see yourself in 5 years?
- What kind of team do you thrive in?
- And more — all answered like Hrithik!

---

## 📂 Folder Structure

/src
└── App.jsx
/netlify/functions
└── chat.js
screenshot.png
README.md

yaml
Copy
Edit

---

## ✍️ Author

**Hrithik S**  
MSc Computer Science (AI) – CUSAT  
[GitHub](https://github.com/Hrithiiks) | [LinkedIn](https://linkedin.com/in/your-link)

---

## ✅ How to Run Locally (Optional)

```bash
npm install
npm run dev