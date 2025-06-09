import { NextResponse } from 'next/server';

async function searchWikipedia(query: string) {
  console.log('Starting Wikipedia search for query:', query);
  // First, search for the most relevant article
  const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(query)}`;
  
  try {
    console.log('Fetching from Wikipedia search URL:', searchUrl);
    const searchResponse = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'TaskChat/1.0 (adithya@windsurf.io)'
      }
    });
    console.log('Search response status:', searchResponse.status);
    const searchData = await searchResponse.json();
    console.log('Search data:', searchData);
    
    if (!searchData.query?.search?.[0]) {
      return null;
    }

    // Get the title of the most relevant article
    const title = searchData.query.search[0].title;

    // Then get the extract for that article
    const extractUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro=1&explaintext=1&titles=${encodeURIComponent(title)}`;
    
    console.log('Fetching from Wikipedia extract URL:', extractUrl);
    const extractResponse = await fetch(extractUrl, {
      headers: {
        'User-Agent': 'TaskChat/1.0 (adithya@windsurf.io)'
      }
    });
    console.log('Extract response status:', extractResponse.status);
    const extractData = await extractResponse.json();
    console.log('Extract data:', extractData);
    const pages = extractData.query.pages;
    const pageId = Object.keys(pages)[0];
    const extract = pages[pageId].extract;

    if (extract) {
      return extract;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Wikipedia API error:', error);
    return null;
  }
}

export async function POST(request: Request) {
  console.log('Received Wikipedia API request');
  try {
    const body = await request.json();
    console.log('Request body:', body);
    const { query } = body;
    
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const wikiResult = await searchWikipedia(query);
    
    if (!wikiResult) {
      return NextResponse.json({ 
        answer: "I couldn't find specific information about that on Wikipedia. Could you try rephrasing your question?" 
      });
    }

    return NextResponse.json({ answer: wikiResult });
  } catch (error) {
    console.error('Error processing Wikipedia request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
