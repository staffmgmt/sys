import React, { useState } from 'react';
import { motion } from 'framer-motion';

const MemoryPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'files' | 'knowledge' | 'vectors'>('files');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Mock memory items
  const memoryItems = [
    { id: 'doc1', name: 'research_ml.pdf', type: 'file', size: '1.2 MB', date: '2023-09-15' },
    { id: 'doc2', name: 'product_specs.docx', type: 'file', size: '567 KB', date: '2023-09-12' },
    { id: 'img1', name: 'architecture_diagram.png', type: 'file', size: '890 KB', date: '2023-09-10' },
    { id: 'web1', name: 'https://example.com/article1', type: 'webpage', date: '2023-09-08' },
    { id: 'note1', name: 'Meeting Notes - Q3 Planning', type: 'note', date: '2023-09-05' },
  ];
  
  // Mock knowledge graph data
  const knowledgeNodes = [
    { id: 'concept1', label: 'Machine Learning', type: 'concept', connections: ['concept2', 'concept4'] },
    { id: 'concept2', label: 'Neural Networks', type: 'subconcept', connections: ['concept3'] },
    { id: 'concept3', label: 'Transformers', type: 'subconcept', connections: [] },
    { id: 'concept4', label: 'Data Processing', type: 'concept', connections: ['concept5'] },
    { id: 'concept5', label: 'Feature Engineering', type: 'subconcept', connections: [] },
  ];
  
  // Filter memory items based on search
  const filteredItems = searchTerm
    ? memoryItems.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : memoryItems;
  
  // Handle file or memory item open
  const handleOpenItem = (item: any) => {
    console.log('Opening item:', item);
    // In a real implementation, this would trigger file opening or knowledge display
  };
  
  // Handle memory directory open
  const handleOpenDirectory = () => {
    console.log('Opening memory directory');
    // In a real implementation, this would open the local Agent_Dir folder
  };
  
  // Handle memory injection
  const handleInjectMemory = () => {
    console.log('Injecting memory');
    // In a real implementation, this would open a dialog to inject specific memories
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-accent-blue">Agent Memory</h1>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleOpenDirectory}
            className="flex items-center px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-sm text-gray-300 hover:bg-gray-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
            </svg>
            Open Directory
          </button>
          
          <button
            onClick={handleInjectMemory}
            className="flex items-center px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-sm text-gray-300 hover:bg-gray-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Inject Memory
          </button>
        </div>
      </div>
      
      {/* Tabs navigation */}
      <div className="flex border-b border-gray-700">
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'files'
              ? 'text-accent-blue border-b-2 border-accent-blue'
              : 'text-gray-400 hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('files')}
        >
          Files & Context
        </button>
        
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'knowledge'
              ? 'text-accent-blue border-b-2 border-accent-blue'
              : 'text-gray-400 hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('knowledge')}
        >
          Knowledge Graph
        </button>
        
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'vectors'
              ? 'text-accent-blue border-b-2 border-accent-blue'
              : 'text-gray-400 hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('vectors')}
        >
          Vector Memory
        </button>
      </div>
      
      {/* Tab content */}
      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden min-h-[500px]">
        {/* Files & Context tab */}
        {activeTab === 'files' && (
          <div className="p-4">
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search files and contexts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-sm text-gray-300"
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            {filteredItems.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                <p>No memory items found. Add files or contexts to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="bg-gray-700 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-650 transition-colors group"
                    onClick={() => handleOpenItem(item)}
                  >
                    <div className="p-4">
                      <div className="flex items-start space-x-3">
                        {/* File type icon */}
                        <div className="w-10 h-10 rounded-lg bg-gray-600 flex items-center justify-center text-gray-300">
                          {item.type === 'file' && item.name.endsWith('.pdf') && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          )}
                          {item.type === 'file' && (item.name.endsWith('.docx') || item.name.endsWith('.doc')) && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          )}
                          {item.type === 'file' && (item.name.endsWith('.png') || item.name.endsWith('.jpg')) && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          )}
                          {item.type === 'webpage' && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                            </svg>
                          )}
                          {item.type === 'note' && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-200 truncate group-hover:text-accent-blue">
                            {item.name}
                          </h3>
                          <p className="text-xs text-gray-400 mt-1">
                            {item.type === 'file' ? `${item.size} • ` : ''}
                            {new Date(item.date).toLocaleDateString()}
                          </p>
                        </div>
                        
                        <div className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Knowledge Graph tab */}
        {activeTab === 'knowledge' && (
          <div className="p-4">
            <div className="h-[450px] flex items-center justify-center bg-gray-750 rounded-lg relative">
              {/* This would be replaced with a real knowledge graph visualization */}
              <div className="text-center">
                <div className="p-6 mb-4">
                  <svg viewBox="0 0 200 200" className="w-full h-64 pointer-events-none">
                    {/* Render connections first */}
                    <line x1="100" y1="50" x2="30" y2="100" stroke="#4299e1" strokeWidth="2" opacity="0.5" />
                    <line x1="100" y1="50" x2="170" y2="100" stroke="#4299e1" strokeWidth="2" opacity="0.5" />
                    <line x1="30" y1="100" x2="30" y2="150" stroke="#4299e1" strokeWidth="2" opacity="0.5" />
                    <line x1="170" y1="100" x2="170" y2="150" stroke="#4299e1" strokeWidth="2" opacity="0.5" />
                    
                    {/* Render nodes on top of connections */}
                    <circle cx="100" cy="50" r="20" fill="#2d3748" stroke="#4299e1" strokeWidth="2" />
                    <text x="100" y="55" textAnchor="middle" fill="#e2e8f0" fontSize="8">Machine Learning</text>
                    
                    <circle cx="30" cy="100" r="15" fill="#2d3748" stroke="#48bb78" strokeWidth="2" />
                    <text x="30" y="103" textAnchor="middle" fill="#e2e8f0" fontSize="7">Neural Networks</text>
                    
                    <circle cx="170" cy="100" r="15" fill="#2d3748" stroke="#48bb78" strokeWidth="2" />
                    <text x="170" y="103" textAnchor="middle" fill="#e2e8f0" fontSize="7">Data Processing</text>
                    
                    <circle cx="30" cy="150" r="12" fill="#2d3748" stroke="#f6ad55" strokeWidth="2" />
                    <text x="30" y="153" textAnchor="middle" fill="#e2e8f0" fontSize="6">Transformers</text>
                    
                    <circle cx="170" cy="150" r="12" fill="#2d3748" stroke="#f6ad55" strokeWidth="2" />
                    <text x="170" y="153" textAnchor="middle" fill="#e2e8f0" fontSize="6">Feature Engineering</text>
                  </svg>
                </div>
                <p className="text-gray-400 text-sm">Interactive knowledge graph visualization.<br />In a full implementation, this would be a dynamic, interactive graph.</p>
              </div>
              
              <div className="absolute bottom-4 right-4 flex space-x-2">
                <button className="p-2 bg-gray-700 rounded-full hover:bg-gray-600 text-gray-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                <button className="p-2 bg-gray-700 rounded-full hover:bg-gray-600 text-gray-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
                <button className="p-2 bg-gray-700 rounded-full hover:bg-gray-600 text-gray-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Vector Memory tab */}
        {activeTab === 'vectors' && (
          <div className="p-4">
            <div className="text-center py-12">
              <div className="inline-block p-6 rounded-lg bg-gray-750 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mx-auto text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-300 mb-2">Vector Memory Visualization</h3>
              <p className="text-gray-400 max-w-lg mx-auto">
                This panel would show a visualization of the agent's vector memory space, allowing you to explore embeddings and semantic relationships. The implementation would include interactive 3D or 2D projections of the vector space.
              </p>
              
              <div className="mt-6">
                <button className="px-4 py-2 bg-accent-blue/20 text-accent-blue rounded-md hover:bg-accent-blue/30 transition-colors">
                  Enable Vector Visualization
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MemoryPanel;