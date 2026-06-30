const API_BASE = import.meta.env.VITE_BACKEND_ORIGIN || 'http://localhost:3000';

function extractErrorMessage(data: any): string {
  // Validation errors from class-validator come as an array
  if (data.message && Array.isArray(data.message)) {
    return data.message.join(', ');
  }
  // Simple error message
  if (data.message) {
    return data.message;
  }
  return 'Une erreur est survenue';
}

export async function registerUser(name: string, email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(extractErrorMessage(data));
  // Store token
  localStorage.setItem('access_token', data.access_token);
  return data;
}

export async function loginUser(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(extractErrorMessage(data));
  // Store token
  localStorage.setItem('access_token', data.access_token);
  return data;
}

export function logoutUser() {
  localStorage.removeItem('access_token');
}

export function getToken(): string | null {
  return localStorage.getItem('access_token');
}