# --- START OF FIXED FILE database.py ---
import sqlite3
import threading
import os
import logging
import sys # Moved import to top
from datetime import datetime, timedelta, timezone # Added timedelta, timezone
import json
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

DATABASE_NAME = "tasks.db"
# Use thread-local storage for database connections
local_data = threading.local()

# Custom timestamp conversion function to handle malformed timestamps
def custom_timestamp_converter(val):
    """Convert timestamp values from SQLite to Python datetime, with graceful error handling."""
    if val is None:
        return None
    
    # Handle bytes input (common with SQLite)
    if isinstance(val, bytes):
        val_str = val.decode('utf-8')
    else:
        val_str = str(val)
    
    # Try multiple formats - handle timestamps with or without spaces
    formats_to_try = [
        "%Y-%m-%dT%H:%M:%S.%fZ",  # ISO 8601 with Z
        "%Y-%m-%dT%H:%M:%SZ",     # ISO 8601 with Z, no milliseconds
        "%Y-%m-%dT%H:%M:%S.%f",   # ISO 8601 without Z
        "%Y-%m-%dT%H:%M:%S",      # ISO 8601 without Z, no milliseconds
        "%Y-%m-%d %H:%M:%S.%f",   # Standard format with space and milliseconds
        "%Y-%m-%d %H:%M:%S",      # Standard format with space
        "%Y-%m-%d%H:%M:%S",       # No space between date and time
        "%Y%m%d%H%M%S",           # Compact format
        "%Y-%m-%d",               # Date only
    ]
    
    for fmt in formats_to_try:
        try:
            dt = datetime.strptime(val_str, fmt)
            # Add UTC timezone if not present
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        except ValueError:
            continue
    
    # If all formats fail, log it but don't crash
    logger.warning(f"DB: Could not parse timestamp: '{val_str}' - returning as string")
    return val_str  # Return as string to avoid breaking calling code

def get_db() -> sqlite3.Connection:
    """Gets the database connection for the current thread/process."""
    if not hasattr(local_data, 'connection') or local_data.connection is None:
        # Also check if connection is None in case close_db was called but thread reused
        logger.debug(f"DB: Creating new SQLite connection for thread {threading.get_ident()} to {DATABASE_NAME}")
        
        # Register the custom timestamp converter
        sqlite3.register_converter("timestamp", custom_timestamp_converter)
        
        # Enable type detection for TIMESTAMP columns
        local_data.connection = sqlite3.connect(DATABASE_NAME,
                                               check_same_thread=False, # Required for multi-threaded access
                                               detect_types=sqlite3.PARSE_DECLTYPES | sqlite3.PARSE_COLNAMES,
                                               timeout=10) # Add a timeout
        local_data.connection.row_factory = sqlite3.Row # Return rows as dict-like objects
        # Improve performance and concurrency handling
        local_data.connection.execute("PRAGMA journal_mode=WAL;") # Use Write-Ahead Logging
        local_data.connection.execute("PRAGMA busy_timeout = 5000;") # Wait 5s if locked
        local_data.connection.execute("PRAGMA foreign_keys = ON;") # Enforce foreign key constraints
    return local_data.connection

def close_db(exception: Optional[Exception] = None) -> None:
    """Closes the database connection for the current thread/process."""
    if hasattr(local_data, 'connection') and local_data.connection is not None:
        logger.debug(f"DB: Closing SQLite connection for thread {threading.get_ident()}")
        local_data.connection.close()
        local_data.connection = None # Ensure it's marked as closed

