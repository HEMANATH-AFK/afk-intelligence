import { useState } from 'react';
import { Save, Sliders, Monitor, Cpu } from 'lucide-react';

export default function Settings() {
  const [model, setModel] = useState('gemma:2b');
  const [theme, setTheme] = useState('dark');
  const [animations, setAnimations] = useState(true);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">System Configuration</h1>
        <p className="text-white/50 text-sm">Manage local AI models and interface parameters.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-xl space-y-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 border-b border-white/5 pb-4">
              <Cpu className="w-5 h-5 text-primary" /> Active Model Parameters
            </h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Local LLM</label>
                <select 
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-surface2 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors appearance-none font-mono"
                >
                  <option value="gemma:2b">Gemma 2B (Default, Fast)</option>
                  <option value="llama3:8b">Llama 3 8B (Advanced)</option>
                  <option value="mistral:7b">Mistral 7B (Balanced)</option>
                </select>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-sm font-medium text-white/80">Context Window</label>
                <input type="range" min="2048" max="16384" step="1024" defaultValue="8192" className="w-full accent-primary" />
                <div className="flex justify-between text-xs text-white/40 font-mono">
                  <span>2k</span>
                  <span>8k</span>
                  <span>16k</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-xl space-y-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 border-b border-white/5 pb-4">
              <Monitor className="w-5 h-5 text-accent" /> Interface Preferences
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-white/80">Cinematic Animations</h3>
                  <p className="text-xs text-white/50 mt-1">Enable complex UI motion and particle effects.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={animations} onChange={() => setAnimations(!animations)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-surface2 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-xl border-primary/20 bg-primary/5">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Memory Usage</h3>
            <div className="text-3xl font-bold font-mono tracking-tight mb-4">4.2 <span className="text-lg text-white/50">GB</span></div>
            <div className="w-full bg-surface2 rounded-full h-2 mb-2 overflow-hidden">
              <div className="bg-gradient-to-r from-primary to-accent h-2 rounded-full" style={{ width: '45%' }}></div>
            </div>
            <p className="text-xs text-white/40">45% of allocated VRAM</p>
          </div>
          
          <button className="w-full bg-primary hover:bg-primary/80 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            <Save className="w-4 h-4" /> Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
