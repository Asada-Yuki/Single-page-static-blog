import { snapshotText, sha256, validAttempt, validPublishResult } from '/writer-protocol.js';
import { DraftStorage } from '/write-drafts.js';

const loginView = document.querySelector('#login-view');
const composerView = document.querySelector('#composer-view');
const loginForm = loginView;
const loginStatus = document.querySelector('#login-status');
const editorForm = document.querySelector('#editor-form');
const postBody = document.querySelector('#post-body');
const imageInput = document.querySelector('#image-input');
const photoButton = document.querySelector('#photo-button');
const attachments = document.querySelector('#attachments');
const publishButton = document.querySelector('#publish-button');
const clearDraftButton = document.querySelector('#clear-draft-button');
const loginButton = document.querySelector('#login-button');
const publishStatus = document.querySelector('#publish-status');
const logoutButton = document.querySelector('#logout-button');
const storage = new DraftStorage();
const storageReady = storage.initialize();
const draftNote = document.querySelector('#draft-note');
const recoverButton = document.querySelector('#recover-published-button');
let lastPublished = null;
let restored = false;
let saveTimer;
let deploymentGeneration = 0;
const maxImages = 5;
const maxImageBytes = 1024 * 1024;
const images = new Map();
let pendingImageCount = 0;
let pendingAttempt = null;

function setView(authenticated) {
  document.querySelector('#startup-status').hidden = true;
  loginView.hidden = authenticated;
  composerView.hidden = !authenticated;
  logoutButton.hidden = !authenticated;
  if (authenticated) postBody.focus();
}

function draftSnapshot() {
  return { body: postBody.value, images: [...images.values()].map(({ id, marker, blob, alt }) => ({ id, marker, blob, alt })),
    attempt: pendingAttempt, lastPublished };
}

async function saveDraftNow() {
  await storageReady;
  await storage.save(draftSnapshot());
}

function saveDraft() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => void saveDraftNow().catch(() => {
    draftNote.textContent = 'Draft could not be saved. Keep this tab open; your text and photos are still here.';
  }), 200);
}

async function readResponseJson(response) {
  if (!(response.headers.get('content-type') || '').toLowerCase().includes('application/json')) throw new Error('The site returned an unexpected response.');
  try {
    const value = await response.json();
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
    return value;
  } catch { throw new Error('The site returned invalid data.'); }
}

async function api(path, options = {}) {
  try { return await fetch(path, { credentials: 'same-origin', signal: AbortSignal.timeout(60000), ...options }); }
  catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') throw new Error('The connection timed out. Retry safely with the same draft.');
    throw error;
  }
}

function setPublishing(publishing) {
  editorForm.setAttribute('aria-busy', String(publishing));
  postBody.readOnly = publishing;
  imageInput.disabled = publishing;
  photoButton.disabled = publishing;
  publishButton.disabled = publishing;
  clearDraftButton.disabled = publishing || pendingImageCount > 0;
  logoutButton.disabled = publishing;
  for (const button of attachments.querySelectorAll('button')) button.disabled = publishing;
  for (const input of attachments.querySelectorAll('input')) input.disabled = publishing;
}

function updateDraftClearState() {
  clearDraftButton.disabled = editorForm.getAttribute('aria-busy') === 'true' || pendingImageCount > 0;
}

