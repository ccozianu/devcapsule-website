// Night mode switch. Without JavaScript the system preference alone applies
// through prefers-color-scheme; the switch stores only a deviation from it.
const themeToggle = document.querySelector('.theme-toggle');
if (themeToggle) {
  const systemDark = matchMedia('(prefers-color-scheme: dark)');
  const stored = () => { try { return localStorage.getItem('theme'); } catch { return null; } };
  const effective = () => stored() || (systemDark.matches ? 'dark' : 'light');
  const apply = () => {
    const choice = stored();
    if (choice) document.documentElement.setAttribute('data-theme', choice);
    else document.documentElement.removeAttribute('data-theme');
    themeToggle.setAttribute('aria-pressed', String(effective() === 'dark'));
  };
  themeToggle.addEventListener('click', () => {
    const next = effective() === 'dark' ? 'light' : 'dark';
    try {
      if (next === (systemDark.matches ? 'dark' : 'light')) localStorage.removeItem('theme');
      else localStorage.setItem('theme', next);
    } catch {}
    document.documentElement.setAttribute('data-theme', next);
    themeToggle.setAttribute('aria-pressed', String(next === 'dark'));
  });
  systemDark.addEventListener('change', apply);
  apply();
  themeToggle.hidden = false;
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
