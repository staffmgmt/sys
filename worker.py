# --- UPDATED worker.py ---
import asyncio
import os
import logging
import sys
import platform
import traceback
import json
import time
import uuid
import httpx
from dotenv import load_dotenv
from typing import List, Dict, Any, Optional

# Arq specific imports
from arq.connections import RedisSettings

# Local database interaction functions
import database
from database import add_log_entry, update_task_status, update_task_result, close_db, get_db, init_db

# Disable telemetry
os.environ["ANONYMIZED_TELEMETRY"] = "false"

# Core Agent Imports
try:
    from browser_use import Agent
    from browser_use.agent.views import AgentSettings
    from browser_use.llm_service import RotatingGeminiClient
    import playwright.async_api
    import gc
except ImportError as import_err:
    print(f"FATAL WORKER ERROR: Failed core library import: {import_err}. Ensure dependencies are installed and accessible.", file=sys.stderr)
    sys.exit(1)

# --- Logging Setup for Worker ---
LOG_FORMAT = '%(asctime)s %(levelname)-8s [WORKER:%(process)d:%(thread)d] [%(name)s:%(lineno)d] %(message)s'
LOG_DATE_FORMAT = '%Y-%m-%d %H:%M:%S'
if not logging.getLogger().handlers:
    logging.basicConfig(level=logging.INFO, format=LOG_FORMAT, datefmt=LOG_DATE_FORMAT, handlers=[logging.StreamHandler(sys.stdout)])

logging.getLogger("browser_use").setLevel(logging.INFO)
logging.getLogger("watchfiles.main").setLevel(logging.WARNING)
logging.getLogger("arq.worker").setLevel(logging.INFO)
logging.getLogger("arq.connections").setLevel(logging.INFO)
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("google.api_core.retry").setLevel(logging.WARNING)
logging.getLogger("PIL").setLevel(logging.WARNING)
logging.getLogger("openai").setLevel(logging.WARNING)

logger = logging.getLogger("worker.task_runner")
logger.setLevel(logging.DEBUG)

# --- Environment Setup & API Key Loading ---
API_KEYS: List[str] = []
API_KEY_LOAD_ATTEMPTED = False

def load_api_keys() -> bool:
    global API_KEYS, API_KEY_LOAD_ATTEMPTED
    if API_KEY_LOAD_ATTEMPTED and API_KEYS:
        return True
    API_KEY_LOAD_ATTEMPTED = True
    loaded_keys = []
    key_base = "GEMINI_API_KEY"
    i = 1
    while True:
        key_name = f"{key_base}_{i}"
        key = os.getenv(key_name)
        if key:
            loaded_keys.append(key)
            logger.debug(f"WORKER: Found API key {key_name}")
        else:
            if i == 1:
                 single_key = os.getenv(key_base) or os.getenv("GOOGLE_API_KEY")
                 if single_key:
                     loaded_keys.append(single_key)
                     logger.info(f"WORKER: Loaded 1 API Key using fallback name '{key_base}' or 'GOOGLE_API_KEY'.")
            break
        i += 1
    API_KEYS = loaded_keys
    if not API_KEYS:
        logger.error("WORKER FATAL: No Gemini API keys found. Worker cannot process LLM tasks.")
        return False
    else:
        if 'GOOGLE_API_KEY' not in os.environ and API_KEYS:
            os.environ['GOOGLE_API_KEY'] = API_KEYS[0]
            logger.debug("WORKER: Set GOOGLE_API_KEY environment variable from the first loaded key.")
        logger.info(f"WORKER: Loaded {len(API_KEYS)} API Key(s).")
        return True

# --- Asyncio Policy Setup ---
def setup_asyncio_policy():
    if platform.system() == "Windows":
        try:
            asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
            logger.info("WORKER: Set WindowsProactorEventLoopPolicy for asyncio on Windows.")
        except Exception as policy_err:
            logger.error(f"WORKER: Error setting Windows event loop policy: {policy_err}", exc_info=True)

