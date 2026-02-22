# Cavista - AI-Powered Cancer Early Detection Platform

<p align="center">
  <img src="https://img.shields.io/badge/Status-Hackathon%20Ready-success?style=for-the-badge" alt="Status">
  <img src="https://img.shields.io/badge/AI-DenseNet121-blue?style=for-the-badge" alt="AI Model">
  <img src="https://img.shields.io/badge/Stack-Node.js%2BNext.js-green?style=for-the-badge" alt="Stack">
</p>

## 🎯 Mission

**"From Detection to Prevention"** - Catch cancer before it starts.

Cavista uses AI to analyze medical images and patient data to provide early cancer risk assessments, empowering patients and healthcare providers with actionable insights.

---

## 🚀 Features

### 1. AI-Powered Image Analysis
- **Chest X-Ray Screening** - DenseNet121 deep learning model for lung abnormality detection
- **Mammography Analysis** - Breast cancer screening with ML models
- **Multi-Model Consensus** - Results from multiple AI models for better accuracy

### 2. Report Analysis (GPT-4o)
- Paste any medical report (blood tests, imaging, biopsy)
- AI translates medical jargon into **plain English**
- Personalized recommendations and questions to ask your doctor

### 3. Longitudinal Tracking
- Track screening results over time
- Visual timeline of risk changes
- Detect patterns and trends early

### 4. Comprehensive Risk Assessment
- Family history analysis
- Genetic marker screening (BRCA, etc.)
- Lifestyle factors evaluation

### 5. Patient-Friendly UI
- Clean, modern interface
- Detailed but understandable results
- Downloadable reports for healthcare providers

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, Tailwind CSS |
| Backend | Node.js, Hono, TypeScript |
| Database | PostgreSQL (Prisma ORM) |
| ML Models | DenseNet121 (PyTorch), scikit-learn |
| AI | OpenAI GPT-4o (report analysis) |
| Deployment | Fly.io (backend), Vercel (frontend) |

---

## 📡 API Endpoints

### Authentication
```
POST /auth/signup     - Create account
POST /auth/login       - Login
```

### Screening
```
POST /screening/xray              - Chest X-ray analysis (DenseNet121)
POST /screening/mammography     - Mammogram analysis
POST /screening/report-analyze   - Text report AI analysis (GPT-4o)
POST /screening/risk-assessment  - Comprehensive risk scoring
POST /screening/longitudinal-track - Track changes over time
```

### Information
```
GET  /screening/history         - Get user's screening history
GET  /                           - API info
```

---

## 🖥️ Getting Started

### Prerequisites
- Node.js 20+
- Python 3.11+
- PostgreSQL database (optional for demo)

### Installation

```bash
# Clone the repo
git clone <repo-url>
cd backend

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your API keys (OpenAI, DATABASE_URL, etc.)

# Generate Prisma client
npx prisma generate

# Start development server
npm run dev
```

### Running ML Services

```bash
# Terminal 1: Start ML service (port 5000)
cd ml-model
python app.py

# The service handles both X-ray and mammography
```

### Build Frontend

```bash
cd frontend
npm run build
# Deploy to Vercel
npx vercel deploy
```

---

## 📱 Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/signup` | User registration |
| `/login` | User login |
| `/dashboard` | Overview & quick actions |
| `/screening` | New AI screening |
| `/longitudinal` | Prevention timeline |
| `/results` | History & results |
| `/report-analysis` | AI text report analyzer |
| `/risk-assessment` | Risk profile |

---

## 🔑 Environment Variables

```env
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
PORT=3000
ML_SERVICE_URL=http://localhost:5000
```

---

## 📄 API Response Examples

### Chest X-Ray Analysis
```json
{
  "hasAbnormality": false,
  "confidence": 0.85,
  "findings": [
    { "type": "Normal", "severity": "normal", "probability": 78.5 }
  ],
  "recommendation": "No significant abnormalities detected"
}
```

### Report Analysis
```json
{
  "summary": "Your blood test results show all values within normal ranges...",
  "findings": [
    { "term": "Hemoglobin", "explanation": "Protein in blood that carries oxygen - your level is healthy", "severity": "normal" }
  ],
  "recommendations": ["Continue maintaining a balanced diet", "Regular exercise"],
  "questionsForDoctor": ["Should I be concerned about my iron levels?"]
}
```

---

## ⚠️ Disclaimer

This is an AI-powered screening tool for informational purposes only. It is NOT a medical diagnosis. Always consult with qualified healthcare professionals for proper medical advice.

---

## 🏆 Hackathon Features (Judge Notes)

1. **Multi-Model AI** - DenseNet121, ResNet-50, EfficientNet for consensus
2. **GPT-4o Integration** - Plain English medical report analysis
3. **Longitudinal Tracking** - Unique prevention-focused feature
4. **End-to-End Pipeline** - From image upload to actionable insights
5. **Production-Ready** - Deployed on Fly.io + Vercel

---

## 📄 License

MIT License

---

<p align="center">Built with ❤️ for Hackathon 2026</p>
