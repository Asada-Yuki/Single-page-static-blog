const dialog = document.querySelector('.image-viewer');

if (dialog instanceof HTMLDialogElement) {
  const viewerImage = dialog.querySelector('.image-viewer__image');
  const count = dialog.querySelector('.image-viewer__count');
  const closeButton = dialog.querySelector('.image-viewer__close');
  const previousButton = dialog.querySelector('.image-viewer__previous');
  const nextButton = dialog.querySelector('.image-viewer__next');

  let gallery = [];
  let currentIndex = 0;
  let opener = null;
  let previousOverflow = '';

  function showCurrentImage() {
    const source = gallery[currentIndex];
    if (!source) return;

    const status = dialog.querySelector('.image-viewer__status');
    status.hidden = false; status.textContent = '正在加载图片…';
    viewerImage.onload = () => { status.hidden = true; };
    viewerImage.onerror = () => { status.hidden = false; status.textContent = '图片暂时无法加载，请关闭后重试。'; };
    viewerImage.src = source.currentSrc || source.src;
    viewerImage.alt = source.alt || '图片预览';
    count.textContent = gallery.length > 1 ? `${currentIndex + 1} / ${gallery.length}` : '';
    dialog.dataset.single = String(gallery.length < 2);
    previousButton.hidden = gallery.length < 2;
    nextButton.hidden = gallery.length < 2;
  }

  function openGallery(images, index, button) {
    gallery = images;
    currentIndex = index;
    opener = button;
    previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    showCurrentImage();
    dialog.showModal();
    closeButton.focus();
  }

  function move(offset) {
    if (gallery.length < 2) return;
    currentIndex = (currentIndex + offset + gallery.length) % gallery.length;
    showCurrentImage();
  }

  const enhanced = new WeakSet();
  function enhanceImages() {
    for (const image of document.querySelectorAll('.entry-content img')) {
      if (enhanced.has(image)) continue;
      enhanced.add(image);
      const linked = image.closest('a');
      const trigger = linked || document.createElement('button');
      if (!linked) { trigger.type = 'button'; image.before(trigger); trigger.append(image); }
      else trigger.setAttribute('role', 'button');
      trigger.classList.add('image-viewer-trigger');
      trigger.setAttribute('aria-haspopup', 'dialog');
      trigger.setAttribute('aria-label', image.alt ? `全屏查看图片：${image.alt}` : '全屏查看图片');
      trigger.addEventListener('click', (event) => {
        if (event.metaKey || event.ctrlKey) return;
        event.preventDefault();
        const images = [...image.closest('.entry').querySelectorAll('.entry-content img')];
        openGallery(images, images.indexOf(image), trigger);
      });
      if (linked) trigger.addEventListener('keydown', (event) => { if (event.key === ' ') { event.preventDefault(); trigger.click(); } });
    }
  }
  enhanceImages();
  document.addEventListener('timeline:changed', enhanceImages);

  closeButton.addEventListener('click', () => dialog.close());
  previousButton.addEventListener('click', () => move(-1));
  nextButton.addEventListener('click', () => move(1));

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog || event.target.classList.contains('image-viewer__stage')) dialog.close();
    if (event.target === viewerImage && viewerImage.naturalWidth) {
      const rect = viewerImage.getBoundingClientRect();
      const scale = Math.min(rect.width / viewerImage.naturalWidth, rect.height / viewerImage.naturalHeight);
      const width = viewerImage.naturalWidth * scale, height = viewerImage.naturalHeight * scale;
      const left = rect.left + (rect.width - width) / 2, top = rect.top + (rect.height - height) / 2;
      if (event.clientX < left || event.clientX > left + width || event.clientY < top || event.clientY > top + height) dialog.close();
    }
  });

  dialog.addEventListener('close', () => {
    document.documentElement.style.overflow = previousOverflow;
    opener?.focus();
    viewerImage.removeAttribute('src');
  });

  document.addEventListener('keydown', (event) => {
    if (!dialog.open) return;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      move(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      move(1);
    }
  });
}
