// frontend/src/services/taskApi.ts (Fixed URL template literals)
import axios, { AxiosError } from 'axios';
import {
  GeneralTaskRequest,
  TaskCreationResponse,
  TaskListResponse,
  FullTaskDetailsResponse,
  TaskLogEntry,
  TaskStatsResponse,
  StatusResponse,
  RetryResponse,
  ApiError,
  TaskSearchQuery,
} from '../models';

// Correctly import from the simplified apiConfig
import { API_BASE_URL } from '../utils/apiConfig';

// Define structure for FastAPI validation errors if needed
interface FastApiValidationErrorDetail {
    loc: string[];
    msg: string;
    type: string;
}
interface FastApiValidationError {
  detail: FastApiValidationErrorDetail[] | string; // Can be string or list of errors
}


const handleApiError = (error: unknown, context: string): ApiError => {
    const axiosError = error as AxiosError<FastApiValidationError | { detail: string }>;
    let status = axiosError.response?.status || 500;
    let message = `API Error (${status}): ${context}`;
    let detail = axiosError.message; // Default to Axios message

    if (axiosError.response?.data) {
        const errorData = axiosError.response.data;
        if (typeof errorData === 'object' && errorData && 'detail' in errorData) {
             if (Array.isArray(errorData.detail)) {
                  detail = errorData.detail.map(d => `${d.loc.join('.')} - ${d.msg}`).join('; ');
             } else if (typeof errorData.detail === 'string') {
                  detail = errorData.detail;
             }
        }
    }
    if (status !== 500 && detail === axiosError.message && axiosError.message.includes("Network Error")) {
        detail = `Failed to connect to the backend at ${API_BASE_URL}. Please ensure it's running.`;
    }

    console.error(`${message} - Detail: ${detail}`, error); // Log the full error
    return { status, message, detail };
};


const taskApi = {

  listTasks: async (limit: number = 100, offset: number = 0): Promise<TaskListResponse[]> => {
    try {
      const response = await axios.get<TaskListResponse[]>(`${API_BASE_URL}/tasks/list/json`, {
        params: { limit, offset }
      });
      return response.data;
    } catch (error) {
      if ((error as AxiosError).response?.status === 404) return []; // Should return [] from backend
      throw handleApiError(error, 'Failed to fetch task list');
    }
  },


  searchTasks: async (query: TaskSearchQuery): Promise<TaskListResponse[]> => {
    try {
        const params = { status: query.status, task_type: query.task_type, days: query.days };
        const response = await axios.get<TaskListResponse[]>(`${API_BASE_URL}/tasks/search/json`, { params });
        return response.data;
    } catch (error) {
        if ((error as AxiosError).response?.status === 404) return []; // Should return [] from backend
        if ((error as AxiosError).response?.status === 501) {
            console.warn("Task search feature is not implemented in the backend database layer yet.");
            throw handleApiError(error, 'Search feature not yet available');
        }
        throw handleApiError(error, 'Failed to search tasks');
    }
  },


  getTaskDetails: async (taskId: string): Promise<FullTaskDetailsResponse> => {
    try {
      const response = await axios.get<FullTaskDetailsResponse>(`${API_BASE_URL}/tasks/${taskId}/json`);
      return response.data; // Includes logs
    } catch (error) {
      throw handleApiError(error, `Failed to fetch task details for ${taskId}`);
    }
  },


  getTaskLogs: async (taskId: string, level?: string, limit: number = 1000): Promise<TaskLogEntry[]> => {
    try {
      const response = await axios.get<TaskLogEntry[]>(`${API_BASE_URL}/tasks/${taskId}/logs/json`, {
        params: { level, limit }
      });
      return response.data;
    } catch (error) {
       if ((error as AxiosError).response?.status === 404 && (error as AxiosError<any>)?.response?.data?.detail === "Task ID not found") {
           throw handleApiError(error, `Task ${taskId} not found`);
       }
      throw handleApiError(error, `Failed to fetch logs for task ${taskId}`);
    }
  },


  getTaskStats: async (): Promise<TaskStatsResponse> => {
    try {
      const response = await axios.get<TaskStatsResponse>(`${API_BASE_URL}/tasks/stats/json`);
      return response.data;
    } catch (error) {
       if ((error as AxiosError).response?.status === 501) {
           console.warn("Task statistics feature is not implemented in the backend database layer yet.");
           return { PENDING: 0, RUNNING: 0, COMPLETED: 0, FAILED: 0, total: 0 };
       }
      throw handleApiError(error, 'Failed to fetch task statistics');
    }
  },


  submitTask: async (taskInput: GeneralTaskRequest): Promise<TaskCreationResponse> => {
    try {
      // Use the correct endpoint and models
      const response = await axios.post<TaskCreationResponse>(`${API_BASE_URL}/tasks/submit`, taskInput);
      return response.data; // Returns { id, status, message }
    } catch (error) {
      throw handleApiError(error, 'Failed to submit task');
    }
  },


  cancelTask: async (taskId: string): Promise<StatusResponse> => {
    try {
      const response = await axios.post<StatusResponse>(`${API_BASE_URL}/tasks/${taskId}/cancel`);
      return response.data;
    } catch (error) {
      throw handleApiError(error, `Failed to cancel task ${taskId}`);
    }
  },


  retryTask: async (taskId: string): Promise<RetryResponse> => {
    try {
      const response = await axios.post<RetryResponse>(`${API_BASE_URL}/tasks/${taskId}/retry`);
      return response.data;
    } catch (error) {
      throw handleApiError(error, `Failed to retry task ${taskId}`);
    }
  },


  deleteTask: async (taskId: string): Promise<StatusResponse> => {
    try {
      const response = await axios.delete<StatusResponse>(`${API_BASE_URL}/tasks/${taskId}`);
      return response.data;
    } catch (error) {
       if ((error as AxiosError).response?.status === 501) {
           console.warn("Task delete feature is not implemented in the backend database layer yet.");
           throw handleApiError(error, 'Delete feature not yet available');
       }
      throw handleApiError(error, `Failed to delete task ${taskId}`);
    }
  }
};

export default taskApi;