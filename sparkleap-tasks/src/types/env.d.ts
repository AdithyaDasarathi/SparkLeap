interface Window {
  search_web(params: { query: string, domain?: string }): Promise<Array<{
    title: string;
    url: string;
    summary?: string;
  }>>;
}

declare global {
  interface Window {
    search_web: Window['search_web'];
  }

  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_OPENAI_API_KEY: string;
      OPENAI_API_KEY: string;
    }
  }
}
