'use client';

import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Task } from '@/types/task';
import { CheckIcon, TrashIcon } from '@heroicons/react/24/outline';
import TaskChat from '@/components/TaskChat';
import Navigation from '@/components/Navigation';

const sortTasks = (tasks: Task[]): Task[] => {
  return [...tasks].sort((a, b) => {
    // First, handle tasks with no due date (put them at the end)
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;

    // Compare dates
    const dateComparison = a.dueDate.getTime() - b.dueDate.getTime();
    if (dateComparison !== 0) return dateComparison;

    // If dates are equal, compare times
    if (a.dueTime && b.dueTime) {
      return a.dueTime.localeCompare(b.dueTime);
    }
    // Put tasks with times before tasks without times
    if (a.dueTime) return -1;
    if (b.dueTime) return 1;
    return 0;
  });
};

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isClient, setIsClient] = useState(false);

  // Load tasks from localStorage after mount
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
        setTasks(sortTasks(parsedTasks));
      } catch (err) {
        console.error('Error loading tasks:', err);
      }
    }
  }, []);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    if (isClient) {
      localStorage.setItem('tasks', JSON.stringify(tasks));
    }
  }, [tasks, isClient]);

  const handleAddTask = (task: Task) => {
    setTasks(prev => {
      const newTasks = [...prev, task];
      return sortTasks(newTasks);
    });
  };

  const toggleTask = (id: string) => {
    setTasks(prev =>
      sortTasks(prev.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
      ))
    );
  };

  const deleteTask = (id: string) => {
    setTasks(prev => sortTasks(prev.filter(task => task.id !== id)));
  };

  const clearAllTasks = () => {
    setTasks([]);
  };

  // Format date and time in a nice way
  const formatDateTime = (date: Date | null, includeTime: boolean = true) => {
    if (!date) return '';
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    
    const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    
    if (isToday) {
      return includeTime ? `Today at ${time}` : 'Today';
    } else if (isTomorrow) {
      return includeTime ? `Tomorrow at ${time}` : 'Tomorrow';
    } else {
      // For dates within the next 6 days, show day name
      const dayDiff = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (dayDiff < 6) {
        return includeTime ? 
          `${date.toLocaleDateString('en-US', { weekday: 'long' })} at ${time}` : 
          `${date.toLocaleDateString('en-US', { weekday: 'long' })}`;
      }
      // Otherwise show month and day
      return includeTime ? 
        `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${time}` : 
        `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
  };
  
  // Get priority styling
  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'High':
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          border: 'border-red-200',
          hover: 'hover:bg-red-50',
          icon: '🔴'
        };
      case 'Medium':
        return {
          bg: 'bg-amber-100',
          text: 'text-amber-800',
          border: 'border-amber-200',
          hover: 'hover:bg-amber-50',
          icon: '🟠'
        };
      case 'Low':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          border: 'border-green-200',
          hover: 'hover:bg-green-50',
          icon: '🟢'
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          border: 'border-gray-200',
          hover: 'hover:bg-gray-50',
          icon: '⚪'
        };
    }
  };

  return (
    <main className="min-h-screen bg-gray-100">
      <Navigation />
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <TaskChat onTaskCreate={handleAddTask} onClearTasks={clearAllTasks} tasks={tasks} />
          
          <div className="mt-8">
            <h2 className="text-xl font-bold text-black mb-4">Your Tasks</h2>
            {tasks.length > 0 ? (
              <div className="space-y-4">
                {tasks.map(task => (
                  <div 
                    key={task.id} 
                    className={`p-4 border border-gray-100 rounded-lg ${task.completed ? 'bg-gray-50' : 'bg-white'} hover:shadow-sm transition-shadow duration-200`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => toggleTask(task.id)}
                            className="h-4 w-4 mt-1 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </div>
                        <div className="ml-3">
                          <div className={`text-base font-normal ${task.completed ? 'line-through text-gray-500' : 'text-black'}`}>
                            {task.title}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {task.priority} Priority
                            {task.dueDate && (
                              <span className="ml-2">
                                {format(task.dueDate, 'MMM d')} at {format(task.dueDate, 'h:mm a')}
                              </span>
                            )}
                            {task.category !== 'General' && (
                              <span className="ml-2">{task.category}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        aria-label="Delete task"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No tasks yet</p>
            )}
          </div>
          
          {tasks.length === 0 && (
            <div className="mt-8 bg-white shadow rounded-lg p-6 text-center">
              <p className="text-gray-500 text-lg">No tasks yet</p>
              <p className="text-gray-400 text-sm mt-2">Start by typing a task in the chat box above</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
