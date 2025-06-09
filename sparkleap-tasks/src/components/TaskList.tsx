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
    <div className="space-y-6">
      {/* Overdue Tasks */}
      {groupedTasks.overdue.length > 0 && (
        <div>
          <h3 className="text-red-600 font-semibold mb-3 flex items-center">
            <span className="mr-2">⚠️</span>
            <span>Overdue ({groupedTasks.overdue.length})</span>
          </h3>
          <div className="border border-red-200 rounded-lg overflow-hidden bg-white shadow-sm">
            <div className="divide-y divide-red-100">
              {groupedTasks.overdue.map((task: Task, index: number) => {
                const style = getPriorityStyle(task.priority);
                return (
                  <div key={task.id} className={`p-3 ${style.hover} flex items-center justify-between`}>
                    <div className="flex-1">
                      <div className="font-medium text-red-700 mb-1">{task.title}</div>
                      <div className="text-xs text-red-500">{formatDateTime(task.dueDate)}</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text} border ${style.border}`}>
                        <span className="mr-1">{style.icon}</span>
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
          <h3 className="text-blue-600 font-semibold mb-3 flex items-center">
            <span className="mr-2">📅</span>
            <span>Today ({groupedTasks.today.length})</span>
          </h3>
          <div className="border border-blue-100 rounded-lg overflow-hidden bg-white shadow-sm">
            <div className="divide-y divide-gray-100">
              {groupedTasks.today.map((task: Task, index: number) => {
                const style = getPriorityStyle(task.priority);
                return (
                  <div key={task.id} className={`p-3 ${style.hover} flex items-center justify-between`}>
                    <div className="flex-1">
                      <div className="font-medium text-black mb-1">{task.title}</div>
                      <div className="text-xs text-gray-500">{formatDateTime(task.dueDate)}</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text} border ${style.border}`}>
                        <span className="mr-1">{style.icon}</span>
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
          <h3 className="text-gray-700 font-semibold mb-3 flex items-center">
            <span className="mr-2">🔜</span>
            <span>Upcoming ({groupedTasks.upcoming.length})</span>
          </h3>
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
            <div className="divide-y divide-gray-100">
              {groupedTasks.upcoming.map((task: Task, index: number) => {
                const style = getPriorityStyle(task.priority);
                return (
                  <div key={task.id} className={`p-3 ${style.hover} flex items-center justify-between`}>
                    <div className="flex-1">
                      <div className="font-medium text-black mb-1">{task.title}</div>
                      <div className="text-xs text-gray-500">{formatDateTime(task.dueDate)}</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text} border ${style.border}`}>
                        <span className="mr-1">{style.icon}</span>
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
          <h3 className="text-green-600 font-semibold mb-3 flex items-center">
            <span className="mr-2">✅</span>
            <span>Completed ({groupedTasks.completed.length})</span>
          </h3>
          <div className="border border-green-100 rounded-lg overflow-hidden bg-white shadow-sm">
            <div className="divide-y divide-gray-100">
              {groupedTasks.completed.map((task: Task, index: number) => (
                <div key={task.id} className="p-3 hover:bg-green-50 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-500 line-through mb-1">{task.title}</div>
                    <div className="text-xs text-gray-400">{task.dueDate ? formatDateTime(task.dueDate) : 'No due date'}</div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
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
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg">No tasks yet</p>
          <p className="text-sm mt-2">Start by typing a task in the chat box below</p>
        </div>
      )}
    </div>
  );
};

export default TaskList;
