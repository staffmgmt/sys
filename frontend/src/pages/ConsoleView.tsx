import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import CommandConsole from '../components/CommandConsole';
import taskApi from '../services/taskApi';
import { TaskStatsResponse } from '../models';

// For WebSocket messages
interface WebSocketMessage {
  type: 'agent_thought' | 'task_status' | 'system_message';
  task_id?: string;
  content: string;
  status?: string;
}

const ConsoleView: React.FC = () => {
  const [output, setOutput] = useState<string[]>([
    '[SYSTEM] Agent Console initialized',
    '[SYSTEM] Ready for commands...',
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  
  // Setup WebSocket connection
  useEffect(() => {
    // Use secure connection if page is served over HTTPS
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = `${protocol}://${window.location.host}/ws/agent`;
    
    const newSocket = new WebSocket(wsUrl);
    
    newSocket.onopen = () => {
      console.log('WebSocket connection established');
      setOutput(prev => [...prev, '[SYSTEM] Real-time connection established']);
    };
    
    newSocket.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        console.log('WebSocket message received:', data);
        
        if (data.type === 'agent_thought') {
          setOutput(prev => [...prev, `[AGENT] ${data.content}`]);
        } else if (data.type === 'task_status') {
          setIsProcessing(data.status === 'running');
          setOutput(prev => [...prev, `[SYSTEM] Task ${data.task_id}: ${data.status}`]);
          
          if (data.status === 'completed' || data.status === 'failed') {
            setCurrentTaskId(null);
          }
        } else if (data.type === 'system_message') {
          setOutput(prev => [...prev, `[SYSTEM] ${data.content}`]);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    newSocket.onclose = () => {
      console.log('WebSocket connection closed');
      setOutput(prev => [...prev, '[SYSTEM] Real-time connection closed']);
      
      // Try to reconnect after delay
      setTimeout(() => {
        console.log('Attempting to reconnect WebSocket...');
        setOutput(prev => [...prev, '[SYSTEM] Attempting to reconnect...']);
      }, 5000);
    };
    
    newSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setOutput(prev => [...prev, '[SYSTEM] Connection error occurred']);
    };
    
    setSocket(newSocket);
    
    return () => {
      if (newSocket && newSocket.readyState === WebSocket.OPEN) {
        newSocket.close();
      }
    };
  }, []);
  
  // Handle command submission
  const handleCommand = useCallback(async (command: string) => {
    if (!command.trim()) return;
    
    // Special commands
    if (command.toLowerCase() === 'clear') {
      setOutput([]);
      return;
    }
    
    setOutput(prev => [...prev, `> ${command}`]);
    
    if (command.toLowerCase() === 'help') {
      setOutput(prev => [...prev, 
        '[SYSTEM] Available commands:',
        ' • help - Display this help message',
        ' • status - Show agent status',
        ' • clear - Clear console',
        ' • <text> - Any other text is interpreted as a task for the agent'
      ]);
      return;
    }
    
    if (command.toLowerCase() === 'status') {
      try {
        const stats = await taskApi.getTaskStats();
        setOutput(prev => [...prev, 
          '[SYSTEM] Agent Status: ONLINE',
          `[SYSTEM] Tasks: ${stats.total} total (${stats.COMPLETED} completed, ${stats.FAILED} failed)`
        ]);
      } catch (error) {
        console.error('Error fetching stats:', error);
        setOutput(prev => [...prev, '[ERROR] Failed to fetch agent status']);
      }
      return;
    }
    
    // Regular task submission
    if (isProcessing) {
      setOutput(prev => [...prev, '[SYSTEM] Already processing a task. Please wait.']);
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Create task payload
      const taskPayload = {
        task_instructions: command,
        context_urls: [],
        agent_config: {
          use_vision: true, // Use options from command console
          use_planner: true,
        }
      };
      
      // Submit task
      const response = await taskApi.submitTask(taskPayload);
      setCurrentTaskId(response.id);
      setOutput(prev => [...prev, 
        `[SYSTEM] Task created: ${response.id}`,
        `[SYSTEM] Status: ${response.status}`,
        `[AGENT] Processing task: "${command}"`
      ]);
      
      // Real-time updates will come through WebSocket
    } catch (error) {
      console.error('Error submitting task:', error);
      setOutput(prev => [...prev, '[ERROR] Failed to submit task: ' + (error instanceof Error ? error.message : String(error))]);
      setIsProcessing(false);
    }
  }, [isProcessing]);
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col h-full"
    >
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-accent-blue">Agent Command Console</h1>
        {isProcessing && (
          <div className="flex items-center">
            <div className="animate-pulse mr-2 h-3 w-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-green-400">Processing task</span>
          </div>
        )}
      </div>
      
      <div className="flex-1">
        <CommandConsole 
          output={output}
          onCommand={handleCommand}
          isLoading={isProcessing}
        />
      </div>
    </motion.div>
  );
};

export default ConsoleView;