def init_db() -> None:
    """Initializes the database schema if tables do not exist."""
    db = get_db()
    cursor = db.cursor()
    logger.info(f"DB: Initializing database schema in {DATABASE_NAME}...")

    # Use TEXT affinity for IDs, REAL for timestamps (ISO8601 strings), keep strict checks
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY NOT NULL,
            task_type TEXT NOT NULL,
            status TEXT NOT NULL CHECK(status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED')),
            created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%S.%fZ', 'now', 'utc')) NOT NULL, -- ISO8601 format
            started_at TEXT NULL,
            completed_at TEXT NULL,
            input_data TEXT, -- Store as JSON string
            result_data TEXT, -- Store as JSON string
            error_details TEXT
        );
    """)
    logger.info("DB: 'tasks' table schema checked/created.")

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS task_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id TEXT NOT NULL,
            timestamp TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%S.%fZ', 'now', 'utc')) NOT NULL, -- ISO8601 format
            level TEXT NOT NULL CHECK(level IN ('DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL')),
            message TEXT NOT NULL,
            FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
        );
    """)
    logger.info("DB: 'task_logs' table schema checked/created.")

    # Add indices for common query patterns
    indices = {
        "idx_task_logs_task_id": "CREATE INDEX IF NOT EXISTS idx_task_logs_task_id ON task_logs (task_id);",
        "idx_tasks_status": "CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks (status);",
        "idx_tasks_created_at": "CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks (created_at);",
        "idx_tasks_task_type": "CREATE INDEX IF NOT EXISTS idx_tasks_task_type ON tasks (task_type);",
    }
    for name, sql in indices.items():
        try:
            cursor.execute(sql)
            logger.info(f"DB: Index '{name}' checked/created.")
        except sqlite3.Error as e:
            logger.error(f"DB: Failed to create index {name}: {e}")

    db.commit()
    logger.info("DB: Database initialization complete.")

def _now_iso() -> str:
    """Returns the current time in UTC ISO 8601 format with 'Z'."""
    return datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'

def create_task(task_id: str, task_type: str, input_data: Dict[str, Any]) -> None:
    """Creates a new task record in the database."""
    db = get_db()
    cursor = db.cursor()
    input_data_json = json.dumps(input_data)
    now_ts = _now_iso()
    try:
        cursor.execute(
            # Explicitly set created_at to ensure consistency if default fails
            "INSERT INTO tasks (id, task_type, status, input_data, created_at) VALUES (?, ?, ?, ?, ?)",
            (task_id, task_type, 'PENDING', input_data_json, now_ts)
        )
        db.commit()
        logger.info(f"DB: Created task {task_id} type '{task_type}' status PENDING.")
    except sqlite3.IntegrityError as e:
        logger.error(f"DB: Integrity error creating task {task_id} (likely duplicate ID): {e}")
        db.rollback()
        raise # Re-raise specific error
    except sqlite3.Error as e:
        logger.error(f"DB: Database error creating task {task_id}: {e}")
        db.rollback()
        raise
    except Exception as e:
         logger.error(f"DB: Unexpected error creating task {task_id}: {e}", exc_info=True)
         db.rollback()
         raise

def update_task_status(task_id: str, status: str, error_details: Optional[str] = None) -> bool:
    """
    Updates the status of a task and relevant timestamps.
    Returns True if a row was updated, False otherwise.
    """
    db = get_db()
    cursor = db.cursor()
    now_ts = _now_iso()
    updated_rows = 0
    allowed_statuses = {'PENDING', 'RUNNING', 'COMPLETED', 'FAILED'}
    if status.upper() not in allowed_statuses:
        logger.warning(f"DB: Attempted to set invalid status '{status}' for task {task_id}")
        return False

    try:
        if status == 'RUNNING':
            # Update only if currently PENDING
            cursor.execute(
                "UPDATE tasks SET status = ?, started_at = ? WHERE id = ? AND status = 'PENDING'",
                (status, now_ts, task_id)
            )
        elif status in ['COMPLETED', 'FAILED']:
            # Update only if currently RUNNING or PENDING (e.g., cancellation, fast failure)
            set_clauses = ["status = ?", "completed_at = ?"]
            params: List[Any] = [status, now_ts]

            if status == 'FAILED':
                set_clauses.append("error_details = ?")
                params.append(error_details)
            elif status == 'COMPLETED':
                # Clear error details on successful completion
                set_clauses.append("error_details = NULL")

            params.append(task_id) # For WHERE clause
            sql = f"UPDATE tasks SET {', '.join(set_clauses)} WHERE id = ? AND status IN ('RUNNING', 'PENDING')"
            cursor.execute(sql, tuple(params))

        updated_rows = cursor.rowcount
        db.commit()

        if updated_rows > 0:
             logger.info(f"DB: Updated task {task_id} status to {status}. ({updated_rows} row affected)")
        else:
             # Log if we tried to update but target wasn't in expected state
             # Fetch current status to provide more context
             cursor.execute("SELECT status FROM tasks WHERE id = ?", (task_id,))
             current_row = cursor.fetchone()
             current_status_msg = f"Current status: {current_row['status']}" if current_row else "Task not found"
             logger.warning(f"DB: Task {task_id} status update to {status} affected 0 rows. {current_status_msg}.")
        return updated_rows > 0

    except sqlite3.Error as e:
        logger.error(f"DB: Database error updating task {task_id} status to {status}: {e}")
        db.rollback()
        raise # Re-raise DB errors
    except Exception as e:
        logger.error(f"DB: Unexpected error updating task {task_id} status to {status}: {e}", exc_info=True)
        db.rollback()
        raise

