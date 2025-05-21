// frontend/src/pages/TaskDetailPage.tsx (Adapted for Axios taskApi)
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import taskApi from '../services/taskApi'; // Use Axios-based API
import { FullTaskDetailsResponse, TaskLogEntry, ApiError, RetryResponse } from '../models'; // Use aligned models
import { getStatusBadgeColor } from '../utils/statusUtils'; // Use correct import path

const TaskDetailPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<FullTaskDetailsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const pollInterval = 5000; // 5 seconds

  // Fetch details function
  const fetchTaskDetails = useCallback(async (isInitialLoad = false) => {
    if (!taskId) {
      setError("Task ID is missing from URL.");
      setIsLoading(false);
      setTask(null);
      setIsPolling(false);
      return;
    }

    if (isInitialLoad) setIsLoading(true);
    // Clear error *before* fetch attempt when refreshing, keep for initial load error display
    if (!isInitialLoad) setError(null);

    try {
      const details = await taskApi.getTaskDetails(taskId);
      setTask(details);
      // Determine polling state based on fetched status
      const shouldPoll = !['COMPLETED', 'FAILED'].includes(details.status.toUpperCase());
      setIsPolling(shouldPoll);
      // Clear error on successful fetch
      setError(null);
    } catch (err) {
      const apiError = err as ApiError;
      console.error("Error fetching task details:", apiError);
      setError(`Failed to load/refresh task details: ${apiError.detail || apiError.message}`);
      setIsPolling(false); // Stop polling on error
       if (isInitialLoad) setTask(null); // Clear task only on initial load error
    } finally {
       if (isInitialLoad) setIsLoading(false);
    }
  }, [taskId]);

  // Initial fetch
  useEffect(() => {
    fetchTaskDetails(true);
  }, [fetchTaskDetails]);

  // Polling effect
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (isPolling && taskId) {
      console.log(`[TaskDetail ${taskId}] Starting polling.`);
      intervalId = setInterval(() => fetchTaskDetails(false), pollInterval);
    } else {
        console.log(`[TaskDetail ${taskId}] Polling stopped or not needed.`);
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
        console.log(`[TaskDetail ${taskId}] Stopping polling cleanup.`);
      }
    };
  }, [isPolling, fetchTaskDetails, taskId, pollInterval]); // Include interval in deps

  // --- Action Handlers ---
  const handleAction = async (actionPromise: Promise<any>, successLog: string, errorContext: string, navigateOnSuccess?: string, navigateOnError: boolean = false) => {
      // Add loading state for actions if needed
      try {
          const response = await actionPromise; // Get response for potential use (e.g., retry)
          console.log(successLog);
          if (navigateOnSuccess) {
              navigate(navigateOnSuccess);
          } else {
               fetchTaskDetails(true); // Force full refresh after action
          }
          return response; // Return response for chaining (e.g., retry navigation)
      } catch (err) {
          console.error(`${errorContext}:`, err);
          const apiError = err as ApiError;
          alert(`${errorContext}: ${apiError.detail || apiError.message}`);
          if (navigateOnError) navigate('/');
          throw err; // Re-throw to allow specific catch blocks if needed
      }
  };

  const handleCancel = () => {
      if (!taskId || !task || !['RUNNING', 'PENDING'].includes(task.status)) return;
      handleAction(
          taskApi.cancelTask(taskId),
          `Cancel requested for task ${taskId}`,
          `Failed to cancel task ${taskId}`
      );
  };

  const handleRetry = () => {
      if (!taskId || !task || task.status !== 'FAILED') return;
      handleAction(
          taskApi.retryTask(taskId),
          `Retry queued for task ${taskId}`,
          `Failed to retry task ${taskId}`
      ).then(response => {
          // Navigate to the new task page on successful retry queueing
          if (response && (response as RetryResponse).new_task_id) {
              navigate(`/tasks/${(response as RetryResponse).new_task_id}`);
          }
      }).catch(() => {}); // Catch is needed if handleAction re-throws
  };

  const handleDelete = () => {
      if (!taskId || !task || !['COMPLETED', 'FAILED'].includes(task.status)) return;
      if (window.confirm(`Are you sure you want to delete task ${taskId}? This action cannot be undone.`)) {
          handleAction(
              taskApi.deleteTask(taskId),
              `Task ${taskId} deleted successfully`,
              `Failed to delete task ${taskId}`,
              '/' // Navigate home on successful delete
          ).catch(() => {});
      }
  };

  // Helper to format datetime strings safely
  const formatDateTime = (isoString: string | null | undefined): string => {
    if (!isoString) return 'N/A';
    try {
      const date = new Date(isoString);
      return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString();
    } catch (e) { return 'Invalid Date'; }
  };

  // --- Render Logic ---
  if (isLoading) {
    return ( /* ... Loading spinner ... */
      <div className="flex justify-center items-center p-10 h-60">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-4 text-lg text-gray-400">Loading Task Details...</span>
      </div>
    );
  }

  // Error state when task failed to load initially
  if (!task && error) {
    return ( /* ... Error display with retry ... */
      <div className="container mx-auto p-4 max-w-4xl">
        <Link to="/" className="text-blue-400 hover:underline mb-4 inline-block">← Back</Link>
        <div className="bg-red-900/50 border border-red-500 text-red-300 p-4 rounded">
          <h2 className="text-xl font-bold mb-2">Error Loading Task</h2>
          <p>{error}</p>
          <button onClick={() => fetchTaskDetails(true)} className="mt-3 px-4 py-2 bg-red-700 hover:bg-red-600 rounded text-white transition"> Retry </button>
        </div>
      </div>
    );
  }

  // Task not found or unavailable state
  if (!task) {
    return ( /* ... Task not found display ... */
      <div className="container mx-auto p-4 max-w-4xl">
        <Link to="/" className="text-blue-400 hover:underline mb-4 inline-block">← Back</Link>
        <div className="bg-gray-800 border border-gray-700 text-gray-400 p-6 rounded mb-4 text-center">
          <p>Task <span className='font-mono'>{taskId}</span> could not be found.</p>
        </div>
      </div>
    );
  }

  // Main Task Detail Display
  return (
    // Assuming base styles are set in App.tsx or index.css
    <div className="container mx-auto p-4 max-w-4xl text-gray-100"> {/* Ensure light text */}
      <Link to="/" className="text-blue-400 hover:underline mb-4 inline-block">← Back to Command Center</Link>

      {/* Header with ID and Actions */}
       <div className="flex flex-wrap justify-between items-start mb-4 gap-4">
         <h1 className="text-3xl font-bold text-gray-100 break-all">Task: <span className="font-mono text-2xl text-blue-300">{task.id}</span></h1>
         <div className="flex space-x-2 flex-shrink-0">
            {(task.status === 'RUNNING' || task.status === 'PENDING') && (
                 <button onClick={handleCancel} className="px-3 py-1 text-sm bg-orange-600 hover:bg-orange-700 rounded text-white transition shadow"> Cancel </button>
             )}
            {task.status === 'FAILED' && (
                 <button onClick={handleRetry} className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 rounded text-white transition shadow"> Retry </button>
             )}
            {(task.status === 'COMPLETED' || task.status === 'FAILED') && (
                 <button onClick={handleDelete} className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 rounded text-white transition shadow"> Delete </button>
             )}
         </div>
      </div>

       {/* Refresh Error Warning (if showing stale data) */}
       {error && (
            <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-300 p-3 rounded mb-4 text-sm">
                <strong>Warning:</strong> Failed to refresh task details. Displaying last known data. Error: {error}
                <button onClick={() => fetchTaskDetails(false)} className="ml-3 px-2 py-0.5 bg-yellow-800 hover:bg-yellow-700 rounded text-white text-xs"> Retry Refresh </button>
            </div>
        )}

      {/* Summary Section */}
      <div className="bg-gray-800 shadow-lg rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-200 mb-3">Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {/* Use text-white with background from util */}
          <div><strong className="text-gray-400 w-28 inline-block">Status:</strong> <span className={`px-2 py-0.5 rounded-full text-xs font-semibold text-white ${getStatusBadgeColor(task.status)} ${isPolling ? 'animate-pulse' : ''}`}>{task.status}</span></div>
          <div><strong className="text-gray-400 w-28 inline-block">Task Type:</strong> <span className="text-gray-300">{task.task_type}</span></div>
          <div><strong className="text-gray-400 w-28 inline-block">Created:</strong> {formatDateTime(task.created_at)}</div>
          <div><strong className="text-gray-400 w-28 inline-block">Started:</strong> {formatDateTime(task.started_at)}</div>
          <div><strong className="text-gray-400 w-28 inline-block">Completed:</strong> {formatDateTime(task.completed_at)}</div>
        </div>
      </div>

      {/* Input Data */}
       <div className="bg-gray-800 shadow-lg rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-200 mb-3">Input Data</h2>
            <pre className="bg-gray-900 p-3 rounded text-xs text-gray-300 overflow-x-auto max-h-60 custom-scrollbar">
                {task.input_data ? JSON.stringify(task.input_data, null, 2) : <span className='text-gray-500'>N/A</span>}
            </pre>
       </div>

      {/* Result Data */}
      {task.result_data && (
        <div className="bg-gray-800 shadow-lg rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-200 mb-3">Result Data</h2>
          <pre className="bg-gray-900 p-3 rounded text-xs text-gray-300 overflow-x-auto max-h-80 custom-scrollbar">
            {JSON.stringify(task.result_data, null, 2)}
          </pre>
        </div>
      )}

      {/* Error Details */}
      {task.error_details && (
        <div className="bg-red-900/30 border border-red-800 shadow-lg rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-red-200 mb-3">Error Details</h2>
          <pre className="bg-red-900/50 p-3 rounded text-xs text-red-300 overflow-x-auto whitespace-pre-wrap max-h-60 custom-scrollbar">
            {task.error_details}
          </pre>
        </div>
      )}

      {/* Logs */}
      <div className="bg-gray-800 shadow-lg rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-200 mb-3">Logs</h2>
        {/* Scrollable log container */}
        <div className="font-mono text-xs bg-gray-900 p-3 rounded h-96 overflow-y-auto custom-scrollbar">
          {task.logs && task.logs.length > 0 ? (
            [...task.logs].reverse().map((log, index) => (
              <div key={index} className="whitespace-pre-wrap mb-1">
                <span className='text-gray-500 mr-2'>[{formatDateTime(log.timestamp)}]</span>
                <span className={`font-medium w-16 inline-block text-right ${
                     log.level === 'ERROR' || log.level === 'CRITICAL' ? 'text-red-400' :
                     log.level === 'WARNING' ? 'text-yellow-400' :
                     log.level === 'INFO' ? 'text-blue-400' :
                     'text-gray-400' // Debug or others
                }`}>[{log.level}]</span>
                <span className='ml-2 text-gray-300'>{log.message}</span>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No logs available for this task.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetailPage;