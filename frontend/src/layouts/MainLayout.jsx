import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ActivityPanel from '../components/ActivityPanel';
import Topbar from '../components/Topbar';

export default function MainLayout() {
  return (
    <div className="h-screen w-screen bg-background flex overflow-hidden text-white font-sans">
      <Sidebar />
      
      <div className="flex-1 flex flex-col relative min-w-0">
        <Topbar />
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative p-6">
          <Outlet />
        </main>
      </div>

      <ActivityPanel />
    </div>
  );
}
