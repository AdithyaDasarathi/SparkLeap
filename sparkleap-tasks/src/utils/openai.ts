// src/utils/openai.ts

type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

// Helper function to add delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Maximum number of retries
const MAX_RETRIES = 3;

export async function callChatApi(messages: Message[]) {
  let retries = 0;
  
  while (retries < MAX_RETRIES) {
    try {
      console.log(`Calling OpenAI API with messages (attempt ${retries + 1}):`, 
        JSON.stringify(messages.map(m => ({ role: m.role, contentPreview: m.content.substring(0, 50) })), null, 2));
      
      const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
      const baseUrl = process.env.NEXT_PUBLIC_OPENAI_API_BASE_URL || 'https://api.openai.com/v1';

      if (!apiKey) {
        console.error('OpenAI API key is missing');
        return 'I apologize, but I am not properly configured to answer questions right now. Please check the OpenAI API key configuration.';
      }

      console.log('API Key loaded, Base URL:', baseUrl);
      
      // Log the request configuration (without sensitive data)
      console.log('Making request to OpenAI API with configuration:', {
        model: 'gpt-4',
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
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an advanced AI assistant powered by GPT-4. You excel at both task management and answering questions with deep, nuanced understanding. When providing answers, always format them with clear bullet points, and add a relevant emoji at the start of each bullet point. For example:\n\n• 🎯 First point\n• 💡 Second point\n• 🔍 Third point\n\nFor general knowledge questions, provide comprehensive, well-structured answers with real-world examples. For business and technical topics, give practical insights backed by industry expertise.\n\nVery important: **Bold important words, phrases, or key concepts** in your responses using double asterisks (**) to make them stand out. Bold any terms, numbers, or ideas that are central to understanding your answer.\n\nAlways maintain a friendly and engaging tone.'
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
        
        console.error('OpenAI API error:', errorData);
        
        // If we get a rate limit or server error, retry
        if (response.status === 429 || response.status >= 500) {
          retries++;
          const waitTime = Math.min(Math.pow(2, retries) * 1000, 10000); // Exponential backoff up to 10 seconds
          console.log(`Rate limited or server error. Retrying in ${waitTime}ms...`);
          await delay(waitTime);
          continue;
        }
        
        return 'I encountered an error while processing your request. Please try again.';
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