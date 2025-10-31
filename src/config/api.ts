export const API_CONFIG: { baseURL: string } = {
  baseURL:
    import.meta.env.MODE === 'production'
      ? 'https://panunet.com.tr/trpc'
      : 'http://localhost:3000/trpc',
};
