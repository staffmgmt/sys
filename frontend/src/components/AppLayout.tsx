import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import TopNavbar from './TopNavbar';
import Sidebar from './Sidebar';
import { motion } from 'framer-motion';

// Define the main layout types
type ViewMode = 'dashboard' | 'tasks' | 'console' | 'memory' | 'plugins';

const AppLayout: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Toggle sidebar collapsed state
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };
  
  return (
    <div className="min-h-screen bg-primary text-gray-100 flex flex-col">
      {/* Top navigation bar with agent status */}
      <TopNavbar onMenuToggle={toggleSidebar} />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar navigation */}
        <Sidebar 
          collapsed={sidebarCollapsed} 
          currentView={currentView}
          onViewChange={setCurrentView}
        />
        
        {/* Main content area with animated transitions */}
        <motion.main 
          className="flex-1 overflow-x-hidden overflow-y-auto bg-primary p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="container mx-auto">
            <Outlet />
          </div>
        </motion.main>
      </div>
    </div>
  );
};

export default AppLayout;