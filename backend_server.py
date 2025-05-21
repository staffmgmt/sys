# --- START OF ADJUSTED FILE backend_server.py (ARQ Compatibility Fix) ---
# (Version 3.4 - Fixed ARQ imports compatibility)
import asyncio
import os
import logging
import sys
import platform
import json
import uuid
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from typing import List, Dict, Set, Any, Optional
import time

from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException, Path, Body, Depends, Request, Response, Query, status
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi import WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field
import uvicorn

# Arq imports - Fixed for compatibility
from arq import create_pool
from arq.connections import RedisSettings, ArqRedis
from arq.jobs import JobStatus  # Removed JobNotFound import

# Local imports
import database
from models import (
    GeneralTaskRequest,
    TaskCreationResponse,
    FullTaskDetailsResponse,
    TaskListResponse,
    TaskLogEntry,
    TaskStatsResponse,
    StatusResponse,
    RetryResponse,
    TaskSearchQuery
)

# --- Logging Setup ---
LOG_FORMAT = '%(asctime)s %(levelname)-8s [%(process)d] [%(name)s:%(lineno)d] %(message)s'
LOG_DATE_FORMAT = '%Y-%m-%d %H:%M:%S'
logging.basicConfig(
    level=logging.INFO, 
    format=LOG_FORMAT, 
    datefmt=LOG_DATE_FORMAT, 
    handlers=[logging.StreamHandler(sys.stdout)]
)
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
logging.getLogger("arq.connections").setLevel(logging.INFO)
logger = logging.getLogger(__name__)
logger.info("--- Browser Agent Backend v3.4 (ARQ Compatibility Fixes) Starting ---")


# --- Load Environment ---
load_dotenv()

# --- Redis/Arq Configuration ---
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_DB = int(os.getenv("REDIS_DATABASE", 0))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", None)
redis_settings = RedisSettings(
    host=REDIS_HOST, 
    port=REDIS_PORT, 
    database=REDIS_DB, 
    password=REDIS_PASSWORD
)
redis_pool_singleton: Optional[ArqRedis] = None

async def get_redis_pool() -> ArqRedis:
    global redis_pool_singleton
    if redis_pool_singleton is None:
        logger.info("API: Creating Arq Redis pool...")
        try:
            redis_pool_singleton = await create_pool(redis_settings)
            logger.info("API: Arq Redis pool created successfully.")
        except Exception as e:
            logger.critical(f"API FATAL: Failed to create Arq Redis pool on demand: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE, 
                detail=f"Failed to connect to Redis: {e}"
            )
    return redis_pool_singleton