async function getPublishAttempt(hash) {
  if (validAttempt(pendingAttempt, hash)) return pendingAttempt;
  pendingAttempt = null;
  const response = await api('/api/attempt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ snapshotHash: hash }) });
  const result = await readResponseJson(response);
  if (response.status === 401) {
    setView(false); loginStatus.textContent = 'Session expired. Enter the author key.';
    throw new Error('Session expired. Enter the author key.');
  }
  if (!response.ok || !validAttempt(result, hash)) throw new Error(result.error || `Publish setup failed (HTTP ${response.status}).`);
  pendingAttempt = result;
  await saveDraftNow().catch(() => { draftNote.textContent = 'Keep this tab open to recover this publish attempt.'; });
  return pendingAttempt;
}

function applyDraft(draft) {
  postBody.value = draft?.body || '';
  for (const image of images.values()) URL.revokeObjectURL(image.previewUrl);
  images.clear();
  for (const image of draft?.images || []) if (image.blob instanceof Blob) images.set(image.id, { ...image, previewUrl: URL.createObjectURL(image.blob) });
  pendingAttempt = draft?.attempt || null;
  lastPublished = draft?.lastPublished || null;
  recoverButton.hidden = !lastPublished;
  recoverButton.disabled = Boolean(postBody.value.trim());
  renderAttachments();
  if (postBody.value.includes('[[image:') && !images.size) publishStatus.textContent = 'Text was recovered, but some photos are missing. Add them again or remove the placeholders.';
}

async function restoreDraft() {
  if (restored) return;
  setPublishing(true);
  await storageReady;
  draftNote.textContent = storage.database
    ? 'Draft text and photos stay in this browser. Clear the draft before sharing this device.'
    : 'Photo recovery is unavailable. Keep this tab open until publishing is confirmed.';
  try { applyDraft(await storage.load()); }
  catch { draftNote.textContent = 'Draft recovery failed. Keep this tab open and check browser storage.'; }
  restored = true;
  setPublishing(false);
}

function insertAtCursor(value) {
  const start = postBody.selectionStart;
  const end = postBody.selectionEnd;
  const before = postBody.value.slice(0, start);
  const after = postBody.value.slice(end);
  const prefix = before && !before.endsWith('\n') ? '\n\n' : '';
  const suffix = after && !after.startsWith('\n') ? '\n\n' : '';
  const insertion = `${prefix}${value}${suffix}`;
  postBody.setRangeText(insertion, start, end, 'end');
  postBody.focus();
  saveDraft();
}

function renderAttachments() {
  attachments.replaceChildren();
  attachments.hidden = images.size === 0;
  let index = 0;

  for (const image of images.values()) {
    index += 1;
    const item = document.createElement('span');
    item.className = 'attachment';
    const preview = document.createElement('img');
    preview.src = image.previewUrl;
    preview.alt = `Selected image ${index}`;
    const descriptionLabel = document.createElement('label');
    descriptionLabel.className = 'attachment__description';
    descriptionLabel.textContent = `Image description ${index} (optional)`;
    const description = document.createElement('input');
    description.type = 'text';
    description.maxLength = 250;
    description.autocomplete = 'off';
    description.placeholder = 'Describe this image for screen readers';
    description.value = image.alt;
    description.disabled = editorForm.getAttribute('aria-busy') === 'true';
    descriptionLabel.append(description);
    description.addEventListener('input', () => {
      image.alt = description.value;
      saveDraft();
    });
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = `Image ${index} ×`;
    remove.setAttribute('aria-label', `Remove image ${index}`);
    remove.disabled = editorForm.getAttribute('aria-busy') === 'true';
    remove.addEventListener('click', () => {
      postBody.value = postBody.value.split(image.marker).join('');
      URL.revokeObjectURL(image.previewUrl);
      images.delete(image.id);
      renderAttachments();
      saveDraft();
    });
    item.append(preview, descriptionLabel, remove);
    attachments.append(item);
  }
}

function canvasBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error('This image could not be converted.'));
      else if (blob.type !== 'image/webp') reject(new Error('This browser cannot create WebP images.'));
      else resolve(blob);
    }, 'image/webp', quality);
  });
}

async function convertImage(file) {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file.');
  if (file.size > 32 * 1024 * 1024) throw new Error('An original image must be 32 MB or smaller.');

  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width * bitmap.height > 40_000_000) throw new Error('Choose a photo with fewer than 40 million pixels.');
    let scale = Math.min(1, 2048 / Math.max(bitmap.width, bitmap.height));
    let quality = 0.86;

    for (let attempt = 0; attempt < 14; attempt += 1) {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext('2d', { alpha: true });
      if (!context) throw new Error('Image processing is unavailable in this browser.');
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await canvasBlob(canvas, quality);
      if (blob.size <= maxImageBytes) return blob;
      if (quality > 0.5) quality -= 0.08;
      else {
        scale *= 0.85;
        quality = 0.78;
      }
    }

    throw new Error('The compressed image is still larger than 1 MB. Choose a smaller image.');
  } finally {
    bitmap.close();
  }
}

