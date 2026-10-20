/* Native dialog gallery. Original image links remain the no-JavaScript fallback. */
(function () {
  'use strict';
  const dialog = document.querySelector('.photo-viewer');
  const links = Array.from(document.querySelectorAll('.photo-gallery a'));
  if (!dialog || !dialog.showModal || !links.length) return;
  const photo = dialog.querySelector('.photo-stage img');
  const title = dialog.querySelector('#photo-title');
  const count = dialog.querySelector('.photo-count');
  const error = dialog.querySelector('.photo-error');
  let index = 0;
  let opener = null;
  function show(next) {
    index = (next + links.length) % links.length;
    const link = links[index];
    const source = link.querySelector('img');
    title.textContent = link.closest('figure').querySelector('figcaption').textContent;
    photo.alt = source.alt;
    photo.hidden = false;
    error.hidden = true;
    photo.setAttribute('aria-busy', 'true');
    error.querySelector('a').href = link.href;
    photo.src = link.href;
    count.textContent = (index + 1) + ' / ' + links.length;
  }
  photo.addEventListener('load', function () { photo.removeAttribute('aria-busy'); });
  photo.addEventListener('error', function () {
    photo.removeAttribute('aria-busy');
    photo.hidden = true;
    error.hidden = false;
  });
  links.forEach(function (link, i) {
    link.setAttribute('aria-haspopup', 'dialog');
    link.setAttribute('aria-label', link.closest('figure').querySelector('figcaption').textContent + ' – nagyítás');
    link.addEventListener('click', function (event) {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      opener = link;
      show(i);
      dialog.showModal();
      document.body.classList.add('photo-open');
      dialog.querySelector('.photo-close').focus();
    });
  });
  dialog.querySelector('.photo-close').addEventListener('click', function () { dialog.close(); });
  dialog.querySelector('.photo-prev').addEventListener('click', function () { show(index - 1); });
  dialog.querySelector('.photo-next').addEventListener('click', function () { show(index + 1); });
  dialog.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowRight') { event.preventDefault(); show(index + 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); show(index - 1); }
  });
  dialog.addEventListener('click', function (event) {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
  dialog.addEventListener('close', function () {
    document.body.classList.remove('photo-open');
    if (opener) opener.focus({ preventScroll: true });
  });
})();
