'use client';

import { useState, useEffect } from 'react';
import { Task } from '@/types/task';
import TaskChat from '@/components/TaskChat';
import Navigation from '@/components/Navigation';

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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0c0c0e, #1a1a1f)',
      color: '#ffffff',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Background gradient effects */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 0
      }}>
        <div style={{
          position: 'absolute',
          top: '-160px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '576px',
          height: '384px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.1) 50%, rgba(147, 51, 234, 0.1) 100%)',
          filter: 'blur(60px)',
          animation: 'pulse 3s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute',
          top: '160px',
          left: '80px',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%)',
          filter: 'blur(60px)',
          animation: 'pulse 3s ease-in-out infinite',
          animationDelay: '1s'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-80px',
          right: '40px',
          width: '512px',
          height: '384px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(147, 51, 234, 0.08) 0%, rgba(236, 72, 153, 0.08) 100%)',
          filter: 'blur(60px)',
          animation: 'pulse 3s ease-in-out infinite',
          animationDelay: '2s'
        }} />
      </div>

      {/* Navigation Header */}
      <Navigation currentPage="tasks" />

      {/* Main Content */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 24px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          padding: '32px',
          overflow: 'hidden'
        }}>
          <TaskChat onTaskCreate={handleAddTask} onClearTasks={clearAllTasks} tasks={tasks} />
        </div>
      </div>
    </div>
  );
} 