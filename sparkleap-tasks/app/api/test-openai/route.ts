import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    const baseUrl = process.env.NEXT_PUBLIC_OPENAI_API_BASE_URL || 'https://api.openai.com/v1';

    console.log('Testing OpenAI API...');
    console.log('API Key exists:', !!apiKey);
    console.log('API Key prefix:', apiKey ? apiKey.substring(0, 7) + '...' : 'NOT SET');
    console.log('Base URL:', baseUrl);

    if (!apiKey) {
      return NextResponse.json({ 
        error: 'API key not configured',
        details: 'NEXT_PUBLIC_OPENAI_API_KEY is not set in environment variables'
      }, { status: 500 });
    }

    if (!apiKey.startsWith('sk-')) {
      return NextResponse.json({ 
        error: 'Invalid API key format',
        details: 'OpenAI API key should start with "sk-"'
      }, { status: 500 });
    }

    // Test the API with a simple request
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content: 'Hello, just testing the connection. Please respond with "Connection successful!"' }
        ],
        max_tokens: 50
      })
    });

    console.log('OpenAI API Response Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: errorText };
      }
      
      console.error('OpenAI API Error:', errorData);
      
      return NextResponse.json({
        error: 'OpenAI API request failed',
        status: response.status,
        details: errorData
      }, { status: response.status });
    }

    const data = await response.json();
    console.log('OpenAI API Success:', data);

    return NextResponse.json({
      success: true,
      message: 'OpenAI API test successful',
      response: data.choices[0]?.message?.content || 'No response content',
      model: data.model,
      usage: data.usage
    });

  } catch (error: any) {
    console.error('Test error:', error);
    return NextResponse.json({
      error: 'Test failed',
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
