'use client';

import { useState } from 'react';
import { parseTaskInput } from '@/utils/taskParser';
import { Task } from '@/types/task';

interface TaskChatProps {
  onTaskCreate: (task: Task) => void;
}

export default function TaskChat({ onTaskCreate }: TaskChatProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{text: string, isAi: boolean}[]>([
    { text: "Hi! What task can I help you with today?", isAi: true },
    { text: "Try something like: 'Follow up with investors next Monday at 2pm (high priority)' or 'Review product roadmap by Friday afternoon (low priority)'.", isAi: true }
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { text: input, isAi: false }]);

    // Parse the input
    const { title, dueDate, dueTime, category, priority } = parseTaskInput(input);

    // Create the task
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      dueDate,
      dueTime: dueTime || undefined,
      category,
      priority,
      completed: false,
      createdAt: new Date()
    };

    // Add AI response
    setMessages(prev => [...prev, {
      text: `I've created a ${priority.toLowerCase()} priority task: "${title}"${dueDate ? ` due on ${dueDate.toLocaleDateString()}${dueTime ? ` at ${dueTime}` : ''}` : ''}.`,
      isAi: true
    }]);

    // Create the task
    onTaskCreate(newTask);

    // Clear input
    setInput('');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
      <div className="space-y-4">
        {messages.map((message, index) => (
          <div key={index} className={`flex items-start ${message.isAi ? '' : 'justify-end'}`}>
            <div className={`flex items-start gap-3 max-w-[80%] ${message.isAi ? '' : 'flex-row-reverse'}`}>
              {message.isAi && (
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white text-sm">AI</span>
                  </div>
                </div>
              )}
              <div className={`rounded-lg px-4 py-2 ${message.isAi ? 'bg-gray-100 text-black' : 'bg-blue-500 text-white'}`}>
                <p className="text-sm font-medium">{message.text}</p>
              </div>
            </div>
          </div>
        ))}
        <form onSubmit={handleSubmit} className="mt-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"
            placeholder="Type your task here..."
          />
        </form>
      </div>
    </div>
  );
}
