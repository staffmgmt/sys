// frontend/src/components/TaskForm.tsx (Phase 3 - Refactored)
import React, { useState } from 'react';
// Import the service and request model
import taskApi from '../services/taskApi';
import { GeneralTaskRequest, ApiError } from '../models';

const TaskForm: React.FC = () => {
  // State for form inputs matching GeneralTaskRequest
  const [taskInstructions, setTaskInstructions] = useState('');
  const [contextUrls, setContextUrls] = useState(''); // Textarea for URLs
  const [useVision, setUseVision] = useState(true); // Example agent_config option
  // Add more state for other agent_config options if needed

  // Component state
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage('');
    setIsError(false);

    if (!taskInstructions.trim()) {
      setMessage('Please enter task instructions.');
      setIsError(true);
      setIsLoading(false);
      return;
    }

    // Process URLs: split, trim, filter empty lines
    const urlsList = contextUrls.split('\n').map(url => url.trim()).filter(url => url);

    // Construct the request payload matching GeneralTaskRequest
    const taskInput: GeneralTaskRequest = {
      task_instructions: taskInstructions.trim(),
      // Only include context_urls if there are any valid URLs entered
      context_urls: urlsList.length > 0 ? urlsList : undefined,
      // Construct agent_config based on state
      agent_config: {
        use_vision: useVision,
        // Add other config options here, e.g., max_steps: 15
      }
    };

    try {
      // Call the aligned taskApi service function
      const response = await taskApi.submitTask(taskInput);

      // Use the response data (includes id, status, message)
      setMessage(`Task submitted successfully! Task ID: ${response.id}`); // Use response.id
      setTaskInstructions(''); // Clear form
      setContextUrls('');
      setUseVision(true); // Reset config

      // Optional: Dispatch event for TaskList refresh (keep if TaskList uses it)
      window.dispatchEvent(new CustomEvent('newTaskSubmitted'));

    } catch (error: any) {
      const apiError = error as ApiError; // Use the ApiError type from models
      console.error('Error submitting task:', apiError);
      setMessage(`Error: ${apiError.detail || apiError.message || 'Failed to submit task'}`);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-primary-light p-6 rounded-lg shadow-sci-fi">
      <h2 className="text-2xl font-semibold mb-4 text-accent-blue">Submit New Agent Task</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Input for Task Instructions */}
        <div>
          <label htmlFor="taskInstructions" className="block text-sm font-medium text-gray-300 mb-1">Task Instructions:</label>
          <textarea
            id="taskInstructions"
            name="taskInstructions"
            rows={5}
            required
            value={taskInstructions}
            onChange={(e) => setTaskInstructions(e.target.value)}
            className="w-full p-2 border border-gray-700 rounded-md bg-primary-lighter text-gray-100 focus:ring-accent-blue focus:border-accent-blue"
            placeholder="Example: Go to the first URL, find the CEO's name, then go to the second URL and find the company address."
          ></textarea>
        </div>

        {/* Input for Context URLs (Optional) */}
        <div>
          <label htmlFor="contextUrls" className="block text-sm font-medium text-gray-300 mb-1">Context URLs (Optional, One per line):</label>
          <textarea
            id="contextUrls"
            name="contextUrls"
            rows={3}
            value={contextUrls}
            onChange={(e) => setContextUrls(e.target.value)}
            className="w-full p-2 border border-gray-700 rounded-md bg-primary-lighter text-gray-100 focus:ring-accent-blue focus:border-accent-blue"
            placeholder="https://example.com/about&#10;https://example.org/contact"
          ></textarea>
        </div>

        {/* Example Agent Config Option */}
        <div className="flex items-center">
          <input
            id="use_vision"
            name="use_vision"
            type="checkbox"
            checked={useVision}
            onChange={(e) => setUseVision(e.target.checked)}
            className="h-4 w-4 text-accent-blue border-gray-700 rounded focus:ring-accent-blue bg-primary-lighter"
          />
          <label htmlFor="use_vision" className="ml-2 block text-sm text-gray-300">Use Vision (Allow Agent to see Screenshots)</label>
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className={`bg-accent-blue hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Submitting...' : 'Submit Task'}
          </button>
        </div>

        {/* Status Message */}
        {message && (
          <div className={`mt-4 text-sm ${isError ? 'text-red-400' : 'text-green-400'}`}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
};

export default TaskForm;