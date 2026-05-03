export function parseJwt(token: string | null) {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodeURIComponent(escape(decoded)));
  } catch (e) {
    return null;
  }
}

export function isAdminFromToken(token: string | null) {
  const p = parseJwt(token);
  if (!p) return false;
  // roles may appear as 'role' or 'roles' or 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
  if (p['role']) return p['role'] === 'Admin' || (Array.isArray(p['role']) && p['role'].includes('Admin'));
  if (p['roles']) return p['roles'] === 'Admin' || (Array.isArray(p['roles']) && p['roles'].includes('Admin'));
  if (p['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']) {
    const v = p['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    return v === 'Admin' || (Array.isArray(v) && v.includes('Admin'));
  }
  return false;
}
