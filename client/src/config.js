// Server URL — auto-detects local vs production
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
export const SERVER_URL = isLocal
  ? 'http://localhost:3001'
  : window.location.origin; // In production, client and server share same origin