async function blobToBase64(blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

async function addFiles(fileList) {
  const files = [...fileList].filter((file) => file.type.startsWith('image/'));
  if (!files.length) return;
  const room = maxImages - images.size - pendingImageCount;
  if (room <= 0) {
    publishStatus.textContent = 'A post can contain up to five images.';
    return;
  }

  const selectedFiles = files.slice(0, room);
  pendingImageCount += selectedFiles.length;
  updateDraftClearState();
  try {
    for (const file of selectedFiles) {
      try {
        const blob = await convertImage(file);
        const id = crypto.randomUUID();
        const marker = `[[image:${id}]]`;
        const image = { id, marker, blob, alt: '', previewUrl: URL.createObjectURL(blob) };
        images.set(id, image);
        insertAtCursor(marker);
        publishStatus.textContent = '';
        renderAttachments();
      } catch (error) {
        publishStatus.textContent = error.message;
      } finally {
        pendingImageCount -= 1;
        updateDraftClearState();
      }
    }
  } finally {
    if (files.length > room) publishStatus.textContent = 'A post can contain up to five images.';
  }
}

function getReferencedImages(body) {
  const pattern = /\[\[image:([0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})\]\]/gi;
  const ids = [...body.matchAll(pattern)].map((match) => match[1].toLowerCase());
  const referenced = new Set(ids);
  if (body.replace(pattern, '').includes('[[image:')) {
    throw new Error('An image placeholder is invalid. Remove it or add the image again.');
  }
  for (const id of referenced) {
    if (!images.has(id)) throw new Error('An image in this draft is missing. Add it again or remove its placeholder.');
  }
  return [...referenced].map((id) => images.get(id));
}

async function publish(event) {
  event.preventDefault();
  if (editorForm.getAttribute('aria-busy') === 'true') return;
  if (pendingImageCount > 0) {
    publishStatus.textContent = 'Wait for selected images to finish processing.';
    return;
  }

  const body = postBody.value;
  if (!body.trim()) {
    publishStatus.textContent = 'Write something or add an image.';
    return;
  }

  let selectedImages;
  try {
    selectedImages = getReferencedImages(body);
  } catch (error) {
    publishStatus.textContent = error.message;
    return;
  }

  deploymentGeneration += 1;
  clearTimeout(saveTimer);
  setPublishing(true);
  publishStatus.textContent = 'Publishing…';

  try {
    const snapshot = { body, images: await Promise.all(selectedImages.map(async (image) => ({ id: image.id, data: await blobToBase64(image.blob), alt: image.alt }))) };
    const hash = await sha256(snapshotText(snapshot.body, snapshot.images));
    const attempt = await getPublishAttempt(hash);
    const payload = { ...snapshot, attemptId: attempt.id, timestamp: attempt.timestamp,
      signature: attempt.signature, snapshotHash: attempt.snapshotHash };
    const response = await api('/api/publish', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await readResponseJson(response);
    if (response.status === 401) {
      setView(false);
      loginStatus.textContent = 'Session expired. Enter the author key.';
      publishStatus.textContent = '';
      return;
    }
    if (!response.ok) throw new Error(result.error || `Publishing failed (HTTP ${response.status}).`);
    if (!validPublishResult(result, attempt)) throw new Error('Publishing was not confirmed by valid data.');
    lastPublished = await storage.archive(draftSnapshot(), result);

    for (const image of images.values()) URL.revokeObjectURL(image.previewUrl);
    images.clear();
    postBody.value = '';
    renderAttachments();
    pendingAttempt = null;
    recoverButton.hidden = false;
    recoverButton.disabled = false;
    await saveDraftNow().catch(() => { draftNote.textContent = 'Published content was saved for recovery, but clearing the saved draft failed. Reload may restore it; do not publish it again.'; });
    void checkDeployment(result);
  } catch (error) {
    publishStatus.textContent = `${error.message} The draft is still here.`;
  } finally {
    setPublishing(false);
  }
}

async function checkSession() {
  try {
    const response = await api('/api/session', { credentials: 'same-origin' });
    const result = await readResponseJson(response);
    if (!response.ok) throw new Error(result.error || `Session check failed (HTTP ${response.status}).`);
    if (typeof result.authenticated !== 'boolean') throw new Error('The session response was invalid.');
    setView(result.authenticated);
    if (result.authenticated) await restoreDraft();
  } catch (error) {
    setView(false);
    loginStatus.textContent = `${error.message || 'Connection failed.'} Reload this page to try again.`;
  }
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const keyInput = document.querySelector('#author-key');
  const key = keyInput.value;
  loginStatus.textContent = 'Checking…';
  loginButton.disabled = true;

  try {
    const response = await api('/api/login', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authorKey: key })
    });
    const result = await readResponseJson(response);
    if (!response.ok) throw new Error(result.error || 'The author key was not accepted.');
    if (result.authenticated !== true) throw new Error('Sign-in was not confirmed.');
    keyInput.value = '';
    loginStatus.textContent = '';
    setView(true);
    await restoreDraft();
  } catch (error) {
    loginStatus.textContent = error.message;
  } finally {
    loginButton.disabled = false;
  }
});

