import { Bell, Search } from 'lucide-react';

export default function Topbar() {
  return (
    <div className="h-16 border-b border-white/5 bg-background/80 backdrop-blur-md flex items-center justify-between px-6 z-10 sticky top-0">
      <div className="flex items-center gap-2 text-white/50 w-64 border border-white/10 bg-surface rounded-full px-4 py-1.5 focus-within:border-primary/50 focus-within:text-white transition-colors">
        <Search className="w-4 h-4" />
        <input 
          type="text" 
          placeholder="Search knowledge base..." 
          className="bg-transparent border-none outline-none text-sm w-full font-sans"
        />
      </div>
      
      <div className="flex items-center gap-4">
        <button className="relative text-white/60 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-accent animate-pulse" />
        </button>
        <div className="w-8 h-8 rounded-full border border-white/10 overflow-hidden">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=AFK" alt="Avatar" className="w-full h-full object-cover" />
        </div>
      </div>
    </div>
  );
}
