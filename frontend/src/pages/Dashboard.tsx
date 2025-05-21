import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import CommandConsole from '../components/CommandConsole';
import taskApi from '../services/taskApi';
import { TaskStatsResponse } from '../models';

// Define dashboard sections for the grid layout
interface DashboardStat {
  title: string;
  value: number | string;
  subtitle?: string;
  color: string;
  icon: React.ReactNode;
}

const Dashboard: React.FC = () => {
  const [consoleOutput, setConsoleOutput] = useState<string[]>([
    '[SYSTEM] Agent Command Center initialized',
    '[SYSTEM] Backend connected',
    '[SYSTEM] Modules loaded: Tasks, Automation, Memory',
    '[SYSTEM] Ready for commands...',
  ]);
  
  const [stats, setStats] = useState<TaskStatsResponse>({
    PENDING: 0,
    RUNNING: 0,
    COMPLETED: 0,
    FAILED: 0,
    total: 0,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch task stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await taskApi.getTaskStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch task stats:', error);
        // Don't update stats on error
      }
    };
    
    fetchStats();
    // Poll for updates
    const interval = setInterval(fetchStats, 10000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Handle console commands
  const handleCommand = (command: string) => {
    // This would be expanded with actual command processing logic
    // For now, just some demo responses
    
    const lowerCommand = command.toLowerCase().trim();
    
    if (lowerCommand === 'help') {
      setTimeout(() => {
        setConsoleOutput([
          ...consoleOutput,
          '> help',
          '[SYSTEM] Available commands:',
          ' • help - Display this help message',
          ' • status - Show agent status',
          ' • tasks - Show recent tasks',
          ' • clear - Clear console',
        ]);
      }, 200);
    } else if (lowerCommand === 'status') {
      setTimeout(() => {
        setConsoleOutput([
          ...consoleOutput,
          '> status',
          '[SYSTEM] Agent Status: ONLINE',
          `[SYSTEM] Tasks: ${stats.total} total (${stats.COMPLETED} completed, ${stats.FAILED} failed)`,
        ]);
      }, 200);
    } else if (lowerCommand === 'clear') {
      setConsoleOutput([]);
    } else if (lowerCommand.startsWith('task')) {
      setTimeout(() => {
        setConsoleOutput([
          ...consoleOutput,
          `> ${command}`,
          '[SYSTEM] Processing task request...',
          '[SYSTEM] Task queued successfully!',
        ]);
      }, 200);
    } else {
      setTimeout(() => {
        setConsoleOutput([
          ...consoleOutput,
          `> ${command}`,
          `[SYSTEM] Unknown command: "${command}". Type "help" for available commands.`,
        ]);
      }, 200);
    }
  };
  
  // Create dashboard stats based on the fetched data
  const dashboardStats: DashboardStat[] = [
    {
      title: 'Total Tasks',
      value: stats.total,
      subtitle: 'All-time tasks',
      color: 'from-blue-500 to-indigo-600',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      title: 'Pending',
      value: stats.PENDING,
      color: 'from-yellow-400 to-yellow-600',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'Running',
      value: stats.RUNNING,
      color: 'from-blue-400 to-blue-600',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      ),
    },
    {
      title: 'Completed',
      value: stats.COMPLETED,
      color: 'from-green-400 to-green-600',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'Failed',
      value: stats.FAILED,
      color: 'from-red-400 to-red-600',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-accent-blue">Agent Dashboard</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-400">Status: <span className="text-green-400">Online</span></span>
          <button 
            onClick={() => {}}
            className="px-3 py-1.5 text-sm bg-accent-blue rounded hover:bg-blue-600 transition-colors text-white"
          >
            New Task
          </button>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {dashboardStats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-gray-800 rounded-lg shadow-lg overflow-hidden"
          >
            <div className={`bg-gradient-to-r ${stat.color} px-4 py-3`}>
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-white">{stat.title}</h3>
                <div className="text-white opacity-80">{stat.icon}</div>
              </div>
              <div className="mt-2">
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                {stat.subtitle && (
                  <div className="text-xs text-white opacity-80 mt-1">{stat.subtitle}</div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Command Console Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-200 mb-2">Command Console</h2>
          <CommandConsole 
            output={consoleOutput} 
            onCommand={handleCommand} 
          />
        </div>
        
        {/* Recent Activity */}
        <div>
          <h2 className="text-lg font-semibold text-gray-200 mb-2">Recent Activity</h2>
          <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden h-96">
            <div className="bg-gray-700 px-4 py-3 border-b border-gray-600">
              <h3 className="text-sm font-medium text-gray-200">Activity Stream</h3>
            </div>
            <div className="p-4 overflow-y-auto h-[calc(100%-48px)]">
              <div className="space-y-4">
                {/* Empty state or loading state */}
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="inline-flex items-center px-4 py-2 bg-gray-700 rounded-md text-sm text-gray-300">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-accent-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading activity...
                    </div>
                  </div>
                ) : (
                  // Demo activity items
                  <>
                    <div className="bg-gray-750 p-3 rounded-lg border-l-4 border-green-500">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-green-400 text-sm font-medium">Task Completed</span>
                            <span className="text-xs text-gray-500">30m ago</span>
                          </div>
                          <div className="mt-1 text-gray-300 text-sm">Web research on "Latest machine learning techniques"</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-750 p-3 rounded-lg border-l-4 border-blue-500">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-blue-400 text-sm font-medium">New Task Created</span>
                            <span className="text-xs text-gray-500">1h ago</span>
                          </div>
                          <div className="mt-1 text-gray-300 text-sm">Analyze website data and create summary report</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-750 p-3 rounded-lg border-l-4 border-yellow-500">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-yellow-400 text-sm font-medium">Agent Status Update</span>
                            <span className="text-xs text-gray-500">2h ago</span>
                          </div>
                          <div className="mt-1 text-gray-300 text-sm">Memory usage optimized, performance improved by 15%</div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;