import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MessageSquare, 
  FolderSearch, 
  BrainCircuit, 
  TerminalSquare, 
  Settings 
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: MessageSquare, label: 'Chat', path: '/chat' },
  { icon: FolderSearch, label: 'Workspace', path: '/workspace' },
  { icon: BrainCircuit, label: 'Memory', path: '/memory' },
  { icon: TerminalSquare, label: 'Terminal', path: '/terminal' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export default function Sidebar() {
  return (
    <div className="w-64 bg-surface/50 border-r border-white/5 flex flex-col backdrop-blur-md">
      <div className="h-16 flex items-center px-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            <span className="font-mono font-bold text-xs">AI</span>
          </div>
          <span className="font-semibold tracking-wide text-sm">AFK Intel</span>
        </div>
      </div>
      
      <div className="flex-1 py-6 px-4 flex flex-col gap-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => clsx(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 relative group overflow-hidden",
              isActive ? "text-white bg-white/5" : "text-white/60 hover:text-white hover:bg-white/5"
            )}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div 
                    layoutId="activeTab" 
                    className="absolute inset-0 bg-white/5 border-l-2 border-primary" 
                    initial={false}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon className={clsx("w-4 h-4 relative z-10", isActive && "text-primary")} />
                <span className="relative z-10 font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
      
      <div className="p-4 border-t border-white/5">
        <div className="bg-surface3/50 rounded-lg p-3 flex items-center gap-3 border border-white/5">
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse" />
          <div className="flex flex-col">
            <span className="text-xs font-medium">Core Online</span>
            <span className="text-[10px] text-white/50 font-mono">LATENCY: 12ms</span>
          </div>
        </div>
      </div>
    </div>
  );
}
