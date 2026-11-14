// Shared in-memory store for the demo.
// On Vercel each serverless instance has its own memory; for a real production
// system replace this with Redis or a database. Good enough for a live demo.
export const claims = new Map<string, any>();
