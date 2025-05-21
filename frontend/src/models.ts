// frontend/src/models.ts (Phase 3 - Aligned with Backend)

// Matches backend models.py TaskLogEntry
export interface TaskLogEntry {
  timestamp: string; // Datetime as ISO string
  level: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  message: string;
}

// Matches backend models.py TaskListResponse
export interface TaskListResponse {
  id: string; // Use 'id' consistently
  status: string; // Consider using TaskStatus type if defined elsewhere
  task_type: string;
  created_at: string; // Datetime as ISO string
}

// Matches backend models.py FullTaskDetailsResponse
export interface FullTaskDetailsResponse {
  id: string; // Use 'id'
  task_type: string;
  status: string; // Consider using TaskStatus type
  created_at: string; // Datetime as ISO string
  started_at: string | null; // Datetime as ISO string or null
  completed_at: string | null; // Datetime as ISO string or null
  input_data: { // Matches GeneralTaskRequest structure + agent_config
    task_instructions: string;
    context_urls?: string[] | null;
    agent_config?: Record<string, any> | null;
  };
  result_data: any | null; // Keep as 'any' for flexibility or define specific result types
  error_details: string | null;
  logs: TaskLogEntry[]; // Logs are included
}

// Matches backend models.py GeneralTaskRequest for submission
export interface GeneralTaskRequest {
  task_instructions: string;
  context_urls?: string[] | null; // Optional URLs - ensure list or null/undefined
  agent_config?: Record<string, any>; // Optional config object
}

// Matches backend models.py TaskCreationResponse
export interface TaskCreationResponse {
  id: string; // Use 'id'
  status: string; // Consider using TaskStatus type
  message: string;
}

// Matches backend models.py TaskStatsResponse
export interface TaskStatsResponse {
  PENDING: number;
  RUNNING: number;
  COMPLETED: number;
  FAILED: number;
  total: number;
}

// Matches backend models.py StatusResponse (for Cancel, Delete)
export interface StatusResponse {
    status: string;
    message?: string | null;
}

// Matches backend models.py RetryResponse
export interface RetryResponse {
    status: string;
    new_task_id: string;
    message?: string | null;
}

// Reusable Task Status type (can be defined here or in a separate types file)
export type TaskStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

// API Error structure (can remain as defined previously or refined)
export interface ApiError {
  status: number; // HTTP status code
  message: string; // General error message from frontend context
  detail?: string; // Detailed error message from backend (FastAPI detail)
}

// Interface for search query parameters, matching backend TaskSearchQuery
export interface TaskSearchQuery {
  status?: TaskStatus;
  task_type?: string; // Matches backend parameter name
  days?: number;
}