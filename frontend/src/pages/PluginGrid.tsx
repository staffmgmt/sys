import React, { useState } from 'react';
import { motion } from 'framer-motion';

// Define plugin interface
interface Plugin {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'api' | 'tool' | 'integration' | 'extension';
  isEnabled: boolean;
  isInstalled: boolean;
}

const PluginGrid: React.FC = () => {
  // Mock plugins data
  const [plugins, setPlugins] = useState<Plugin[]>([
    {
      id: 'notion',
      name: 'Notion',
      description: 'Access and manage Notion documents and databases.',
      category: 'integration',
      isEnabled: true,
      isInstalled: true,
      icon: (
        <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
          <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466l1.823 1.447zm1.353 5.507c.187.466 0 .932-.465 1.072l-2.056.28c-.373.047-.7-.093-.84-.42-.14-.326-.234-.7-.234-1.072l.233-4.424c.047-.373.374-.606.747-.56l1.963.186c.48.047.7.373.7.746v4.192zm16.378-5.18L7.965 5.516c-.7 0-1.075.28-1.075.653v12.335c0 .373.187.794.56.884l2.8.747c.467.14.934-.046 1.12-.513.094-.187.094-.373.094-.56V9.664c0-.186.094-.373.28-.42l10.735-1.91c.28-.47.514-.327.514-.607v-.746c0-.7-.514-1.26-1.214-1.446zm-2.055 3.403c-.047.233-.373.42-.7.42L7.126 9.85c-.326.093-.7-.046-.932-.232-.14-.093-.233-.28-.233-.466V2.828c0-.187.093-.373.28-.42.793-.233 1.587-.42 2.38-.653.327-.093.654 0 .887.186.233.187.373.513.373.84v4.192c0 .42.28.84.7.933l9.658 1.073c.7.093.84.42.7.793l-.186.699z" />
        </svg>
      ),
    },
    {
      id: 'zapier',
      name: 'Zapier',
      description: 'Connect with thousands of apps through Zapier automations.',
      category: 'integration',
      isEnabled: false,
      isInstalled: true,
      icon: (
        <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
          <path d="M12 0C5.322 0 0 5.322 0 12s5.322 12 12 12 12-5.322 12-12S18.678 0 12 0Zm-.006 5.44c.974 0 1.733.352 2.309.985.49.576.957 1.56.957 2.546v.05c0 .012-.006.018-.012.018h-1.584c-.018 0-.024-.006-.024-.024 0-.45-.175-1.038-.462-1.387-.293-.353-.694-.54-1.208-.54-.913 0-1.703.737-1.703 1.65 0 .293.094.522.342.846.223.288 1.005.728 1.798 1.106 1.02.475 1.659.864 2.12 1.293.731.683 1.012 1.404 1.012 2.309 0 1.957-1.597 3.5-3.536 3.5-1.12 0-2.037-.378-2.672-1.087-.63-.703-.98-1.688-.98-2.784v-.051c0-.012.006-.018.018-.018h1.596c.012 0 .018.006.018.018 0 .587.2 1.045.462 1.358.287.342.707.522 1.202.522.957 0 1.763-.775 1.763-1.739 0-.24-.07-.522-.35-.858-.175-.216-.624-.51-1.763-1.087-1.101-.557-1.805-.985-2.276-1.41-.688-.63-.938-1.283-.938-2.114 0-1.81 1.495-3.438 3.67-3.438z" />
        </svg>
      ),
    },
    {
      id: 'gmail',
      name: 'Gmail',
      description: 'Send and receive emails through Gmail.',
      category: 'integration',
      isEnabled: true,
      isInstalled: true,
      icon: (
        <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
          <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
        </svg>
      ),
    },
    {
      id: 'googleDrive',
      name: 'Google Drive',
      description: 'Access files and folders in Google Drive.',
      category: 'integration',
      isEnabled: true,
      isInstalled: true,
      icon: (
        <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
          <path d="M4.433 22.396l4.896-8.48 4.324 7.481-4.56 1.704a.819.819 0 0 1-.672-.096l-3.988-3.988v3.379zm19.133-7.381s.001-.001 0 0c.033-.064.027-.137.027-.208l-.044-.061-.027-.061-7.165-12.424a.823.823 0 0 0-.616-.336.823.823 0 0 0-.672.336L11.025 9.6 4.433 22.396l.266.267.027.061h18.278a.84.84 0 0 0 .672-.336l-.11-.025s.001-.001 0 0a.818.818 0 0 0 0-.672zM6.344 4.233L0 15.63l4.44-7.688 6.124-10.65a.82.82 0 0 1 .672-.336.82.82 0 0 1 .616.336l4.56 7.896-4.896 8.48-7.688-.157 2.516-9.278z" />
        </svg>
      ),
    },
    {
      id: 'github',
      name: 'GitHub',
      description: 'Interact with GitHub repositories and issues.',
      category: 'integration',
      isEnabled: false,
      isInstalled: true,
      icon: (
        <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
        </svg>
      ),
    },
    {
      id: 'openai',
      name: 'OpenAI API',
      description: 'Access GPT models for enhanced capabilities.',
      category: 'api',
      isEnabled: false,
      isInstalled: false,
      icon: (
        <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
          <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.038l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.392.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
        </svg>
      ),
    },
    {
      id: 'scraper',
      name: 'Web Scraper',
      description: 'Extract structured data from websites.',
      category: 'tool',
      isEnabled: true,
      isInstalled: true,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      ),
    },
    {
      id: 'pdf',
      name: 'PDF Processor',
      description: 'Extract and process text from PDF documents.',
      category: 'tool',
      isEnabled: true,
      isInstalled: true,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
  ]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showInstalled, setShowInstalled] = useState(true);
  
  // Filter plugins based on search, category, and installation status
  const filteredPlugins = plugins.filter(plugin => {
    // Filter by search term
    const matchesSearch = 
      plugin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plugin.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by category
    const matchesCategory = categoryFilter === 'all' || plugin.category === categoryFilter;
    
    // Filter by installation status
    const matchesInstallation = showInstalled ? plugin.isInstalled : true;
    
    return matchesSearch && matchesCategory && matchesInstallation;
  });
  
  // Toggle plugin enabled state
  const togglePlugin = (id: string) => {
    setPlugins(
      plugins.map(plugin => 
        plugin.id === id ? { ...plugin, isEnabled: !plugin.isEnabled } : plugin
      )
    );
  };
  
  // Install plugin
  const installPlugin = (id: string) => {
    setPlugins(
      plugins.map(plugin => 
        plugin.id === id ? { ...plugin, isInstalled: true } : plugin
      )
    );
  };
  
  // Uninstall plugin
  const uninstallPlugin = (id: string) => {
    if (window.confirm(`Are you sure you want to uninstall the ${plugins.find(p => p.id === id)?.name} plugin?`)) {
      setPlugins(
        plugins.map(plugin => 
          plugin.id === id ? { ...plugin, isInstalled: false, isEnabled: false } : plugin
        )
      );
    }
  };
  
  // Count plugins by category
  const categoryCounts = plugins.reduce((acc, plugin) => {
    if (plugin.isInstalled) {
      acc.all += 1;
      acc[plugin.category] = (acc[plugin.category] || 0) + 1;
    }
    return acc;
  }, { all: 0, api: 0, tool: 0, integration: 0, extension: 0 } as Record<string, number>);
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-accent-blue">Plugins & Extensions</h1>
        
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search plugins..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 w-full sm:w-auto"
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <button
            onClick={() => {}}
            className="flex items-center px-3 py-2 bg-accent-blue text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Browse Plugin Store
          </button>
        </div>
      </div>
      
      {/* Category filters */}
      <div className="flex overflow-x-auto pb-2 hide-scrollbar">
        <div className="flex space-x-2">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              categoryFilter === 'all'
                ? 'bg-accent-blue text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            All ({categoryCounts.all})
          </button>
          
          <button
            onClick={() => setCategoryFilter('integration')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              categoryFilter === 'integration'
                ? 'bg-accent-blue text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Integrations ({categoryCounts.integration})
          </button>
          
          <button
            onClick={() => setCategoryFilter('api')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              categoryFilter === 'api'
                ? 'bg-accent-blue text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            APIs ({categoryCounts.api})
          </button>
          
          <button
            onClick={() => setCategoryFilter('tool')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              categoryFilter === 'tool'
                ? 'bg-accent-blue text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Tools ({categoryCounts.tool})
          </button>
          
          <button
            onClick={() => setCategoryFilter('extension')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              categoryFilter === 'extension'
                ? 'bg-accent-blue text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Extensions ({categoryCounts.extension})
          </button>
        </div>
      </div>
      
      {/* Plugin grid */}
      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        {filteredPlugins.length === 0 ? (
          <div className="p-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <h3 className="text-lg font-medium text-gray-300 mb-2">No plugins found</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              {searchTerm
                ? `No plugins match "${searchTerm}". Try a different search term or category.`
                : 'No plugins found in this category. Browse the plugin store to discover and install plugins.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
            {filteredPlugins.map((plugin, index) => (
              <motion.div
                key={plugin.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`bg-gray-750 rounded-lg border ${
                  plugin.isEnabled ? 'border-accent-blue' : 'border-gray-700'
                } overflow-hidden hover:shadow-md transition-shadow relative`}
              >
                <div className={`absolute top-3 right-3 h-2.5 w-2.5 rounded-full ${
                  plugin.isEnabled ? 'bg-green-500' : 'bg-gray-500'
                }`}></div>
                
                <div className="p-5">
                  <div className="flex items-center mb-3">
                    <div className={`p-2 rounded-full mr-3 ${
                      plugin.isEnabled ? 'text-accent-blue bg-accent-blue/10' : 'text-gray-400 bg-gray-800'
                    }`}>
                      {plugin.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-200">{plugin.name}</h3>
                      <span className="text-xs text-gray-400 capitalize">{plugin.category}</span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-400 mb-4 line-clamp-2">{plugin.description}</p>
                  
                  <div className="flex justify-between items-center">
                    {plugin.isInstalled ? (
                      <>
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={plugin.isEnabled}
                            onChange={() => togglePlugin(plugin.id)}
                            className="sr-only peer"
                          />
                          <div className="relative w-10 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent-blue"></div>
                        </label>
                        
                        <button
                          onClick={() => uninstallPlugin(plugin.id)}
                          className="text-xs text-gray-400 hover:text-gray-200"
                        >
                          Uninstall
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => installPlugin(plugin.id)}
                        className="text-xs bg-accent-blue hover:bg-blue-600 text-white px-3 py-1 rounded-md transition-colors"
                      >
                        Install
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PluginGrid;

// Add a CSS class to hide the scrollbar but allow scrolling
const style = document.createElement('style');
style.textContent = `
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;
document.head.appendChild(style);