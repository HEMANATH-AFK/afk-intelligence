import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, User, Loader2 } from 'lucide-react';
import { FadeDown, HoverScale } from '@hemanath-afk/afk-motion';

export default function Register() {
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
    <FadeDown>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="relative group/input">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/50 group-focus-within/input:text-primary transition-colors" />
            <input 
              type="text" 
              required
              placeholder="Agent Handle" 
              className="w-full bg-surface2/30 border border-primary/20 rounded-xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-primary/80 focus:shadow-[0_0_15px_var(--color-glow)] text-white transition-all font-mono placeholder-white/20"
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary/20 group-focus-within/input:bg-primary transition-colors" />
          </div>
          
          <div className="relative group/input">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/50 group-focus-within/input:text-primary transition-colors" />
            <input 
              type="email" 
              required
              placeholder="Network Address (Email)" 
              className="w-full bg-surface2/30 border border-primary/20 rounded-xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-primary/80 focus:shadow-[0_0_15px_var(--color-glow)] text-white transition-all font-mono placeholder-white/20"
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary/20 group-focus-within/input:bg-primary transition-colors" />
          </div>

          <div className="relative group/input">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/50 group-focus-within/input:text-primary transition-colors" />
            <input 
              type="password" 
              required
              placeholder="Neural Passcode" 
              className="w-full bg-surface2/30 border border-primary/20 rounded-xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-primary/80 focus:shadow-[0_0_15px_var(--color-glow)] text-white transition-all font-mono placeholder-white/20"
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary/20 group-focus-within/input:bg-primary transition-colors" />
          </div>
        </div>

        <HoverScale scale={1.015}>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-accent to-primary hover:opacity-95 text-white py-3 rounded-xl font-bold tracking-wide uppercase text-xs transition-all duration-300 shadow-[0_0_15px_var(--color-glow)] hover:shadow-[0_0_25px_var(--color-glow)] flex items-center justify-center gap-2 border border-primary/20 hover:border-primary/50 cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Initialize Profile'}
          </button>
        </HoverScale>

        <p className="text-center text-sm text-white/50">
          Already registered? <Link to="/login" className="text-primary hover:underline">Authenticate Here</Link>
        </p>
      </form>
    </FadeDown>
  );
}