# --- FastAPI App Initialization ---
app = FastAPI(
    title="Browser Agent Backend API", 
    version="3.4.0", 
    description="API to manage browser automation agent tasks."
)
origins = [os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")]
logger.info(f"API: Allowing CORS origins: {origins}")
app.add_middleware(
    CORSMiddleware, 
    allow_origins=origins, 
    allow_credentials=True, 
    allow_methods=["*"], 
    allow_headers=["*"]
)

# --- App Lifespan Events ---
@app.on_event("startup")
async def startup_event():
    logger.info("API: FastAPI application starting up...")
    try:
        database.get_db()
        logger.info("API: Database connection established for API startup.")
        database.init_db()
        logger.info("API: Database schema checked/initialized.")
    except Exception as e:
        logger.critical(f"API FATAL: Failed to initialize database on startup: {e}", exc_info=True)
        sys.exit(1)
    try:
        await get_redis_pool()
    except Exception as e:
        logger.critical(f"API FATAL: Failed to create Redis pool on startup: {e}", exc_info=True)
        sys.exit(1)
    logger.info("API: FastAPI startup complete. Database and Redis connected.")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("API: FastAPI application shutting down...")
    global redis_pool_singleton
    if redis_pool_singleton:
        logger.info("API: Closing Arq Redis pool...")
        await redis_pool_singleton.close()
        redis_pool_singleton = None
        logger.info("API: Arq Redis pool closed.")
    database.close_db()
    logger.info("API: Database connection closed for API shutdown.")
    logger.info("API: FastAPI shutdown complete.")


# --- Datetime Parsing Helper ---
def parse_db_datetime(datetime_str: Any) -> Optional[datetime]:
    if datetime_str is None:
        return None
    
    if isinstance(datetime_str, datetime):
        if datetime_str.tzinfo is None:
            return datetime_str.replace(tzinfo=timezone.utc)
        return datetime_str
    
    if isinstance(datetime_str, str):
        formats_to_try = [
            "%Y-%m-%d %H:%M:%S.%f%z",
            "%Y-%m-%d %H:%M:%S%z",
            "%Y-%m-%d %H:%M:%S.%f",
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%dT%H:%M:%S.%f%z",
            "%Y-%m-%dT%H:%M:%S%z",
            "%Y-%m-%dT%H:%M:%S.%f",
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%d",
        ]
        
        for fmt in formats_to_try:
            try:
                dt = datetime.strptime(datetime_str, fmt)
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                return dt
            except ValueError:
                continue
        
        try:
            dt = datetime.fromisoformat(datetime_str.replace('Z', '+00:00'))
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        except ValueError:
            logger.warning(f"API: Could not parse datetime string: '{datetime_str}' using any known format.")
            return None
    
    return None

# --- Utility to Map DB Dict to Pydantic Model ---
def map_db_task_to_response(task_dict: Dict[str, Any], response_model: BaseModel) -> Optional[BaseModel]:
    if not task_dict:
        return None
    
    try:
        if 'id' not in task_dict and 'task_id' in task_dict:
            task_dict['id'] = task_dict['task_id']
        
        for key in ['created_at', 'started_at', 'completed_at']:
            if key in task_dict:
                task_dict[key] = parse_db_datetime(task_dict[key])
        
        if 'logs' in task_dict and isinstance(task_dict['logs'], list):
            parsed_logs = []
            for log in task_dict['logs']:
                if isinstance(log, dict) and 'timestamp' in log:
                    log['timestamp'] = parse_db_datetime(log.get('timestamp'))
                    try:
                        parsed_logs.append(TaskLogEntry(**log))
                    except Exception as log_parse_err:
                        logger.warning(f"API: Skipping malformed log entry during mapping: {log}, Error: {log_parse_err}")
                else:
                    logger.warning(f"API: Skipping invalid log data structure: {log}")
            task_dict['logs'] = parsed_logs
        
        return response_model(**task_dict)
    except Exception as e:
        task_id = task_dict.get('id', 'UNKNOWN')
        logger.error(f"API: Error mapping DB task {task_id} to {response_model.__name__}: {e}", exc_info=True)
        return None


# --- API Endpoints ---

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.task_subscribers: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"API: New WebSocket connection established. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            
        # Remove from any task subscriptions
        for task_id in list(self.task_subscribers.keys()):
            if websocket in self.task_subscribers[task_id]:
                self.task_subscribers[task_id].remove(websocket)
                # Clean up empty sets
                if not self.task_subscribers[task_id]:
                    del self.task_subscribers[task_id]
        
        logger.info(f"API: WebSocket disconnected. Remaining connections: {len(self.active_connections)}")

    def subscribe_to_task(self, websocket: WebSocket, task_id: str):
        if task_id not in self.task_subscribers:
            self.task_subscribers[task_id] = set()
        self.task_subscribers[task_id].add(websocket)
        logger.info(f"API: Client subscribed to task {task_id}. Subscribers: {len(self.task_subscribers[task_id])}")

    async def broadcast(self, message: str):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"API: Error broadcasting message: {e}")
                disconnected.append(connection)
        
        # Clean up failed connections
        for conn in disconnected:
            self.disconnect(conn)

    async def broadcast_to_task(self, task_id: str, message: str):
        if task_id not in self.task_subscribers:
            return
            
        disconnected = []
        for connection in self.task_subscribers[task_id]:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"API: Error sending message to task {task_id} subscriber: {e}")
                disconnected.append(connection)
        
        # Clean up failed connections
        for conn in disconnected:
            self.disconnect(conn)

