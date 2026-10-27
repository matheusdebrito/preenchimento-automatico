/**
 * Only a random job UUID goes in sessionStorage. It is not an auth credential,
 * does not contain extracted values and still needs the HttpOnly login cookie.
 * Session storage is tab-scoped and cleared when the tab is closed.
 */
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const key = (serviceId: string) => 'pa:temporary-job:' + serviceId;

export function readTemporaryJob(serviceId: string): string | null {
  try {
    const id = sessionStorage.getItem(key(serviceId));
    if (id && uuid.test(id)) return id;
    if (id) sessionStorage.removeItem(key(serviceId));
  } catch { /* Browser storage may be disabled. */ }
  return null;
}

export function rememberTemporaryJob(serviceId: string, jobId: string): void {
  try {
    if (uuid.test(jobId)) sessionStorage.setItem(key(serviceId), jobId);
  } catch { /* The server-side session remains authoritative. */ }
}

export function forgetTemporaryJob(serviceId: string): void {
  try { sessionStorage.removeItem(key(serviceId)); } catch { /* Ignore storage failures. */ }
}