def update_task_result(task_id: str, result_data: Dict[str, Any]) -> None:
    """Updates the result_data (as JSON) for a task."""
    db = get_db()
    cursor = db.cursor()
    try:
        result_data_json = json.dumps(result_data)
        cursor.execute("UPDATE tasks SET result_data = ? WHERE id = ?", (result_data_json, task_id))
        db.commit()
        if cursor.rowcount > 0:
             logger.info(f"DB: Stored result for task {task_id}.")
        else:
            logger.warning(f"DB: Update result for task {task_id} affected 0 rows (task might not exist).")
    except json.JSONDecodeError as json_err:
        logger.error(f"DB: Failed to serialize result data for task {task_id}: {json_err}")
        # Decide whether to raise or just log
    except sqlite3.Error as e:
        logger.error(f"DB: Database error updating task {task_id} result: {e}")
        db.rollback()
        raise
    except Exception as e:
        logger.error(f"DB: Unexpected error updating task {task_id} result: {e}", exc_info=True)
        db.rollback()
        raise

def add_log_entry(task_id: str, level: str, message: str) -> None:
    """Adds a log entry for a specific task using explicit timestamp."""
    db = get_db()
    cursor = db.cursor()
    valid_levels = {'DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'}
    level_upper = level.upper()
    if level_upper not in valid_levels:
        logger.warning(f"DB: Invalid log level '{level}' for task {task_id}. Defaulting to INFO.")
        level_upper = 'INFO'
    now_ts = _now_iso()

    try:
        cursor.execute(
            # Use explicit timestamp
            "INSERT INTO task_logs (task_id, level, message, timestamp) VALUES (?, ?, ?, ?)",
            (task_id, level_upper, message, now_ts)
        )
        db.commit()
        # Avoid logging every log entry addition to prevent excessive noise
    except sqlite3.Error as e:
        # Use print/stderr for critical DB errors during logging itself
        print(f"[DB:{threading.get_ident()}] FATAL ERROR adding log for task {task_id}: {e}", file=sys.stderr)
        db.rollback()
        # Do not re-raise, logging failure shouldn't crash the main process
    except Exception as e:
        print(f"[DB:{threading.get_ident()}] UNEXPECTED ERROR adding log for task {task_id}: {e}", file=sys.stderr)
        db.rollback()

def _parse_json_field(data: Optional[str], field_name: str, task_id: str) -> Optional[Any]:
    """Helper to safely parse JSON fields from TEXT columns."""
    if data is None:
        return None
    try:
        return json.loads(data)
    except (json.JSONDecodeError, TypeError) as e:
        logger.error(f"DB: Failed to parse JSON in '{field_name}' for task {task_id}: {e}. Raw data (start): '{data[:100]}...'")
        # Return an error structure instead of the raw data or None
        return {"_parse_error": f"Failed to parse {field_name}: {e}", "raw_data_preview": data[:100]}

