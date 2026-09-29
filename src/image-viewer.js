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

    viewerImage.src = source.currentSrc || source.src;
    viewerImage.alt = source.alt || '图片预览';
    count.textContent = gallery.length > 1 ? `${currentIndex + 1} / ${gallery.length}` : '';
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

  for (const entry of document.querySelectorAll('.entry')) {
    const images = Array.from(entry.querySelectorAll('.entry-content img'));

    images.forEach((image, index) => {
      const trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'image-viewer-trigger';
      trigger.setAttribute('aria-haspopup', 'dialog');
      trigger.setAttribute('aria-label', image.alt ? `全屏查看图片：${image.alt}` : '全屏查看图片');
      image.before(trigger);
      trigger.append(image);
      trigger.addEventListener('click', () => openGallery(images, index, trigger));
    });
  }

  closeButton.addEventListener('click', () => dialog.close());
  previousButton.addEventListener('click', () => move(-1));
  nextButton.addEventListener('click', () => move(1));

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
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
