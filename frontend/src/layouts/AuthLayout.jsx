import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse delay-1000" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md p-8"
      >
        <div className="glass-panel glow-border rounded-2xl p-8 backdrop-blur-xl">
          <div className="mb-8 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(59,130,246,0.5)]">
              <span className="font-mono font-bold text-xl">AFK</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Intelligence Layer</h1>
            <p className="text-white/50 text-sm mt-2">Initialize your local agent</p>
          </div>
          
          <Outlet />
        </div>
      </motion.div>
    </div>
  );
}
