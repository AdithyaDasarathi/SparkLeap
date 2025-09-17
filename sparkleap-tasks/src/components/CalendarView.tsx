'use client';

import React, { useState, useMemo } from 'react';
import { Task } from '../types/task';

interface CalendarViewProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ tasks, onTaskClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const startOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  };

  const endOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return {
          background: 'rgba(239, 68, 68, 0.2)',
          color: '#fca5a5',
          border: '1px solid rgba(239, 68, 68, 0.3)'
        };
      case 'Medium':
        return {
          background: 'rgba(245, 158, 11, 0.2)',
          color: '#fbbf24',
          border: '1px solid rgba(245, 158, 11, 0.3)'
        };
      case 'Low':
        return {
          background: 'rgba(34, 197, 94, 0.2)',
          color: '#4ade80',
          border: '1px solid rgba(34, 197, 94, 0.3)'
        };
      default:
        return {
          background: 'rgba(156, 163, 175, 0.2)',
          color: '#9ca3af',
          border: '1px solid rgba(156, 163, 175, 0.3)'
        };
    }
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => 
      task.dueDate && 
      task.dueDate.toDateString() === date.toDateString()
    );
  };

  const calendarDays = useMemo(() => {
    const first = startOfMonth(currentDate);
    const last = endOfMonth(currentDate);
    const leading = (first.getDay() + 6) % 7; // Make Monday=0
    const total = leading + last.getDate();
    const rows = Math.ceil(total / 7);
    const cells: Array<{ date: Date | null; tasks: Task[] }> = [];
    
    for (let i = 0; i < rows * 7; i++) {
      const dayIndex = i - leading + 1;
      if (dayIndex < 1 || dayIndex > last.getDate()) {
        cells.push({ date: null, tasks: [] });
      } else {
        const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayIndex);
        const tasksForDate = getTasksForDate(d);
        cells.push({ date: d, tasks: tasksForDate });
      }
    }
    return cells;
  }, [currentDate, tasks]);

  // Calculate number of rows to evenly space calendar cells
  const rowsCount = useMemo(() => {
    const first = startOfMonth(currentDate);
    const last = endOfMonth(currentDate);
    const leading = (first.getDay() + 6) % 7;
    const total = leading + last.getDate();
    return Math.ceil(total / 7);
  }, [currentDate]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <div style={{
      width: '100%',
      background: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(20px)',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      padding: '24px'
    }}>
      {/* Calendar Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px'
      }}>
        <button
          onClick={() => navigateMonth('prev')}
          style={{
            padding: '8px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#ffffff',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#ffffff',
          margin: 0
        }}>
          {currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}
        </h2>
        
        <button
          onClick={() => navigateMonth('next')}
          style={{
            padding: '8px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#ffffff',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day Headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '4px',
        marginBottom: '8px'
      }}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <div key={day} style={{
            padding: '12px',
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: '600',
            color: 'rgba(255, 255, 255, 0.6)'
          }}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gridTemplateRows: `repeat(${rowsCount}, 1fr)`,
        gap: '4px',
        // Give the grid a consistent height so rows can distribute evenly
        minHeight: '520px',
        height: '60vh'
      }}>
        {calendarDays.map((cell, idx) => (
          <div
            key={idx}
            style={{
              // Let the grid row height control the cell height
              height: '100%',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '8px',
              border: cell.date 
                ? isToday(cell.date)
                  ? '1px solid rgba(249, 115, 22, 0.5)'
                  : isPast(cell.date)
                  ? '1px solid rgba(255, 255, 255, 0.05)'
                  : '1px solid rgba(255, 255, 255, 0.1)'
                : '1px solid transparent',
              background: cell.date 
                ? isToday(cell.date)
                  ? 'rgba(249, 115, 22, 0.1)'
                  : isPast(cell.date)
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(255, 255, 255, 0.05)'
                : 'transparent',
              transition: 'all 0.2s ease',
              cursor: cell.date ? 'pointer' : 'default'
            }}
            onMouseEnter={(e) => {
              if (cell.date && !isPast(cell.date)) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (cell.date && !isPast(cell.date)) {
                e.currentTarget.style.background = isToday(cell.date) 
                  ? 'rgba(249, 115, 22, 0.1)' 
                  : 'rgba(255, 255, 255, 0.05)';
              }
            }}
          >
            {cell.date && (
              <>
                <div style={{
                  padding: '8px',
                  textAlign: 'right',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: isToday(cell.date) 
                    ? '#fb923c' 
                    : isPast(cell.date)
                    ? 'rgba(255, 255, 255, 0.4)'
                    : '#ffffff'
                }}>
                  {cell.date.getDate()}
                </div>
                
                <div style={{ padding: '0 8px', flex: 1, overflowY: 'auto' }}>
                  {cell.tasks.slice(0, 3).map(task => {
                    const priorityStyle = getPriorityColor(task.priority);
                    return (
                      <div
                        key={task.id}
                        style={{
                          fontSize: '12px',
                          padding: '4px 8px',
                          marginBottom: '4px',
                          borderRadius: '4px',
                          background: priorityStyle.background,
                          color: priorityStyle.color,
                          border: priorityStyle.border,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        onClick={() => onTaskClick?.(task)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                        title={`${task.title} - ${task.priority} priority`}
                      >
                        <div style={{ fontWeight: '500' }}>{task.title}</div>
                        {task.dueTime && (
                          <div style={{ fontSize: '10px', opacity: 0.75 }}>{task.dueTime}</div>
                        )}
                      </div>
                    );
                  })}
                  
                  {cell.tasks.length > 3 && (
                    <div style={{
                      fontSize: '12px',
                      color: 'rgba(255, 255, 255, 0.5)',
                      padding: '4px 8px'
                    }}>
                      +{cell.tasks.length - 3} more
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{
        marginTop: '24px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        justifyContent: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '4px',
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}></div>
          <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>High Priority</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '4px',
            background: 'rgba(245, 158, 11, 0.2)',
            border: '1px solid rgba(245, 158, 11, 0.3)'
          }}></div>
          <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Medium Priority</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '4px',
            background: 'rgba(34, 197, 94, 0.2)',
            border: '1px solid rgba(34, 197, 94, 0.3)'
          }}></div>
          <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Low Priority</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;