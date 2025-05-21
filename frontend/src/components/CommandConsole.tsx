import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface CommandConsoleProps {
  output: string[];
  onCommand: (command: string) => void;
  isLoading?: boolean;
}

const CommandConsole: React.FC<CommandConsoleProps> = ({ 
  output, 
  onCommand, 
  isLoading = false 
}) => {
  const [inputValue, setInputValue] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isOptionsVisible, setIsOptionsVisible] = useState(false);
  const [options, setOptions] = useState({
    useVision: true,
    usePlanner: true,
    enablePersistentState: false,
    enableGif: false,
  });
  
  const consoleEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Auto-scroll to bottom when logs change
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [output]);
  
  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    
    if (inputValue.trim().toLowerCase() !== 'clear') {
      setCommandHistory(prev => [inputValue, ...prev].slice(0, 50));
    }
    onCommand(inputValue);
    setInputValue('');
    setHistoryIndex(-1);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isLoading) return;
    
    if (e.key === 'ArrowUp' && commandHistory.length > 0) {
      e.preventDefault();
      const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
      setHistoryIndex(newIndex);
      setInputValue(commandHistory[newIndex] || '');
    } else if (e.key === 'ArrowDown' && historyIndex >= 0) {
      e.preventDefault();
      const newIndex = historyIndex > 0 ? historyIndex - 1 : -1;
      setHistoryIndex(newIndex);
      setInputValue(newIndex >= 0 ? commandHistory[newIndex] || '' : '');
    }
  };
  
  // Toggle options panel
  const toggleOptions = () => {
    setIsOptionsVisible(!isOptionsVisible);
  };
  
  // Handle option change
  const handleOptionChange = (option: keyof typeof options) => {
    setOptions({
      ...options,
      [option]: !options[option],
    });
  };
  
  // Get agent config from options
  const getAgentConfig = () => {
    return {
      use_vision: options.useVision,
      use_planner: options.usePlanner,
      enable_persistent_state: options.enablePersistentState,
      enable_gif: options.enableGif,
    };
  };
  
  const formatOutput = (line: string) => {
    if (line.startsWith('>')) {
      return <span className="text-green-400">{line}</span>;
    } else if (line.startsWith('[SYSTEM]')) {
      return <span className="text-yellow-400">{line}</span>;
    } else if (line.startsWith('[AGENT]')) {
      return <span className="text-blue-400">{line}</span>;
    } else if (line.toLowerCase().includes('error') || line.toLowerCase().includes('failed')) {
      return <span className="text-red-400">{line}</span>;
    } else if (line.toLowerCase().includes('warning')) {
      return <span className="text-orange-400">{line}</span>;
    }
    return <span className="text-gray-300">{line}</span>;
  };
  
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden shadow-lg flex flex-col h-full">
      {/* Console header */}
      <div className="bg-gray-800 p-3 border-b border-gray-700 flex justify-between items-center">
        <div className="flex items-center">
          <div className="flex space-x-2 mr-3">
            <div className="h-3 w-3 rounded-full bg-red-500"></div>
            <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
            <div className="h-3 w-3 rounded-full bg-green-500"></div>
          </div>
          <h3 className="text-sm font-medium text-gray-200">Command Console</h3>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={toggleOptions}
            className="text-gray-400 hover:text-gray-200 text-sm"
          >
            Options
          </button>
          <button 
            onClick={() => onCommand('clear')}
            className="text-gray-400 hover:text-gray-200 text-sm"
          >
            Clear
          </button>
        </div>
      </div>
      
      {/* Options panel - conditionally rendered */}
      {isOptionsVisible && (
        <motion.div 
          className="bg-gray-800 p-3 border-b border-gray-700"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <label className="flex items-center space-x-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={options.useVision}
                onChange={() => handleOptionChange('useVision')}
                className="form-checkbox h-4 w-4 text-accent-blue rounded border-gray-600 bg-gray-700 focus:ring-accent-blue"
              />
              <span>Vision</span>
            </label>
            <label className="flex items-center space-x-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={options.usePlanner}
                onChange={() => handleOptionChange('usePlanner')}
                className="form-checkbox h-4 w-4 text-accent-blue rounded border-gray-600 bg-gray-700 focus:ring-accent-blue"
              />
              <span>Planner</span>
            </label>
            <label className="flex items-center space-x-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={options.enablePersistentState}
                onChange={() => handleOptionChange('enablePersistentState')}
                className="form-checkbox h-4 w-4 text-accent-blue rounded border-gray-600 bg-gray-700 focus:ring-accent-blue"
              />
              <span>Persistent State</span>
            </label>
            <label className="flex items-center space-x-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={options.enableGif}
                onChange={() => handleOptionChange('enableGif')}
                className="form-checkbox h-4 w-4 text-accent-blue rounded border-gray-600 bg-gray-700 focus:ring-accent-blue"
              />
              <span>Enable GIF</span>
            </label>
          </div>
        </motion.div>
      )}
      
      {/* Console output */}
      <div className="flex-1 p-3 overflow-y-auto font-mono text-sm bg-gray-900">
        {output.map((line, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="whitespace-pre-wrap mb-1"
          >
            {formatOutput(line)}
          </motion.div>
        ))}
        <div ref={consoleEndRef} />
      </div>
      
      {/* Command input */}
      <form onSubmit={handleSubmit} className="border-t border-gray-700 p-2">
        <div className="flex items-center bg-gray-800 rounded px-2">
          <span className="text-green-400 mr-2">$</span>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            ref={inputRef}
            placeholder={isLoading ? "Processing..." : "Enter command..."}
            className="flex-1 bg-transparent border-none outline-none text-gray-200 py-1.5 font-mono"
            disabled={isLoading}
          />
          {isLoading && (
            <div className="animate-pulse h-4 w-4 bg-blue-500 rounded-full mr-2"></div>
          )}
        </div>
      </form>
    </div>
  );
};

export default CommandConsole;