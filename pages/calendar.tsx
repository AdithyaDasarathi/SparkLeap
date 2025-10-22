
import { useState, useEffect } from 'react';
import { Task } from '@/types/task';
import AppHeader from '@/components/AppHeader';
import CalendarView from '@/components/CalendarView';
import TaskList from '@/components/TaskList';
import GoogleCalendarSync from '@/components/GoogleCalendarSync';
import Navigation from '@/components/Navigation';

export default function CalendarPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetails, setShowTaskDetails] = useState(false);

  useEffect(() => {
    // Set client state immediately
    setIsClient(true);
    
    // Check for user authentication first
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      console.log('⚠️ No user found in localStorage, redirecting to Supabase login');
      window.location.href = '/login-supabase';
      return;
    }
    
    // Load tasks from localStorage
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

  // Fallback timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isClient) {
        console.warn('Calendar page loading timeout - forcing client state');
        setIsClient(true);
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, [isClient]);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('tasks', JSON.stringify(tasks));
    }
  }, [tasks, isClient]);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowTaskDetails(true);
  };

  const closeTaskDetails = () => {
    setShowTaskDetails(false);
    setSelectedTask(null);
  };

  const getTasksWithDueDates = () => {
    return tasks.filter(task => task.dueDate && !task.completed);
  };

  const getUpcomingTasks = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return tasks.filter(task => 
      task.dueDate && 
      task.dueDate >= today && 
      !task.completed
    );
  };

  if (!isClient) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0c0c0e, #1a1a1f)',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '40px',
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(255, 255, 255, 0.3)',
            borderTop: '3px solid #ffffff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Loading Calendar...</div>
          <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>Please wait while we load your tasks</div>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
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
      <AppHeader title="Calendar" subtitle="Integration" />
      
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
      <Navigation currentPage="calendar" />

      {/* Main Content */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '40px 24px'
      }}>
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Calendar View</h1>
          <p className="text-white/60 text-lg">
            View your tasks in a calendar format. Click on any task to see details.
          </p>
        </div>

        {/* Google Calendar Sync */}
        <GoogleCalendarSync 
          tasks={tasks} 
          onSyncComplete={(result) => {
            console.log('Sync completed:', result);
          }}
        />

        {/* Calendar and Task List Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar View - Takes up 2/3 on large screens */}
          <div className="lg:col-span-2">
            <CalendarView 
              tasks={getTasksWithDueDates()} 
              onTaskClick={handleTaskClick}
            />
          </div>

          {/* Task List Sidebar - Takes up 1/3 on large screens */}
          <div className="lg:col-span-1">
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span>📋</span>
                Upcoming Tasks
              </h3>
              <div className="max-h-96 overflow-y-auto">
                <TaskList tasks={getUpcomingTasks()} />
              </div>
            </div>
          </div>
        </div>

        {/* Task Details Modal */}
        {showTaskDetails && selectedTask && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closeTaskDetails}
          >
            <div 
              className="bg-black/80 backdrop-blur-xl rounded-2xl border border-white/20 p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Task Details</h3>
                <button
                  onClick={closeTaskDetails}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-white/60">Title</label>
                  <p className="text-white font-medium">{selectedTask.title}</p>
                </div>
                
                <div>
                  <label className="text-sm text-white/60">Due Date</label>
                  <p className="text-white">
                    {selectedTask.dueDate 
                      ? selectedTask.dueDate.toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })
                      : 'No due date'
                    }
                  </p>
                </div>
                
                {selectedTask.dueTime && (
                  <div>
                    <label className="text-sm text-white/60">Due Time</label>
                    <p className="text-white">{selectedTask.dueTime}</p>
                  </div>
                )}
                
                <div>
                  <label className="text-sm text-white/60">Priority</label>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    selectedTask.priority === 'High' 
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : selectedTask.priority === 'Medium'
                      ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                      : 'bg-green-500/20 text-green-300 border border-green-500/30'
                  }`}>
                    {selectedTask.priority}
                  </span>
                </div>
                
                <div>
                  <label className="text-sm text-white/60">Category</label>
                  <p className="text-white">{selectedTask.category}</p>
                </div>
                
                <div>
                  <label className="text-sm text-white/60">Status</label>
                  <p className="text-white">
                    {selectedTask.completed ? '✅ Completed' : '⏳ Pending'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
