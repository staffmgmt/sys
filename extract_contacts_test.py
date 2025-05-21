import asyncio
import os
import logging
import sys
import platform
import traceback
import json
import time # For timing agent run
from dotenv import load_dotenv
from typing import List, Dict, Any

# --- Attempt Core Imports ---
try:
    from playwright.async_api import Error as PlaywrightError
    # Import necessary classes based on code analysis
    from browser_use import Agent, ActionResult, AgentHistoryList
    from langchain_google_genai import ChatGoogleGenerativeAI
except ImportError as import_err:
    print(f"FATAL ERROR: Failed core library import: {import_err}. Ensure dependencies installed.", file=sys.stderr)
    sys.exit(1)

# --- Logging Setup (Console Output) ---
LOG_FORMAT = '%(asctime)s %(levelname)-8s [%(name)s:%(lineno)d] %(message)s'
LOG_DATE_FORMAT = '%Y-%m-%d %H:%M:%S'
logging.basicConfig(level=logging.INFO, format=LOG_FORMAT, datefmt=LOG_DATE_FORMAT, handlers=[logging.StreamHandler(sys.stdout)])
logging.getLogger("browser_use").setLevel(logging.INFO)
logging.getLogger("__main__").setLevel(logging.DEBUG)
logger = logging.getLogger(__name__)
logger.info("--- Contact Extraction Test Script v1.3 Starting ---")

# --- Environment Setup & API Key Loading ---
API_KEYS: List[str] = []
try:
    if not load_dotenv(): logger.warning(".env file not found or empty.")
    i = 1
    while True: # Load numbered keys GEMINI_API_KEY_1, _2 etc
        key = os.getenv(f"GEMINI_API_KEY_{i}")
        if key: API_KEYS.append(key); i += 1
        else: break
    if not API_KEYS: # Fallback to single key
        single_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if single_key: API_KEYS.append(single_key); logger.info("Loaded 1 API Key using fallback.")
        else: logger.critical("FATAL: No GEMINI_API_KEY_n or fallback keys found."); sys.exit(1)
    else: logger.info(f"Loaded {len(API_KEYS)} API Key(s) (GEMINI_API_KEY_1, _2...).")
    # Ensure first key is in env vars
    os.environ['GOOGLE_API_KEY'] = API_KEYS[0]
    os.environ['GEMINI_API_KEY'] = API_KEYS[0]
except Exception as env_err:
    logger.critical(f"FATAL: Error loading environment variables: {env_err}", exc_info=True); sys.exit(1)

# --- Configuration ---
# !!! MANDATORY: REPLACE THESE PLACEHOLDERS WITH ACTUAL URLS !!!
TARGET_URLS: List[str] = [
    "https://www.botanicgardens.org/contact-us",   # Replace with actual URL 1
    "https://ww2.aip.org/aip/contact-us", # Replace with actual URL 2
    "https://www.annarbor.org/contact/",      # Replace with actual URL 3
]
LLM_MODEL = "gemini-2.0-flash" # Explicitly set as requested

# --- Task Prompt Generation --- (Identical to v1.2)
def create_extraction_task(url: str) -> str:
    return f"""
1. Navigate to the specified URL: {url}                                                                                                           
2. Identify the top-ranking individual (e.g., CEO, President, Director) — "boss". 
3. If explicitly associated, extract their direct admin (e.g., Executive Assistant) — "assistant". 
4. For both, extract: 
   - full name  
   - official title  
   - email (from visible text or `mailto:` links only)
5. If any value is absent or ambiguous, assign `null`. No inference. 
6. Return a JSON array (one object per URL) with: 
   boss_name, boss_title, boss_email, assistant_name, assistant_title, assistant_email.
Output JSON only.
"""

