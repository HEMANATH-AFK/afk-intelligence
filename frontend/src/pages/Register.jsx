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
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input 
              type="text" 
              required
              placeholder="Agent Handle" 
              className="w-full bg-surface border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors font-mono"
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input 
              type="email" 
              required
              placeholder="Network Address (Email)" 
              className="w-full bg-surface border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors font-mono"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input 
              type="password" 
              required
              placeholder="Neural Passcode" 
              className="w-full bg-surface border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors font-mono"
            />
          </div>
        </div>

        <HoverScale scale={1.03}>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-accent to-primary hover:opacity-90 text-white py-3 rounded-xl font-medium transition-all duration-200 shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Initialize Profile'}
          </button>
        </HoverScale>

        <p className="text-center text-sm text-white/50">
          Already registered? <Link to="/login" className="text-primary hover:underline">Authenticate Here</Link>
        </p>
      </form>
    </FadeDown>
  );
}
