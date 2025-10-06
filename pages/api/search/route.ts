import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(request: Request) {
  console.log('Received search request');
  try {
    // 1) Parse request and extract topic
    const body = await request.json();
    console.log('Request body:', body);
    
    if (!body || typeof body.query !== 'string') {
      console.error('Invalid request body');
      return NextResponse.json(
        { content: 'Invalid request. Query is required.' },
        { status: 400 }
      );
    }
    
    const { query } = body;
    const topic = query
      .toLowerCase()
      .replace(/^(?:what\s+(?:is|are)|define|explain|tell me about)\s+/i, '')
      .replace(/[?!.]+$/, '')
      .trim();

    console.log('🔍 Topic:', topic);

    // 2) Try DuckDuckGo first
    try {
      const ddgUrl = new URL('https://api.duckduckgo.com/');
      console.log('Querying DuckDuckGo for:', topic);
      ddgUrl.searchParams.set('q', topic);
      ddgUrl.searchParams.set('format', 'json');
      ddgUrl.searchParams.set('no_redirect', '1');
      ddgUrl.searchParams.set('no_html', '1');
      ddgUrl.searchParams.set('t', 'TaskChat');

      console.log('🌐 DDG URL:', ddgUrl.toString());
      const ddgRes = await fetch(ddgUrl.toString(), {
        headers: {
          'User-Agent': 'TaskChat/1.0 (adithya@windsurf.io)'
        }
      });
      
      if (ddgRes.ok) {
        const data = await ddgRes.json();
        if (data.AbstractText || (data.RelatedTopics && data.RelatedTopics[0])) {
          const answer = data.AbstractText || data.RelatedTopics[0].Text;
          console.log('✅ Found DDG answer');
          return NextResponse.json({ content: answer });
        }
      }
    } catch (err) {
      console.log('❌ DDG error:', err);
    }

    // 3) Try Wikipedia as fallback
    try {
      const wikiTitle = topic.replace(/\s+/g, '_');
      const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`;
      console.log('Querying Wikipedia for:', wikiTitle);
      
      console.log('🌐 Wiki URL:', wikiUrl);
      const wikiRes = await fetch(wikiUrl);
      
      if (wikiRes.ok) {
        const data = await wikiRes.json();
        if (data.extract && data.type !== 'disambiguation') {
          console.log('✅ Found Wiki answer');
          return NextResponse.json({ content: data.extract });
        }
      }
    } catch (err) {
      console.log('❌ Wiki error:', err);
    }

    // 4) No answers found
    console.log('❓ No answers found');
    return NextResponse.json({
      content: "I couldn't find any information about that. Could you try rephrasing or asking about something else?"
    });

  } catch (err) {
    // Handle any unexpected errors
    console.error('🚨 Unexpected error:', err);
    return NextResponse.json(
      { content: "Sorry, I'm having trouble searching right now. Please try again in a moment." },
      { status: 500 }
    );
  }
}
