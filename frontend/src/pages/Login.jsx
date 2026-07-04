import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, Loader2 } from 'lucide-react';
import { FadeUp, HoverTilt } from '@hemanath-afk/afk-motion';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate('/');
    }, 1500);
  };

  return (
    <FadeUp>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="relative group/input">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within/input:text-primary transition-colors" />
            <input 
              type="email" 
              required
              placeholder="Agent Designation (Email)" 
              className="w-full bg-surface2 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 text-slate-900 transition-all font-sans placeholder-slate-450"
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-slate-200 group-focus-within/input:bg-primary transition-colors" />
          </div>
          
          <div className="relative group/input">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within/input:text-primary transition-colors" />
            <input 
              type="password" 
              required
              placeholder="Neural Passcode" 
              className="w-full bg-surface2 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 text-slate-900 transition-all font-sans placeholder-slate-450"
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-slate-200 group-focus-within/input:bg-primary transition-colors" />
          </div>
        </div>

        <HoverTilt maxTilt={8} scale={1.015}>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-95 text-white py-3 rounded-xl font-bold tracking-wide uppercase text-xs transition-all duration-300 shadow-[0_0_15px_var(--color-glow)] hover:shadow-[0_0_25px_var(--color-glow)] flex items-center justify-center gap-2 border border-primary/20 hover:border-primary/50 cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Authenticate Agent'}
          </button>
        </HoverTilt>

        <p className="text-center text-sm text-white/50">
          New agent? <Link to="/register" className="text-primary hover:underline">Request Access</Link>
        </p>
      </form>
    </FadeUp>
  );
}
