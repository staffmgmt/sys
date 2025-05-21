import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import taskApi from '../services/taskApi';
import { TaskListResponse, ApiError } from '../models';
import { getStatusBadgeColor } from '../utils/statusUtils';

// Enhanced task interface with priority
interface EnhancedTask extends TaskListResponse {
  priority?: 'high' | 'medium' | 'low';
}

const TaskQueue: React.FC = () => {
  const [tasks, setTasks] = useState<EnhancedTask[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<EnhancedTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(5000);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Apply filters and search to the tasks
  useEffect(() => {
    let result = [...tasks];
    
    // Apply status filter
    if (filterStatus !== 'all') {
      result = result.filter(task => task.status.toLowerCase() === filterStatus.toLowerCase());
    }
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(task => 
        task.id.toLowerCase().includes(query) || 
        task.task_type.toLowerCase().includes(query)
      );
    }
    
    setFilteredTasks(result);
  }, [tasks, filterStatus, searchQuery]);
  
  // Fetch tasks
  const fetchTasks = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const taskList = await taskApi.listTasks();
      
      // Simulate priority for demo purposes
      // In a real implementation, this would come from the backend
      const enhancedTasks: EnhancedTask[] = taskList.map((task, index) => {
        let priority: 'high' | 'medium' | 'low' | undefined;
        
        if (task.status === 'RUNNING') {
          priority = 'high';
        } else if (task.status === 'PENDING') {
          priority = 'medium';
        } else if (index % 5 === 0) {
          priority = 'high';
        } else if (index % 3 === 0) {
          priority = 'medium';
        } else {
          priority = 'low';
        }
        
        return {
          ...task,
          priority,
        };
      });
      
      setTasks(enhancedTasks);
      setError(null);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(`Failed to load tasks: ${(err as ApiError).detail || (err as ApiError).message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Initial fetch and polling
  useEffect(() => {
    fetchTasks(true);
    const intervalId = setInterval(() => fetchTasks(false), refreshInterval);
    return () => clearInterval(intervalId);
  }, [refreshInterval]);
  
  // Handler for task actions
  const handleTaskAction = async (action: 'cancel' | 'retry' | 'delete', taskId: string) => {
    try {
      setIsLoading(true);
      
      if (action === 'cancel') {
        await taskApi.cancelTask(taskId);
      } else if (action === 'retry') {
        await taskApi.retryTask(taskId);
      } else if (action === 'delete') {
        if (window.confirm(`Are you sure you want to delete task ${taskId}?`)) {
          await taskApi.deleteTask(taskId);
        } else {
          setIsLoading(false);
          return;
        }
      }
      
      await fetchTasks(false);
    } catch (err) {
      console.error(`Failed to ${action} task:`, err);
      setError(`Failed to ${action} task: ${(err as ApiError).detail || (err as ApiError).message}`);
      setIsLoading(false);
    }
  };
  
  // Get priority badge color
  const getPriorityColor = (priority?: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'bg-red-600 text-white';
      case 'medium': return 'bg-yellow-600 text-white';
      case 'low': return 'bg-blue-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-accent-blue">Task Queue</h1>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-sm text-gray-300 w-full sm:w-auto"
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          {/* Filter dropdown */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-sm text-gray-300"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
          
          {/* Refresh button */}
          <button
            onClick={() => fetchTasks(true)}
            disabled={isLoading}
            className={`flex items-center px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-sm text-gray-300 hover:bg-gray-700 transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            Refresh
          </button>
        </div>
      </div>
      
      {/* Error display */}
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-300 p-3 rounded-md">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
          <button
            onClick={() => fetchTasks(true)}
            className="mt-2 px-3 py-1 bg-red-800 hover:bg-red-700 rounded text-white text-sm"
          >
            Retry
          </button>
        </div>
      )}
      
      {/* Task list */}
      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            {isLoading ? (
              <div className="flex flex-col items-center">
                <svg className="animate-spin h-8 w-8 mb-4 text-accent-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading tasks...
              </div>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                {searchQuery || filterStatus !== 'all' ? (
                  <p>No tasks match your search criteria. Try adjusting your filters.</p>
                ) : (
                  <p>No tasks found. Create a new task to get started.</p>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Task ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Created</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {filteredTasks.map((task, index) => (
                  <motion.tr
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className={task.status === 'RUNNING' ? 'bg-blue-900/10' : ''}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority || 'normal'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-mono">
                      <Link to={`/tasks/${task.id}`} className="text-accent-blue hover:underline">
                        {task.id.substring(0, 10)}...
                      </Link>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{task.task_type}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(task.status)}`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400">
                      {new Date(task.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-3">
                      <Link to={`/tasks/${task.id}`} className="text-accent-blue hover:text-blue-300">
                        View
                      </Link>
                      
                      {task.status === 'RUNNING' && (
                        <button
                          onClick={() => handleTaskAction('cancel', task.id)}
                          className="text-yellow-500 hover:text-yellow-400"
                        >
                          Cancel
                        </button>
                      )}
                      
                      {task.status === 'FAILED' && (
                        <button
                          onClick={() => handleTaskAction('retry', task.id)}
                          className="text-green-500 hover:text-green-400"
                        >
                          Retry
                        </button>
                      )}
                      
                      {(task.status === 'COMPLETED' || task.status === 'FAILED') && (
                        <button
                          onClick={() => handleTaskAction('delete', task.id)}
                          className="text-red-500 hover:text-red-400"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Pagination and refresh interval controls */}
      <div className="flex justify-between items-center">
        <div>
          <span className="text-sm text-gray-400">
            {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'} found
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">Refresh interval:</span>
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="bg-gray-800 text-gray-300 text-sm rounded p-1 border border-gray-700"
          >
            <option value={2000}>2s</option>
            <option value={5000}>5s</option>
            <option value={10000}>10s</option>
            <option value={30000}>30s</option>
            <option value={60000}>60s</option>
          </select>
        </div>
      </div>
    </motion.div>
  );
};

export default TaskQueue;