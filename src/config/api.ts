export const API_CONFIG: { baseURL: string } = {
  baseURL:
    import.meta.env.MODE === 'production'
      ? 'https://v2.panunet.com.tr/trpc'
      : 'http://localhost:3000/trpc',
};