editorForm.addEventListener('submit', publish);
clearDraftButton.addEventListener('click', () => {
  if (editorForm.getAttribute('aria-busy') === 'true' || pendingImageCount > 0) return;
  if (!window.confirm('Clear the draft text and selected images from this browser?')) return;

  postBody.value = '';
  clearTimeout(saveTimer);
  for (const image of images.values()) URL.revokeObjectURL(image.previewUrl);
  images.clear();
  pendingAttempt = null;
  lastPublished = null;
  recoverButton.hidden = true;
  void saveDraftNow().catch(() => { publishStatus.textContent = 'Visible draft cleared, but stored recovery data could not be removed.'; });
  renderAttachments();
  publishStatus.textContent = 'Draft cleared from this browser.';
  postBody.focus();
});
postBody.addEventListener('input', () => { recoverButton.disabled = Boolean(postBody.value.trim()); saveDraft(); });
imageInput.addEventListener('change', async () => {
  await addFiles(imageInput.files || []);
  imageInput.value = '';
});
photoButton.addEventListener('click', () => imageInput.click());
postBody.addEventListener('paste', (event) => {
  const files = [...(event.clipboardData?.files || [])].filter((file) => file.type.startsWith('image/'));
  if (!files.length) return;
  event.preventDefault();
  void addFiles(files);
});
postBody.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
    event.preventDefault();
    editorForm.requestSubmit();
  }
});
logoutButton.addEventListener('click', async () => {
  logoutButton.disabled = true;
  publishStatus.textContent = 'Signing out…';
  try {
    const response = await api('/api/logout', { method: 'POST', credentials: 'same-origin' });
    const result = await readResponseJson(response);
    if (!response.ok) throw new Error(result.error || `Sign-out failed (HTTP ${response.status}).`);
    if (result.ok !== true) throw new Error('Sign-out was not confirmed.');
    setView(false);
    loginStatus.textContent = '';
    publishStatus.textContent = '';
    document.querySelector('#author-key').focus();
  } catch {
    publishStatus.textContent = 'Sign-out failed. Check your connection and try again.';
  } finally {
    logoutButton.disabled = false;
  }
});

function publishMessage(result, text) {
  publishStatus.replaceChildren(document.createTextNode(text + ' '));
  const link = document.createElement('a'); link.href = result.permalink; link.textContent = 'Open this post';
  link.target = '_blank'; link.rel = 'noopener noreferrer'; publishStatus.append(link);
}

async function checkDeployment(result) {
  const generation = ++deploymentGeneration;
  publishMessage(result, 'Committed to GitHub. Waiting for the site to rebuild…');
  for (const delay of [3000, 5000, 8000, 12000, 20000, 30000, 40000]) {
    await new Promise((resolve) => setTimeout(resolve, delay));
    if (generation !== deploymentGeneration || editorForm.getAttribute('aria-busy') === 'true') return;
    try {
      const response = await fetch(`${result.permalink}status.json`, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
      const status = await readResponseJson(response);
      if (response.ok && status.key === result.key && status.timestamp === result.timestamp && status.bodyHash === result.bodyHash) {
        publishMessage(result, 'Published on the site.'); return;
      }
    } catch { /* The previous deployment may not contain the new post yet. */ }
  }
  if (generation === deploymentGeneration) publishMessage(result, 'Committed, but the site update is not yet confirmed. Check again later.');
}

recoverButton.addEventListener('click', () => {
  if (!lastPublished || postBody.value.trim()) return;
  const saved = lastPublished;
  applyDraft({ ...saved, lastPublished: saved, attempt: null }); saveDraft(); postBody.focus();
  publishStatus.textContent = 'Restored as a new draft. Nothing has been published again.';
});
window.addEventListener('pagehide', () => { if (restored) { clearTimeout(saveTimer); void saveDraftNow().catch(() => {}); } });
document.addEventListener('visibilitychange', () => { if (document.hidden && restored) { clearTimeout(saveTimer); void saveDraftNow().catch(() => {}); } });
void checkSession();
