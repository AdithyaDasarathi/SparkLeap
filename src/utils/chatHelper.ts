// chatHelper.ts
import { Task } from '../types/task';
import { Message } from '../types/message';

// Regular expressions for identifying important text patterns
const IMPORTANT_PATTERNS = [
  // Dates and times
  /\b(?:today|tomorrow|yesterday|next week|next month|\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)\b/gi,
  // Numbers with context
  /\b(?:\d+\s+(?:tasks?|items?|events?|deadlines?|days?|weeks?|months?))\b/gi,
  // Priority levels
  /\b(?:high|medium|low)\s+priority\b/gi,
  // Status words
  /\b(?:completed|pending|overdue|upcoming|today's)\s+tasks?\b/gi,
  // Key action verbs
  /\b(?:remember to|don't forget to|must|should|need to|important to)\b/gi,
  // Task categories
  /\b(?:Overdue|Today|Upcoming|Completed)\b(?=:)/g
];

interface ResponseContext {
  tasks: Task[];
  hasOverdueTasks: boolean;
  hasTodayTasks: boolean;
  hasUpcomingTasks: boolean;
  totalTasks: number;
  completedTasks: number;
}

import { callChatApi } from './openai';

// Helper function to perform web search and format results
async function performWebSearch(query: string): Promise<string> {
  try {
    console.log('Performing web search for:', query);
    
    // Check if window.search_web is available (client-side)
    if (typeof window !== 'undefined' && window.search_web) {
      console.log('Using window.search_web for search');
      try {
        // Get the search results
        const searchResults = await window.search_web({ query });
        
        // Check if we have valid search results
        if (Array.isArray(searchResults) && searchResults.length > 0) {
          // Format search results with emojis and bold text
          let response = '• 🔍 **Here\'s what I found about your question:**\n\n';
          
          // Process each search result
          searchResults.forEach((result) => {
            if (result.title === 'Error') {
              // Handle error results
              response += `• ⚠️ ${result.summary || 'An error occurred during search.'}\n\n`;
            } else {
              // Format normal results
              response += `• 📄 **${result.title}**: ${result.summary || 'No summary available.'}\n\n`;
              if (result.url) {
                response += `  🔗 [More information](${result.url})\n\n`;
              }
            }
          });
          
          response += '• 💡 **Note**: These results are based on available information. Let me know if you need more specific details!';
          return response;
        }
      } catch (searchError) {
        console.error('Error using window.search_web:', searchError);
      }
    } else {
      console.log('window.search_web not available, using fallback');
    }
    
    // Fallback to simulated results if window.search_web is not available or fails
    const searchResults = [
      { title: 'Search Result', snippet: 'I found some information related to your query, but I\'m currently operating in offline mode.' },
    ];
    
    // Format search results with emojis and bold text
    let response = '• 🔍 **Here\'s what I found about your question:**\n\n';
    searchResults.forEach((result) => {
      response += `• 📄 **${result.title}**: ${result.snippet}\n\n`;
    });
    response += '• 💡 **Note**: For more detailed information, please ensure you\'re connected to the internet.';
    
    return response;
  } catch (error) {
    console.error('Error performing web search:', error);
    return '• 🔍 I tried to search for information about your question, but encountered an error.\n\n• 💡 Please try asking in a different way or check back later.';
  }
}

function getTaskContext(tasks: Task[]): ResponseContext {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueTasks = tasks.filter(task =>
    !task.completed && task.dueDate && new Date(task.dueDate) < today
  );

  const todayTasks = tasks.filter(task => {
    if (!task.completed && task.dueDate) {
      const dueDate = new Date(task.dueDate);
      return dueDate.getDate() === today.getDate() &&
        dueDate.getMonth() === today.getMonth() &&
        dueDate.getFullYear() === today.getFullYear();
    }
    return false;
  });

  const upcomingTasks = tasks.filter(task =>
    !task.completed && task.dueDate && new Date(task.dueDate) > today
  );

  const completedTasks = tasks.filter(task => task.completed);

  return {
    tasks,
    hasOverdueTasks: overdueTasks.length > 0,
    hasTodayTasks: todayTasks.length > 0,
    hasUpcomingTasks: upcomingTasks.length > 0,
    totalTasks: tasks.length,
    completedTasks: completedTasks.length
  };
}

function getTaskSummary(tasks: Task[]): string {
  if (tasks.length === 0) {
    return '📝 You don\'t have **any tasks** yet. Would you like to **create one**?';
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const overdueTasks = tasks.filter(task => !task.completed && task.dueDate && new Date(task.dueDate) < today);
  const todayTasks = tasks.filter(task => {
    if (!task.completed && task.dueDate) {
      const dueDate = new Date(task.dueDate);
      return dueDate.getDate() === today.getDate() &&
        dueDate.getMonth() === today.getMonth() &&
        dueDate.getFullYear() === today.getFullYear();
    }
    return false;
  });
  const upcomingTasks = tasks.filter(task => !task.completed && task.dueDate && new Date(task.dueDate) > today);
  const completedTasks = tasks.filter(task => task.completed);

  let response = '📋 Here\'s your **task summary**:\n\n';

  if (overdueTasks.length > 0) {
    response += '⚠️ **Overdue**:\n' + overdueTasks.map(task =>
      `• **${task.title}** (**${task.priority} priority**)`).join('\n') + '\n\n';
  }

  if (todayTasks.length > 0) {
    response += '📅 **Today**:\n' + todayTasks.map(task =>
      `• **${task.title}** (**${task.priority} priority**)`).join('\n') + '\n\n';
  }

  if (upcomingTasks.length > 0) {
    response += '🔜 **Upcoming**:\n' + upcomingTasks.map(task =>
      `• **${task.title}** (**${task.priority} priority**)`).join('\n');
  }

  if (completedTasks.length > 0) {
    response += '\n\n✅ **Completed**:\n' + completedTasks.map(task =>
      `• **${task.title}**`).join('\n');
  }

  return response;
}

/**
 * Automatically adds bold markdown to important text in a response
 * @param text The text to process
 * @returns Text with important elements wrapped in bold markdown
 */
function addEmphasisToImportantText(text: string): string {
  // Skip processing if text already contains markdown bold syntax
  if (text.includes('**')) {
    return text;
  }
  
  let result = text;
  
  // Apply each pattern to find and bold important text
  IMPORTANT_PATTERNS.forEach(pattern => {
    result = result.replace(pattern, match => `**${match}**`);
  });
  
  return result;
}

export async function generateChatResponse(input: string, tasks: Task[]): Promise<string> {
  try {
    const inputLower = input.toLowerCase().trim();
    console.log('Processing input:', inputLower);

    const context = getTaskContext(tasks);

    // Check for greetings
    if (/^(hi|hello|hey|howdy|good\s*(morning|afternoon|evening))\b/i.test(input)) {
      const greetings = [
        `👋 Hello! ${context.hasOverdueTasks ? 'You have some overdue tasks that need attention.' : 'How can I help you today?'}`,
        `Hi there! ${context.hasTodayTasks ? 'You have some tasks planned for today.' : 'What can I help you with?'}`,
        `Hey! ${context.totalTasks === 0 ? 'Ready to create your first task?' : 'Need help managing your tasks?'}`,
      ];
      const response = greetings[Math.floor(Math.random() * greetings.length)];
      return addEmphasisToImportantText(response);
    }

    // Check for "how are you"
    if (/how are you|how's it going|how do you feel/i.test(inputLower)) {
      const responses = [
        "😊 I'm doing great, thanks for asking! Ready to help you with your tasks!",
        "I'm functioning perfectly and excited to assist you! What can I help you with?",
        "All systems operational and happy to help! How can I assist you today? 🌟",
      ];
      const response = responses[Math.floor(Math.random() * responses.length)];
      return addEmphasisToImportantText(response);
    }

    // Check for help request
    if (/help|what can you do|how do|what do/.test(inputLower)) {
      const response = `🌟 I can help you with:

• 📝 **Creating and managing tasks**
• 📅 **Setting due dates and priorities**
• 📊 **Showing task summaries**
• ❓ **Answering general questions**

Try saying something like:
• "**Create a task for tomorrow**"
• "**Show my tasks**"
• "**What's the weather like?**"
• "**How many tasks are completed?**"`;
      return addEmphasisToImportantText(response);
    }

    // Improved task-related intent detection
    const taskQueries = ['my tasks', 'show tasks', 'list tasks', 'to dos', 'todo list', 'schedule', 'deadlines'];
    const isTaskQuery = taskQueries.some(q => inputLower.includes(q));

    if (isTaskQuery) {
      return getTaskSummary(tasks);
    }

    // For general knowledge questions, use OpenAI with fallback to web search
    try {
      const messages: Message[] = [
        { role: 'user', content: input }
      ];
      
      try {
        // Try OpenAI first
        const apiResponse = await callChatApi(messages);
        return addEmphasisToImportantText(apiResponse);
      } catch (apiError) {
        console.error('OpenAI API error, falling back to web search:', apiError);
        
        // If it's a knowledge question, use web search as fallback
        if (/what|how|why|when|where|who|which|is|are|can|could|should|would|will/i.test(inputLower)) {
          console.log('Using web search fallback for knowledge question');
          return await performWebSearch(input);
        } else {
          // For non-knowledge questions, return a friendly error
          return '• 🤔 **I\'m having trouble connecting to my knowledge base right now.**\n\n• 💡 I can still help with your tasks though! Try asking me to create a task or show your task list.';
        }
      }
    } catch (error) {
      console.error('Error generating chat response:', error);
      return '• ⚠️ **I apologize, but I encountered an error.** Please try again in a moment.';
    }
    const fallbackResponse = '🤔 I\'m not sure about that. Would you like to create a task or ask me something specific?';
    return addEmphasisToImportantText(fallbackResponse);
  } catch (error) {
    console.error('Error generating chat response:', error);
    return '❌ **I encountered an error.** Please try again.';
  }
}
