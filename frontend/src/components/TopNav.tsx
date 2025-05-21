// src/components/TopNav.tsx (Updated Links and Active Styling)
import React, { useState } from 'react';
import { motion } from 'framer-motion';
// Import NavLink for active styling
import { Link, NavLink } from 'react-router-dom';

interface TopNavProps {
  agentStatus: 'online' | 'offline' | 'busy';
}

const TopNav: React.FC<TopNavProps> = ({ agentStatus }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Define SVG paths (as before)
  const unmutedIconPath = "M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z";
  const mutedIconPath = "M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l-4-4m0 4l4-4";

  // Active link class helper
  const getNavLinkClass = ({ isActive }: { isActive: boolean }): string => {
      const baseClass = "px-3 py-2 rounded-md text-sm transition";
      const activeClass = "text-command-accent font-medium bg-command-highlight bg-opacity-50";
      const inactiveClass = "text-command-text-muted hover:text-command-text hover:bg-command-highlight";
      return `${baseClass} ${isActive ? activeClass : inactiveClass}`;
  };


  return (
    <motion.header
      // Removed sticky as it's part of the page now, not global fixed top
      className="bg-command-panel border-b border-command-highlight shadow-lg flex-shrink-0 z-10" // Added flex-shrink-0
      initial={{ y: -50 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-6">
            {/* Logo links to CommandCenter (root) */}
            <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
              <div className="h-9 w-9 bg-gradient-to-r from-blue-600 to-indigo-800 rounded-md flex items-center justify-center shadow-command-glow">
                {/* ... icon ... */}
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                 </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent hidden sm:inline">
                Command Center
              </span>
            </Link>

            {/* Navigation - Using NavLink for active state */}
            <nav className="hidden md:flex space-x-1 text-sm">
               {/* NavLink applies class based on active state */}
               <NavLink to="/" end className={getNavLinkClass}> {/* 'end' prop for exact root match */}
                  Command
               </NavLink>
              <NavLink to="/dashboard" className={getNavLinkClass}>
                Dashboard
              </NavLink>
              <NavLink to="/tasks" className={getNavLinkClass}> {/* Link to /tasks (shows TaskDashboard for now) */}
                Tasks
              </NavLink>
              {/* <NavLink to="/settings" className={getNavLinkClass}> Settings </NavLink> */}
            </nav>
          </div>

          {/* Right side controls (unchanged) */}
          <div className="flex items-center space-x-2 sm:space-x-4">
             {/* Status indicator */}
             <div className="flex items-center space-x-2">
                 <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                      agentStatus === 'online' ? 'bg-green-500 animate-pulse' :
                      agentStatus === 'busy' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                 <span className="text-sm text-command-text-muted hidden md:inline">
                     Agent: <span className="text-command-text capitalize">{agentStatus}</span>
                 </span>
             </div>

             {/* Quick action buttons */}
             <div className="hidden sm:flex items-center space-x-2">
                 {/* Mute Button */}
                 <button onClick={() => setIsMuted(!isMuted)} title={isMuted ? "Unmute" : "Mute"} className={`p-1.5 rounded-full transition ${ isMuted ? 'bg-command-highlight text-red-400' : 'text-command-text-muted hover:bg-command-highlight hover:text-command-text'}`}>
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}> {isMuted ? <path strokeLinecap="round" strokeLinejoin="round" d={mutedIconPath} /> : <path strokeLinecap="round" strokeLinejoin="round" d={unmutedIconPath} /> } </svg>
                 </button>
                 {/* Pause Button */}
                 <button onClick={() => setIsPaused(!isPaused)} title={isPaused ? "Resume" : "Pause"} className={`p-1.5 rounded-full transition ${ isPaused ? 'bg-command-highlight text-yellow-400' : 'text-command-text-muted hover:bg-command-highlight hover:text-command-text'}`}>
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}> {isPaused ? <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" /> : <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" /> } </svg>
                 </button>
                 {/* Settings Button - Placeholder Link */}
                 {/* <Link to="/settings" title="Settings" className="p-1.5 rounded-full text-command-text-muted hover:bg-command-highlight hover:text-command-text transition">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}> <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.004.827c-.292.24-.437.613-.43.992a6.759 6.759 0 010 1.255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.063-.374-.313-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.759 6.759 0 010-1.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /> <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /> </svg>
                 </Link> */}
             </div>

             {/* Agent avatar */}
             <div className="relative flex-shrink-0">
               <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-command-glow ring-2 ring-offset-2 ring-offset-command-panel ring-purple-500">
                 <span className="text-white font-bold text-lg">A</span> {/* Changed to 'A' */}
               </div>
               {agentStatus === 'busy' && (
                 <div className="absolute -top-1 -right-1 h-4 w-4 bg-yellow-500 rounded-full border-2 border-command-panel animate-ping"></div> // Added ping animation
               )}
             </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default TopNav;