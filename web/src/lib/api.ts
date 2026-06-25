// Base URL for the Sweep backend.
// Set VITE_API_URL in .env.local for local dev, and in Vercel env vars for production.
export const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8000'