# Create connection manager instance
ws_manager = ConnectionManager()

# Add WebSocket endpoint
@app.websocket("/ws/agent")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Process incoming messages - could be task subscriptions
            try:
                message = json.loads(data)
                if message.get("type") == "subscribe" and "task_id" in message:
                    ws_manager.subscribe_to_task(websocket, message["task_id"])
                    await websocket.send_text(json.dumps({
                        "type": "system_message",
                        "content": f"Subscribed to task {message['task_id']}"
                    }))
            except json.JSONDecodeError:
                logger.warning(f"API: Received invalid JSON through WebSocket: {data[:100]}")
                await websocket.send_text(json.dumps({
                    "type": "system_message",
                    "content": "Invalid message format. Expected JSON."
                }))
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)

# Add broadcast endpoint for workers
@app.post("/api/agent/broadcast", status_code=status.HTTP_200_OK)
async def broadcast_agent_message(
    message: Dict[str, Any] = Body(..., description="Message to broadcast via WebSocket")
):
    """Endpoint for workers to send messages to WebSocket clients."""
    logger.debug(f"API: Received broadcast message: {message}")
    
    if "type" not in message or "content" not in message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message must contain 'type' and 'content' fields"
        )
    
    # Format the message as JSON
    message_json = json.dumps(message)
    
    # If message has a task_id, broadcast only to subscribers
    if "task_id" in message and message["task_id"]:
        await ws_manager.broadcast_to_task(message["task_id"], message_json)
        await ws_manager.broadcast(message_json)  # Also broadcast to all for now
    else:
        # Otherwise broadcast to all connections
        await ws_manager.broadcast(message_json)
    
    return {"success": True, "message": "Broadcast successful"}

# Add task queue with built-in WebSocket broadcasting
@app.post("/tasks/submit", response_model=TaskCreationResponse, status_code=status.HTTP_202_ACCEPTED)
async def submit_general_task(
    request_data: GeneralTaskRequest, 
    redis_pool: ArqRedis = Depends(get_redis_pool)
):
    task_id = f"task_{uuid.uuid4().hex[:12]}"
    task_type = "general_agent_task"
    input_data = request_data.model_dump()
    
    logger.info(f"API: Received task submission {task_id} ({task_type}).")
    
    try:
        database.create_task(task_id, task_type, input_data)
        database.add_log_entry(task_id, "INFO", "API: Task received and created in DB.")
        
        # Notify any listening WebSocket clients
        await ws_manager.broadcast(json.dumps({
            "type": "task_status",
            "task_id": task_id,
            "status": "pending",
            "content": f"Task {task_id} created and queued"
        }))
        
        await redis_pool.enqueue_job(
            "run_task",
            task_id=task_id,
            urls=request_data.context_urls,
            task_instructions=request_data.task_instructions,
            agent_config=request_data.agent_config,
            _job_id=task_id
        )
        
        database.add_log_entry(task_id, "INFO", f"API: Task enqueued for worker processing (Job ID: {task_id}).")
        logger.info(f"API: Successfully submitted and enqueued task {task_id}.")
        
        return TaskCreationResponse(
            id=task_id,
            status="PENDING",
            message="Agent task accepted and queued."
        )
    except Exception as e:
        logger.error(f"API: Failed to submit or enqueue task {task_id}: {e}", exc_info=True)
        
        # Notify any listening clients about the error
        await ws_manager.broadcast(json.dumps({
            "type": "task_status",
            "task_id": task_id,
            "status": "failed",
            "content": f"Task {task_id} submission failed: {str(e)}"
        }))
        
        try:
            database.update_task_status(task_id, "FAILED", error_details=f"API submission error: {e}")
            database.add_log_entry(task_id, "ERROR", f"API: Task submission failed: {e}. Marked as FAILED.")
        except Exception as db_err:
            logger.error(f"API: Failed to mark task {task_id} as FAILED after submission error: {db_err}")
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to enqueue task: {e}"
        )

