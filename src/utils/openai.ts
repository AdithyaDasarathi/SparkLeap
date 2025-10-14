// src/utils/openai.ts
import { rateLimiter } from './rateLimiter';

type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

// Helper function to add delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Maximum number of retries
const MAX_RETRIES = 3;

// Generate user identifier (uses authenticated user if available)
function getUserIdentifier(): string {
  if (typeof window !== 'undefined') {
    // Try to get authenticated user first
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.email || user.id || 'authenticated-user';
      }
    } catch (e) {
      console.log('No authenticated user found');
    }
    
    // Fallback to session-based identifier
    let identifier = localStorage.getItem('user-session-id');
    if (!identifier) {
      identifier = 'guest-' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('user-session-id', identifier);
    }
    return identifier;
  }
  // Server-side: use a default identifier
  return 'server-user';
}

export async function callChatApi(messages: Message[]) {
  // Check rate limits first
  const userIdentifier = getUserIdentifier();
  const rateLimitCheck = rateLimiter.checkLimit(userIdentifier);
  
  if (!rateLimitCheck.allowed) {
    const resetTime = new Date(rateLimitCheck.resetTime).toLocaleString();
    console.log(`🚫 Rate limit exceeded for user ${userIdentifier}. Reset at: ${resetTime}`);
    return `• 🚫 **Rate limit exceeded**: You've reached your usage limit.\n• ⏰ **Try again**: ${resetTime}\n• 💡 **Tip**: Each user gets 50 requests per day and 10 per hour to prevent abuse.`;
  }
  
  console.log(`✅ Rate limit check passed. Remaining requests: ${rateLimitCheck.remaining}`);
  
  let retries = 0;
  
  while (retries < MAX_RETRIES) {
    try {
      console.log(`Calling OpenAI API with messages (attempt ${retries + 1}):`, 
        JSON.stringify(messages.map(m => ({ role: m.role, contentPreview: m.content.substring(0, 50) })), null, 2));
      
      const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
      const baseUrl = process.env.NEXT_PUBLIC_OPENAI_API_BASE_URL || 'https://api.openai.com/v1';

      if (!apiKey || apiKey === 'your_openai_api_key_here' || apiKey === 'placeholder-key') {
        console.error('OpenAI API key is missing or invalid');
        return '• 🔧 **Demo Mode**: AI chat is not configured yet.\n• 💡 **To enable**: Add your OpenAI API key to environment variables.\n• 🎯 **For now**: You can still use all other features like tasks, calendar, and KPI tracking.\n• 📊 **Try asking**: "Show me my tasks" or "What are my KPIs?"';
      }

      console.log('API Key loaded, Base URL:', baseUrl);
      
      // Log the request configuration (without sensitive data)
      console.log('Making request to OpenAI API with configuration:', {
        model: 'gpt-3.5-turbo',
        messageCount: messages.length,
        temperature: 0.7,
        max_tokens: 1000
      });

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an advanced AI assistant. Always return answers formatted as a clean bullet list.\n\nFormatting Rules (strict):\n- Each bullet MUST be on its own new line (use a real newline \n, never inline separators).\n- Start each bullet with an emoji, then bold the key phrase, then a concise explanation.\n- Prefer short, scannable bullets.\n- If steps are needed, use a numbered list (each number on its own line).\n- Do not prepend summaries before or after the list.\n\nExample:\n• 🎯 **Definition**: One‑line definition.\n• 💡 **Why it matters**: Short implication.\n• 🔧 **How to use**: Actionable instruction.\n\nReturn only the list using real newlines between items.'
            },
            ...messages
          ],
          temperature: 0.7,
          max_tokens: 1000,
          presence_penalty: 0.6,
          frequency_penalty: 0.4
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: errorText };
        }
        
        console.error('OpenAI API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        
        // If we get a rate limit or server error, retry
        if (response.status === 429 || response.status >= 500) {
          retries++;
          const waitTime = Math.min(Math.pow(2, retries) * 1000, 10000); // Exponential backoff up to 10 seconds
          console.log(`Rate limited or server error. Retrying in ${waitTime}ms...`);
          await delay(waitTime);
          continue;
        }
        
        // Return more specific error messages
        if (response.status === 401) {
          return '• 🔑 **API Key Issue**: Your OpenAI API key is invalid or expired.\n• 💡 **Solution**: Check your API key in Vercel environment variables.\n• 🎯 **Demo Mode**: All other features work without AI chat.\n• 📊 **Try**: Tasks, Calendar, and KPI tracking are fully functional.';
        } else if (response.status === 403) {
          return '• 🚫 **Access Denied**: Your API key might not have access to GPT models.\n• 💡 **Solution**: Check your OpenAI account permissions and billing.\n• 🎯 **Demo Mode**: Other features work independently.\n• 📊 **Try**: Explore tasks and KPI dashboard.';
        } else if (response.status === 400) {
          return '• ⚠️ **Request Error**: There might be an issue with the message format.\n• 💡 **Solution**: Try rephrasing your question.\n• 🎯 **Demo Mode**: All other features work normally.\n• 📊 **Try**: "What are my current KPIs?" or "Show my tasks".';
        }
        
        return `I encountered an error (${response.status}). Please try again or check your API configuration.`;
      }

      const data = await response.json();
      console.log('OpenAI API response received successfully');
      
      if (!data.choices?.[0]?.message?.content) {
        console.error('Unexpected API response format:', data);
        return 'I received an unexpected response format. Please try again.';
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error in callChatApi:', error);
      
      // Network errors or other exceptions should trigger a retry
      retries++;
      if (retries < MAX_RETRIES) {
        const waitTime = Math.min(Math.pow(2, retries) * 1000, 10000);
        console.log(`Network error. Retrying in ${waitTime}ms...`);
        await delay(waitTime);
        continue;
      }
      
      return 'I encountered a network error. Please check your internet connection and try again.';
    }
  }
  
  return 'I was unable to get a response after multiple attempts. Please try again later.';
}