import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// Timeline event type definition
interface TimelineEvent {
  id: string;
  timestamp: Date;
  category: 'system' | 'task' | 'agent' | 'user' | 'error';
  title: string;
  description: string;
  taskId?: string;
}

const TimelineMonitor: React.FC = () => {
  // Mock timeline events
  const [events, setEvents] = useState<TimelineEvent[]>([
    {
      id: '1',
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      category: 'system',
      title: 'System Startup',
      description: 'Agent system initialized successfully',
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 2400000), // 40 min ago
      category: 'user',
      title: 'User Connection',
      description: 'User connected to the agent interface',
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 1800000), // 30 min ago
      category: 'task',
      title: 'Task Created',
      description: 'Research task created: Analyze market trends for AI startups',
      taskId: 'task_12345',
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 1500000), // 25 min ago
      category: 'agent',
      title: 'Web Search',
      description: 'Agent performed web search for recent AI startup funding rounds',
      taskId: 'task_12345',
    },
    {
      id: '5',
      timestamp: new Date(Date.now() - 1200000), // 20 min ago
      category: 'error',
      title: 'API Rate Limit',
      description: 'Exceeded rate limit for financial data API',
      taskId: 'task_12345',
    },
    {
      id: '6',
      timestamp: new Date(Date.now() - 900000), // 15 min ago
      category: 'agent',
      title: 'Data Analysis',
      description: 'Analyzed funding data for 50 AI startups',
      taskId: 'task_12345',
    },
    {
      id: '7',
      timestamp: new Date(Date.now() - 600000), // 10 min ago
      category: 'task',
      title: 'Task Completed',
      description: 'Market analysis completed successfully',
      taskId: 'task_12345',
    },
    {
      id: '8',
      timestamp: new Date(Date.now() - 300000), // 5 min ago
      category: 'task',
      title: 'Task Created',
      description: 'New task: Summarize quarterly earnings reports',
      taskId: 'task_67890',
    },
    {
      id: '9',
      timestamp: new Date(Date.now() - 120000), // 2 min ago
      category: 'agent',
      title: 'Document Processing',
      description: 'Processing PDF reports from 5 companies',
      taskId: 'task_67890',
    },
    {
      id: '10',
      timestamp: new Date(Date.now() - 60000), // 1 min ago
      category: 'system',
      title: 'Memory Optimization',
      description: 'Performed vector store optimization',
    },
  ]);
  
  const [filter, setFilter] = useState<'all' | 'system' | 'task' | 'agent' | 'user' | 'error'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [taskFilter, setTaskFilter] = useState<string | null>(null);
  
  // Filter events based on category, search query, and task ID
  const filteredEvents = events.filter(event => {
    // Category filter
    const categoryMatch = filter === 'all' || event.category === filter;
    
    // Search query filter
    const searchMatch = 
      !searchQuery || 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Task ID filter
    const taskMatch = !taskFilter || event.taskId === taskFilter;
    
    return categoryMatch && searchMatch && taskMatch;
  });
  
  // Get category badge color
  const getCategoryColor = (category: TimelineEvent['category']) => {
    switch (category) {
      case 'system': return 'bg-purple-700 text-white';
      case 'task': return 'bg-blue-700 text-white';
      case 'agent': return 'bg-green-700 text-white';
      case 'user': return 'bg-yellow-700 text-white';
      case 'error': return 'bg-red-700 text-white';
      default: return 'bg-gray-700 text-white';
    }
  };
  
  // Get category icon
  const getCategoryIcon = (category: TimelineEvent['category']) => {
    switch (category) {
      case 'system':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'task':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        );
      case 'agent':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'user':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'error':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };
  
  // Group events by date
  const groupedEvents = filteredEvents.reduce((groups, event) => {
    const date = new Date(event.timestamp).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(event);
    return groups;
  }, {} as Record<string, TimelineEvent[]>);
  
  // Export events as JSON
  const exportEvents = () => {
    const dataStr = JSON.stringify(events, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportFileDefaultName = `agent-timeline-${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };
  
  // Clear filters
  const clearFilters = () => {
    setFilter('all');
    setSearchQuery('');
    setTaskFilter(null);
  };
  
  // Add additional mocked events in real-time (for demo)
  useEffect(() => {
    const interval = setInterval(() => {
      // Example: 20% chance to add a new event every 10 seconds
      if (Math.random() < 0.2) {
        const newEvent: TimelineEvent = {
          id: `auto_${Date.now()}`,
          timestamp: new Date(),
          category: ['system', 'agent', 'task'][Math.floor(Math.random() * 3)] as TimelineEvent['category'],
          title: 'New Activity',
          description: 'Automated system activity detected',
        };
        
        setEvents(prev => [newEvent, ...prev]);
      }
    }, 10000); // Check every 10 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-accent-blue">Timeline Monitor</h1>
        
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 w-full sm:w-auto"
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <button
            onClick={exportEvents}
            className="flex items-center px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Logs
          </button>
        </div>
      </div>
      
      {/* Category filters */}
      <div className="flex overflow-x-auto pb-2 hide-scrollbar">
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              filter === 'all'
                ? 'bg-accent-blue text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            All Events
          </button>
          
          <button
            onClick={() => setFilter('system')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              filter === 'system'
                ? 'bg-purple-700 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            System
          </button>
          
          <button
            onClick={() => setFilter('task')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              filter === 'task'
                ? 'bg-blue-700 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Tasks
          </button>
          
          <button
            onClick={() => setFilter('agent')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              filter === 'agent'
                ? 'bg-green-700 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Agent
          </button>
          
          <button
            onClick={() => setFilter('user')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              filter === 'user'
                ? 'bg-yellow-700 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            User
          </button>
          
          <button
            onClick={() => setFilter('error')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              filter === 'error'
                ? 'bg-red-700 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Errors
          </button>
        </div>
      </div>
      
      {/* Active filters */}
      {(filter !== 'all' || searchQuery || taskFilter) && (
        <div className="flex items-center bg-gray-800 p-3 rounded-lg">
          <span className="text-sm text-gray-400 mr-2">Active filters:</span>
          <div className="flex flex-wrap gap-2">
            {filter !== 'all' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                Category: {filter}
                <button 
                  onClick={() => setFilter('all')}
                  className="ml-1 text-gray-400 hover:text-gray-200"
                >
                  &times;
                </button>
              </span>
            )}
            
            {searchQuery && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                Search: {searchQuery}
                <button 
                  onClick={() => setSearchQuery('')}
                  className="ml-1 text-gray-400 hover:text-gray-200"
                >
                  &times;
                </button>
              </span>
            )}
            
            {taskFilter && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                Task: {taskFilter}
                <button 
                  onClick={() => setTaskFilter(null)}
                  className="ml-1 text-gray-400 hover:text-gray-200"
                >
                  &times;
                </button>
              </span>
            )}
            
            <button
              onClick={clearFilters}
              className="text-xs text-accent-blue hover:text-blue-400 ml-2"
            >
              Clear all filters
            </button>
          </div>
        </div>
      )}
      
      {/* Timeline display */}
      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        {Object.keys(groupedEvents).length === 0 ? (
          <div className="p-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-300 mb-2">No events found</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              {filter !== 'all' || searchQuery || taskFilter
                ? 'No events match your current filters. Try adjusting or clearing them.'
                : 'No activity has been recorded yet. Events will appear here as they occur.'}
            </p>
            
            {(filter !== 'all' || searchQuery || taskFilter) && (
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 bg-accent-blue text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="p-4">
            {Object.keys(groupedEvents).map((date) => (
              <div key={date} className="mb-6">
                <h3 className="text-sm font-medium text-gray-400 mb-3 sticky top-0 bg-gray-800 py-2">{date}</h3>
                
                <div className="relative border-l-2 border-gray-700 pl-4 ml-2 space-y-6">
                  {groupedEvents[date].map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="relative"
                    >
                      {/* Timeline dot */}
                      <div className={`absolute top-0 -left-6 h-4 w-4 rounded-full bg-gray-800 border-2 border-gray-700 flex items-center justify-center ${getCategoryColor(event.category)}`}>
                        {getCategoryIcon(event.category)}
                      </div>
                      
                      {/* Event content */}
                      <div className="bg-gray-750 p-4 rounded-md">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(event.category)} mr-2`}>
                              {event.category}
                            </span>
                            <h4 className="text-sm font-medium text-gray-200">{event.title}</h4>
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-400 mb-2">{event.description}</p>
                        
                        {event.taskId && (
                          <div className="mt-2 flex">
                            <button
                              onClick={() => setTaskFilter(event.taskId && event.taskId === taskFilter ? null : (event.taskId || null))}
                              className="text-xs text-accent-blue hover:text-blue-400 flex items-center"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              Task: {event.taskId}
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TimelineMonitor;

// Add a CSS class to hide the scrollbar but allow scrolling
const style = document.createElement('style');
style.textContent = `
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;
document.head.appendChild(style);