# List Tasks
@app.get("/tasks/list/json", response_model=List[TaskListResponse])
async def list_tasks_json(
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0)
):
    logger.debug(f"API: Received JSON task list request GET /tasks/list/json (limit={limit}, offset={offset})")
    try:
        tasks_summary_list = database.list_tasks(limit=limit, offset=offset)
        
        if not tasks_summary_list:
            return []
        
        tasks_list_pydantic = []
        for task_summary in tasks_summary_list:
            mapped = map_db_task_to_response(task_summary, TaskListResponse)
            if mapped:
                tasks_list_pydantic.append(mapped)
        
        logger.debug(f"API: Retrieved {len(tasks_list_pydantic)} tasks summary (JSON).")
        return tasks_list_pydantic
    except Exception as e:
        logger.error(f"API: Error listing tasks (JSON): {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error listing tasks."
        )

# Get Task Details
@app.get("/tasks/{task_id}/json", response_model=FullTaskDetailsResponse)
async def get_task_details_json(
    task_id: str = Path(..., description="The ID of the task to retrieve details for.")
):
    logger.debug(f"API: Received JSON details request GET /tasks/{task_id}/json")
    try:
        task_details_dict = database.get_task_details(task_id)
        
        if not task_details_dict:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task ID not found"
            )
        
        task_logs_list = database.get_task_logs(task_id)
        task_details_dict['logs'] = task_logs_list
        
        response_data = map_db_task_to_response(task_details_dict, FullTaskDetailsResponse)
        
        if response_data is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error processing task details from database."
            )
        
        logger.debug(f"API: Retrieved JSON details for task {task_id}.")
        return response_data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"API: Error retrieving JSON details for task {task_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error retrieving task details."
        )

# Get Task Logs
@app.get("/tasks/{task_id}/logs/json", response_model=List[TaskLogEntry])
async def get_task_logs_json(
    task_id: str = Path(..., description="The ID of the task to retrieve logs for."),
    level: Optional[str] = Query(None, description="Filter logs by level (e.g., INFO, ERROR)."),
    limit: int = Query(1000, ge=1, le=5000)
):
    logger.debug(f"API: Received JSON logs request GET /tasks/{task_id}/logs/json (level={level}, limit={limit})")
    
    task_exists = database.get_task_details(task_id)
    if not task_exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task ID not found"
        )
    
    try:
        task_logs_list = database.get_task_logs(task_id, level=level, limit=limit)
        
        if not task_logs_list:
            return []
        
        log_entries_pydantic = []
        for log in task_logs_list:
            mapped_log = map_db_task_to_response(log, TaskLogEntry)
            if mapped_log:
                log_entries_pydantic.append(mapped_log)
        
        logger.debug(f"API: Retrieved {len(log_entries_pydantic)} logs for task {task_id}.")
        return log_entries_pydantic
    except Exception as e:
        logger.error(f"API: Error retrieving JSON logs for task {task_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error retrieving task logs."
        )

# Search Tasks
@app.get("/tasks/search/json", response_model=List[TaskListResponse])
async def search_tasks_json(query: TaskSearchQuery = Depends()):
    logger.debug(f"API: Received JSON task search request GET /tasks/search/json with query: {query}")
    try:
        tasks_summary_list = database.search_tasks(
            status=query.status,
            task_type=query.task_type,
            days=query.days
        )
        
        if not tasks_summary_list:
            return []
        
        tasks_list_pydantic = []
        for task_summary in tasks_summary_list:
            mapped = map_db_task_to_response(task_summary, TaskListResponse)
            if mapped:
                tasks_list_pydantic.append(mapped)
        
        logger.debug(f"API: Found {len(tasks_list_pydantic)} tasks matching search criteria.")
        return tasks_list_pydantic
    except AttributeError:
        logger.error("API: database.search_tasks function not found or implemented.", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Search functionality not yet implemented in the database layer."
        )
    except Exception as e:
        logger.error(f"API: Error searching tasks (JSON): {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error searching tasks."
        )

