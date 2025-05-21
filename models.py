# --- START OF REVISED FILE models.py ---
from pydantic import BaseModel, Field, field_validator
from typing import List, Dict, Any, Optional
from datetime import datetime

# --- API Request Models ---

class GeneralTaskRequest(BaseModel):
    """Model for submitting a general agent task."""
    task_instructions: str = Field(..., description="The high-level goal or instructions for the agent.", min_length=10)
    context_urls: Optional[List[str]] = Field(None, description="Optional list of URLs for the agent to start with or use as context.")
    agent_config: Optional[Dict[str, Any]] = Field(None, description="Optional configuration overrides for the agent (e.g., {'use_vision': False, 'max_steps': 15}).")

    @field_validator('context_urls')
    @classmethod
    def validate_urls(cls, urls: Optional[List[str]]) -> Optional[List[str]]:
        if urls is None:
            return None
        validated_urls = []
        for url in urls:
            # Basic check, allows various valid URL characters
            if not isinstance(url, str) or not url.startswith(('http://', 'https://')):
                raise ValueError(f"Invalid URL format: {url}. Must start with http:// or https://")
            validated_urls.append(url)
        return validated_urls

# --- API Response Models ---

class TaskCreationResponse(BaseModel):
    """Response after successfully creating and queueing a task."""
    id: str = Field(..., description="Unique identifier for the created task.")
    status: str = Field(..., description="Initial status of the task (PENDING).")
    message: str = Field(..., description="User-friendly message confirming task acceptance.")

class TaskLogEntry(BaseModel):
    """Represents a single log entry associated with a task."""
    timestamp: datetime = Field(..., description="Timestamp of the log entry (UTC).")
    level: str = Field(..., description="Log level (e.g., INFO, WARNING, ERROR).")
    message: str = Field(..., description="The log message content.")

    class Config:
        from_attributes = True # Replaces orm_mode=True in Pydantic v2

class FullTaskDetailsResponse(BaseModel):
    """Comprehensive details of a single task."""
    id: str = Field(..., description="Unique identifier for the task.")
    task_type: str = Field(..., description="Type of task (e.g., general_agent_task).")
    status: str = Field(..., description="Current status (PENDING, RUNNING, COMPLETED, FAILED).")
    created_at: datetime = Field(..., description="Timestamp when task was created (UTC).")
    started_at: Optional[datetime] = Field(None, description="Timestamp when task started processing (UTC).")
    completed_at: Optional[datetime] = Field(None, description="Timestamp when task finished processing (UTC).")
    input_data: Optional[Dict[str, Any]] = Field(None, description="Input parameters provided.")
    result_data: Optional[Dict[str, Any]] = Field(None, description="Final result data if completed successfully.")
    error_details: Optional[str] = Field(None, description="Error message if the task failed.")
    logs: List[TaskLogEntry] = Field(default_factory=list, description="Associated log entries, ordered by time.")

    class Config:
        from_attributes = True

class TaskListResponse(BaseModel):
     """Summary information for a task, used in lists."""
     id: str = Field(..., description="Unique identifier for the task.")
     status: str = Field(..., description="Current status.")
     task_type: str = Field(..., description="Type of task.")
     created_at: datetime = Field(..., description="Timestamp when task was created (UTC).")

     class Config:
        from_attributes = True

class TaskStatsResponse(BaseModel):
    """Statistics about task statuses."""
    PENDING: int = Field(0, description="Number of tasks currently pending.")
    RUNNING: int = Field(0, description="Number of tasks currently running.")
    COMPLETED: int = Field(0, description="Number of tasks successfully completed.")
    FAILED: int = Field(0, description="Number of tasks that failed.")
    TOTAL: int = Field(0, description="Total number of tasks recorded.")

class StatusResponse(BaseModel):
    """Generic status response for actions like cancel/delete."""
    status: str = Field(..., description="Result status code (e.g., 'cancelled', 'deleted', 'error').")
    message: str = Field(..., description="User-friendly message describing the outcome.")

class RetryResponse(BaseModel):
    """Response after successfully queueing a task retry."""
    status: str = Field("retry_queued", description="Indicates the retry task was queued.")
    new_task_id: str = Field(..., description="The ID of the newly created task for the retry.")
    message: str = Field(..., description="User-friendly confirmation message.")

class TaskSearchQuery(BaseModel):
    """Query parameters for searching tasks via API."""
    status: Optional[str] = Field(None, description="Filter by task status (e.g., COMPLETED, FAILED). Case-insensitive.")
    task_type: Optional[str] = Field(None, description="Filter by task type (e.g., general_agent_task).")
    days: Optional[int] = Field(None, ge=1, description="Filter tasks created within the last N days.")

    @field_validator('status')
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v:
            upper_v = v.upper()
            allowed_statuses = {'PENDING', 'RUNNING', 'COMPLETED', 'FAILED'}
            if upper_v not in allowed_statuses:
                raise ValueError(f"Invalid status. Must be one of: {', '.join(allowed_statuses)}")
            return upper_v
        return None

# --- END OF REVISED FILE models.py ---