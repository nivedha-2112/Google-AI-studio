import express from "express";
import { createServer as createViteServer } from "vite";
import { MultivariateLinearRegression } from "ml-regression";
import multer from "multer";
import { parse } from "csv-parse/sync";
import fs from "fs";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  const upload = multer({ dest: "uploads/" });

  // In-memory storage for the model and data
  let model: any = null;
  let cityMap: Record<string, number> = {};
  let stateMap: Record<string, number> = {};
  let features: string[] = ["PM10", "NO2", "SO2", "CO", "O3"];

  // API Routes
  app.post("/api/upload", upload.single("file"), (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const fileContent = fs.readFileSync(req.file.path, "utf-8");
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
      });

      // Cleanup
      fs.unlinkSync(req.file.path);

      if (records.length === 0) {
        return res.status(400).json({ error: "CSV is empty" });
      }

      // Process data for training
      // Columns: State, City, PM2.5, PM10, NO2, SO2, CO, O3
      const X: number[][] = [];
      const Y: number[] = [];

      cityMap = {};
      stateMap = {};
      let cityCounter = 0;
      let stateCounter = 0;

      records.forEach((row: any) => {
        const city = row.City;
        const state = row.State;
        
        if (!(city in cityMap)) cityMap[city] = cityCounter++;
        if (!(state in stateMap)) stateMap[state] = stateCounter++;

        const pm25 = parseFloat(row["PM2.5"]);
        const pm10 = parseFloat(row["PM10"]);
        const no2 = parseFloat(row["NO2"]);
        const so2 = parseFloat(row["SO2"]);
        const co = parseFloat(row["CO"]);
        const o3 = parseFloat(row["O3"]);

        if (!isNaN(pm25) && !isNaN(pm10) && !isNaN(no2) && !isNaN(so2) && !isNaN(co) && !isNaN(o3)) {
          // Features: CityID, StateID, PM10, NO2, SO2, CO, O3
          X.push([cityMap[city], stateMap[state], pm10, no2, so2, co, o3]);
          Y.push(pm25);
        }
      });

      if (X.length === 0) {
        return res.status(400).json({ error: "No valid numeric data found in CSV" });
      }

      model = new MultivariateLinearRegression(X, Y);

      res.json({ 
        message: "Model trained successfully", 
        sampleCount: X.length,
        cities: Object.keys(cityMap),
        states: Object.keys(stateMap)
      });
    } catch (error: any) {
      console.error("Upload/Train error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/predict", (req, res) => {
    try {
      if (!model) {
        return res.status(400).json({ error: "Model not trained yet. Please upload a dataset." });
      }

      const { city, state, pm10, no2, so2, co, o3 } = req.body;
      
      const cityId = cityMap[city];
      const stateId = stateMap[state];

      if (cityId === undefined || stateId === undefined) {
        return res.status(400).json({ error: "City or State not found in training data" });
      }

      const input = [cityId, stateId, parseFloat(pm10), parseFloat(no2), parseFloat(so2), parseFloat(co), parseFloat(o3)];
      const prediction = model.predict(input);

      res.json({ prediction });
    } catch (error: any) {
      console.error("Prediction error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
