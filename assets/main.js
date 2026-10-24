(() => {
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('menu-toggle');
  const links = Array.from(document.querySelectorAll('.side-nav a'));
  const mobile = window.matchMedia('(max-width: 850px)');

  function setMenu(open) {
    if (!sidebar || !toggle) return;
    sidebar.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    const symbol = toggle.querySelector('span');
    if (symbol) symbol.textContent = open ? '×' : '☰';
    document.body.classList.toggle('nav-open', open && mobile.matches);
  }
  if (toggle) toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  links.forEach(link => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') setMenu(false); });
  document.addEventListener('click', event => {
    if (mobile.matches && sidebar?.classList.contains('is-open') && !sidebar.contains(event.target) && !toggle?.contains(event.target)) setMenu(false);
  });
  const onResize = () => { if (!mobile.matches) setMenu(false); };
  if (mobile.addEventListener) mobile.addEventListener('change', onResize);
  else if (mobile.addListener) mobile.addListener(onResize);

  const sectionMap = links.map(link => [link, document.getElementById(link.hash.slice(1))]).filter(pair => pair[1]);
  if (!('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(entries => {
    const visible = entries.filter(x => x.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    sectionMap.forEach(([link, section]) => {
      const active = section === visible.target;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-15% 0px -62% 0px', threshold: [0, 0.15, 0.35] });
  sectionMap.forEach(([, section]) => observer.observe(section));
})();
