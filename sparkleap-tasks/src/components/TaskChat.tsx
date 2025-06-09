'use client';

import React, { useState, useEffect, ReactElement, useRef } from 'react';
import { Task } from '../types/task';
import type { Message } from '../types/message';
import { generateChatResponse } from '../utils/chatHelper';
import { processTaskInput } from '../utils/taskProcessor';
import TaskList from './TaskList';

interface TaskChatProps {
  onTaskCreate: (task: Task) => void;
  onClearTasks: () => void;
  tasks: Task[];
}

const TaskChat = ({ onTaskCreate, onClearTasks, tasks }: TaskChatProps): ReactElement => {
  // Add Inter font
  React.useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Use useEffect to set initial message to avoid hydration errors
  useEffect(() => {
    // Only set initial message on client-side to avoid hydration mismatch
    setMessages([{
      role: 'assistant',
      content: 'Hey there! 👋 I\'m here to help you manage your tasks and chat about them. What\'s on your mind?'
    }]);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleClearCommand = () => {
    onClearTasks();
    setMessages(prev => [...prev, { role: 'assistant', content: 'All tasks have been cleared! 🧹' }]);
  };

  const handleSubmit = async () => {
    if (!input.trim()) return;

    const currentInput = input;
    setInput(''); // Clear input immediately for better UX

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: currentInput
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Show typing indicator
    setIsTyping(true);
    // Ensure scroll to bottom after adding user message
    scrollToBottom();

    try {
      if (currentInput.toLowerCase() === 'clear tasks') {
        // Wait a moment to show typing indicator
        await new Promise(resolve => setTimeout(resolve, 500));
        setIsTyping(false);
        handleClearCommand();
        return;
      }

      // Process the input to check if it's a task
      console.log('Processing input for task creation:', currentInput);
      const processedTasks = await processTaskInput(currentInput);
      console.log('Processed tasks result:', processedTasks);
      
      // If tasks were created, handle them
      if (processedTasks && processedTasks.length > 0) {
        // Add tasks to the list
        processedTasks.forEach(task => {
          console.log('Creating task:', task);
          onTaskCreate(task);
        });

        // Add confirmation message after a short delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const taskCount = processedTasks.length;
        const confirmationMessage = taskCount === 1 
          ? `📝 Added task "${processedTasks[0].title}" with ${processedTasks[0].priority.toLowerCase()} priority.`
          : `📝 Added ${taskCount} tasks to your list.`;

        setIsTyping(false);
        setMessages(prev => [...prev, { role: 'assistant', content: confirmationMessage }]);
        return;
      }

      // If not a task, handle as a general message
      console.log('Generating chat response for:', currentInput);
      const aiResponse = await generateChatResponse(currentInput, tasks);
      console.log('Generated response:', aiResponse);
      
      // Add a small delay to make typing indicator more realistic
      const typingDelay = Math.min(1500, aiResponse.length * 10);
      await new Promise(resolve => setTimeout(resolve, typingDelay));
      
      // Replace typing indicator with actual response
      setIsTyping(false);
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
    } catch (error) {
      console.error('Error handling message:', error);
      // Replace typing indicator with error message after a short delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsTyping(false);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="chat-container">
      {/* Chat messages */}
      <div className="messages-container">
        <div className="max-w-4xl mx-auto">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`chat-message-container ${message.role === 'user' ? 'chat-message-user' : 'chat-message-assistant'}`}
            >
              <div className={`chat-bubble ${message.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'}`}>
                <div className="message-content">
                  {message.content.split(/\*\*(.+?)\*\*/).map((part, i) => 
                    i % 2 === 0 ? part : <strong key={i}>{part}</strong>
                  )}
                </div>
              </div>
              
              <div className={`chat-avatar ${message.role === 'user' ? 'chat-avatar-user' : 'chat-avatar-assistant'}`}>
                {message.role === 'user' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                    <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                  </svg>
                )}
              </div>
            </div>
          ))}
          
          {/* Typing indicator */}
          {isTyping && (
            <div className="chat-message-container chat-message-assistant">
              <div className="typing-indicator">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
              <div className="chat-avatar chat-avatar-assistant">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                  <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                </svg>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} className="h-1" />
        </div>
      </div>

      {/* Task list */}
      {tasks.length > 0 && (
        <div className="border-t border-gray-200 bg-white shadow-sm">
          <div className="max-w-4xl mx-auto py-5 px-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Your Tasks</h2>
            <TaskList tasks={tasks} />
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="input-container">
        <div className="max-w-4xl mx-auto w-full">
          <div className="flex items-center">
            <div className="relative flex-grow">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message or create a task..."
                className="chat-input w-full"
                ref={inputRef}
              />
            </div>
            <button
              onClick={handleSubmit}
              className="send-button flex-shrink-0"
              aria-label="Send message"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskChat;
