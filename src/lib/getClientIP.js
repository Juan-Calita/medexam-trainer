let cachedIP = null;

export async function getClientIPIfAnonymous() {
  try {
    const isAuth = await base44CheckAuth();
    if (isAuth) return null; // logged in — no need to track IP
  } catch {
    // not authenticated
  }
  if (cachedIP) return cachedIP;
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    cachedIP = data.ip;
    return cachedIP;
  } catch {
    return null;
  }
}

async function base44CheckAuth() {
  const { base44 } = await import('@/api/base44Client');
  return base44.auth.isAuthenticated();
}