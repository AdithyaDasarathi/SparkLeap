'use client';

import React, { useEffect } from 'react';

// Define the SearchResult type to match cascade.d.ts
type SearchResult = {
  title: string;
  url: string;
  summary?: string;
};

declare global {
  interface Window {
    search_web: (params: { query: string; domain?: string }) => Promise<SearchResult[]>;
  }
}

export function SearchProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Expose the search_web function to the global scope
    window.search_web = async ({ query, domain }) => {
      try {
        console.log('SearchProvider: Searching for:', query, domain ? `in domain: ${domain}` : '');
        const response = await fetch('/api/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query, domain }),
        });

        if (!response.ok) {
          console.error('SearchProvider: Search request failed with status:', response.status);
          throw new Error('Search request failed');
        }

        const data = await response.json();
        console.log('SearchProvider: Search results received');
        
        // Convert the API response to the expected SearchResult[] format
        if (data && data.content) {
          return [{
            title: query,
            url: `https://search.example.com?q=${encodeURIComponent(query)}`,
            summary: data.content
          }];
        }
        
        return [{
          title: 'No results',
          url: '',
          summary: 'No search results found.'
        }];
      } catch (error) {
        console.error('SearchProvider: Search error:', error);
        return [{
          title: 'Error',
          url: '',
          summary: "Sorry, I encountered an error while searching. Please try again."
        }];
      }
    };
    
    console.log('SearchProvider: search_web function initialized and available globally');
  }, []);

  return <>{children}</>;
}
