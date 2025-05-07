'use client';

import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Task } from '@/types/task';
import { CheckIcon, TrashIcon } from '@heroicons/react/24/outline';
import TaskChat from '@/components/TaskChat';

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
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tasks');
      if (saved) {
        const parsed = JSON.parse(saved);
        const parsedTasks = parsed.map((task: any) => ({
          ...task,
          dueDate: task.dueDate ? new Date(task.dueDate) : null,
          createdAt: new Date(task.createdAt)
        }));
        return sortTasks(parsedTasks);
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  const handleAddTask = (task: Task) => {
    setTasks(prev => sortTasks([task, ...prev]));
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

  return (
    <main className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <TaskChat onTaskCreate={handleAddTask} />
        <div className="mt-8 bg-white shadow rounded-lg divide-y divide-gray-200">
          {tasks.map(task => (
            <div
              key={task.id}
              className={`p-4 flex items-start justify-between ${task.completed ? 'bg-gray-50' : ''}`}
            >
              <div className="flex items-start space-x-3 flex-grow">
                <button
                  onClick={() => toggleTask(task.id)}
                  className={`flex-shrink-0 h-6 w-6 rounded-full border-2 ${task.completed
                    ? 'bg-green-500 border-green-500 flex items-center justify-center'
                    : 'border-gray-300'}`}
                >
                  {task.completed && (
                    <CheckIcon className="h-4 w-4 text-white" />
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium text-black ${task.completed ? 'line-through text-gray-500' : ''}`}>
                    {task.title}
                  </p>
                  <div className="mt-1 flex items-center space-x-2">
                    {task.dueDate && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {format(task.dueDate, 'MMM d')}
                        {task.dueTime && ` at ${task.dueTime}`}
                      </span>
                    )}
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      task.priority === 'High' ? 'bg-red-100 text-red-800' :
                      task.priority === 'Low' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {task.priority} Priority
                    </span>
                    {task.category !== 'General' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        {task.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => deleteTask(task.id)}
                className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-500"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
