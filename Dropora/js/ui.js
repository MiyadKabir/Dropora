// ui.js — toasts, modals, theme application, mobile drawer, context menu.
const UI = (() => {
  function toast(message) {
    const stack = document.getElementById('toastStack');
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    stack.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .25s'; }, 2200);
    setTimeout(() => el.remove(), 2500);
  }

  function applyTheme(mode) {
    const resolved = mode === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : mode;
    document.body.setAttribute('data-theme', resolved);
    document.querySelectorAll('[data-theme-opt]').forEach(b =>
      b.classList.toggle('is-active', b.dataset.themeOpt === mode));
  }

  function openModal(el) { el.classList.remove('hidden'); }
  function closeModal(el) { el.classList.add('hidden'); }

  function openGenericModal({ title, bodyHTML, buttons }) {
    const modal = document.getElementById('genericModal');
    document.getElementById('genericModalTitle').textContent = title;
    document.getElementById('genericModalBody').innerHTML = bodyHTML;
    const footer = document.getElementById('genericModalFooter');
    footer.innerHTML = '';
    buttons.forEach(b => {
      const btn = document.createElement('button');
      btn.className = 'btn ' + (b.className || 'btn-ghost');
      btn.textContent = b.label;
      btn.addEventListener('click', () => b.onClick(modal));
      footer.appendChild(btn);
    });
    openModal(modal);
    return modal;
  }

  let openMenuEl = null;
  function closeMenu() { if (openMenuEl) { openMenuEl.remove(); openMenuEl = null; } }
  function openContextMenu(x, y, items) {
    closeMenu();
    const menu = document.createElement('div');
    menu.className = 'menu';
    items.forEach(item => {
      const btn = document.createElement('button');
      if (item.danger) btn.classList.add('danger');
      btn.textContent = item.label;
      btn.addEventListener('click', () => { closeMenu(); item.onClick(); });
      menu.appendChild(btn);
    });
    document.body.appendChild(menu);
    const rect = menu.getBoundingClientRect();
    menu.style.left = Math.min(x, window.innerWidth - rect.width - 10) + 'px';
    menu.style.top = Math.min(y, window.innerHeight - rect.height - 10) + 'px';
    openMenuEl = menu;
  }
  document.addEventListener('click', (e) => { if (openMenuEl && !openMenuEl.contains(e.target)) closeMenu(); });

  document.addEventListener('click', (e) => {
    if (e.target.matches('[data-close-modal]')) closeModal(e.target.closest('.modal-overlay'));
    if (e.target.classList.contains('modal-overlay')) closeModal(e.target);
  });

  function initDrawer() {
    const sidebar = document.getElementById('sidebar');
    const scrim = document.getElementById('drawerScrim');
    const toggle = document.getElementById('drawerToggle');
    const open = () => { sidebar.classList.add('open'); scrim.classList.add('open'); toggle.setAttribute('aria-expanded', 'true'); };
    const close = () => { sidebar.classList.remove('open'); scrim.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); };
    toggle.addEventListener('click', () => sidebar.classList.contains('open') ? close() : open());
    scrim.addEventListener('click', close);
    sidebar.querySelectorAll('.nav-item').forEach(b => b.addEventListener('click', close));
  }

  return { toast, applyTheme, openModal, closeModal, openGenericModal, openContextMenu, closeMenu, initDrawer };
})();
