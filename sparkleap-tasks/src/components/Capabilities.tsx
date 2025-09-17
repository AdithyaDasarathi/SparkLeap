'use client';

import { useEffect, useState } from 'react';
import KPIDashboard from './KPIDashboard';
import TaskList from './TaskList';
import TaskChat from './TaskChat';
import CalendarDemo from './CalendarDemo';
import InviteDemo from './InviteDemo';

const items = [
  {
    key: 'team',
    title: 'Invite Your Team Members',
    description:
      'Collaborate with your cofounders and teammates. Share dashboards, assign tasks, and review progress together.',
    icon: '👥',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    key: 'goals',
    title: 'Create Your Goals',
    description:
      "Define where you're going — and why. Set strategic goals that align your projects, tasks, and metrics toward real growth.",
    icon: '🎯',
    gradient: 'from-emerald-500 to-green-500'
  },
  {
    key: 'projects',
    title: 'Create Projects',
    description:
      'Group related tasks, campaigns, and experiments. Keep execution organized and outcomes measurable.',
    icon: '📁',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    key: 'schedule',
    title: 'Smart Scheduling',
    description:
      'Auto-prioritize tasks by impact and due dates. SparkLeap helps you spend time where it matters most.',
    icon: '📅',
    gradient: 'from-orange-500 to-red-500'
  },
  {
    key: 'tasks',
    title: 'Create Tasks',
    description:
      'Capture work quickly from chat or templates. Close the loop with accountable, trackable action.',
    icon: '✅',
    gradient: 'from-indigo-500 to-blue-500'
  },
] as const;

export default function Capabilities() {
  const [active, setActive] = useState(1);
  const [animatedIn, setAnimatedIn] = useState(true);

  // Trigger a quick fade/slide animation whenever the active item changes
  useEffect(() => {
    setAnimatedIn(false);
    const id = requestAnimationFrame(() => setAnimatedIn(true));
    return () => cancelAnimationFrame(id);
  }, [active]);

  const [demoTasks, setDemoTasks] = useState<any[]>([
    { id: 't1', title: 'Launch our MVP', completed: false, priority: 'High', category: 'Product', createdAt: new Date(), dueDate: new Date(Date.now() + 86400000) },
    { id: 't2', title: 'Plan marketing campaign', completed: false, priority: 'Medium', category: 'Marketing', createdAt: new Date(), dueDate: new Date(Date.now() + 3*86400000) },
    { id: 't3', title: 'Reply to customer tickets', completed: true, priority: 'Low', category: 'Support', createdAt: new Date(), dueDate: new Date(Date.now() - 86400000) },
  ]);

  return (
    <section style={{
      position: 'relative',
      zIndex: 10,
      padding: '80px 24px',
      background: 'linear-gradient(135deg, rgba(12, 12, 14, 0.8), rgba(20, 20, 25, 0.9))',
      backdropFilter: 'blur(20px)'
    }}>
      <div style={{
        maxWidth: '1152px',
        margin: '0 auto'
      }}>
        <h3 style={{
          textAlign: 'center',
          fontSize: 'clamp(24px, 4vw, 36px)',
          fontWeight: '700',
          marginBottom: '60px',
          background: 'linear-gradient(135deg, #ffffff, #f97316, #dc2626)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>What You Can Do With Us</h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '40px',
          alignItems: 'start'
        }}>
          {/* Left list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {items.map((item, idx) => {
              const isActive = idx === active;
              return (
                <button
                  key={item.title}
                  onClick={() => setActive(idx)}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                    width: '100%',
                    padding: '20px',
                    borderRadius: '16px',
                    border: isActive ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                    background: isActive 
                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))'
                      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
                    backdropFilter: 'blur(10px)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    textAlign: 'left',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      e.target.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04))';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      e.target.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))';
                    }
                  }}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      height: '100%',
                      width: '4px',
                      background: 'linear-gradient(135deg, #f97316, #dc2626)',
                      borderRadius: '0 4px 4px 0'
                    }} />
                  )}
                  
                  {/* Icon */}
                  <div style={{
                    fontSize: '24px',
                    marginTop: '4px',
                    filter: isActive ? 'none' : 'grayscale(0.3)',
                    transition: 'all 0.3s ease'
                  }}>
                    {item.icon}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#ffffff',
                      marginBottom: '8px',
                      background: isActive 
                        ? 'linear-gradient(135deg, #ffffff, #f97316)'
                        : 'none',
                      WebkitBackgroundClip: isActive ? 'text' : 'initial',
                      WebkitTextFillColor: isActive ? 'transparent' : '#ffffff',
                      backgroundClip: isActive ? 'text' : 'initial'
                    }}>
                      {item.title}
                    </div>
                    {isActive && (
                      <p style={{
                        fontSize: '14px',
                        color: 'rgba(255, 255, 255, 0.8)',
                        lineHeight: '1.5',
                        margin: 0,
                        animation: 'fadeIn 0.3s ease-out'
                      }}>
                        {item.description}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right preview */}
          <div style={{
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
            backdropFilter: 'blur(20px)',
            padding: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Preview header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              paddingBottom: '16px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h4 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#ffffff',
                margin: 0
              }}>
                {items[active].title}
              </h4>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #f97316, #dc2626)',
                animation: 'pulse 2s ease-in-out infinite'
              }} />
            </div>

            {/* Preview content */}
            <div style={{
              position: 'relative',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(0, 0, 0, 0.3)',
              overflow: 'auto',
              minHeight: '400px',
              maxHeight: '600px'
            }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                transform: animatedIn ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(10px)',
                opacity: animatedIn ? 1 : 0,
                transition: 'all 0.4s ease-out',
                padding: '16px'
              }}>
                {active === 0 && (
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '8px' }}>
                    <InviteDemo />
                  </div>
                )}
                {active === 1 && <KPIDashboard userId="demo-user" />}
                {active === 2 && (
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '8px' }}>
                    <TaskList tasks={demoTasks as any} />
                  </div>
                )}
                {active === 3 && (
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '8px' }}>
                    <CalendarDemo tasks={demoTasks as any} />
                  </div>
                )}
                {active === 4 && (
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '8px' }}>
                    <TaskChat 
                      onTaskCreate={(task: any) => setDemoTasks((prev) => [...prev, task])}
                      onClearTasks={() => setDemoTasks([])}
                      tasks={demoTasks as any} 
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}