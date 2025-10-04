import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  console.log('Received search_web request');
  try {
    const body = await request.json();
    console.log('Request body:', body);
    
    if (!body || typeof body.query !== 'string') {
      console.error('Invalid request body');
      return NextResponse.json(
        { error: 'Invalid request. Query is required.' },
        { status: 400 }
      );
    }
    
    const { query } = body;
    console.log('Searching for:', query);

    // Use the built-in search_web tool
    const response = await fetch('http://localhost:3001/api/search_web', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      console.error('Search failed:', response.status);
      return NextResponse.json(
        { error: 'Search failed' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);



  } catch (err) {
    console.error('Search error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
