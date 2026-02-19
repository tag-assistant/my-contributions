const CLIENT_ID = 'Ov23liYOURCLIENTID'; // Will be replaced with real OAuth App client ID
const WORKER_URL = 'https://my-contributions-auth.tag-worker.workers.dev';

export function getLoginUrl(returnPath?: string): string {
  const redirectUri = `${window.location.origin}${import.meta.env.BASE_URL || '/'}callback`;
  const state = returnPath || '/';
  return `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=read:user&state=${encodeURIComponent(state)}`;
}

export async function exchangeCode(code: string): Promise<string> {
  const res = await fetch(`${WORKER_URL}/api/auth/callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) throw new Error('Failed to exchange code');
  const data = await res.json();
  return data.access_token;
}

export function getToken(): string | null {
  return localStorage.getItem('gh_token');
}

export function setToken(token: string): void {
  localStorage.setItem('gh_token', token);
}

export function clearToken(): void {
  localStorage.removeItem('gh_token');
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
