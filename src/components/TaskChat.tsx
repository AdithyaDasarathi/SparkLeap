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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: '500px',
      maxHeight: '80vh',
      background: 'transparent',
      overflow: 'hidden'
    }}>
      {/* Chat messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0 0 20px 0',
        minHeight: 0
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 16px' }}>
          {messages.map((message, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                marginBottom: '16px',
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                alignItems: 'flex-start',
                gap: '12px'
              }}
            >
              {message.role === 'assistant' && (
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f97316, #dc2626)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '4px'
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '16px', height: '16px', color: '#000000' }} viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                    <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                  </svg>
                </div>
              )}
              
              <div style={{
                maxWidth: '70%',
                padding: '12px 16px',
                borderRadius: message.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: message.role === 'user' 
                  ? 'linear-gradient(135deg, #f97316, #dc2626)'
                  : 'rgba(255, 255, 255, 0.1)',
                color: message.role === 'user' ? '#000000' : '#ffffff',
                border: message.role === 'assistant' ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                backdropFilter: 'blur(10px)',
                fontSize: '14px',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap'
              }}>
                {message.content.split(/\*\*(.+?)\*\*/).map((part, i) => 
                  i % 2 === 0 ? part : <strong key={i} style={{ fontWeight: '600' }}>{part}</strong>
                )}
              </div>

              {message.role === 'user' && (
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '4px'
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '16px', height: '16px', color: '#ffffff' }} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          ))}
          
          {/* Typing indicator */}
          {isTyping && (
            <div style={{
              display: 'flex',
              marginBottom: '16px',
              justifyContent: 'flex-start',
              alignItems: 'flex-start',
              gap: '12px'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #f97316, #dc2626)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '4px'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '16px', height: '16px', color: '#000000' }} viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                  <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                </svg>
              </div>
              <div style={{
                padding: '12px 16px',
                borderRadius: '18px 18px 18px 4px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                gap: '4px',
                alignItems: 'center'
              }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  animation: 'pulse 1.4s ease-in-out infinite both'
                }} />
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  animation: 'pulse 1.4s ease-in-out infinite both',
                  animationDelay: '0.2s'
                }} />
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  animation: 'pulse 1.4s ease-in-out infinite both',
                  animationDelay: '0.4s'
                }} />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} style={{ height: '4px' }} />
        </div>
      </div>

      {/* Task list */}
      {tasks.length > 0 && (
        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(255, 255, 255, 0.02)',
          padding: '24px 0'
        }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 16px' }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#ffffff',
              marginBottom: '16px',
              background: 'linear-gradient(135deg, #ffffff, #f97316)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>Your Tasks</h2>
            <TaskList tasks={tasks} />
          </div>
        </div>
      )}

      {/* Input area */}
      <div style={{
        padding: '20px 0 0 0',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message or create a task..."
                ref={inputRef}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '24px',
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
              onClick={handleSubmit}
              aria-label="Send message"
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #f97316, #dc2626)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                const target = e.target as HTMLButtonElement;
                target.style.transform = 'scale(1.05)';
                target.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.4)';
              }}
              onMouseLeave={(e) => {
                const target = e.target as HTMLButtonElement;
                target.style.transform = 'scale(1)';
                target.style.boxShadow = 'none';
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '20px', height: '20px', color: '#000000' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
