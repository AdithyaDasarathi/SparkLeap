
import { useState, useEffect } from 'react';
import { Task } from '@/types/task';
import TaskChat from '@/components/TaskChat';
import AppHeader from '@/components/AppHeader';
import { supabase } from '../src/lib/supabase';
import { User } from '@supabase/supabase-js';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get current user from Supabase
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUser(user);
          console.log('✅ User found:', user.email);
          
          // Try to load user-specific tasks from database
          try {
            const response = await fetch(`/api/tasks?userId=${user.id}`);
            const data = await response.json();
            if (data.success) {
              setTasks(data.tasks);
              console.log('📋 Loaded tasks for user:', user.email, '- Count:', data.tasks.length);
            } else {
              console.log('⚠️ No tasks found or API error, starting with empty tasks');
              setTasks([]);
            }
          } catch (apiError) {
            console.log('⚠️ API error loading tasks, starting with empty tasks:', apiError);
            setTasks([]);
          }
        } else {
          // No user found - redirect to Supabase login page
          console.log('⚠️ No user found in Supabase, redirecting to Supabase login');
          window.location.href = '/login-supabase';
          return;
        }
      } catch (error) {
        console.error('Error loading user:', error);
        window.location.href = '/login-supabase';
      }
      setIsLoading(false);
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(session.user);
        } else {
          window.location.href = '/login-supabase';
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const syncTaskToCalendar = async (task: Task) => {
    try {
      const credsStr = localStorage.getItem('googleCalendarCredentials');
      if (!credsStr) return; // Not connected to Google Calendar
      if (!task.dueDate) return; // Only sync tasks with dates

      const credentials = JSON.parse(credsStr);
      const start = new Date(task.dueDate);
      if (task.dueTime) {
        const [h, m] = task.dueTime.split(':').map(Number);
        start.setHours(h, m, 0, 0);
      }
      const end = new Date(start);
      end.setHours(start.getHours() + 1);

      const res = await fetch('/api/calendar/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: task.title,
          startISO: start.toISOString(),
          endISO: end.toISOString(),
          description: `Task from SparkLeap. Priority: ${task.priority}.`,
          credentials
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.warn('Calendar create failed:', data.error || res.statusText);
        return;
      }
      const data = await res.json();
      console.log('🗓️ Calendar event created:', data.eventId);
    } catch (e) {
      console.warn('Calendar sync skipped/error:', e);
    }
  };

  const handleAddTask = async (task: Task) => {
    if (!user) return;
    
    try {
      // Save task to database
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, userId: user.id || user.email })
      });
      const data = await response.json();
      if (data.success) {
        setTasks(prev => [...prev, data.task]);
        console.log('💾 Task saved to database:', data.task.id);
        // Fire-and-forget calendar sync
        syncTaskToCalendar(data.task);
        // Notify other tabs that tasks have been updated
        localStorage.setItem('tasks-updated', Date.now().toString());
      }
    } catch (error) {
      console.error('Error saving task:', error);
      // Fallback to local state
      setTasks(prev => [...prev, task]);
      // Try to sync even for local fallback
      syncTaskToCalendar(task);
      // Notify other tabs that tasks have been updated
      localStorage.setItem('tasks-updated', Date.now().toString());
    }
  };

  const clearAllTasks = async () => {
    if (!user) return;
    
    try {
      // Clear tasks from database
      const response = await fetch(`/api/tasks?userId=${user.id || user.email}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setTasks([]);
        console.log('🗑️ Cleared all tasks for user:', user.email);
      }
    } catch (error) {
      console.error('Error clearing tasks:', error);
      // Fallback to local clear
      setTasks([]);
    }
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0c0c0e, #1a1a1f)',
        color: '#ffffff'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid rgba(255, 255, 255, 0.3)',
          borderTop: '3px solid #ffffff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0c0c0e, #1a1a1f)',
      color: '#ffffff',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Global Header */}
      <AppHeader title="Tasks" subtitle="Management" />
      
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