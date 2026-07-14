const API_BASE = '/api';

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

export async function registerUser(
  name: string,
  email: string,
  password: string,
  confirmPassword: string,
) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, confirmPassword }),
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
  return data;
}

export async function verifyLoginCode(email: string, otp: string) {
  const res = await fetch(`${API_BASE}/auth/verify-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(extractErrorMessage(data));

  if (data.access_token) {
    localStorage.setItem('access_token', data.access_token);
  }

  return data;
}

export function logoutUser() {
  localStorage.removeItem('access_token');
}

export function getToken(): string | null {
  return localStorage.getItem('access_token');
}

export async function updateProfile(data: { name?: string, currentPassword?: string, newPassword?: string }) {
  const token = getToken();
  if (!token) {
    throw new Error('Token non trouvé');
  }

  const res = await fetch(`${API_BASE}/auth/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(extractErrorMessage(result));
  return result;
}

export async function requestPasswordResetCode(email: string) {
  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(extractErrorMessage(data));
  return data;
}

export async function verifyPasswordResetCode(email: string, otp: string) {
  const res = await fetch(`${API_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(extractErrorMessage(data));
  return data;
}

export async function resetPasswordWithToken(resetToken: string, newPassword: string) {
  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resetToken, newPassword }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(extractErrorMessage(data));
  return data;
}