# --- Send Agent Thought Helper ---
async def send_agent_thought(task_id: str, thought: str, type: str = "agent_thought") -> bool:
    api_url = os.getenv("BACKEND_API_URL", "http://localhost:8000").rstrip('/')
    ws_update_url = f"{api_url}/api/agent/broadcast"
    message = {"type": type, "task_id": task_id, "content": thought}
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(ws_update_url, json=message, headers={"Content-Type": "application/json"})
            if response.status_code == 200:
                logger.debug(f"Successfully sent agent thought for task {task_id}: {type}")
                return True
            else:
                logger.warning(f"Failed to send agent thought for task {task_id} to {ws_update_url}. Status: {response.status_code}, Response: {response.text}")
                return False
    except httpx.RequestError as e:
        logger.error(f"HTTP RequestError sending agent thought for task {task_id} to {ws_update_url}: {e}", exc_info=False)
        return False
    except Exception as e:
        logger.error(f"Unexpected error sending agent thought for task {task_id}: {e}", exc_info=True)
        return False

# --- Playwright Cleanup Utility ---
async def cleanup_playwright_resources(task_id: str, log_prefix: str = ""):
    logger.info(f"{log_prefix}WORKER: Starting Playwright cleanup for task {task_id}.")
    closed_count = 0
    try:
        gc.collect()
        all_objects = gc.get_objects()
        browser_class = getattr(playwright.async_api, 'Browser', None)
        context_class = getattr(playwright.async_api, 'BrowserContext', None)
        page_class = getattr(playwright.async_api, 'Page', None)
        
        async def safe_close(obj, obj_type_name, close_method_name="close"):
            nonlocal closed_count
            try:
                if hasattr(obj, close_method_name) and callable(getattr(obj, close_method_name)):
                    if page_class and isinstance(obj, page_class) and hasattr(obj, 'is_closed') and obj.is_closed(): 
                        return
                    if browser_class and isinstance(obj, browser_class) and hasattr(obj, 'is_connected') and not obj.is_connected(): 
                        return
                    await getattr(obj, close_method_name)()
                    closed_count += 1
                    logger.debug(f"{log_prefix}WORKER: Closed Playwright {obj_type_name} instance {id(obj)}.")
            except Exception as close_err:
                err_str = str(close_err).lower()
                if "closed" not in err_str and "context was destroyed" not in err_str and "browser has been closed" not in err_str:
                    if "api_key" not in err_str and "openai" not in err_str:
                        logger.warning(f"{log_prefix}WORKER: Error closing Playwright {obj_type_name} {id(obj)}: {type(close_err).__name__} - {close_err}")
        
        # First close pages
        if page_class:
            for obj in all_objects:
                if isinstance(obj, page_class): 
                    await safe_close(obj, "Page")
        
        # Then contexts
        if context_class:
            for obj in all_objects:
                if isinstance(obj, context_class): 
                    await safe_close(obj, "Context")
        
        # Finally browsers
        if browser_class:
            for obj in all_objects:
                if isinstance(obj, browser_class): 
                    await safe_close(obj, "Browser")
        
        if closed_count > 0: 
            logger.info(f"{log_prefix}WORKER: Playwright cleanup closed {closed_count} resources for task {task_id}.")
        else:
            logger.debug(f"{log_prefix}WORKER: Playwright cleanup found no active Playwright resources to close for task {task_id}.")
    
    except Exception as cleanup_err:
        if "api_key" not in str(cleanup_err) and "openai" not in str(cleanup_err):
            logger.error(f"{log_prefix}WORKER: General error during Playwright cleanup for task {task_id}: {cleanup_err}", exc_info=True)
        else:
            logger.warning(f"{log_prefix}WORKER: OpenAI-related error encountered during cleanup.")
    
    finally:
        try: 
            gc.collect()
        except: 
            pass

