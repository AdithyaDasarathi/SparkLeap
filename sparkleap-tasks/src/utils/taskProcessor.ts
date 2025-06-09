import { Task, Priority, TaskCategory } from '../types/task';

const SYSTEM_PROMPT = `You are a task extraction system. Your only job is to convert natural language input into structured task data. Do not engage in conversation or add any extra text.

You must respond with ONLY a JSON object and nothing else - no greeting, no explanation, no conversation.

You must return a JSON object in one of these two formats:

1. For a single task:
{
  "title": "Task title",
  "due_date": "YYYY-MM-DD",
  "priority": "High",
  "category": "Product",
  "status": "pending"
}

2. For multiple tasks:
{
  "tasks": [
    {
      "title": "Task 1",
      "due_date": "YYYY-MM-DD",
      "priority": "High",
      "category": "Product",
      "status": "pending"
    },
    {...}
  ]
}

Rules:
- title: For meetings, include the time in the title (e.g., "Meeting at 9:00 AM")
- due_date: YYYY-MM-DD format. For "tomorrow at 9", use tomorrow's date
- priority: Must be exactly "High", "Medium", or "Low". Meetings are usually "High" priority
- category: Must be exactly "Follow-up", "Product", "Hiring", or "General". Meetings are usually "Follow-up"
- status: Always "pending"

Time handling:
- For "9" or "9am" tomorrow, set due_date to tomorrow's date
- For "3pm next week", set due_date to next week's date
- Always include the time in the task title

DO NOT include any other text or explanations - only valid JSON.`;

export interface ProcessedTask {
  title: string;
  due_date: string | null;
  priority: string;
  category: string;
  status: 'pending';
}

interface GPTTaskResponse {
  title: string;
  due_date: string | null;
  priority: string;
  category: string;
  status: 'pending';
  tasks?: ProcessedTask[];
}

// Helper function to generate a stable ID on both client and server
function generateStableId(text: string): string {
  // Simple hash function that will be consistent on both server and client
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return 'task-' + Math.abs(hash).toString(16);
}

