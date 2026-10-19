// Colour scheme picker. Catppuccin latte is the default and needs no
// JavaScript; a chosen scheme is stored per browser, and "system" follows
// the preference between the DevCapsule day and night palettes.
const picker = document.querySelector('.palette-picker');
if (picker) {
  const select = picker.querySelector('select');
  const root = document.documentElement;
  const DEFAULT = 'catppuccin-latte';
  const known = [...select.options].map((o) => o.value);
  const stored = () => { try { return localStorage.getItem('palette'); } catch { return null; } };
  const apply = (value) => {
    const scheme = known.includes(value) ? value : DEFAULT;
    if (scheme === DEFAULT) root.removeAttribute('data-palette');
    else root.setAttribute('data-palette', scheme);
    select.value = scheme;
  };
  apply(root.getAttribute('data-palette') || stored() || DEFAULT);
  select.addEventListener('change', () => {
    apply(select.value);
    try {
      if (select.value === DEFAULT) localStorage.removeItem('palette');
      else localStorage.setItem('palette', select.value);
      localStorage.removeItem('theme');
    } catch {}
  });
  picker.hidden = false;
}
for (const pre of document.querySelectorAll('.prose pre')) {
  if (!navigator.clipboard) continue;
  const code = pre.querySelector('code');
  if (!code) continue;
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'copy-button'; button.textContent = 'Copy';
  button.setAttribute('aria-label', 'Copy code example');
  pre.append(button);
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(code.textContent);
      button.textContent = 'Copied';
      document.getElementById('copy-status').textContent = 'Code copied to clipboard.';
      setTimeout(() => { button.textContent = 'Copy'; }, 2000);
    } catch { document.getElementById('copy-status').textContent = 'Copy unavailable. Select the code and copy it manually.'; }
  });
}
const toc = [...document.querySelectorAll('.toc-desktop a')];
if ('IntersectionObserver' in window && toc.length) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      toc.forEach(link => { if (decodeURIComponent(link.hash.slice(1)) === entry.target.id) link.setAttribute('aria-current','location'); else link.removeAttribute('aria-current'); });
    }
  }, { rootMargin: '-15% 0px -65% 0px' });
  document.querySelectorAll('.prose h2,.prose h3').forEach(el => observer.observe(el));
}
for (const btn of document.querySelectorAll('[data-video-expand]')) {
  const dialog = document.getElementById(btn.getAttribute('data-video-expand'));
  if (!dialog || typeof dialog.showModal !== 'function') continue;
  btn.hidden = false;
  const inlineVideo = btn.closest('.workspace-figure--video')?.querySelector('.workspace-video');
  const modalVideo = dialog.querySelector('.workspace-video--modal');
  btn.addEventListener('click', () => {
    if (inlineVideo && !inlineVideo.paused) inlineVideo.pause();
    if (modalVideo && inlineVideo && inlineVideo.currentTime > 0) {
      try { modalVideo.currentTime = inlineVideo.currentTime; } catch {}
    }
    dialog.showModal();
  });
  dialog.addEventListener('close', () => {
    if (modalVideo && !modalVideo.paused) modalVideo.pause();
  });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  for (const closeBtn of dialog.querySelectorAll('[data-video-close]')) {
    closeBtn.addEventListener('click', () => dialog.close());
  }
}
for (const link of document.querySelectorAll('.hero-actions a[href^="#"]')) {
  link.addEventListener('click', () => {
    const target = document.getElementById(link.getAttribute('href').slice(1));
    const video = target?.querySelector('video');
    if (video) video.focus({ preventScroll: true });
  });
}
