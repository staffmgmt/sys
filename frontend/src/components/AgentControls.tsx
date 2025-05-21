// src/components/AgentControls.tsx (Updated with state management)
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// Define the structure for the agent configuration options
export interface AgentConfigOptions {
  useMemory: boolean;
  usePlanner: boolean;
  useVision: boolean;
  useGIF: boolean; // Example option
  // Add other relevant config options here
}

interface AgentControlsProps {
  // Current agent status (passed down)
  status: 'online' | 'offline' | 'busy';
  // Callback when status change is requested (e.g., Start/Stop Agent button)
  onStatusChange: (newStatus: 'online' | 'offline') => void; // Only allow changing to online/offline
  // Initial configuration values
  initialConfig: AgentConfigOptions;
  // Callback when configuration changes
  onConfigChange: (newConfig: AgentConfigOptions) => void;
}

const AgentControls: React.FC<AgentControlsProps> = ({
    status,
    onStatusChange,
    initialConfig,
    onConfigChange
}) => {
  // Use state initialized from props, report changes via onConfigChange
  const [config, setConfig] = useState<AgentConfigOptions>(initialConfig);

  // Effect to call onConfigChange when local config state changes
  useEffect(() => {
    onConfigChange(config);
  }, [config, onConfigChange]);


  const handleToggleAgent = () => {
    // Only allow toggling between online and offline
    if (status === 'offline') {
      onStatusChange('online');
    } else if (status === 'online') {
      onStatusChange('offline');
    }
    // Ignore clicks if busy
  };

  // Helper function to update a specific config option
  const handleConfigToggle = (option: keyof AgentConfigOptions) => {
      setConfig(prevConfig => ({
          ...prevConfig,
          [option]: !prevConfig[option]
      }));
  };

  return (
    <motion.div
      className="bg-command-panel border border-command-highlight rounded-lg shadow-command overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="px-4 py-3 border-b border-command-highlight flex justify-between items-center">
        <h3 className="text-lg font-semibold text-command-accent">Agent Controls</h3>
        <motion.button
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
            status === 'offline'
              ? 'bg-green-600 hover:bg-green-700 text-white' // Use clearer colors
              : 'bg-red-600 hover:bg-red-700 text-white' // Use clearer colors
          } ${status === 'busy' ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleToggleAgent}
          whileTap={{ scale: 0.95 }}
          disabled={status === 'busy'}
        >
          {status === 'offline' ? 'Start Agent' : 'Stop Agent'}
        </motion.button>
      </div>

      <div className="p-4">
        {/* Toggles using handleConfigToggle */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Memory Toggle */}
            <div className="flex items-center space-x-2">
                <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                <input
                    type="checkbox"
                    id="toggle-memory"
                    checked={config.useMemory}
                    onChange={() => handleConfigToggle('useMemory')}
                    className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in"
                    style={{ transform: config.useMemory ? 'translateX(100%)' : 'translateX(0)', borderColor: config.useMemory ? '#3b82f6' : '#4b5563'}} // Blue when on, Gray when off
                 />
                <label htmlFor="toggle-memory" className="toggle-label block overflow-hidden h-5 rounded-full bg-gray-600 cursor-pointer transition-colors duration-200 ease-in" style={{backgroundColor: config.useMemory ? '#1d4ed8': '#4b5563' }}></label> {/* Darker blue/gray */}
                </div>
                <label htmlFor="toggle-memory" className="text-sm text-command-text cursor-pointer">Memory</label>
            </div>

             {/* Planner Toggle */}
             <div className="flex items-center space-x-2">
                 <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                 <input type="checkbox" id="toggle-planner" checked={config.usePlanner} onChange={() => handleConfigToggle('usePlanner')} className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer" style={{ transform: config.usePlanner ? 'translateX(100%)' : 'translateX(0)', borderColor: config.usePlanner ? '#3b82f6' : '#4b5563'}} />
                 <label htmlFor="toggle-planner" className="toggle-label block overflow-hidden h-5 rounded-full bg-gray-600 cursor-pointer" style={{backgroundColor: config.usePlanner ? '#1d4ed8': '#4b5563' }}></label>
                 </div>
                 <label htmlFor="toggle-planner" className="text-sm text-command-text cursor-pointer">Planner</label>
             </div>

             {/* Vision Toggle */}
             <div className="flex items-center space-x-2">
                 <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                 <input type="checkbox" id="toggle-vision" checked={config.useVision} onChange={() => handleConfigToggle('useVision')} className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer" style={{ transform: config.useVision ? 'translateX(100%)' : 'translateX(0)', borderColor: config.useVision ? '#3b82f6' : '#4b5563'}} />
                 <label htmlFor="toggle-vision" className="toggle-label block overflow-hidden h-5 rounded-full bg-gray-600 cursor-pointer" style={{backgroundColor: config.useVision ? '#1d4ed8': '#4b5563' }}></label>
                 </div>
                 <label htmlFor="toggle-vision" className="text-sm text-command-text cursor-pointer">Vision</label>
             </div>

             {/* GIF Toggle */}
             <div className="flex items-center space-x-2">
                 <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                 <input type="checkbox" id="toggle-gif" checked={config.useGIF} onChange={() => handleConfigToggle('useGIF')} className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer" style={{ transform: config.useGIF ? 'translateX(100%)' : 'translateX(0)', borderColor: config.useGIF ? '#3b82f6' : '#4b5563'}} />
                 <label htmlFor="toggle-gif" className="toggle-label block overflow-hidden h-5 rounded-full bg-gray-600 cursor-pointer" style={{backgroundColor: config.useGIF ? '#1d4ed8': '#4b5563' }}></label>
                 </div>
                 <label htmlFor="toggle-gif" className="text-sm text-command-text cursor-pointer">GIF</label>
             </div>

        </div>

        {/* Status indicator row */}
        <div className="mt-4 pt-3 border-t border-command-highlight flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`h-2.5 w-2.5 rounded-full ${
              status === 'online' ? 'bg-green-500 animate-pulse' : // Brighter green
              status === 'busy' ? 'bg-yellow-500' : // Brighter yellow
              'bg-red-500' // Brighter red
            }`}></div>
            <span className="text-xs text-command-text-muted">
              Status: <span className={`font-medium ${
                status === 'online' ? 'text-green-400' :
                status === 'busy' ? 'text-yellow-400' :
                'text-red-400'
              } capitalize`}>{status}</span>
            </span>
          </div>

          <button className="text-xs text-command-accent hover:text-command-accent-bright transition">
            Advanced Settings {/* Placeholder */}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default AgentControls;