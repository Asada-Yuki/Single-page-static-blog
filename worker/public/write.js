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
const loginButton = document.querySelector('#login-button');
const publishStatus = document.querySelector('#publish-status');
const logoutButton = document.querySelector('#logout-button');
const draftKey = 'single-timeline-draft-v1';
const maxImages = 5;
const maxImageBytes = 1024 * 1024;
const images = new Map();
let pendingImageCount = 0;

function setView(authenticated) {
  loginView.hidden = authenticated;
  composerView.hidden = !authenticated;
  logoutButton.hidden = !authenticated;
  if (authenticated) postBody.focus();
}

function saveDraft() {
  try {
    localStorage.setItem(draftKey, postBody.value);
  } catch {
    publishStatus.textContent = 'Draft could not be saved in this browser.';
  }
}

async function readResponseJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function setPublishing(publishing) {
  editorForm.setAttribute('aria-busy', String(publishing));
  postBody.readOnly = publishing;
  imageInput.disabled = publishing;
  photoButton.disabled = publishing;
  publishButton.disabled = publishing;
  logoutButton.disabled = publishing;
  for (const button of attachments.querySelectorAll('button')) button.disabled = publishing;
}

function restoreDraft() {
  try {
    postBody.value = localStorage.getItem(draftKey) || '';
  } catch {
    postBody.value = '';
  }
  if (postBody.value.includes('[[image:')) {
    publishStatus.textContent = 'This draft has image placeholders. Add those images again or remove the placeholders.';
  }
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
    item.append(preview, remove);
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
  try {
    for (const file of selectedFiles) {
      try {
        const blob = await convertImage(file);
        const id = crypto.randomUUID();
        const marker = `[[image:${id}]]`;
        const image = { id, marker, blob, previewUrl: URL.createObjectURL(blob) };
        images.set(id, image);
        insertAtCursor(marker);
        publishStatus.textContent = '';
        renderAttachments();
      } catch (error) {
        publishStatus.textContent = error.message;
      } finally {
        pendingImageCount -= 1;
      }
    }
  } finally {
    if (files.length > room) publishStatus.textContent = 'A post can contain up to five images.';
  }
}

function getReferencedImages(body) {
  const pattern = /\[\[image:([0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})\]\]/gi;
  const ids = [...body.matchAll(pattern)].map((match) => match[1]);
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

  setPublishing(true);
  publishStatus.textContent = 'Publishing…';

  try {
    const payload = {
      body,
      images: await Promise.all(selectedImages.map(async (image) => ({
        id: image.id,
        data: await blobToBase64(image.blob)
      })))
    };
    const response = await fetch('/api/publish', {
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

    for (const image of images.values()) URL.revokeObjectURL(image.previewUrl);
    images.clear();
    postBody.value = '';
    renderAttachments();
    try {
      localStorage.removeItem(draftKey);
    } catch {
      // Publishing succeeded; the visible draft has already been cleared.
    }
    publishStatus.textContent = `Published · ${result.timestamp} UTC`;
  } catch (error) {
    publishStatus.textContent = `${error.message} The draft is still here.`;
  } finally {
    setPublishing(false);
  }
}

async function checkSession() {
  try {
    const response = await fetch('/api/session', { credentials: 'same-origin' });
    const result = await readResponseJson(response);
    if (!response.ok) throw new Error(result.error || `Session check failed (HTTP ${response.status}).`);
    setView(Boolean(result.authenticated));
    if (result.authenticated) restoreDraft();
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
    const response = await fetch('/api/login', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authorKey: key })
    });
    const result = await readResponseJson(response);
    if (!response.ok) throw new Error(result.error || 'The author key was not accepted.');
    keyInput.value = '';
    loginStatus.textContent = '';
    setView(true);
    restoreDraft();
  } catch (error) {
    loginStatus.textContent = error.message;
  } finally {
    loginButton.disabled = false;
  }
});

editorForm.addEventListener('submit', publish);
postBody.addEventListener('input', saveDraft);
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
    const response = await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' });
    const result = await readResponseJson(response);
    if (!response.ok) throw new Error(result.error || `Sign-out failed (HTTP ${response.status}).`);
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

void checkSession();
