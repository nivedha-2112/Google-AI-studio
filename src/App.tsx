/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  Wind, 
  MapPin, 
  Activity, 
  LineChart as ChartIcon, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight,
  Info,
  FileText,
  RefreshCw,
  Droplets
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface PredictionHistory {
  time: string;
  value: number;
}

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cities, setCities] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [isTrained, setIsTrained] = useState(false);
  
  const [inputs, setInputs] = useState({
    city: '',
    state: '',
    pm10: '50',
    no2: '20',
    so2: '10',
    co: '0.5',
    o3: '30'
  });

  const [prediction, setPrediction] = useState<number | null>(null);
  const [history, setHistory] = useState<PredictionHistory[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    
    const formData = new FormData();
    formData.append('file', selectedFile);

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Upload failed');
      
      setCities(result.cities);
      setStates(result.states);
      setIsTrained(true);
      setSuccess(`Model trained on ${result.sampleCount} samples.`);
      if (result.cities.length > 0) setInputs(prev => ({ ...prev, city: result.cities[0] }));
      if (result.states.length > 0) setInputs(prev => ({ ...prev, state: result.states[0] }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePredict = async () => {
    if (!isTrained) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputs),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Prediction failed');
      
      setPrediction(result.prediction);
      const newHistory = [
        ...history, 
        { time: new Date().toLocaleTimeString(), value: result.prediction }
      ].slice(-10);
      setHistory(newHistory);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")' }} />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-white/10 backdrop-blur-md bg-black/20 p-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
            <Wind className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">EcoPredict <span className="text-emerald-400">AI</span></h1>
            <p className="text-[10px] uppercase tracking-[0.2em] opacity-40 font-mono">Pollution Forecasting System</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-4 text-xs font-mono opacity-50 uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isTrained ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-yellow-500'}`} />
              <span>{isTrained ? 'Engine Active' : 'Engine Offline'}</span>
            </div>
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-medium transition-all flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {file ? file.name : 'Upload Dataset'}
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".csv" 
            className="hidden" 
          />
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Controls */}
        <div className="lg:col-span-4 space-y-6">
          {/* Status Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl"
          >
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2 opacity-60">
              <Activity className="w-4 h-4" /> System Configuration
            </h2>
            
            {!isTrained ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10">
                  <FileText className="w-8 h-8 opacity-20" />
                </div>
                <p className="text-sm opacity-40 italic">Please upload a CSV dataset to initialize the Elastic Net model.</p>
                <p className="text-[10px] font-mono opacity-30 uppercase tracking-tighter">Required: State, City, PM2.5, PM10, NO2, SO2, CO, O3</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono opacity-40">State</label>
                    <select 
                      value={inputs.state}
                      onChange={(e) => setInputs({...inputs, state: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
                    >
                      {states.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono opacity-40">City</label>
                    <select 
                      value={inputs.city}
                      onChange={(e) => setInputs({...inputs, city: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
                    >
                      {cities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {['pm10', 'no2', 'so2', 'co', 'o3'].map((key) => (
                    <div key={key} className="space-y-1">
                      <label className="text-[10px] uppercase font-mono opacity-40">{key}</label>
                      <input 
                        type="number"
                        value={inputs[key as keyof typeof inputs]}
                        onChange={(e) => setInputs({...inputs, [key]: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
                      />
                    </div>
                  ))}
                </div>

                <button 
                  onClick={handlePredict}
                  disabled={loading}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-2xl transition-all flex items-center justify-center gap-2 group"
                >
                  {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                  Run Prediction
                </button>
              </div>
            )}
          </motion.div>

          {/* Info Card */}
          <div className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-emerald-400 mt-1" />
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-emerald-400">Model Insight</h3>
                <p className="text-xs leading-relaxed opacity-60">
                  This system utilizes Elastic Net Regression to predict PM2.5 levels. By combining L1 and L2 regularization, it effectively handles multicollinearity between pollutants like NO2 and CO.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Results & Charts */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Display */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="md:col-span-2 p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl flex flex-col justify-center relative overflow-hidden"
            >
              <div className="relative z-10">
                <h2 className="text-sm font-semibold opacity-40 mb-2 uppercase tracking-widest">Predicted PM2.5</h2>
                <div className="flex items-baseline gap-4">
                  <span className="text-7xl font-bold tracking-tighter text-emerald-400">
                    {prediction !== null ? prediction.toFixed(2) : '--.--'}
                  </span>
                  <span className="text-xl opacity-40 font-mono">µg/m³</span>
                </div>
                <p className="mt-4 text-xs opacity-40 flex items-center gap-2">
                  <MapPin className="w-3 h-3" /> Based on current inputs for {inputs.city || 'selected city'}
                </p>
              </div>
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Droplets className="w-32 h-32" />
              </div>
            </motion.div>

            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl flex flex-col justify-between">
              <h2 className="text-xs font-semibold opacity-40 uppercase tracking-widest">Air Quality Index</h2>
              <div className="space-y-4">
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: prediction ? `${Math.min(prediction, 100)}%` : '0%' }}
                    className={`h-full ${prediction && prediction > 50 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                  />
                </div>
                <p className="text-[10px] opacity-40 leading-relaxed">
                  {prediction && prediction > 50 
                    ? 'Moderate air quality. Sensitive groups should reduce prolonged outdoor exertion.' 
                    : 'Good air quality. Air pollution poses little or no risk.'}
                </p>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl h-[300px]">
              <h2 className="text-xs font-semibold opacity-40 mb-6 uppercase tracking-widest flex items-center gap-2">
                <ChartIcon className="w-4 h-4" /> Prediction History
              </h2>
              <ResponsiveContainer width="100%" height="80%">
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="time" stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px' }}
                    itemStyle={{ color: '#10b981' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#10b981" fillOpacity={1} fill="url(#colorVal)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl h-[300px]">
              <h2 className="text-xs font-semibold opacity-40 mb-6 uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-4 h-4" /> Pollutant Distribution
              </h2>
              <ResponsiveContainer width="100%" height="80%">
                <LineChart data={[
                  { name: 'PM10', val: parseFloat(inputs.pm10) },
                  { name: 'NO2', val: parseFloat(inputs.no2) },
                  { name: 'SO2', val: parseFloat(inputs.so2) },
                  { name: 'CO', val: parseFloat(inputs.co) * 10 }, // Scaled for visibility
                  { name: 'O3', val: parseFloat(inputs.o3) },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="name" stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px' }}
                  />
                  <Line type="stepAfter" dataKey="val" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: '#3b82f6' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Notifications */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5" /> {error}
              </motion.div>
            )}
            {success && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-3"
              >
                <CheckCircle2 className="w-5 h-5" /> {success}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="relative z-10 p-12 text-center border-t border-white/5">
        <p className="text-[10px] uppercase tracking-[0.4em] opacity-20">
          Advanced Environmental Analytics Platform © 2026
        </p>
      </footer>
    </div>
  );
}
