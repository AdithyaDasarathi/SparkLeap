import * as dotenv from 'dotenv';

// Load .env file explicitly
dotenv.config({ path: '.env' });
import { openai } from './openai';

(async () => {
  try {
    console.log('Testing OpenAI integration...');
    const resp = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'ping' }]
    });
    
    const message = resp.choices[0].message;
    console.log('\nOpenAI Response:', JSON.stringify(message, null, 2));
  } catch (err: any) {
    console.error('❌ OpenAI request error:', {
      message: err.message,
      name: err.name,
      code: err.code,
      status: err.status,
      stack: err.stack
    });
  }
})();