# Get Task Stats
@app.get("/tasks/stats/json", response_model=TaskStatsResponse)
async def get_task_stats_json():
    logger.debug("API: Received JSON task stats request GET /tasks/stats/json")
    try:
        stats_dict = database.get_task_stats()
        for key in TaskStatsResponse.model_fields.keys():
            stats_dict.setdefault(key, 0)
        return TaskStatsResponse(**stats_dict)
    except AttributeError:
        logger.error("API: database.get_task_stats function not found or implemented.", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Statistics functionality not yet implemented in the database layer."
        )
    except Exception as e:
        logger.error(f"API: Error getting task stats (JSON): {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error getting task statistics."
        )

# Cancel Task (Adapted for compatibility without JobNotFound)
@app.post("/tasks/{task_id}/cancel", response_model=StatusResponse)
async def cancel_task(
    task_id: str = Path(..., description="The ID of the task to cancel."),
    redis_pool: ArqRedis = Depends(get_redis_pool)
):
    logger.info(f"API: Received cancel request for task {task_id}")
    task = database.get_task_details(task_id)
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task ID not found"
        )

    current_status = task.get("status")
    
    if current_status == "PENDING":
        try:
            database.update_task_status(
                task_id,
                "FAILED",
                error_details="Task cancelled by user before start."
            )
            database.add_log_entry(
                task_id,
                "WARNING",
                "Task cancelled by user request (was PENDING)."
            )
            logger.info(f"API: Cancelled pending task {task_id}.")
            
            return StatusResponse(
                status="cancelled",
                message="Task was pending and has been marked as failed."
            )
        except Exception as e:
            logger.error(f"API: Failed to mark pending task {task_id} as failed during cancel: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update task status during cancel."
            )

    elif current_status == "RUNNING":
        job_aborted = False
        abort_error = None
        job_status_str = "unknown"
        
        try:
            # Check if job exists without using JobNotFound exception
            job = await redis_pool.get_job_by_id(task_id)
            
            if job:
                job_status_str = job.status
                if job.status in {JobStatus.queued, JobStatus.in_progress}:
                    await job.abort(timeout=5)  # Request abort
                    job_aborted = True
                    logger.info(f"API: Sent abort signal to Arq job {task_id}.")
                    database.add_log_entry(
                        task_id,
                        "WARNING",
                        f"API: Sent abort signal to worker for task {task_id}."
                    )
                else:
                    logger.warning(
                        f"API: Cancel request for task {task_id}, but job already finished "
                        f"(Arq Status: {job_status_str})."
                    )
                    database.add_log_entry(
                        task_id,
                        "WARNING",
                        f"API: Cancel request, but Arq job finished (Status: {job_status_str}). "
                        f"Treating as already finished."
                    )
            else:
                # Job doesn't exist in Redis
                job_status_str = "not_found"
                logger.warning(f"API: Cancel request for running task {task_id}, but Arq job not found in Redis.")
                database.add_log_entry(
                    task_id,
                    "WARNING",
                    f"API: Cancel request, but Arq job {task_id} not found. Treating as already finished."
                )
        except Exception as e:
            # Catch other potential errors during job interaction
            abort_error = str(e)
            logger.error(f"API: Error interacting with Arq job {task_id} during cancellation: {e}", exc_info=True)
            database.add_log_entry(
                task_id,
                "ERROR",
                f"API: Failed to interact with Arq job {task_id}: {e}"
            )

        # Always mark as FAILED in DB after attempting abort/check
        try:
            err_details = f"Task cancelled by user request."
            if abort_error:
                err_details += f" Abort signal error: {abort_error}"
            elif not job_aborted:
                err_details += f" Worker may not have received signal (Arq Status: {job_status_str})."

            database.update_task_status(task_id, "FAILED", error_details=err_details)
            database.add_log_entry(
                task_id,
                "WARNING",
                "Task marked as FAILED due to user cancellation request."
            )
            logger.info(
                f"API: Marked running task {task_id} as FAILED due to cancel request "
                f"(Abort signal sent: {job_aborted}, Arq Status: {job_status_str})."
            )
            
            return StatusResponse(
                status="cancellation_requested",
                message="Cancellation requested; task marked as failed."
            )
        except Exception as db_err:
            logger.error(
                f"API: Critical failure during cancel: Could not mark task {task_id} as FAILED "
                f"after abort attempt: {db_err}",
                exc_info=True
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error marking task as failed during cancellation: {db_err}"
            )

    else:  # COMPLETED or FAILED
        logger.warning(f"API: Cannot cancel task {task_id}, status is {current_status}.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Task cannot be cancelled, status is {current_status}."
        )

