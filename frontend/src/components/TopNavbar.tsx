import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TopNavbarProps {
  onMenuToggle: () => void;
}

// Agent status types
type AgentStatus = 'online' | 'offline' | 'busy' | 'paused';

const TopNavbar: React.FC<TopNavbarProps> = ({ onMenuToggle }) => {
  const [agentStatus, setAgentStatus] = useState<AgentStatus>('online');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update the clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Get status color based on agent status
  const getStatusColor = (status: AgentStatus): string => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'paused': return 'bg-blue-500';
      case 'offline': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  
  // Toggle agent status (simplified for now)
  const toggleAgentStatus = () => {
    const statusCycle: AgentStatus[] = ['online', 'busy', 'paused', 'offline'];
    const currentIndex = statusCycle.indexOf(agentStatus);
    const nextIndex = (currentIndex + 1) % statusCycle.length;
    setAgentStatus(statusCycle[nextIndex]);
  };
  
  return (
    <nav className="bg-primary-light border-b border-gray-700 p-3 shadow-lg">
      <div className="flex items-center justify-between">
        {/* Left side - Logo and menu button */}
        <div className="flex items-center space-x-4">
          <button 
            onClick={onMenuToggle}
            className="text-gray-400 hover:text-accent-blue focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div className="flex items-center">
            <span className="text-xl font-bold text-accent-blue tracking-tight">
              AGENT COMMAND CENTER
            </span>
            <div className="ml-2 flex items-center text-xs text-gray-400">
              <span>v3.4.0</span>
            </div>
          </div>
        </div>
        
        {/* Center - Status indicators */}
        <div className="hidden md:flex items-center space-x-6">
          {/* Agent status indicator */}
          <div className="flex items-center space-x-2">
            <button 
              onClick={toggleAgentStatus}
              className="flex items-center space-x-2 px-3 py-1 rounded-md bg-primary-lighter hover:bg-primary-light transition-colors"
            >
              <div className={`h-3 w-3 rounded-full ${getStatusColor(agentStatus)} shadow-glow`}></div>
              <span className="text-gray-300 capitalize text-sm">{agentStatus}</span>
            </button>
          </div>
          
          {/* System stats - simplified placeholders */}
          <div className="flex items-center space-x-3 text-xs text-gray-400">
            <div className="flex items-center">
              <span className="font-mono">CPU: 12%</span>
              <div className="ml-1 w-16 bg-gray-700 rounded-full h-1.5">
                <div className="bg-accent-blue h-1.5 rounded-full" style={{ width: '12%' }}></div>
              </div>
            </div>
            <div className="flex items-center">
              <span className="font-mono">MEM: 28%</span>
              <div className="ml-1 w-16 bg-gray-700 rounded-full h-1.5">
                <div className="bg-accent-green h-1.5 rounded-full" style={{ width: '28%' }}></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right side - Time and quick actions */}
        <div className="flex items-center space-x-4">
          {/* Digital clock */}
          <div className="hidden sm:block">
            <div className="text-gray-300 font-mono text-sm">
              {currentTime.toLocaleTimeString()}
            </div>
          </div>
          
          {/* Quick action buttons */}
          <div className="flex items-center space-x-2">
            <button className="p-1.5 rounded-full text-gray-400 hover:text-accent-blue hover:bg-primary-lighter">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <button className="p-1.5 rounded-full text-gray-400 hover:text-accent-blue hover:bg-primary-lighter">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button className="p-1.5 rounded-full text-gray-400 hover:text-accent-blue hover:bg-primary-lighter">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default TopNavbar;

// Add a CSS class for the glowing effect
const style = document.createElement('style');
style.textContent = `
  .shadow-glow {
    box-shadow: 0 0 8px currentColor;
  }
`;
document.head.appendChild(style);