# --- Main Asynchronous Function ---
async def main():
    logger.info(f"--- Executing main() ---")
    logger.info(f"Using LLM: {LLM_MODEL}")
    logger.info(f"Target URLs: {len(TARGET_URLS)}")
    logger.info("---")

    global API_KEYS
    current_key_index = 0
    all_results: Dict[str, Any] = {}

    for url_index, url in enumerate(TARGET_URLS):
        logger.info(f"--- Processing URL {url_index+1}/{len(TARGET_URLS)}: {url} ---")
        task_prompt = create_extraction_task(url)
        agent_instance = None; result_data = None; error_data = None
        run_successful = False; num_keys_tried = 0

        # --- API Key Rotation / Retry Loop ---
        while num_keys_tried < len(API_KEYS):
            current_api_key = API_KEYS[current_key_index]
            attempt_index = current_key_index
            logger.info(f"Attempting URL with API Key Index: {attempt_index}...")
            try:
                llm = ChatGoogleGenerativeAI(model=LLM_MODEL, temperature=0.1, convert_system_message_to_human=True, google_api_key=current_api_key)
                logger.debug(f"LLM Initialized for attempt.")
                agent_instance = Agent(task=task_prompt, llm=llm)
                logger.info(f"Agent Initialized. Starting run...")
                start_time = time.monotonic()
                result_data: AgentHistoryList = await agent_instance.run() # Explicitly type hint return
                end_time = time.monotonic(); run_duration = end_time - start_time
                logger.info(f"Agent run finished for URL: {url} (Key Index: {attempt_index}). Duration: {run_duration:.2f}s")
                run_successful = True
                break # Exit retry loop on success
            except Exception as run_err:
                # --- [Identical Error Handling + Key Rotation Logic as v1.2] ---
                logger.warning(f"Agent run FAILED for URL {url} with key index {attempt_index}: {type(run_err).__name__}", exc_info=False)
                logger.debug("Full error during agent run:", exc_info=True)
                error_str = str(run_err).lower()
                is_api_error = any(e in error_str for e in ["429", "resource has been exhausted", "permission denied", "api key", "quota exceeded", "authentication failed"])
                if is_api_error and len(API_KEYS) > 1:
                    logger.warning(f"Detected API/Quota/Auth error. Rotating key.")
                    current_key_index = (current_key_index + 1) % len(API_KEYS)
                    num_keys_tried += 1
                    error_data = f"API Error (Key Index {attempt_index}): {run_err}"
                    if num_keys_tried < len(API_KEYS): logger.info(f"Retrying with next key (Index {current_key_index}). Waiting 3 seconds..."); await asyncio.sleep(3)
                    else: logger.error(f"All {len(API_KEYS)} API keys failed for URL: {url}. Last error: {run_err}"); break
                else:
                     logger.error(f"Non-API related error OR only one key available. Stopping retries for {url}.", exc_info=True)
                     error_data = f"Execution Error: {run_err}"; break
            # --- [End Error Handling Block] ---

        # --- Process Results ---
        parsed_result_for_url = None
        if run_successful and result_data:
            # --- MANDATED CHANGE v1.3: Correct Result Processing based on Code Analysis ---
            try:
                final_json_string = None
                # Check the history list exists and is not empty
                if isinstance(result_data, AgentHistoryList) and result_data.history:
                    last_history_item = result_data.history[-1]
                    # Check the result list within the last history item
                    if last_history_item.result:
                        last_action_result = last_history_item.result[-1]
                        # Check if the last action was 'done' and extract its content
                        if isinstance(last_action_result, ActionResult) and last_action_result.is_done:
                            if isinstance(last_action_result.extracted_content, str):
                                final_json_string = last_action_result.extracted_content
                                logger.info(f"Extracted final result JSON string from last 'done' action for {url}")
                            else:
                                 logger.warning(f"Final 'done' action's extracted_content is not a string ({type(last_action_result.extracted_content).__name__}) for {url}")
                        else:
                            logger.warning(f"Last action result for {url} was not 'done'. Final state may be incomplete.")
                    else:
                         logger.warning(f"Last history item for {url} has no 'result' list.")
                else:
                     logger.warning(f"Result object for {url} is not AgentHistoryList or has no history items.")

                # If we successfully extracted the string, try parsing
                if isinstance(final_json_string, str):
                    cleaned_text = final_json_string.strip()
                    if cleaned_text.startswith("```json"): cleaned_text = cleaned_text[7:-3].strip()
                    elif cleaned_text.startswith("```"): cleaned_text = cleaned_text[3:-3].strip()
                    parsed_result_for_url = json.loads(cleaned_text)
                    logger.info(f"Successfully parsed JSON result for {url}")
                elif final_json_string is not None: # Should ideally not happen if agent follows prompt
                     parsed_result_for_url = {"error": "Final result content was not a string", "raw_result": final_json_string}
                     logger.error(f"Extracted final result for {url} was not string: {type(final_json_string).__name__}")
                else: # Failed to extract the string
                    raise ValueError("Could not extract final JSON string from agent's history.")

            except json.JSONDecodeError as json_err:
                 logger.error(f"Final extracted content for {url} could not be parsed as JSON: {json_err}. Content: '{cleaned_text if 'cleaned_text' in locals() else str(final_json_string)}'", exc_info=False)
                 parsed_result_for_url = {"error": f"JSON Decode Error: {json_err}", "raw_content": cleaned_text if 'cleaned_text' in locals() else str(final_json_string)}
            except Exception as process_err:
                 logger.error(f"Error processing result object for {url}: {process_err}", exc_info=True)
                 parsed_result_for_url = {"error": f"Result processing error: {process_err}", "raw_object_type": type(result_data).__name__}
            # --- END MANDATED CHANGE ---
        else: # Run failed for this URL
            parsed_result_for_url = {"error": error_data or "Agent execution failed."}

        all_results[url] = parsed_result_for_url # Store final JSON or error dict
        logger.info(f"Finished processing URL: {url}")
        if url_index < len(TARGET_URLS) - 1:
            logger.debug("Waiting 2 seconds before next URL...")
            await asyncio.sleep(2)

    # --- Print Final Collected Results ---
    print("\n\n" + "="*20 + " FINAL EXTRACTION RESULTS " + "="*20)
    for url, result in all_results.items():
        print(f"\n--- Results for: {url} ---")
        try: print(json.dumps(result, indent=2)) # Pretty print
        except TypeError: print(str(result)) # Fallback
    print("\n" + "="*64)
    logger.info("--- Contact Extraction Test Script Finished ---")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt: logger.info("Execution interrupted by user.")
    except Exception as main_run_err: logger.critical(f"FATAL ERROR running asyncio.run(main): {main_run_err}", exc_info=True)