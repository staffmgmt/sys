import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';

// Navigation item type
interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  view: ViewMode;
}

// View mode type
type ViewMode = 'dashboard' | 'tasks' | 'console' | 'memory' | 'plugins';

interface SidebarProps {
  collapsed: boolean;
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, currentView, onViewChange }) => {
  // Navigation items
  const navItems: NavItem[] = [
    {
      name: 'Dashboard',
      path: '/',
      view: 'dashboard',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      name: 'Command Console',
      path: '/console',
      view: 'console',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      name: 'Task Queue',
      path: '/tasks',
      view: 'tasks',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
    {
      name: 'Agent Memory',
      path: '/memory',
      view: 'memory',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
      ),
    },
    {
      name: 'Plugins',
      path: '/plugins',
      view: 'plugins',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
        </svg>
      ),
    },
  ];

  const handleNavClick = (view: ViewMode) => {
    onViewChange(view);
  };

  // Animation variants for sidebar width
  const sidebarVariants = {
    expanded: { width: '240px', transition: { duration: 0.3 } },
    collapsed: { width: '70px', transition: { duration: 0.3 } },
  };

  // Animation variants for text fade
  const textVariants = {
    visible: { opacity: 1, x: 0, transition: { delay: 0.1, duration: 0.2 } },
    hidden: { opacity: 0, x: -10, transition: { duration: 0.2 } },
  };

  return (
    <motion.aside
      className="bg-primary-light border-r border-gray-700 flex flex-col overflow-hidden"
      variants={sidebarVariants}
      initial="expanded"
      animate={collapsed ? 'collapsed' : 'expanded'}
    >
      {/* Navigation links */}
      <nav className="flex-1 py-4">
        <ul className="space-y-2 px-2">
          {navItems.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.path}
                className={({ isActive }) => 
                  `flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
                    isActive || currentView === item.view
                      ? 'bg-accent-blue/20 text-accent-blue'
                      : 'text-gray-400 hover:bg-primary hover:text-gray-200'
                  }`
                }
                onClick={() => handleNavClick(item.view)}
              >
                <div>{item.icon}</div>
                <motion.span
                  className="font-medium"
                  variants={textVariants}
                  initial="visible"
                  animate={collapsed ? 'hidden' : 'visible'}
                >
                  {item.name}
                </motion.span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom section with user/agent info */}
      <div className="border-t border-gray-700 p-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="h-9 w-9 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold">A</span>
            </div>
            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-primary-light"></div>
          </div>
          {!collapsed && (
            <motion.div
              variants={textVariants}
              initial="visible"
              animate={collapsed ? 'hidden' : 'visible'}
              className="flex flex-col"
            >
              <span className="text-sm font-medium text-gray-300">Agent Trident</span>
              <span className="text-xs text-gray-500">ID: AGT-T7291</span>
            </motion.div>
          )}
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;