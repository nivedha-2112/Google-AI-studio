# Pollution Forecasting System (EcoPredict AI)

A full-stack application for predicting PM2.5 levels using Elastic Net Regression.

## Folder Structure
```
/
├── backend_flask.py      # Flask (Python) Backend for local system
├── server.ts             # Express (Node.js) Backend for preview/deployment
├── src/
│   ├── App.tsx           # React Frontend (UI & Charts)
│   ├── main.tsx          # React Entry Point
│   └── index.css         # Tailwind CSS Styles
├── package.json          # Node.js Dependencies
└── metadata.json         # App Metadata
```

## Local Installation Steps

### 1. Backend (Python/Flask)
You need Python 3.8+ installed.

```bash
# Install required Python packages
pip install flask flask-cors pandas numpy scikit-learn

# Run the Flask server
python backend_flask.py
```
The Flask server will run on `http://localhost:5000`.

### 2. Frontend (React/Vite)
You need Node.js installed.

```bash
# Install Node.js dependencies
npm install

# Run the development server
npm run dev
```
The frontend will be accessible at `http://localhost:3000`.

## Dataset Requirements
The application expects a CSV file with the following columns:
- `State`: Name of the state
- `City`: Name of the city
- `PM2.5`: Target pollutant level
- `PM10`: Feature pollutant level
- `NO2`: Feature pollutant level
- `SO2`: Feature pollutant level
- `CO`: Feature pollutant level
- `O3`: Feature pollutant level

## Features
- **Elastic Net Regression**: Combines L1 and L2 penalties for robust prediction.
- **Dynamic Charts**: Real-time visualization of prediction history and pollutant distribution.
- **Dark Transparent Theme**: Modern, glassmorphism-inspired UI.
- **City-Specific Predictions**: Model learns city-specific patterns via label encoding.
