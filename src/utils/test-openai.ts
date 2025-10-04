import * as dotenv from 'dotenv';

// Load .env file explicitly
console.error('Starting test script...');
dotenv.config({ path: '.env' });
console.error('Dotenv config loaded');
import { callChatApi } from './openai';

// Check if environment variables are loaded
console.error('Environment variables loaded:', {
  OPENAI_KEY_EXISTS: !!process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  BASE_URL: process.env.NEXT_PUBLIC_OPENAI_API_BASE_URL || 'https://api.openai.com/v1'
});

(async () => {
  try {
    console.error('Testing OpenAI integration...');
    console.error('Current working directory:', process.cwd());
    console.error('About to call OpenAI API...');
    const message = await callChatApi([
      { role: 'user', content: 'ping' }
    ]);
    
    console.error('\nOpenAI Response:', message);
  } catch (err: any) {
    console.error('❌ OpenAI request error:', {
      message: err.message,
      name: err.name,
      code: err.code,
      status: err.status,
      stack: err.stack
    });
  } finally {
    console.error('Test script execution completed');
  }
})();

// Force output to be flushed
process.on('exit', () => {
  console.error('Process exiting');
});