export async function processTaskInput(input: string): Promise<Task[]> {
  console.log('Processing task input:', input);
  
  // Task creation patterns
  const taskCreationPatterns = [
    // Explicit task creation commands
    /^(create|add|make|set up)\s+.*task/i,
    // Schedule-related patterns with time
    /^schedule\s+.*\s+at\s+\d{1,2}/i,
    /^remind\s+.*\s+at\s+\d{1,2}/i,
    // Meeting patterns with time
    /^(set|schedule)\s+.*meeting\s+.*\s+at\s+\d{1,2}/i,
    // Explicit time-based patterns
    /^.*\s+by\s+\d{1,2}(\s*:\s*\d{2})?\s*(am|pm)/i,
    // I have a meeting pattern
    /^i\s+have\s+a\s+meeting\s+.*\s+at\s+\d{1,2}/i,
    // Additional patterns for better task detection
    /^remind me to/i,
    /^add (a|an) (new )?appointment/i,
    /^create (a|an) (new )?reminder/i,
    /^set (a|an) (new )?deadline/i
  ];

  // Check if input matches any task creation pattern
  const isTaskCreation = taskCreationPatterns.some(pattern => pattern.test(input));
  
  // Also check for common meeting/task phrases
  const hasMeetingKeyword = /meeting|appointment|call|interview|deadline|reminder|task/i.test(input);
  const hasTimeIndicator = /\b\d{1,2}(:\d{2})?(\s*[ap]m)?\b|\btoday\b|\btomorrow\b|\bnext\s+\w+\b|\bmonday\b|\btuesday\b|\bwednesday\b|\bthursday\b|\bfriday\b|\bsaturday\b|\bsunday\b/i.test(input);
  
  console.log('Task detection:', {
    isTaskCreation,
    hasMeetingKeyword,
    hasTimeIndicator,
    isTask: isTaskCreation || (hasMeetingKeyword && hasTimeIndicator)
  });
  
  // Create a task if it matches patterns or contains both meeting keywords and time indicators
  if (!isTaskCreation && !(hasMeetingKeyword && hasTimeIndicator)) {
    console.log('Not a task creation request');
    return [];
  }

  // Extract task details from input
  let taskTitle = "";
  let dueDate = new Date();
  let category: TaskCategory = 'Follow-up';
  let priority: Priority = 'Medium';
  
  // Extract date information
  // Check for specific day patterns
  if (/tomorrow/i.test(input)) {
    dueDate.setDate(dueDate.getDate() + 1);
  } else if (/next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i.test(input)) {
    const dayMatch = input.match(/next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
    if (dayMatch) {
      const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        .indexOf(dayMatch[1].toLowerCase());
      
      // Calculate days to add
      const currentDay = dueDate.getDay();
      let daysToAdd = dayOfWeek - currentDay;
      if (daysToAdd <= 0) daysToAdd += 7; // If it's already past that day this week, go to next week
      daysToAdd += 7; // Add another week because it's "next" week
      
      dueDate.setDate(dueDate.getDate() + daysToAdd);
    }
  } else if (/(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i.test(input)) {
    const dayMatch = input.match(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
    if (dayMatch) {
      const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        .indexOf(dayMatch[1].toLowerCase());
      
      // Calculate days to add
      const currentDay = dueDate.getDay();
      let daysToAdd = dayOfWeek - currentDay;
      if (daysToAdd <= 0) daysToAdd += 7; // If it's already past that day this week, go to next week
      
      dueDate.setDate(dueDate.getDate() + daysToAdd);
    }
  }
  
  // Set default time to 9 AM
  dueDate.setHours(9, 0, 0, 0);
  
  // Extract time if specified
  const timeMatch = input.match(/(\d{1,2})(?::(\d{2}))?(\s*[AaPp][Mm])?/);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const isPM = timeMatch[3] && timeMatch[3].toLowerCase().includes('pm');
    
    if (isPM && hours < 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
    
    dueDate.setHours(hours, minutes, 0, 0);
  }
  
  // Check for priority keywords in the entire input first
  if (/low priority|not urgent|minor|low importance/i.test(input)) {
    priority = 'Low';
  } else if (/urgent|important|critical|high priority/i.test(input)) {
    priority = 'High';
  } else {
    priority = 'Medium'; // Default to Medium priority
  }

  // Extract task title
  if (/meeting|appointment|call/i.test(input)) {
    // For meetings, extract any details after "meeting" or before "at"
    const meetingMatch = input.match(/meeting\s+(?:about|with|for)?\s+([^\s]+(?:\s+[^\s]+)*?)(?:\s+at|\s+on|$)/i);
    if (meetingMatch && meetingMatch[1]) {
      taskTitle = `Meeting about ${meetingMatch[1]} on ${dueDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} at ${dueDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } else {
      taskTitle = `Meeting on ${dueDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} at ${dueDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    }
    category = 'Follow-up';
    // Priority is already set above, don't override it here
  } else {
    // For general tasks
    const taskMatch = input.match(/(?:create|add|make|set up)\s+(?:a\s+)?(?:task\s+)?(?:to\s+)?([^\s]+(?:\s+[^\s]+)*?)(?:\s+by|\s+at|\s+on|$)/i);
    if (taskMatch && taskMatch[1]) {
      taskTitle = taskMatch[1];
    } else {
      // Fallback - use the input as title but clean it up
      taskTitle = input.replace(/^(create|add|schedule|remind|i have)\s+(?:a\s+)?/i, '').replace(/\s+at\s+\d{1,2}/i, '');
    }
    
    // Set category based on keywords
    if (/work|project|report|email|document/i.test(input)) {
      category = 'Product';
    }
    
    // Priority is already set above, no need to set it again
  }
  
  // Create a stable task ID based on the input and current time to avoid hydration errors
  const stableId = generateStableId(input + taskTitle);
  
  // Format dates as ISO strings for consistency between server and client
  const formattedDueDate = new Date(dueDate.getTime());
  const now = new Date();
  
  return [{
    id: stableId,
    title: taskTitle,
    dueDate: formattedDueDate,
    category: category,
    priority: priority,
    completed: false,
    createdAt: now
  }];
}
