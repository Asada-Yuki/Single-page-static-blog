const sessionKey = 'yuki-draft-id-v2';

export class DraftStorage {
  async initialize() {
    try { this.id = sessionStorage.getItem(sessionKey); } catch { /* Storage may be unavailable. */ }
    try {
      this.database = await new Promise((resolve, reject) => {
        const request = indexedDB.open('yuki-writer-v2', 1);
        let finished = false;
        const timer = setTimeout(() => { finished = true; reject(new Error('Draft storage timed out.')); }, 5000);
        request.onupgradeneeded = () => request.result.createObjectStore('drafts', { keyPath: 'id' });
        request.onsuccess = () => { clearTimeout(timer); if (finished) request.result.close(); else resolve(request.result); };
        request.onerror = () => { clearTimeout(timer); finished = true; reject(request.error); };
        request.onblocked = () => { clearTimeout(timer); finished = true; reject(new Error('Draft storage is blocked.')); };
      });
      if (!navigator.locks && this.id) {
        const original = await this.transaction('readonly', (store) => store.get(this.id));
        this.id = crypto.randomUUID();
        if (original) await this.save({ ...original, attempt: null });
      }
      if (!this.id) {
        const drafts = (await this.transaction('readonly', (store) => store.getAll()))
          .filter((draft) => draft.body || draft.images?.length || draft.lastPublished).sort((a, b) => b.updatedAt - a.updatedAt);
        for (const draft of drafts) {
          if (await this.claim(draft.id)) {
            this.id = navigator.locks ? draft.id : crypto.randomUUID();
            if (!navigator.locks) await this.save({ ...draft, attempt: null });
            break;
          }
        }
      } else if (!await this.claim(this.id)) {
        const original = await this.transaction('readonly', (store) => store.get(this.id));
        this.id = crypto.randomUUID();
        await this.claim(this.id);
        if (original) await this.save({ ...original, attempt: null });
      }
    } catch {
      this.database = null;
      if (this.id) {
        if (!navigator.locks || !await this.claim(this.id)) {
          let original;
          try { original = JSON.parse(localStorage.getItem(`yuki-draft-v2:${this.id}`) || 'null'); } catch { /* Storage can be unavailable. */ }
          this.id = crypto.randomUUID();
          await this.claim(this.id);
          if (original) { try { await this.save({ ...original, attempt: null }); } catch { /* Report saving limitations in the writer. */ } }
        }
      } else {
        try {
          const records = Object.keys(localStorage).filter((key) => key.startsWith('yuki-draft-v2:'))
            .map((key) => JSON.parse(localStorage.getItem(key))).filter((draft) => draft?.body || draft?.lastPublished)
            .sort((a, b) => b.updatedAt - a.updatedAt);
          for (const draft of records) if (await this.claim(draft.id)) {
            this.id = navigator.locks ? draft.id : crypto.randomUUID();
            if (!navigator.locks) await this.save({ ...draft, attempt: null });
            break;
          }
        } catch { /* Keep the editor usable without persistent storage. */ }
      }
    }
    if (!this.id) { this.id = crypto.randomUUID(); await this.claim(this.id); }
    try { sessionStorage.setItem(sessionKey, this.id); } catch { /* Keep the tab functional. */ }
    return this;
  }

  claim(id) {
    if (!navigator.locks) return Promise.resolve(true);
    return new Promise((resolve) => {
      void navigator.locks.request(`yuki-draft:${id}`, { ifAvailable: true }, (lock) => {
        resolve(Boolean(lock));
        if (lock) return new Promise(() => {}); // Released when the owning document is destroyed.
      }).catch(() => resolve(false));
    });
  }

  transaction(mode, operation) {
    return new Promise((resolve, reject) => {
      const transaction = this.database.transaction('drafts', mode);
      const request = operation(transaction.objectStore('drafts'));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error || new Error('Draft save interrupted.'));
    });
  }

  async load() {
    let draft = this.database ? await this.transaction('readonly', (store) => store.get(this.id))
      : JSON.parse(localStorage.getItem(`yuki-draft-v2:${this.id}`) || 'null');
    if (!draft) {
      const body = localStorage.getItem('single-timeline-draft-v1');
      if (body) {
        draft = { body, images: [], attempt: null };
        await this.save(draft);
        localStorage.removeItem('single-timeline-draft-v1');
        localStorage.removeItem('single-timeline-attempt-v1');
      }
    }
    return draft;
  }

  save(draft) {
    const record = { ...draft, id: this.id, updatedAt: Date.now() };
    if (this.database) return this.transaction('readwrite', (store) => store.put(record));
    // Text-only fallback is isolated by draft id. Never pretend photos were saved.
    localStorage.setItem(`yuki-draft-v2:${this.id}`, JSON.stringify({ ...record, images: [],
      lastPublished: record.lastPublished ? { ...record.lastPublished, images: [] } : null }));
    return Promise.resolve();
  }

  async archive(draft, result) {
    if (!this.database && draft.images.length) throw new Error('Publishing was confirmed, but photo recovery could not be saved. Keep this draft until you clear it.');
    const lastPublished = { body: draft.body, images: draft.images, result };
    await this.save({ ...draft, lastPublished });
    return lastPublished;
  }
}
