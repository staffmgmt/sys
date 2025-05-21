// frontend/src/components/TaskList.tsx (Adapted for Axios taskApi & Dashboard View)
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Added useNavigate
import { motion } from 'framer-motion';
import taskApi from '../services/taskApi'; // Use Axios-based API
import { TaskListResponse, ApiError, RetryResponse, StatusResponse } from '../models'; // Use correct models
import { getStatusBadgeColor } from '../utils/statusUtils'; // Use correct util

const TaskList: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<TaskListResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(10000); // Default 10 seconds for full list

  // Fetch tasks function using useCallback
   const fetchTasks = useCallback(async (showLoading = true) => {
       if (showLoading) setIsLoading(true);
       // setError(null); // Keep error displayed until successful fetch
       try {
           const taskList = await taskApi.listTasks(1000); // Fetch more tasks for the main list view
           setTasks(taskList);
           setError(null); // Clear error on success
       } catch (err: unknown) {
           console.error('Error fetching tasks:', err);
           const apiError = err as ApiError;
           setError(`Failed to load tasks: ${apiError.detail || apiError.message}`);
           // Keep stale data if available
       } finally {
           // Only set loading false if we were showing it initially
           if (showLoading) setIsLoading(false);
       }
   }, []); // Empty dependency array, fetch logic is self-contained


  // Initial fetch and polling setup
  useEffect(() => {
    fetchTasks(true);
    const intervalId = setInterval(() => fetchTasks(false), refreshInterval);
    return () => clearInterval(intervalId);
  }, [fetchTasks, refreshInterval]); // Include fetchTasks and interval

  // Listener for newTaskSubmitted event (optional, good for reactivity)
  useEffect(() => {
    const handleNewTask = () => {
        console.log("TaskList: New task submitted event received, refreshing list...");
        fetchTasks(false); // Refresh silently
    };
    window.addEventListener('newTaskSubmitted', handleNewTask);
    return () => {
        window.removeEventListener('newTaskSubmitted', handleNewTask);
    };
  }, [fetchTasks]);

  // --- Action Handlers (using helper) ---
  const handleAction = async (actionPromise: Promise<any>, successLog: string, errorContext: string, navigateOnSuccess?: string) => {
      try {
          const response = await actionPromise;
          console.log(successLog);
          if (navigateOnSuccess) {
              navigate(navigateOnSuccess);
          } else {
               fetchTasks(false); // Refresh list silently after action
          }
          return response;
      } catch (err) {
          console.error(`${errorContext}:`, err);
          const apiError = err as ApiError;
          alert(`${errorContext}: ${apiError.detail || apiError.message}`);
          throw err;
      }
  };

  const handleCancel = (taskId: string) => {
      handleAction(
          taskApi.cancelTask(taskId),
          `Cancel requested for task ${taskId}`,
          `Failed to cancel task ${taskId}`
      );
  };

   const handleRetry = (taskId: string) => {
       handleAction(
           taskApi.retryTask(taskId),
           `Retry queued for task ${taskId}`,
           `Failed to retry task ${taskId}`
       ).then(response => {
           if (response && (response as RetryResponse).new_task_id) {
               navigate(`/tasks/${(response as RetryResponse).new_task_id}`);
           }
       }).catch(() => {});
   };

   const handleDelete = (taskId: string) => {
       if (window.confirm(`Are you sure you want to delete task ${taskId}? This action cannot be undone.`)) {
           handleAction(
               taskApi.deleteTask(taskId),
               `Task ${taskId} deleted successfully`,
               `Failed to delete task ${taskId}`
           ).then(() => {
               // Optimistic UI update or rely on fetchTasks called by handleAction
               setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
           }).catch(() => {});
       }
   };

  // --- Render Logic ---
  return (
    // Using TaskDashboard's theme as it's the secondary view
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg mt-8"> {/* Use dark theme consistent bg */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-blue-400">Full Task List</h2> {/* Adjusted colors */}
         {/* Refresh Controls */}
        <div className='flex items-center space-x-4'>
            <div className="flex items-center">
                <span className="text-xs text-gray-400 mr-2">Refresh:</span>
                <select
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(Number(e.target.value))}
                    className="bg-gray-700 text-gray-200 text-xs rounded p-1 border border-gray-600 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                    disabled={isLoading && tasks.length > 0}
                >
                    {/* <option value={5000}>5s</option> */}
                    <option value={10000}>10s</option>
                    <option value={30000}>30s</option>
                    <option value={60000}>60s</option>
                </select>
            </div>
            <button
              onClick={() => fetchTasks(true)}
              disabled={isLoading}
              className={`px-3 py-1 bg-gray-700 hover:bg-blue-600/50 rounded text-white text-sm transition ${isLoading ? 'opacity-50 cursor-not-allowed animate-pulse' : ''}`}
            >
              {isLoading ? 'Refreshing...' : 'Refresh Now'}
            </button>
        </div>
      </div>

      {/* Loading Indicator */}
      {isLoading && tasks.length === 0 && (
         <div className="flex justify-center items-center p-6 h-40"> {/* Using dark theme colors */}
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-400"></div>
            <span className="ml-3 text-gray-400">Loading tasks...</span>
         </div>
      )}

      {/* Error Display */}
      {error && (
         <div className="bg-red-900/50 border border-red-500 text-red-300 p-3 rounded mb-4">
           <p><strong className="font-semibold">Error:</strong> {error}</p>
           <button onClick={() => fetchTasks(true)} className="mt-2 px-3 py-1 bg-red-700 hover:bg-red-600 rounded text-white text-sm transition"> Retry </button>
         </div>
       )}

      {/* Empty State */}
      {!isLoading && !error && tasks.length === 0 && (
          <div className="bg-gray-700 border border-gray-600 text-gray-300 p-6 rounded mb-4 text-center"> {/* Dark theme colors */}
              <p>No tasks found.</p>
          </div>
      )}

      {/* Task Table */}
      {tasks.length > 0 && (
        <div className="overflow-x-auto">
          {/* Using dark theme colors */}
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-750"> {/* Slightly darker header */}
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Task ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Created At</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {tasks.map((task) => (
                <motion.tr
                   key={task.id}
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   transition={{ duration: 0.3 }}
                   className="hover:bg-gray-700/50" // Dark hover
                >
                  {/* ID */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-300" title={task.id}>
                     <Link to={`/tasks/${task.id}`} className="hover:text-blue-300 hover:underline"> {/* Adjusted color */}
                        {task.id.substring(0, 12)}...
                     </Link>
                  </td>
                  {/* Type */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{task.task_type}</td>
                  {/* Status Badge */}
                  <td className="px-6 py-4 whitespace-nowrap">
                     {/* Use text-white with background from util */}
                    <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full text-white ${getStatusBadgeColor(task.status)}`}>
                        {task.status}
                    </span>
                  </td>
                  {/* Created At */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                     {new Date(task.created_at).toLocaleString()}
                  </td>
                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                    <Link to={`/tasks/${task.id}`} className="text-blue-400 hover:text-blue-300 transition duration-150 ease-in-out"> View </Link>
                    {(task.status === 'RUNNING' || task.status === 'PENDING') && (
                       <button onClick={() => handleCancel(task.id)} className="text-orange-400 hover:text-orange-300 transition duration-150 ease-in-out"> Cancel </button>
                     )}
                    {task.status === 'FAILED' && (
                       <button onClick={() => handleRetry(task.id)} className="text-green-400 hover:text-green-300 transition duration-150 ease-in-out"> Retry </button>
                     )}
                     {(task.status === 'COMPLETED' || task.status === 'FAILED') && (
                          <button onClick={() => handleDelete(task.id)} className="text-red-500 hover:text-red-400 transition duration-150 ease-in-out"> Delete </button>
                     )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TaskList;