# Retry Task
@app.post("/tasks/{task_id}/retry", response_model=RetryResponse)
async def retry_task(
    task_id: str = Path(..., description="The ID of the failed task to retry."),
    redis_pool: ArqRedis = Depends(get_redis_pool)
):
    logger.info(f"API: Received retry request for task {task_id}")
    original_task = database.get_task_details(task_id)
    
    if not original_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Original task ID not found"
        )
    
    if original_task.get("status") != "FAILED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only FAILED tasks can be retried (status: {original_task.get('status')})."
        )
    
    input_data = original_task.get("input_data")
    if not isinstance(input_data, dict):
        logger.error(f"API: Cannot retry task {task_id}, input_data is missing or not a dictionary.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Cannot retry task: original input data is invalid."
        )
    
    try:
        request_model = GeneralTaskRequest(**input_data)
    except Exception as pydantic_err:
        logger.error(f"API: Failed to parse original input_data for retry of task {task_id}: {pydantic_err}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Cannot retry task: original input data is incompatible with current format: {pydantic_err}"
        )
    
    new_task_id = f"retry_{uuid.uuid4().hex[:8]}_{original_task['id'][-8:]}"
    logger.info(f"API: Creating retry task {new_task_id} based on failed task {task_id}")
    
    try:
        database.create_task(new_task_id, original_task['task_type'], input_data)
        database.add_log_entry(new_task_id, "INFO", f"API: Task created as retry of {task_id}.")
        
        await redis_pool.enqueue_job(
            "run_task",
            task_id=new_task_id,
            urls=request_model.context_urls,
            task_instructions=request_model.task_instructions,
            agent_config=request_model.agent_config,
            _job_id=new_task_id
        )
        
        database.add_log_entry(
            new_task_id,
            "INFO",
            f"API: Retry task enqueued for worker processing (Job ID: {new_task_id})."
        )
        logger.info(f"API: Successfully submitted and enqueued retry task {new_task_id}.")
        
        return RetryResponse(
            status="retry_queued",
            new_task_id=new_task_id,
            message=f"New task {new_task_id} created and queued for retry."
        )
    except Exception as e:
        logger.error(f"API: Failed to submit or enqueue retry task {new_task_id}: {e}", exc_info=True)
        try:
            database.update_task_status(
                new_task_id,
                "FAILED",
                error_details=f"API retry submission error: {e}"
            )
            database.add_log_entry(
                new_task_id,
                "ERROR",
                f"API: Retry task submission failed: {e}. Marked as FAILED."
            )
        except Exception as db_err:
            logger.error(f"API: Failed to mark retry task {new_task_id} as FAILED after submission error: {db_err}")
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to enqueue retry task: {e}"
        )

