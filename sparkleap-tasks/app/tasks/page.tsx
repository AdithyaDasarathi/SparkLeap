'use client';

import { useState, useEffect } from 'react';
import { Task } from '@/types/task';
import TaskChat from '@/components/TaskChat';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem('tasks');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const parsedTasks = parsed.map((task: any) => ({
          ...task,
          dueDate: task.dueDate ? new Date(task.dueDate) : null,
          createdAt: new Date(task.createdAt)
        }));
        setTasks(parsedTasks);
      } catch (err) {
        console.error('Error loading tasks:', err);
      }
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('tasks', JSON.stringify(tasks));
    }
  }, [tasks, isClient]);

  const handleAddTask = (task: Task) => {
    setTasks(prev => [...prev, task]);
  };

  const clearAllTasks = () => {
    setTasks([]);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <TaskChat onTaskCreate={handleAddTask} onClearTasks={clearAllTasks} tasks={tasks} />
    </div>
  );
} 