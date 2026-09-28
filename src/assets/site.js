// Colour scheme picker. Without JavaScript the system preference alone
// selects the DevCapsule day or night palette; a chosen scheme is stored per
// browser, and the empty choice returns to following the system.
const picker = document.querySelector('.palette-picker');
if (picker) {
  const select = picker.querySelector('select');
  const root = document.documentElement;
  const known = [...select.options].map((o) => o.value).filter(Boolean);
  const stored = () => { try { return localStorage.getItem('palette'); } catch { return null; } };
  const apply = (value) => {
    if (known.includes(value)) root.setAttribute('data-palette', value);
    else root.removeAttribute('data-palette');
    select.value = known.includes(value) ? value : '';
  };
  apply(root.getAttribute('data-palette') || stored() || '');
  select.addEventListener('change', () => {
    apply(select.value);
    try {
      if (select.value) localStorage.setItem('palette', select.value);
      else localStorage.removeItem('palette');
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