# Delete Task
@app.delete("/tasks/{task_id}", response_model=StatusResponse)
async def delete_task(task_id: str = Path(..., description="The ID of the task to delete.")):
    logger.info(f"API: Received delete request for task {task_id}")
    task = database.get_task_details(task_id)
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task ID not found"
        )
    
    if task.get("status") == "RUNNING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete a RUNNING task. Cancel it first."
        )
    
    try:
        deleted = database.delete_task(task_id)
        if deleted:
            logger.info(f"API: Successfully deleted task {task_id} and its logs.")
            return StatusResponse(
                status="deleted",
                message=f"Task {task_id} and its logs have been deleted."
            )
        else:
            logger.warning(f"API: Delete request for task {task_id}, but database delete operation failed or task already gone.")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task found initially but could not be deleted (or was already deleted)."
            )
    except AttributeError:
        logger.error("API: database.delete_task function not found or implemented.", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Delete functionality not yet implemented in the database layer."
        )
    except Exception as e:
        logger.error(f"API: Error deleting task {task_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error deleting task: {e}"
        )

# --- Static Files Serving (React Build) ---
BUILD_DIR = os.getenv("FRONTEND_BUILD_DIR", "frontend/build")

if not os.path.exists(BUILD_DIR) or not os.path.isdir(BUILD_DIR):
    logger.warning(f"API: Frontend build directory not found at '{BUILD_DIR}'. Serving API only.")
    
    @app.get("/", response_class=HTMLResponse, include_in_schema=False)
    async def root_api_only():
        return HTMLResponse("<h1>Browser Agent API</h1><p>Frontend not found. Access API at /docs.</p>")
else:
    logger.info(f"API: Serving frontend static files from '{BUILD_DIR}'")
    static_assets_path = os.path.join(BUILD_DIR, "static")
    
    if os.path.exists(static_assets_path) and os.path.isdir(static_assets_path):
        app.mount("/static", StaticFiles(directory=static_assets_path), name="static_assets")
    else:
        logger.warning(f"API: Static assets directory not found at '{static_assets_path}'. Frontend may not load correctly.")
    
    index_html_path = os.path.join(BUILD_DIR, "index.html")
    if not os.path.exists(index_html_path):
        logger.error(f"API FATAL: Frontend index.html not found at {index_html_path}!")
        
        @app.get("/{full_path:path}", response_class=HTMLResponse, include_in_schema=False)
        async def serve_frontend_missing_index(request: Request, full_path: str):
            return HTMLResponse("<h1>Error: Frontend index.html not found.</h1>", status_code=500)
    else:
        @app.get("/{full_path:path}", response_class=HTMLResponse, include_in_schema=False)
        async def serve_frontend_spa(request: Request, full_path: str):
            if full_path.startswith("tasks/") or full_path in ["docs", "openapi.json", "redoc"]:
                return Response(content="Not Found", status_code=404)
            
            logger.debug(f"API: Serving index.html for SPA path: /{full_path}")
            try:
                return HTMLResponse(content=open(index_html_path).read())
            except Exception as e:
                logger.error(f"API: Error reading index.html: {e}", exc_info=True)
                return HTMLResponse("<h1>Internal Server Error</h1>", status_code=500)


# --- Run Server ---
if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "127.0.0.1")
    reload_flag = os.getenv("UVICORN_RELOAD", "true").lower() == "true"
    log_level = os.getenv("UVICORN_LOG_LEVEL", "info")
    
    logger.info(f"API: Starting Uvicorn server on http://{host}:{port} (Reload: {reload_flag}, LogLevel: {log_level})")
    uvicorn.run(
        "backend_server:app",
        host=host,
        port=port,
        reload=reload_flag,
        log_level=log_level
    )

# --- END OF ADJUSTED FILE backend_server.py (ARQ Compatibility Fix) ---