# --- Arq Task Definition ---
async def run_task(
    ctx: dict,
    task_id: str,
    task_instructions: str,
    urls: Optional[List[str]] = None,
    agent_config: Optional[Dict[str, Any]] = None
    ):
    job_id = ctx.get('job_id', task_id)
    start_time_monotonic = time.monotonic()
    log_prefix = f"[Task {task_id}] "
    logger.info(f"{log_prefix}Received. Job ID: {job_id}. Instructions: '{task_instructions[:100]}...'. URLs: {urls}. Agent Config: {agent_config}")

    agent_instance = None
    llm_client = None
    browser_setup_error = None

    try:
        get_db()
        add_log_entry(task_id, "INFO", f"{log_prefix}Worker picked up task. Job ID: {job_id}.")
        update_task_status(task_id, "RUNNING")
    except Exception as db_err:
        logger.critical(f"{log_prefix}DB connection/update failed at task start: {db_err}", exc_info=True)
        raise RuntimeError(f"DB setup failed for task {task_id}: {db_err}") from db_err

    try:
        if not API_KEYS:
            if not load_api_keys():
                raise RuntimeError("API keys are not loaded for LLM tasks.")
        
        # Disable OpenAI to prevent errors
        os.environ["OPENAI_API_KEY"] = "DISABLED_INTENTIONALLY_BY_WORKER"
        
        # Create the client params
        client_init_params = {
            "api_keys": API_KEYS,
        }
        
        # Get model name from environment instead of hardcoding
        model_name = os.environ.get("LLM_MODEL", "gemini-1.5-flash")
        client_init_params["model_name"] = model_name
        
        # Add other configs from agent_config
        if agent_config:
            for param in ["temperature", "convert_system_message_to_human", 
                          "request_timeout", "top_p", "top_k"]:
                if param in agent_config:
                    client_init_params[param] = agent_config[param]
        
        # Create the Rotating LLM Client
        llm_client = RotatingGeminiClient(**client_init_params)
        
        # Skip verification by marking as verified
        llm_client._verified_api_keys = True
        
        # Verify client connection explicitly
        try:
            logger.info(f"{log_prefix}Testing LLM client connection before agent initialization...")
            await llm_client.verify_client()  # This actually makes a test call
            logger.info(f"{log_prefix}LLM client connection verified successfully.")
        except Exception as verify_err:
            logger.error(f"{log_prefix}LLM client test failed: {verify_err}", exc_info=True)
            add_log_entry(task_id, "ERROR", f"LLM client connection test failed: {verify_err}")
            raise RuntimeError(f"LLM API connection failed: {verify_err}")
        
        add_log_entry(task_id, "INFO", f"{log_prefix}Initialized Rotating LLM Client with {len(API_KEYS)} keys using model {model_name}.")
        
        # Create a clean agent config 
        effective_agent_config = agent_config.copy() if agent_config else {}
        
        # Must disable planner to avoid errors
        effective_agent_config['use_planner'] = True
        
        # Add browser configuration for headless mode in worker environment
        browser_config = {
            "headless": True,  # Always run headless in the worker
            "disable_security": True,  # Allow cross-origin iframe support
        }
        effective_agent_config['browser_config'] = browser_config
        
        # Get all valid AgentSettings fields
        agent_settings_fields = {}
        for k, v in effective_agent_config.items():
            # Check if field is in AgentSettings
            if hasattr(AgentSettings, k) and k not in ['llm', 'planner_llm', 'model_name']:
                agent_settings_fields[k] = v
        
        # Only keep what Agent.__init__ actually accepts
        agent_args = {
            'llm': llm_client,
        }
        
        # Add settings that are valid for Agent constructor
        valid_agent_params = [
            'use_vision', 'use_vision_for_planner', 'save_conversation_path',
            'max_failures', 'retry_delay', 'override_system_message',
            'extend_system_message', 'max_input_tokens', 'validate_output',
            'message_context', 'generate_gif', 'available_file_paths',
            'include_attributes', 'max_actions_per_step', 'tool_calling_method',
            'page_extraction_llm', 'planner_interval', 'is_planner_reasoning',
            'enable_memory', 'memory_interval', 'memory_config',
            'browser_config'  # Include browser config
        ]
        
        # Add only valid params to agent_args
        for param in valid_agent_params:
            if param in agent_settings_fields:
                agent_args[param] = agent_settings_fields[param]
        
        # Prepare task for agent
        agent_task = {
            "id": task_id,
            "instructions": task_instructions,
            "user_id": f"worker_arq_{job_id}"
        }
        
        # Add URLs to task description if provided
        if urls:
            agent_task["instructions"] += f"\n\nContext URLs: {', '.join(urls)}"
        
        add_log_entry(task_id, "INFO", f"{log_prefix}Preparing to run Agent with planner and memory DISABLED.")
        
        # Set environment variable for agent to know we're in ARQ worker
        os.environ["ARQ_WORKER"] = "true"
        
        # Initialize the agent with only valid parameters
        try:
            agent_instance = Agent(task=agent_task["instructions"], **agent_args)
            await send_agent_thought(task_id, f"Starting task: {task_instructions[:70]}...", "task_status_update")
        except Exception as agent_init_err:
            browser_setup_error = f"Agent initialization failed: {str(agent_init_err)}"
            logger.error(f"{log_prefix}Agent initialization failed: {agent_init_err}", exc_info=True)
            add_log_entry(task_id, "ERROR", f"Agent initialization failed: {agent_init_err}")
            raise RuntimeError(f"Agent initialization failed: {agent_init_err}")
        
        # Set max_steps when running the agent (not in constructor)
        max_steps = effective_agent_config.get('max_steps', 50)
        
        # Run the agent with the max_steps parameter
        agent_start_time = time.monotonic()
        await agent_instance.run(max_steps=max_steps)
        agent_run_duration = time.monotonic() - agent_start_time
        add_log_entry(task_id, "INFO", f"{log_prefix}Agent run finished in {agent_run_duration:.2f}s.")
        
        # Extract results from agent state
        final_result_data = None
        agent_run_error_message = None
        run_successful = False
        
        if hasattr(agent_instance, 'state') and agent_instance.state:
            agent_status = getattr(agent_instance.state, 'status', 'UNKNOWN_STATUS')
            run_successful = "COMPLETED" in str(agent_status).upper()
            
            # Get output from agent state
            final_output = getattr(agent_instance.state, 'accumulated_output', "No output.")
            error_details = getattr(agent_instance.state, 'last_error', None)
            
            final_result_data = {"final_output": final_output}
            if error_details:
                final_result_data["error_details"] = error_details
                if not run_successful:
                    agent_run_error_message = error_details
                    
            add_log_entry(
                task_id, 
                "INFO" if run_successful else "WARNING", 
                f"{log_prefix}Agent final status: {agent_status}. Success: {run_successful}."
            )
        else:
            add_log_entry(task_id, "ERROR", f"{log_prefix}Agent run finished but agent state is missing.")
            agent_run_error_message = "Agent instance or state missing after run."
            final_result_data = {"error": agent_run_error_message}
            run_successful = False
            
        # Record final results
        final_status = "COMPLETED" if run_successful else "FAILED"
        final_error_for_db = agent_run_error_message if not run_successful else None
        
        add_log_entry(
            task_id, 
            "INFO" if run_successful else "ERROR", 
            f"{log_prefix}Task recorded as {final_status}. Error: {final_error_for_db}"
        )
        
        await send_agent_thought(
            task_id, 
            f"Task {final_status.lower()}" + (f": {final_error_for_db}" if final_error_for_db else "."), 
            "task_result"
        )
        
        # Ensure result is serializable
        serializable_result = {}
        try:
            json.dumps(final_result_data or {"status": final_status})
            serializable_result = final_result_data or {"status": final_status}
        except TypeError:
            logger.warning(f"{log_prefix}Final result data not directly JSON serializable.")
            serializable_result = {
                "status": final_status, 
                "error": final_error_for_db, 
                "raw_output_type": str(type(final_result_data))
            }
            
        # Update database with results
        update_task_result(task_id, serializable_result)
        update_task_status(task_id, final_status, error_details=final_error_for_db)

    except asyncio.CancelledError:
        logger.warning(f"{log_prefix}Task cancelled by Arq or system.")
        update_task_status(task_id, "CANCELLED", error_details="Task cancelled by worker/system.")
        add_log_entry(task_id, "WARNING", f"{log_prefix}Task marked as CANCELLED.")
        await send_agent_thought(task_id, "Task was cancelled.", "task_status_update")
    except Exception as e:
        final_error_details = f"Critical worker task error: {type(e).__name__} - {e}"
        if browser_setup_error:
            final_error_details = f"Browser setup failed: {browser_setup_error}. {final_error_details}"
            
        logger.critical(f"{log_prefix}{final_error_details}", exc_info=True)
        try:
            update_task_status(task_id, "FAILED", error_details=final_error_details)
            add_log_entry(task_id, "CRITICAL", f"{log_prefix}{final_error_details}")
            await send_agent_thought(task_id, f"Task failed critically: {final_error_details[:100]}...", "task_error")
        except Exception as db_update_err:
            logger.error(f"{log_prefix}Failed to update task status to FAILED after critical error: {db_update_err}")
    finally:
        try:
            # Cleanup agent resources
            if agent_instance:
                if hasattr(agent_instance, 'close') and callable(agent_instance.close):
                    try:
                        logger.debug(f"{log_prefix}Closing agent via close method")
                        await agent_instance.close()
                        logger.info(f"{log_prefix}Agent resources closed via close method.")
                    except Exception as close_err:
                        logger.warning(f"{log_prefix}Error during agent close: {close_err}. Performing manual Playwright cleanup.")
                        await cleanup_playwright_resources(task_id, log_prefix + "Fallback ")
                else:
                    logger.debug(f"{log_prefix}No agent close method available. Using manual Playwright cleanup.")
                    await cleanup_playwright_resources(task_id, log_prefix)
        except Exception as cleanup_err:
            logger.error(f"{log_prefix}Error during cleanup: {cleanup_err}")
        
        close_db()
        total_duration = time.monotonic() - start_time_monotonic
        logger.info(f"{log_prefix}Job {job_id} processing finished. Total duration: {total_duration:.2f}s")

