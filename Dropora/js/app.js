// app.js — wires everything together once the DOM is ready.
const App = (() => {
  let currentView = 'files';
  let viewMode = Store.getViewMode();

  function refreshCurrentView() {
    if (currentView === 'files') {
      Files.render(document.getElementById('fileGrid'), viewMode);
    } else if (currentView === 'folders') {
      Folders.renderFolderGrid(document.getElementById('folderGrid'), openFolder);
    } else if (currentView === 'storage') {
      renderStorageStats();
    }
  }

  function openFolder(id) {
    Files.setFolderScope(id);
    switchView('files');
  }

  function switchView(name) {
    currentView = name;
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById('view-' + name).classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('is-active'));
    const activeBtn = document.querySelector(`.nav-item[data-view="${name}"]`) ||
      document.querySelector('.nav-item[data-filter="all"]');
    if (activeBtn) activeBtn.classList.add('is-active');
    refreshCurrentView();
  }

  function renderStorageStats() {
    const files = Files.all();
    const totalBytes = files.reduce((s, f) => s + f.size, 0);
    document.getElementById('statFiles').textContent = files.length;
    document.getElementById('statFolders').textContent = Folders.all().length;
    document.getElementById('statSize').textContent = Files.readableSize(totalBytes);
  }

  function runIntro() {
    const intro = document.getElementById('intro');
    setTimeout(() => {
      intro.classList.add('leaving');
      document.getElementById('app').classList.remove('hidden');
      setTimeout(() => intro.remove(), 650);
    }, 2600);
  }

  function initNav() {
    document.querySelectorAll('.nav-item[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        Files.setFolderScope(null);
        const chip = document.querySelector(`.chip[data-chip="${btn.dataset.filter === 'recent' ? 'all' : btn.dataset.filter}"]`);
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('is-active'));
        if (chip) chip.classList.add('is-active');
        Files.setFilter(btn.dataset.filter);
        switchView('files');
      });
    });
    document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
      btn.addEventListener('click', () => switchView(btn.dataset.view));
    });
  }

  function initFilterChips() {
    document.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        Files.setFolderScope(null);
        Files.setFilter(chip.dataset.chip);
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('is-active'));
        document.querySelector('.nav-item[data-filter="all"]').classList.add('is-active');
      });
    });
  }

  function initSearch() {
    document.getElementById('searchInput').addEventListener('input', (e) => Files.setSearch(e.target.value));
  }

  function initViewToggle() {
    const gridBtn = document.getElementById('viewGridBtn'), listBtn = document.getElementById('viewListBtn');
    function set(mode) {
      viewMode = mode; Store.setViewMode(mode);
      gridBtn.classList.toggle('is-active', mode === 'grid'); gridBtn.setAttribute('aria-pressed', mode === 'grid');
      listBtn.classList.toggle('is-active', mode === 'list'); listBtn.setAttribute('aria-pressed', mode === 'list');
      refreshCurrentView();
    }
    gridBtn.addEventListener('click', () => set('grid'));
    listBtn.addEventListener('click', () => set('list'));
    set(viewMode);
  }

  function initDropzone() {
    const dz = document.getElementById('dropzone');
    const input = document.getElementById('fileInput');
    dz.addEventListener('click', () => input.click());
    document.getElementById('emptyChooseBtn').addEventListener('click', () => input.click());
    input.addEventListener('change', (e) => Files.add(e.target.files));
    ['dragenter', 'dragover'].forEach(evt => dz.addEventListener(evt, (e) => {
      e.preventDefault(); dz.classList.add('drag-over');
    }));
    ['dragleave', 'drop'].forEach(evt => dz.addEventListener(evt, (e) => {
      e.preventDefault(); dz.classList.remove('drag-over');
    }));
    dz.addEventListener('drop', (e) => { if (e.dataTransfer.files.length) Files.add(e.dataTransfer.files); });
    // Allow dropping anywhere on the window while on the files view.
    window.addEventListener('dragover', (e) => e.preventDefault());
    window.addEventListener('drop', (e) => e.preventDefault());
  }

  function initSelectionBar() {
    document.getElementById('selectionBar').addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (!action) return;
      const records = Files.selectedRecords();
      if (!records.length) return;
      if (action === 'download') Files.downloadMany(records);
      if (action === 'move') Files.moveFiles(records);
      if (action === 'delete') Files.deleteFiles(records);
    });
  }

  function initThemeToggle() {
    document.getElementById('themeToggle').addEventListener('click', () => {
      const settings = Store.getSettings();
      const next = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      settings.themeMode = next; Store.setSettings(settings);
      UI.applyTheme(next);
    });
  }

  function initSettingsPage() {
    const settings = Store.getSettings();
    document.querySelectorAll('[data-theme-opt]').forEach(b => b.addEventListener('click', () => {
      settings.themeMode = b.dataset.themeOpt; Store.setSettings(settings); UI.applyTheme(b.dataset.themeOpt);
    }));
    document.querySelectorAll('[data-defaultview-opt]').forEach(b => {
      b.classList.toggle('is-active', b.dataset.defaultviewOpt === settings.defaultView);
      b.addEventListener('click', () => {
        document.querySelectorAll('[data-defaultview-opt]').forEach(x => x.classList.remove('is-active'));
        b.classList.add('is-active');
        settings.defaultView = b.dataset.defaultviewOpt; Store.setSettings(settings);
      });
    });
    const confirmToggle = document.getElementById('confirmDeleteToggle');
    confirmToggle.checked = settings.confirmDelete;
    confirmToggle.addEventListener('change', () => { settings.confirmDelete = confirmToggle.checked; Store.setSettings(settings); });

    document.getElementById('clearWorkspaceBtn').addEventListener('click', () => {
      UI.openGenericModal({
        title: 'Clear local workspace?',
        bodyHTML: '<p>All files and folders in this session will be removed. This can\'t be undone.</p>',
        buttons: [
          { label: 'Cancel', onClick: (m) => UI.closeModal(m) },
          { label: 'Clear workspace', className: 'btn-danger', onClick: (m) => {
              Files.deleteFiles(Files.all(), { skipConfirm: true });
              Folders.all().slice().forEach(f => Folders.remove(f.id));
              UI.closeModal(m); refreshCurrentView(); UI.toast('Workspace cleared.');
          }},
        ],
      });
    });

    document.getElementById('exportMetaBtn').addEventListener('click', () => {
      const meta = {
        exportedAt: new Date().toISOString(),
        folders: Folders.all(),
        files: Files.all().map(f => ({ name: f.name, size: f.size, type: f.type, kind: f.kind, addedAt: f.addedAt, folderId: f.folderId })),
      };
      const blob = new Blob([JSON.stringify(meta, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'dropora-workspace.json';
      document.body.appendChild(a); a.click(); a.remove();
      UI.toast('Workspace metadata exported.');
    });
  }

  function initNewFolder() {
    document.getElementById('newFolderBtn').addEventListener('click', () => {
      UI.openGenericModal({
        title: 'New folder',
        bodyHTML: '<input class="field" id="newFolderInput" placeholder="Folder name" autofocus>',
        buttons: [
          { label: 'Cancel', onClick: (m) => UI.closeModal(m) },
          { label: 'Create', className: 'btn-primary', onClick: (m) => {
              const v = document.getElementById('newFolderInput').value;
              if (v.trim()) { Folders.create(v); UI.toast('Folder created.'); refreshCurrentView(); }
              UI.closeModal(m);
          }},
        ],
      });
    });
  }

  function init() {
    const settings = Store.getSettings();
    viewMode = settings.defaultView || viewMode;
    UI.applyTheme(settings.themeMode || Store.getTheme());
    UI.initDrawer();
    initNav(); initFilterChips(); initSearch(); initViewToggle();
    initDropzone(); initSelectionBar(); initThemeToggle(); initSettingsPage(); initNewFolder();
    runIntro();
    switchView('files');
  }

  document.addEventListener('DOMContentLoaded', init);
  return { refreshCurrentView, switchView };
})();
