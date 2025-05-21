// --- START OF FILE frontend/src/App.tsx ---
import React from 'react';
// Corrected: Import necessary components from react-router-dom
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import TaskDashboard from './pages/TaskDashboard';
import Dashboard from './pages/Dashboard';
import TaskQueue from './pages/TaskQueue';
import ConsoleView from './pages/ConsoleView';
import MemoryPanel from './pages/MemoryPanel';
import PluginGrid from './pages/PluginGrid';
import TimelineMonitor from './pages/TimelineMonitor';
import TaskDetailPage from './pages/TaskDetailPage';
import AppLayout from './components/AppLayout';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="tasks" element={<TaskQueue />} />
          <Route path="tasks/:taskId" element={<TaskDetailPage />} />
          <Route path="console" element={<ConsoleView />} />
          <Route path="memory" element={<MemoryPanel />} />
          <Route path="plugins" element={<PluginGrid />} />
          <Route path="timeline" element={<TimelineMonitor />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
// --- END OF FILE frontend/src/App.tsx ---