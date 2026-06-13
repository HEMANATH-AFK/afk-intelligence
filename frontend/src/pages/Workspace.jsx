import { useState } from 'react';
import { FolderSearch, Loader2, FileCode, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Workspace() {
  const [path, setPath] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState(null);

  const handleScan = async () => {
    if (!path.trim()) return;
    setIsScanning(true);
    setResult(null);

    try {
      const res = await fetch('http://localhost:8000/api/workspace/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
      });
      const data = await res.json();
      setResult(data);
    } catch (error) {
      console.error(error);
      setResult({ error: 'Failed to connect to backend' });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Workspace Intelligence</h1>
        <p className="text-white/50 text-sm">Target a local directory for deep AI architectural analysis.</p>
      </div>

      <div className="glass-panel p-6 rounded-xl space-y-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <FolderSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input 
              type="text" 
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="Enter absolute path (e.g. C:\Projects\MyApp)" 
              className="w-full bg-surface2 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors font-mono"
            />
          </div>
          <button 
            onClick={handleScan}
            disabled={isScanning || !path}
            className="bg-primary hover:bg-primary/80 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isScanning ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Scanning</>
            ) : (
              'Initialize Scan'
            )}
          </button>
        </div>

        {isScanning && (
          <div className="h-64 border border-white/5 border-dashed rounded-xl flex flex-col items-center justify-center gap-4 text-white/50 bg-black/20">
            <div className="w-16 h-16 rounded-full border border-primary/30 flex items-center justify-center relative">
              <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin" />
              <Loader2 className="w-6 h-6 text-primary animate-pulse" />
            </div>
            <p className="font-mono text-sm animate-pulse">Running architectural diagnostics...</p>
          </div>
        )}

        {result && !result.error && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-lg flex items-center gap-3 text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>{result.summary}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-surface2 p-5 rounded-lg border border-white/5 space-y-4">
                <h3 className="text-white/60 text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                  <FileCode className="w-4 h-4" /> Detected Stack
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.technologies?.map(tech => (
                    <span key={tech} className="bg-primary/20 text-primary px-3 py-1 rounded-md text-xs font-mono border border-primary/30">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-surface2 p-5 rounded-lg border border-white/5 space-y-4">
                <h3 className="text-white/60 text-sm font-semibold uppercase tracking-wider">Architecture Analysis</h3>
                <p className="text-sm text-white/80 leading-relaxed font-mono">
                  {result.architecture}
                </p>
              </div>
            </div>

            <div className="bg-surface2 p-5 rounded-lg border border-white/5 space-y-4">
                <h3 className="text-white/60 text-sm font-semibold uppercase tracking-wider">Suggested Improvements</h3>
                <ul className="space-y-2">
                  {result.improvements?.map((imp, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>
          </motion.div>
        )}

        {result && result.error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg flex items-center gap-3 text-sm">
            <span>{result.error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