def get_task_details(task_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves the full details for a specific task, parsing JSON fields."""
    db = get_db()
    cursor = db.cursor()
    try:
        cursor.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
        task_row = cursor.fetchone()
        if task_row:
             # Convert sqlite3.Row to a mutable dictionary
             task_dict = dict(task_row)
             # Safely parse JSON fields
             task_dict['input_data'] = _parse_json_field(task_dict.get('input_data'), 'input_data', task_id)
             task_dict['result_data'] = _parse_json_field(task_dict.get('result_data'), 'result_data', task_id)
             # Convert timestamp strings back to datetime objects for consistency (optional here, Pydantic handles it too)
             # task_dict['created_at'] = datetime.fromisoformat(task_dict['created_at'].replace('Z', '+00:00')) if task_dict.get('created_at') else None
             # ... similar for started_at, completed_at
             return task_dict
        return None # Task not found
    except sqlite3.Error as e:
        logger.error(f"DB: Database error retrieving details for task {task_id}: {e}")
        raise
    except Exception as e:
        logger.error(f"DB: Unexpected error retrieving details for task {task_id}: {e}", exc_info=True)
        raise

def get_task_logs(task_id: str, level: Optional[str] = None, limit: int = 1000) -> List[Dict[str, Any]]:
    """Retrieves log entries for a task, ordered by time, with optional level filter and limit."""
    db = get_db()
    cursor = db.cursor()
    if limit <= 0: limit = 1000 # Ensure positive limit

    try:
        query = "SELECT id, timestamp, level, message FROM task_logs WHERE task_id = ?"
        params: List[Any] = [task_id]
        if level:
            level_upper = level.upper()
            valid_levels = {'DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'}
            if level_upper in valid_levels:
                 query += " AND level = ?"
                 params.append(level_upper)
            else:
                 logger.warning(f"DB: Invalid log level filter '{level}' requested for task {task_id}. Ignoring filter.")

        query += " ORDER BY id ASC LIMIT ?" # Order by auto-incrementing ID for reliable sequence
        params.append(limit)

        cursor.execute(query, tuple(params))
        log_rows = cursor.fetchall()
        # Convert rows to dictionaries
        return [dict(row) for row in log_rows]
    except sqlite3.Error as e:
        logger.error(f"DB: Database error retrieving logs for task {task_id}: {e}")
        raise
    except Exception as e:
        logger.error(f"DB: Unexpected error retrieving logs for task {task_id}: {e}", exc_info=True)
        raise

def list_tasks(limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
    """Lists task summaries (id, status, type, created_at) with pagination."""
    db = get_db()
    cursor = db.cursor()
    if limit <= 0: limit = 100
    if offset < 0: offset = 0

    try:
        cursor.execute(
            "SELECT id, status, task_type, created_at FROM tasks ORDER BY created_at DESC LIMIT ? OFFSET ?",
            (limit, offset)
        )
        task_rows = cursor.fetchall()
        
        # Use defensive row conversion to handle any potential conversion errors
        result = []
        for row in task_rows:
            try:
                row_dict = dict(row)
                result.append(row_dict)
            except Exception as row_err:
                logger.error(f"DB: Error converting row to dict: {row_err}. Row data: {repr(row)}")
                # Skip problematic rows instead of failing completely
                continue
        return result
    except sqlite3.Error as e:
        logger.error(f"DB: Database error listing tasks (limit={limit}, offset={offset}): {e}")
        raise
    except Exception as e:
        logger.error(f"DB: Unexpected error listing tasks: {e}", exc_info=True)
        raise

def search_tasks(
    status: Optional[str] = None,
    task_type: Optional[str] = None,
    days: Optional[int] = None,
    limit: int = 100
) -> List[Dict[str, Any]]:
    """Searches tasks based on status, type, and creation date (within last N days)."""
    db = get_db()
    cursor = db.cursor()
    if limit <= 0: limit = 100

    try:
        # Base query selecting summary fields
        query = "SELECT id, status, task_type, created_at FROM tasks WHERE 1=1"
        params: List[Any] = []

        # Append conditions dynamically and safely
        if status:
            allowed_statuses = {'PENDING', 'RUNNING', 'COMPLETED', 'FAILED'}
            status_upper = status.upper()
            if status_upper in allowed_statuses:
                query += " AND status = ?"
                params.append(status_upper)
            else:
                 logger.warning(f"DB: Invalid status '{status}' provided for search. Ignoring status filter.")
        if task_type:
            query += " AND task_type = ?"
            params.append(task_type) # Assuming task_type is case-sensitive as stored
        if days is not None and days > 0:
            # Calculate cutoff date N days ago in UTC
            cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
            # Format for comparison with stored ISO strings
            cutoff_str = cutoff_date.strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
            query += " AND created_at >= ?"
            params.append(cutoff_str)

        query += " ORDER BY created_at DESC LIMIT ?"
        params.append(limit)

        cursor.execute(query, tuple(params))
        task_rows = cursor.fetchall()
        
        # Use defensive row conversion here too
        result = []
        for row in task_rows:
            try:
                row_dict = dict(row)
                result.append(row_dict)
            except Exception as row_err:
                logger.error(f"DB: Error converting row to dict during search: {row_err}")
                continue
        return result
    except sqlite3.Error as e:
        logger.error(f"DB: Database error searching tasks: {e}")
        raise
    except Exception as e:
        logger.error(f"DB: Unexpected error searching tasks: {e}", exc_info=True)
        raise

def get_task_stats() -> Dict[str, int]:
    """Retrieves counts of tasks grouped by status."""
    db = get_db()
    cursor = db.cursor()
    # Initialize stats with all possible statuses
    stats = {"PENDING": 0, "RUNNING": 0, "COMPLETED": 0, "FAILED": 0, "TOTAL": 0}
    try:
        # Query counts for each status
        cursor.execute("SELECT status, COUNT(*) as count FROM tasks GROUP BY status")
        rows = cursor.fetchall()
        total = 0
        for row in rows:
            status_key = row['status']
            if status_key in stats: # Ensure status from DB is valid
                count = row['count']
                stats[status_key] = count
                total += count
            else:
                logger.warning(f"DB: Found unexpected status '{status_key}' during stats calculation.")
        stats["TOTAL"] = total
        return stats
    except sqlite3.Error as e:
        logger.error(f"DB: Database error getting task stats: {e}")
        # Return default stats on error to avoid breaking API response
        return stats
    except Exception as e:
        logger.error(f"DB: Unexpected error getting task stats: {e}", exc_info=True)
        return stats

def delete_task(task_id: str) -> bool:
    """Deletes a task and its associated logs (via cascade). Returns True if deleted."""
    db = get_db()
    cursor = db.cursor()
    deleted_count = 0
    try:
        # Foreign key constraint with ON DELETE CASCADE handles task_logs deletion
        cursor.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
        deleted_count = cursor.rowcount
        db.commit()
        if deleted_count > 0:
            logger.info(f"DB: Deleted task {task_id} and its associated logs ({deleted_count} task row deleted).")
            return True
        else:
            logger.warning(f"DB: Delete task {task_id} affected 0 rows (task might not exist).")
            return False
    except sqlite3.Error as e:
        logger.error(f"DB: Database error deleting task {task_id}: {e}")
        db.rollback()
        raise # Re-raise DB errors
    except Exception as e:
        logger.error(f"DB: Unexpected error deleting task {task_id}: {e}", exc_info=True)
        db.rollback()
        raise

# --- Main block for direct initialization ---
if __name__ == "__main__":
    # Setup basic console logging ONLY when script is run directly
    log_format = '%(asctime)s %(levelname)-8s [DB_INIT] %(message)s'
    logging.basicConfig(level=logging.INFO, format=log_format)
    # Re-assign logger in this scope if basicConfig overrides root logger
    logger = logging.getLogger(__name__)
    logger.info("--- Running database.py directly for initialization ---")
    try:
        # Ensure the directory for the DB file exists
        db_dir = os.path.dirname(DATABASE_NAME)
        if db_dir and not os.path.exists(db_dir):
            logger.info(f"Creating directory for database: {db_dir}")
            os.makedirs(db_dir, exist_ok=True)

        init_db()
        logger.info("--- Database initialization script finished successfully ---")
    except Exception as e:
        logger.critical(f"FATAL ERROR during database initialization: {e}", exc_info=True)
        sys.exit(1) # Exit with error code if init fails
    finally:
        close_db() # Ensure the connection used for init is closed

# --- END OF FIXED FILE database.py ---