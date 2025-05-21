// --- START OF FILE frontend/src/pages/TaskDashboard.tsx ---
import React from 'react';
import TaskForm from '../components/TaskForm'; // Will create this
import TaskList from '../components/TaskList'; // Will create this

const TaskDashboard: React.FC = () => {
  return (
    <div className="space-y-8">
      <TaskForm />
      <TaskList />
    </div>
  );
};

export default TaskDashboard;
// --- END OF FILE frontend/src/pages/TaskDashboard.tsx ---