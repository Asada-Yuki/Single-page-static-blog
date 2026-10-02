export function snapshotText(body, images) {
  return JSON.stringify({ body, images: images.map((image) => ({
    id: image.id.toLowerCase(), data: image.data, alt: image.alt || ''
  })) });
}

export async function sha256(text) {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function canonicalTimestamp(value) {
  if (typeof value !== 'string' || !/^20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
}

export function validAttempt(value, hash) {
  return value && typeof value.id === 'string'
    && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value.id)
    && canonicalTimestamp(value.timestamp) && value.snapshotHash === hash
    && /^[A-Za-z0-9_-]{43}$/.test(value.signature);
}

export function validPublishResult(value, attempt) {
  const key = `${attempt.timestamp.replaceAll(':', '-')}-${attempt.id.replaceAll('-', '').toLowerCase()}`;
  return value?.ok === true && value.timestamp === attempt.timestamp
    && value.attemptId === attempt.id && value.snapshotHash === attempt.snapshotHash
    && /^[a-f0-9]{40}$/i.test(value.commit) && /^[a-f0-9]{64}$/.test(value.bodyHash)
    && value.key === key && value.permalink === `/p/${key}/`;
}