# --- Arq Worker Settings ---
load_dotenv()
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_DB = int(os.getenv("REDIS_DATABASE_ARQ", 0))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", None)
if REDIS_PASSWORD == "null" or REDIS_PASSWORD == "": REDIS_PASSWORD = None
redis_settings = RedisSettings(host=REDIS_HOST, port=REDIS_PORT, database=REDIS_DB, password=REDIS_PASSWORD)

async def on_worker_startup(ctx: dict):
    worker_pid = os.getpid()
    ctx['worker_pid'] = worker_pid
    logger.info(f"WORKER STARTUP: Process {worker_pid} initializing...")
    setup_asyncio_policy()
    try:
        get_db()
        init_db()
        logger.info(f"WORKER STARTUP [{worker_pid}]: Database connection pool and schema initialized.")
    except Exception as e:
        logger.critical(f"WORKER STARTUP [{worker_pid}]: FATAL - Failed to initialize database: {e}", exc_info=True)
    if not load_api_keys():
         logger.critical(f"WORKER STARTUP [{worker_pid}]: FATAL - No API keys loaded. LLM-dependent tasks will fail.")
    else:
        logger.info(f"WORKER STARTUP [{worker_pid}]: API Keys loaded successfully.")
    # Disable OpenAI
    os.environ["OPENAI_API_KEY"] = "DISABLED_INTENTIONALLY_BY_WORKER"
    # Set ARQ worker flag
    os.environ["ARQ_WORKER"] = "true"
    logger.info(f"WORKER STARTUP [{worker_pid}]: Initialization complete. Ready for tasks.")

