import React from 'react';
import { Task } from '../types/task';

interface TaskListProps {
  tasks: Task[];
}

const TaskList: React.FC<TaskListProps> = ({ tasks }) => {
  // Format date and time in a nice way
  const formatDateTime = (date: Date | null) => {
    if (!date) return '';
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    
    const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    
    if (isToday) {
      return `Today at ${time}`;
    } else if (isTomorrow) {
      return `Tomorrow at ${time}`;
    } else {
      // For dates within the next 6 days, show day name
      const dayDiff = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (dayDiff < 6) {
        return `${date.toLocaleDateString('en-US', { weekday: 'long' })} at ${time}`;
      }
      // Otherwise show month and day
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ` at ${time}`;
    }
  };
  
  // Get priority styling
  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'High':
        return {
          background: 'rgba(239, 68, 68, 0.1)',
          color: '#fca5a5',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          icon: '🔴'
        };
      case 'Medium':
        return {
          background: 'rgba(245, 158, 11, 0.1)',
          color: '#fbbf24',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          icon: '🟡'
        };
      case 'Low':
        return {
          background: 'rgba(34, 197, 94, 0.1)',
          color: '#4ade80',
          border: '1px solid rgba(34, 197, 94, 0.2)',
          icon: '🟢'
        };
      default:
        return {
          background: 'rgba(156, 163, 175, 0.1)',
          color: '#9ca3af',
          border: '1px solid rgba(156, 163, 175, 0.2)',
          icon: '⚪'
        };
    }
  };

  // Group tasks by category and status
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const groupedTasks = tasks.reduce((acc, task) => {
    if (task.completed) {
      acc.completed.push(task);
    } else if (task.dueDate) {
      if (task.dueDate < startOfDay) {
        acc.overdue.push(task);
      } else if (task.dueDate < endOfDay) {
        acc.today.push(task);
      } else {
        acc.upcoming.push(task);
      }
    } else {
      acc.upcoming.push(task);
    }
    return acc;
  }, {
    overdue: [] as Task[],
    today: [] as Task[],
    upcoming: [] as Task[],
    completed: [] as Task[]
  });

  // Sort each group by priority and due date
  const sortByPriorityAndDate = (a: Task, b: Task) => {
    const priorityOrder = { High: 0, Medium: 1, Low: 2 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.getTime() - b.dueDate.getTime();
  };

  Object.values(groupedTasks).forEach(group => group.sort(sortByPriorityAndDate));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Overdue Tasks */}
      {groupedTasks.overdue.length > 0 && (
        <div>
          <h3 style={{
            color: '#fca5a5',
            fontWeight: '600',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            fontSize: '16px'
          }}>
            <span style={{ marginRight: '8px' }}>⚠️</span>
            <span>Overdue ({groupedTasks.overdue.length})</span>
          </h3>
          <div style={{
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '12px',
            overflow: 'hidden',
            background: 'rgba(239, 68, 68, 0.05)',
            backdropFilter: 'blur(10px)'
          }}>
            <div>
              {groupedTasks.overdue.map((task: Task, index: number) => {
                const style = getPriorityStyle(task.priority);
                return (
                  <div key={task.id} style={{
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: index < groupedTasks.overdue.length - 1 ? '1px solid rgba(239, 68, 68, 0.1)' : 'none',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontWeight: '500',
                        color: '#fca5a5',
                        marginBottom: '4px',
                        fontSize: '14px'
                      }}>{task.title}</div>
                      <div style={{
                        fontSize: '12px',
                        color: '#f87171'
                      }}>{formatDateTime(task.dueDate)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        background: style.background,
                        color: style.color,
                        border: style.border
                      }}>
                        <span style={{ marginRight: '4px' }}>{style.icon}</span>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Today's Tasks */}
      {groupedTasks.today.length > 0 && (
        <div>
          <h3 style={{
            color: '#60a5fa',
            fontWeight: '600',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            fontSize: '16px'
          }}>
            <span style={{ marginRight: '8px' }}>📅</span>
            <span>Today ({groupedTasks.today.length})</span>
          </h3>
          <div style={{
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '12px',
            overflow: 'hidden',
            background: 'rgba(59, 130, 246, 0.05)',
            backdropFilter: 'blur(10px)'
          }}>
            <div>
              {groupedTasks.today.map((task: Task, index: number) => {
                const style = getPriorityStyle(task.priority);
                return (
                  <div key={task.id} style={{
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: index < groupedTasks.today.length - 1 ? '1px solid rgba(59, 130, 246, 0.1)' : 'none',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontWeight: '500',
                        color: '#ffffff',
                        marginBottom: '4px',
                        fontSize: '14px'
                      }}>{task.title}</div>
                      <div style={{
                        fontSize: '12px',
                        color: 'rgba(255, 255, 255, 0.6)'
                      }}>{formatDateTime(task.dueDate)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        background: style.background,
                        color: style.color,
                        border: style.border
                      }}>
                        <span style={{ marginRight: '4px' }}>{style.icon}</span>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Tasks */}
      {groupedTasks.upcoming.length > 0 && (
        <div>
          <h3 style={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontWeight: '600',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            fontSize: '16px'
          }}>
            <span style={{ marginRight: '8px' }}>🔜</span>
            <span>Upcoming ({groupedTasks.upcoming.length})</span>
          </h3>
          <div style={{
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            overflow: 'hidden',
            background: 'rgba(255, 255, 255, 0.02)',
            backdropFilter: 'blur(10px)'
          }}>
            <div>
              {groupedTasks.upcoming.map((task: Task, index: number) => {
                const style = getPriorityStyle(task.priority);
                return (
                  <div key={task.id} style={{
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: index < groupedTasks.upcoming.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontWeight: '500',
                        color: '#ffffff',
                        marginBottom: '4px',
                        fontSize: '14px'
                      }}>{task.title}</div>
                      <div style={{
                        fontSize: '12px',
                        color: 'rgba(255, 255, 255, 0.6)'
                      }}>{formatDateTime(task.dueDate)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        background: style.background,
                        color: style.color,
                        border: style.border
                      }}>
                        <span style={{ marginRight: '4px' }}>{style.icon}</span>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Completed Tasks */}
      {groupedTasks.completed.length > 0 && (
        <div>
          <h3 style={{
            color: '#4ade80',
            fontWeight: '600',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            fontSize: '16px'
          }}>
            <span style={{ marginRight: '8px' }}>✅</span>
            <span>Completed ({groupedTasks.completed.length})</span>
          </h3>
          <div style={{
            border: '1px solid rgba(34, 197, 94, 0.2)',
            borderRadius: '12px',
            overflow: 'hidden',
            background: 'rgba(34, 197, 94, 0.05)',
            backdropFilter: 'blur(10px)'
          }}>
            <div>
              {groupedTasks.completed.map((task: Task, index: number) => (
                <div key={task.id} style={{
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: index < groupedTasks.completed.length - 1 ? '1px solid rgba(34, 197, 94, 0.1)' : 'none',
                  opacity: 0.6,
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(34, 197, 94, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: '500',
                      color: '#4ade80',
                      marginBottom: '4px',
                      fontSize: '14px',
                      textDecoration: 'line-through'
                    }}>{task.title}</div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6ee7b7'
                    }}>{task.dueDate ? formatDateTime(task.dueDate) : 'No due date'}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      background: 'rgba(156, 163, 175, 0.1)',
                      color: '#9ca3af',
                      border: '1px solid rgba(156, 163, 175, 0.2)'
                    }}>
                      {task.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No tasks message */}
      {tasks.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '32px 0',
          color: 'rgba(255, 255, 255, 0.6)'
        }}>
          <p style={{ fontSize: '18px', marginBottom: '8px' }}>No tasks yet</p>
          <p style={{ fontSize: '14px' }}>Start by typing a task in the chat box below</p>
        </div>
      )}
    </div>
  );
};

export default TaskList;
