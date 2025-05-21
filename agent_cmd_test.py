# -*- coding: utf-8 -*-
# agent_cmd_test.py: Standalone test for browser-use Agent with console logging.

import asyncio
import os
import logging
import sys
import platform
import traceback
from dotenv import load_dotenv

# --- Attempt Core Imports ---
try:
    from playwright.async_api import Error as PlaywrightError
    from browser_use import Agent # Assuming Agent handles Browser/Context internally for basic cases
    from langchain_google_genai import ChatGoogleGenerativeAI
except ImportError as import_err:
    print(f"FATAL ERROR: Failed to import core libraries (Playwright, browser-use, langchain-google-genai).", file=sys.stderr)
    print(f"Ensure dependencies installed via: pip install google-generativeai python-dotenv nest-asyncio \"playwright>=1.30\" \"git+https://github.com/browser-use/browser-use.git@main\"", file=sys.stderr)
    print(f"Error details: {import_err}", file=sys.stderr)
    sys.exit(1)

# --- Logging Setup (Console Output) ---
# Configure root logger to send INFO+ to stdout.
# Set levels for specific loggers to DEBUG for more detail.
LOG_FORMAT = '%(asctime)s %(levelname)-8s [%(name)s:%(lineno)d] %(message)s'
LOG_DATE_FORMAT = '%Y-%m-%d %H:%M:%S'
logging.basicConfig(level=logging.INFO, format=LOG_FORMAT, datefmt=LOG_DATE_FORMAT, handlers=[logging.StreamHandler(sys.stdout)])

# Set desired log levels for verbosity
logging.getLogger("browser_use").setLevel(logging.DEBUG)
logging.getLogger("__main__").setLevel(logging.DEBUG)
logger = logging.getLogger(__name__) # Get logger for this script
logger.info("--- Standalone Agent Test Script Starting ---")
logger.info("Console logging configured (INFO+ for root, DEBUG for __main__ and browser_use).")

# --- Environment Setup ---
try:
    if not load_dotenv(): # Loads .env from current dir or parents
        logger.warning(".env file not found or is empty.")
    API_KEY = os.getenv("GOOGLE_API_KEY")
    if not API_KEY:
        logger.critical("FATAL: GOOGLE_API_KEY not found in environment variables. Ensure .env file is present and correct.")
        sys.exit(1)
    # Mask key for logging confirmation if needed, but avoid logging keys directly.
    # logger.info("GOOGLE_API_KEY loaded successfully.")
    # Make key available in env for LangChain
    os.environ['GOOGLE_API_KEY'] = API_KEY
except Exception as env_err:
    logger.critical(f"FATAL: Error loading environment variables: {env_err}", exc_info=True)
    sys.exit(1)

# --- Agent Task Definition ---
# Define a simple, reasonable task for testing
AGENT_TASK = "Go to playwright.dev, find the link to the Python documentation, and return the full URL of that Python documentation page."

# --- Main Asynchronous Function ---
async def main():
    logger.info(f"--- Executing main() ---")
    logger.info(f"Python Version: {sys.version}")
    logger.info(f"Platform: {platform.system()} {platform.release()} ({platform.version()})")

    # Verify loop policy (standalone should default correctly on Win >= 3.8)
    try:
        current_loop = asyncio.get_running_loop()
        policy = asyncio.get_event_loop_policy()
        loop_type = type(current_loop).__name__
        policy_type = type(policy).__name__
        logger.info(f"Active Event Loop: {loop_type}")
        logger.info(f"Active Policy: {policy_type}")
        if platform.system() == "Windows":
            is_proactor = isinstance(current_loop, asyncio.ProactorEventLoop)
            logger.info(f"Is Proactor based: {is_proactor}")
            if not is_proactor: logger.warning("Default loop is NOT Proactor based!")
    except Exception as check_err:
        logger.warning(f"Could not verify event loop/policy: {check_err}")

    logger.info("---")

    agent_instance = None
    final_result = None
    run_successful = False

    try:
        # Initialize LLM
        logger.info("[1/3] Initializing LLM (gemini-2.0-flash)...")
        llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", temperature=0.7, convert_system_message_to_human=True, google_api_key=API_KEY)
        logger.info("[1/3] LLM Initialized.")

        # Initialize Agent
        # Assuming Agent handles internal browser/context setup when none are passed
        logger.info("[2/3] Initializing Agent...")
        agent_instance = Agent(
            task=AGENT_TASK,
            llm=llm,
            # browser=None, # Let Agent create its own
            # browser_context=None, # Let Agent create its own
            # config=AgentConfig(...) # Add if specific agent config needed
        )
        logger.info("[2/3] Agent Initialized.")

        # Run Agent
        logger.info(f"[3/3] >>> Starting Agent Execution for task: '{AGENT_TASK}'")
        final_result = await agent_instance.run()
        logger.info("[3/3] <<< Agent Execution Finished.")
        run_successful = True

    except PlaywrightError as pe: # Catch specific library errors
        logger.error(f"Agent Run Failed (PlaywrightError): {pe}", exc_info=True)
        final_result = f"ERROR: PlaywrightError - {pe}"
    except NotImplementedError as nie: # Catch if Proactor somehow still fails
        logger.critical(f"Agent Run Failed (NotImplementedError): {nie}", exc_info=True)
        logger.critical("*** This indicates the asyncio subprocess issue occurred unexpectedly! ***")
        final_result = f"ERROR: NotImplementedError - {nie}"
    except Exception as e:
        logger.error(f"Agent Run Failed (Unexpected Exception): {e}", exc_info=True)
        final_result = f"ERROR: {type(e).__name__} - {e}"
    finally:
        logger.info("--- Agent Run Finalizing ---")
        # NOTE: Agent should ideally handle its own browser/context cleanup internally
        # If manual cleanup were needed, it would go here (e.g., await agent_instance.close())
        # Consult browser-use docs for explicit cleanup requirements if needed.
        logger.info(f"Run outcome - Success: {run_successful}")
        print("\n--- FINAL RESULT ---")
        print(final_result if final_result is not None else "(No explicit result returned)")
        print("--- END ---")


if __name__ == "__main__":
    # Optional: Add Playwright check here if desired, but it ran in previous test
    # print("Verifying Playwright browsers...")
    # os.system("playwright install --with-deps chromium")

    # Note: Explicitly setting Proactor policy is omitted here to test
    # Python's default behavior in a standalone script. If errors occur,
    # uncommenting the policy set logic used in app.py might be necessary.
    # if platform.system() == "Windows":
    #     try:
    #         from asyncio.windows_events import WindowsProactorEventLoopPolicy
    #         asyncio.set_event_loop_policy(WindowsProactorEventLoopPolicy())
    #         logger.info("Explicitly set WindowsProactorEventLoopPolicy.")
    #     except Exception as policy_err:
    #         logger.error(f"Failed to explicitly set Proactor policy: {policy_err}")

    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Execution interrupted by user.")
    except Exception as main_run_err:
        logger.critical(f"FATAL ERROR running asyncio.run(main): {main_run_err}", exc_info=True)