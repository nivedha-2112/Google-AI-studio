from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.linear_model import ElasticNet
from sklearn.preprocessing import LabelEncoder
import os

app = Flask(__name__)
CORS(app)

# Global variables to store model and encoders
model = None
city_encoder = LabelEncoder()
state_encoder = LabelEncoder()

@app.route('/api/upload', methods=['POST'])
def upload_file():
    global model, city_encoder, state_encoder
    
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    try:
        df = pd.read_csv(file)
        
        # Required columns: State, City, PM2.5, PM10, NO2, SO2, CO, O3
        required_cols = ['State', 'City', 'PM2.5', 'PM10', 'NO2', 'SO2', 'CO', 'O3']
        if not all(col in df.columns for col in required_cols):
            return jsonify({"error": f"Missing columns. Required: {required_cols}"}), 400
        
        # Drop rows with missing values in required columns
        df = df.dropna(subset=required_cols)
        
        # Encode categorical variables
        df['City_Encoded'] = city_encoder.fit_transform(df['City'])
        df['State_Encoded'] = state_encoder.fit_transform(df['State'])
        
        # Features and Target
        X = df[['City_Encoded', 'State_Encoded', 'PM10', 'NO2', 'SO2', 'CO', 'O3']]
        y = df['PM2.5']
        
        # Train Elastic Net model
        model = ElasticNet(alpha=1.0, l1_ratio=0.5)
        model.fit(X, y)
        
        return jsonify({
            "message": "Model trained successfully using Elastic Net",
            "sampleCount": len(df),
            "cities": city_encoder.classes_.tolist(),
            "states": state_encoder.classes_.tolist()
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/predict', methods=['POST'])
def predict():
    global model, city_encoder, state_encoder
    
    if model is None:
        return jsonify({"error": "Model not trained. Please upload a dataset first."}), 400
    
    data = request.json
    try:
        city = data.get('city')
        state = data.get('state')
        pm10 = float(data.get('pm10'))
        no2 = float(data.get('no2'))
        so2 = float(data.get('so2'))
        co = float(data.get('co'))
        o3 = float(data.get('o3'))
        
        # Encode inputs
        try:
            city_encoded = city_encoder.transform([city])[0]
            state_encoded = state_encoder.transform([state])[0]
        except ValueError:
            return jsonify({"error": "City or State not recognized from training data"}), 400
            
        features = np.array([[city_encoded, state_encoded, pm10, no2, so2, co, o3]])
        prediction = model.predict(features)[0]
        
        return jsonify({"prediction": float(prediction)})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
