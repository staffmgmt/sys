// src/components/ActivityTimeline.tsx
import React from 'react';
import { motion } from 'framer-motion';

// Mock data for activity timeline
const activities = [
  {
    id: 1,
    type: 'task',
    action: 'started',
    description: 'Research market trends for Q3',
    timestamp: new Date(Date.now() - 1000 * 60 * 2) // 2 minutes ago
  },
  {
    id: 2,
    type: 'browser',
    action: 'visited',
    description: 'https://example.com/market-research',
    timestamp: new Date(Date.now() - 1000 * 60 * 5) // 5 minutes ago
  },
  {
    id: 3,
    type: 'memory',
    action: 'saved',
    description: 'Market share statistics from report',
    timestamp: new Date(Date.now() - 1000 * 60 * 8) // 8 minutes ago
  },
  {
    id: 4,
    type: 'task',
    action: 'completed',
    description: 'Download quarterly financials',
    timestamp: new Date(Date.now() - 1000 * 60 * 15) // 15 minutes ago
  },
  {
    id: 5,
    type: 'system',
    action: 'restarted',
    description: 'Agent restarted after update',
    timestamp: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
  }
];

const ActivityTimeline: React.FC = () => {
  const getActivityIcon = (type: string, action: string) => {
    if (type === 'task' && action === 'started') {
      return (
        <div className="h-7 w-7 rounded-full bg-command-accent/20 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-command-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
      );
    } else if (type === 'task' && action === 'completed') {
      return (
        <div className="h-7 w-7 rounded-full bg-command-success/20 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-command-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    } else if (type === 'browser') {
      return (
        <div className="h-7 w-7 rounded-full bg-blue-500/20 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
        </div>
      );
    } else if (type === 'memory') {
      return (
        <div className="h-7 w-7 rounded-full bg-purple-500/20 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
        </div>
      );
    } else if (type === 'system') {
      return (
        <div className="h-7 w-7 rounded-full bg-yellow-500/20 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
      );
    } else {
      return (
        <div className="h-7 w-7 rounded-full bg-command-highlight flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-command-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
    }
  };
  
  return (
    <motion.div 
      className="bg-command-panel border border-command-highlight rounded-lg shadow-command"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="px-4 py-3 border-b border-command-highlight flex justify-between items-center">
        <h3 className="text-lg font-semibold text-command-accent">Activity Timeline</h3>
        <button className="p-1.5 text-command-text-muted hover:text-command-text transition rounded hover:bg-command-highlight">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
      
      <div className="p-4 relative">
        {/* Vertical timeline line */}
        <div className="absolute top-6 bottom-6 left-7 w-0.5 bg-command-highlight"></div>
        
        <div className="space-y-6">
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              className="relative pl-12"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              {/* Activity dot with icon */}
              <div className="absolute left-4 top-0 -translate-x-1/2">
                {getActivityIcon(activity.type, activity.action)}
              </div>
              
              <div>
                <div className="flex items-center space-x-1">
                  <span className="text-sm font-medium capitalize">{activity.action}</span>
                  <span className="text-xs text-command-text-muted">{activity.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-sm text-command-text mt-0.5 break-all">{activity.description}</p>
                <span className="text-xs text-command-text-muted inline-block mt-1 capitalize">
                  {activity.type === 'task' ? 'Task Manager' : activity.type}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      <div className="px-4 py-3 border-t border-command-highlight bg-command-panel/80">
        <button className="text-xs text-command-accent hover:text-command-accent-bright transition w-full text-center">
          View Full Activity Log
        </button>
      </div>
    </motion.div>
  );
};

export default ActivityTimeline;