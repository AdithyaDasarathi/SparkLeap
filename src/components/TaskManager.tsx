"use client";

import { useState } from 'react';

interface TaskManagerProps {
  sourceId: string | null;
}

export default function TaskManager({ sourceId }: TaskManagerProps) {
  const [taskTitle, setTaskTitle] = useState('');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [goalCategory, setGoalCategory] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateTask = async () => {
    if (!sourceId) {
      setMessage('Please connect to Notion first');
      return;
    }

    if (!taskTitle.trim()) {
      setMessage('Please enter a task title');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/notion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'demo-user',
          sourceId,
          action: 'createTask',
          title: taskTitle,
          priority,
          goalCategory: goalCategory || undefined,
          dueDate: dueDate || undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setMessage('✅ Task created successfully in Notion!');
          setTaskTitle('');
          setPriority('Medium');
          setGoalCategory('');
          setDueDate('');
        } else {
          setMessage('❌ Failed to create task');
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        setMessage(`❌ Error: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    setLoading(false);
  };

  if (!sourceId) {
    return null;
  }

  return (
    <div style={{
      marginTop: '24px',
      padding: '20px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(10px)'
    }}>
      <h3 style={{
        fontSize: '18px',
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: '20px',
        background: 'linear-gradient(135deg, #ffffff, #f97316)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>Create New Task</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#ffffff',
            marginBottom: '8px'
          }}>Task Title *</label>
          <input
            type="text"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#ffffff',
              fontSize: '14px',
              outline: 'none',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(16, 185, 129, 0.5)';
              e.target.style.background = 'rgba(255, 255, 255, 0.08)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              e.target.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
            placeholder="Enter task title..."
          />
        </div>

        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#ffffff',
            marginBottom: '8px'
          }}>Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as 'High' | 'Medium' | 'Low')}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#ffffff',
              fontSize: '14px',
              outline: 'none',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(16, 185, 129, 0.5)';
              e.target.style.background = 'rgba(255, 255, 255, 0.08)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              e.target.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
          >
            <option value="High" style={{ background: '#1f2937', color: '#ffffff' }}>High</option>
            <option value="Medium" style={{ background: '#1f2937', color: '#ffffff' }}>Medium</option>
            <option value="Low" style={{ background: '#1f2937', color: '#ffffff' }}>Low</option>
          </select>
        </div>

        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#ffffff',
            marginBottom: '8px'
          }}>Goal Category</label>
          <input
            type="text"
            value={goalCategory}
            onChange={(e) => setGoalCategory(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#ffffff',
              fontSize: '14px',
              outline: 'none',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(16, 185, 129, 0.5)';
              e.target.style.background = 'rgba(255, 255, 255, 0.08)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              e.target.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
          />
        </div>

        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#ffffff',
            marginBottom: '8px'
          }}>Due Date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#ffffff',
              fontSize: '14px',
              outline: 'none',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(16, 185, 129, 0.5)';
              e.target.style.background = 'rgba(255, 255, 255, 0.08)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              e.target.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
          />
        </div>

        <button
          onClick={handleCreateTask}
          disabled={loading || !taskTitle.trim()}
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            background: loading || !taskTitle.trim() 
              ? 'rgba(107, 114, 128, 0.5)' 
              : 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: '#ffffff',
            border: 'none',
            fontSize: '14px',
            fontWeight: '600',
            cursor: loading || !taskTitle.trim() ? 'not-allowed' : 'pointer',
            opacity: loading || !taskTitle.trim() ? 0.6 : 1,
            transition: 'all 0.3s ease',
            boxShadow: loading || !taskTitle.trim() 
              ? 'none' 
              : '0 4px 12px rgba(59, 130, 246, 0.3)'
          }}
          onMouseEnter={(e) => {
            if (!loading && taskTitle.trim()) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading && taskTitle.trim()) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
            }
          }}
        >
          {loading ? 'Creating...' : 'Create Task in Notion'}
        </button>

        {message && (
          <div style={{
            marginTop: '12px',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            background: message.includes('✅') 
              ? 'rgba(34, 197, 94, 0.1)'
              : message.includes('❌') 
              ? 'rgba(239, 68, 68, 0.1)'
              : 'rgba(59, 130, 246, 0.1)',
            color: message.includes('✅') 
              ? '#4ade80'
              : message.includes('❌') 
              ? '#fca5a5'
              : '#60a5fa',
            border: message.includes('✅') 
              ? '1px solid rgba(34, 197, 94, 0.2)'
              : message.includes('❌') 
              ? '1px solid rgba(239, 68, 68, 0.2)'
              : '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
} 