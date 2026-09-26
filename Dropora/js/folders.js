// folders.js — client-side folders. Folders are metadata only; a file's folderId
// points at a folder's id.
const Folders = (() => {
  let folders = Store.getFolders(); // [{id, name}]

  function persist() { Store.setFolders(folders); }
  function all() { return folders; }
  function byId(id) { return folders.find(f => f.id === id); }

  function create(name) {
    const folder = { id: 'f' + Date.now(), name: name.trim() || 'Untitled folder' };
    folders.push(folder);
    persist();
    return folder;
  }
  function rename(id, name) {
    const f = byId(id);
    if (f) { f.name = name.trim() || f.name; persist(); }
  }
  function remove(id) {
    folders = folders.filter(f => f.id !== id);
    persist();
    Files.unassignFolder(id);
  }

  function renderFolderGrid(container, onOpen) {
    container.innerHTML = '';
    if (!folders.length) {
      container.innerHTML = '<div class="empty-state"><h2>No folders yet</h2><p class="muted">Create one to start organizing your files.</p></div>';
      return;
    }
    folders.forEach(f => {
      const count = Files.all().filter(file => file.folderId === f.id).length;
      const card = document.createElement('div');
      card.className = 'folder-card';
      card.innerHTML = `<svg viewBox="0 0 24 24"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
        <div class="folder-name">${escapeHTML(f.name)}</div>
        <div class="folder-count">${count} file${count === 1 ? '' : 's'}</div>`;
      card.addEventListener('click', () => onOpen(f.id));
      card.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        UI.openContextMenu(e.clientX, e.clientY, [
          { label: 'Rename', onClick: () => promptRename(f) },
          { label: 'Delete', danger: true, onClick: () => confirmDelete(f) },
        ]);
      });
      container.appendChild(card);
    });
  }

  function promptRename(f) {
    UI.openGenericModal({
      title: 'Rename folder',
      bodyHTML: `<input class="field" id="renameFolderInput" value="${escapeHTML(f.name)}">`,
      buttons: [
        { label: 'Cancel', onClick: (m) => UI.closeModal(m) },
        { label: 'Save', className: 'btn-primary', onClick: (m) => {
            rename(f.id, document.getElementById('renameFolderInput').value);
            UI.closeModal(m); App.refreshCurrentView(); UI.toast('Folder renamed.');
        }},
      ],
    });
  }
  function confirmDelete(f) {
    UI.openGenericModal({
      title: 'Delete folder?',
      bodyHTML: `<p>“${escapeHTML(f.name)}” will be deleted. Files inside will move back to All Files.</p>`,
      buttons: [
        { label: 'Cancel', onClick: (m) => UI.closeModal(m) },
        { label: 'Delete', className: 'btn-danger', onClick: (m) => {
            remove(f.id); UI.closeModal(m); App.refreshCurrentView(); UI.toast('Folder deleted.');
        }},
      ],
    });
  }

  function escapeHTML(s) { return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  return { all, byId, create, rename, remove, renderFolderGrid, promptRename };
})();
