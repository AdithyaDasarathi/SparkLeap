declare const search_web: (params: { query: string, domain?: string }) => Promise<Array<{
  title: string;
  url: string;
  summary?: string;
}>>;

export { search_web };
