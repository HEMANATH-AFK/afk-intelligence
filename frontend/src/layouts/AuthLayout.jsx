import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useOrchestrationStore } from '../stores/useOrchestrationStore';

export default function AuthLayout() {
  const theme = useOrchestrationStore(state => state.theme);

  return (
    <div className={`theme-${theme} min-h-screen bg-background relative flex items-center justify-center overflow-hidden cyber-grid`}>
      {/* Scanline CRT overlay */}
      <div className="absolute inset-0 scanlines pointer-events-none opacity-[0.07]" />

      {/* Futuristic Animated Glow Orbs */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        <motion.div 
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full mix-blend-screen filter blur-[120px]" 
        />
        <motion.div 
          animate={{
            scale: [1.2, 1, 1.2],
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full mix-blend-screen filter blur-[120px]" 
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md p-8"
      >
        <div className="glass-panel glow-border rounded-2xl p-8 backdrop-blur-xl">
          <div className="mb-8 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 shadow-[0_0_20px_var(--color-glow)]">
              <span className="font-mono font-bold text-xl text-white">AFK</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white text-glow">Intelligence Layer</h1>
            <p className="text-white/50 text-sm mt-2">Initialize your local agent</p>
          </div>
          
          <Outlet />
        </div>
      </motion.div>
    </div>
  );
}