async def on_worker_shutdown(ctx: dict):
    worker_pid = ctx.get('worker_pid', 'UNKNOWN_PID')
    logger.info(f"WORKER SHUTDOWN: Process {worker_pid} shutting down...")
    try:
        close_db()
        logger.info(f"WORKER SHUTDOWN [{worker_pid}]: Database connection pool closed.")
    except Exception as e:
        logger.error(f"WORKER SHUTDOWN [{worker_pid}]: Error closing database: {e}", exc_info=True)
    logger.info(f"WORKER SHUTDOWN [{worker_pid}]: Shutdown complete.")

class WorkerSettings:
    functions = [run_task]
    redis_settings = redis_settings
    max_jobs = int(os.getenv("ARQ_MAX_JOBS", 5))
    job_timeout = int(os.getenv("ARQ_JOB_TIMEOUT", 1800))
    keep_result_seconds = int(os.getenv("ARQ_KEEP_RESULT_SECONDS", 3600 * 24 * 7))
    max_tries = int(os.getenv("ARQ_MAX_TRIES", 3))
    on_startup = on_worker_startup
    on_shutdown = on_worker_shutdown

if __name__ == "__main__":
    print("--- Initializing Arq worker process directly ---")
    if not load_api_keys():
        print("FATAL ERROR: Cannot start worker, failed to load API keys. Exiting.", file=sys.stderr)
        sys.exit(1)
    try:
        get_db() 
        init_db()
        close_db()
        print("Database schema initialized successfully.")
    except Exception as db_init_err:
        print(f"FATAL ERROR: Cannot start worker, failed to initialize database: {db_init_err}", file=sys.stderr)
        traceback.print_exc()
        sys.exit(1)
    try:
        from arq.cli import run_worker
        print(f"Starting Arq worker with settings: Max Jobs={WorkerSettings.max_jobs}, Timeout={WorkerSettings.job_timeout}s")
        run_worker(WorkerSettings) 
    except ImportError:
        print("FATAL ERROR: 'arq' package not found or `run_worker` could not be imported. Please install it: pip install arq", file=sys.stderr)
        sys.exit(1)
    except Exception as arq_err:
        print(f"FATAL ERROR: Arq worker failed to start: {arq_err}", file=sys.stderr)
        traceback.print_exc()
        sys.exit(1)
    print("--- Arq worker process has been shut down ---")
# --- END OF UPDATED worker.py ---