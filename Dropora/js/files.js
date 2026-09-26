// files.js — holds file records for this session and renders the grid/list.
// Each record: {id, name, blob, size, type, addedAt, folderId, kind}
const Files = (() => {
  let files = [];
  let selected = new Set();
  let activeFilter = 'all';
  let activeFolder = null; // when set, only show files in this folder
  let searchTerm = '';

  const KIND_EXT = {
    image: ['png','jpg','jpeg','gif','webp','svg','bmp'],
    pdf: ['pdf'],
    document: ['doc','docx','txt','csv','json','md','xls','xlsx','rtf'],
    video: ['mp4','webm','mov','mkv','avi'],
    audio: ['mp3','wav','ogg','m4a','flac'],
    archive: ['zip','rar','7z','tar','gz'],
  };
  function kindOf(name) {
    const ext = name.split('.').pop().toLowerCase();
    for (const k in KIND_EXT) if (KIND_EXT[k].includes(ext)) return k;
    return 'other';
  }
  function readableSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    const units = ['KB','MB','GB']; let i = -1;
    do { bytes /= 1024; i++; } while (bytes >= 1024 && i < units.length - 1);
    return bytes.toFixed(1) + ' ' + units[i];
  }
  function readableDate(ts) {
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  function readableType(file) {
    const ext = file.name.split('.').pop().toUpperCase();
    return ext + ' file';
  }

  function add(fileList) {
    let count = 0;
    Array.from(fileList).forEach(f => {
      files.push({
        id: 'file' + Date.now() + Math.random().toString(36).slice(2),
        name: f.name, blob: f, size: f.size, type: f.type,
        addedAt: Date.now(), folderId: activeFolder, kind: kindOf(f.name),
      });
      count++;
    });
    if (count) UI.toast(count > 1 ? `${count} files added.` : 'File added successfully.');
    App.refreshCurrentView();
  }

  function all() { return files; }
  function unassignFolder(folderId) { files.forEach(f => { if (f.folderId === folderId) f.folderId = null; }); }

  function setFilter(f) { activeFilter = f; selected.clear(); App.refreshCurrentView(); }
  function setSearch(term) { searchTerm = term.toLowerCase(); App.refreshCurrentView(); }
  function setFolderScope(id) { activeFolder = id; selected.clear(); App.refreshCurrentView(); }
  function getFolderScope() { return activeFolder; }

  function visibleFiles() {
    return files.filter(f => {
      if (activeFolder && f.folderId !== activeFolder) return false;
      if (!activeFolder && activeFilter !== 'all' && activeFilter !== 'recent' && f.kind !== activeFilter) return false;
      if (searchTerm) {
        const hay = (f.name + ' ' + f.kind).toLowerCase();
        if (!hay.includes(searchTerm)) return false;
      }
      return true;
    }).sort((a, b) => activeFilter === 'recent' ? b.addedAt - a.addedAt : a.name.localeCompare(b.name));
  }

  function toggleSelect(id) {
    selected.has(id) ? selected.delete(id) : selected.add(id);
    App.refreshCurrentView();
  }
  function clearSelection() { selected.clear(); App.refreshCurrentView(); }
  function selectedRecords() { return files.filter(f => selected.has(f.id)); }

  function download(file) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file.blob);
    a.download = file.name;
    document.body.appendChild(a); a.click(); a.remove();
    UI.toast('Download started.');
  }
  function downloadMany(records) { records.forEach(download); }

  function renameFile(file) {
    UI.openGenericModal({
      title: 'Rename file',
      bodyHTML: `<input class="field" id="renameFileInput" value="${escapeAttr(file.name)}">`,
      buttons: [
        { label: 'Cancel', onClick: (m) => UI.closeModal(m) },
        { label: 'Save', className: 'btn-primary', onClick: (m) => {
            const v = document.getElementById('renameFileInput').value.trim();
            if (v) file.name = v;
            UI.closeModal(m); App.refreshCurrentView(); UI.toast('File renamed.');
        }},
      ],
    });
  }

  function moveFiles(records) {
    const opts = Folders.all().map(f => `<option value="${f.id}">${f.name}</option>`).join('')
      || '<option disabled>No folders yet — create one first</option>';
    UI.openGenericModal({
      title: `Move ${records.length} file${records.length > 1 ? 's' : ''}`,
      bodyHTML: `<select class="field" id="moveFolderSelect"><option value="">All Files (no folder)</option>${opts}</select>`,
      buttons: [
        { label: 'Cancel', onClick: (m) => UI.closeModal(m) },
        { label: 'Move', className: 'btn-primary', onClick: (m) => {
            const id = document.getElementById('moveFolderSelect').value || null;
            records.forEach(r => r.folderId = id);
            UI.closeModal(m); clearSelection(); UI.toast('Files moved.');
        }},
      ],
    });
  }

  function deleteFiles(records, opts = {}) {
    const settings = Store.getSettings();
    const proceed = () => {
      const ids = new Set(records.map(r => r.id));
      files = files.filter(f => !ids.has(f.id));
      records.forEach(r => selected.delete(r.id));
      App.refreshCurrentView();
      UI.toast(records.length > 1 ? 'Files deleted.' : 'File deleted.');
    };
    if (settings.confirmDelete && !opts.skipConfirm) {
      UI.openGenericModal({
        title: `Delete ${records.length > 1 ? records.length + ' files' : '"' + records[0].name + '"'}?`,
        bodyHTML: '<p>This can\'t be undone.</p>',
        buttons: [
          { label: 'Cancel', onClick: (m) => UI.closeModal(m) },
          { label: 'Delete', className: 'btn-danger', onClick: (m) => { UI.closeModal(m); proceed(); } },
        ],
      });
    } else proceed();
  }

  function fileInfo(file) {
    UI.openGenericModal({
      title: 'File information',
      bodyHTML: `<p><strong>Name:</strong> ${escapeHTML(file.name)}</p>
        <p><strong>Type:</strong> ${readableType(file)}</p>
        <p><strong>Size:</strong> ${readableSize(file.size)}</p>
        <p><strong>Added:</strong> ${new Date(file.addedAt).toLocaleString()}</p>
        <p><strong>Folder:</strong> ${file.folderId ? (Folders.byId(file.folderId)?.name || '—') : 'All Files'}</p>`,
      buttons: [{ label: 'Close', className: 'btn-primary', onClick: (m) => UI.closeModal(m) }],
    });
  }

  function iconFor(kind) {
    const paths = {
      image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5-9 9"/>',
      pdf: '<path d="M6 2h9l5 5v15H6z"/><path d="M9 13h6M9 17h6"/>',
      document: '<path d="M6 2h9l5 5v15H6z"/><path d="M15 2v5h5"/>',
      video: '<rect x="3" y="5" width="14" height="14" rx="2"/><path d="M17 9l4-2v10l-4-2z"/>',
      audio: '<path d="M9 18V6l10-2v12"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/>',
      archive: '<path d="M4 4h16v16H4z"/><path d="M10 4v16M14 4v16"/>',
      other: '<path d="M6 2h9l5 5v15H6z"/>',
    };
    return `<svg viewBox="0 0 24 24">${paths[kind] || paths.other}</svg>`;
  }

  function render(container, mode) {
    const list = visibleFiles();
    const empty = document.getElementById('emptyState');
    const noResults = document.getElementById('noResults');
    const selBar = document.getElementById('selectionBar');

    empty.classList.toggle('hidden', !(files.length === 0 && !activeFolder));
    noResults.classList.toggle('hidden', !(list.length === 0 && (files.length > 0 || activeFolder)));
    if (noResults) document.getElementById('noResultsQuery').textContent = searchTerm || '(filtered)';
    container.classList.toggle('hidden', list.length === 0);
    container.className = 'file-grid' + (mode === 'list' ? ' list-mode' : '') + (list.length === 0 ? ' hidden' : '');
    container.innerHTML = '';

    if (mode === 'list' && list.length) {
      const head = document.createElement('div');
      head.className = 'list-head';
      head.innerHTML = '<span>Name</span><span>Type</span><span>Size</span><span data-col="modified">Modified</span><span data-col="actions">Actions</span>';
      container.appendChild(head);
    }

    list.forEach(file => {
      const card = document.createElement('div');
      card.className = 'file-card' + (selected.has(file.id) ? ' selected' : '');
      if (mode === 'list') {
        card.innerHTML = `
          <div class="list-row-name">
            <span class="file-check ${selected.has(file.id) ? 'checked' : ''}"></span>
            ${iconFor(file.kind)}<span class="file-name">${escapeHTML(file.name)}</span>
          </div>
          <span class="muted">${file.kind}</span>
          <span class="muted">${readableSize(file.size)}</span>
          <span class="muted" data-col="modified">${readableDate(file.addedAt)}</span>
          <button class="file-more" data-col="actions" aria-label="More options">⋯</button>`;
      } else {
        card.innerHTML = `
          <span class="file-check ${selected.has(file.id) ? 'checked' : ''}"></span>
          <button class="file-more" aria-label="More options">⋯</button>
          <div class="file-thumb">${iconFor(file.kind)}</div>
          <div class="file-name">${escapeHTML(file.name)}</div>
          <div class="file-sub">${readableSize(file.size)} · ${readableDate(file.addedAt)}</div>`;
      }
      card.addEventListener('click', (e) => {
        if (e.target.closest('.file-check')) { toggleSelect(file.id); return; }
        if (e.target.closest('.file-more')) return;
        Preview.open(file);
      });
      card.querySelector('.file-more').addEventListener('click', (e) => {
        e.stopPropagation();
        const r = e.target.getBoundingClientRect();
        UI.openContextMenu(r.left, r.bottom + 4, [
          { label: 'Preview', onClick: () => Preview.open(file) },
          { label: 'Rename', onClick: () => renameFile(file) },
          { label: 'Download', onClick: () => download(file) },
          { label: 'Move', onClick: () => moveFiles([file]) },
          { label: 'File information', onClick: () => fileInfo(file) },
          { label: 'Delete', danger: true, onClick: () => deleteFiles([file]) },
        ]);
      });
      container.appendChild(card);
    });

    selBar.classList.toggle('hidden', selected.size === 0);
    document.getElementById('selectionCount').textContent = `${selected.size} selected`;
  }

  function escapeHTML(s) { return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function escapeAttr(s) { return s.replace(/"/g, '&quot;'); }

  return {
    add, all, render, setFilter, setSearch, setFolderScope, getFolderScope,
    clearSelection, selectedRecords, download, downloadMany, deleteFiles, moveFiles,
    unassignFolder, readableSize, readableDate, readableType,
  };
})();
