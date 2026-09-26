// preview.js — opens the preview modal for a given file record.
const Preview = (() => {
  function open(file) {
    document.getElementById('previewName').textContent = file.name;
    document.getElementById('previewMeta').textContent =
      `${Files.readableType(file)} · ${Files.readableSize(file.size)} · added ${Files.readableDate(file.addedAt)}`;
    const body = document.getElementById('previewBody');
    body.innerHTML = '';
    const url = URL.createObjectURL(file.blob);

    if (file.kind === 'image') {
      body.innerHTML = `<div class="preview-media"><img src="${url}" alt="${escapeAttr(file.name)}"></div>`;
    } else if (file.kind === 'pdf') {
      body.innerHTML = `<div class="preview-media"><iframe src="${url}" title="${escapeAttr(file.name)}"></iframe></div>`;
    } else if (file.kind === 'audio') {
      body.innerHTML = `<div class="preview-media"><audio controls src="${url}"></audio></div>`;
    } else if (file.kind === 'video') {
      body.innerHTML = `<div class="preview-media"><video controls src="${url}"></video></div>`;
    } else if (file.kind === 'document' && /\.(txt|csv|json|md)$/i.test(file.name)) {
      file.blob.text().then(t => {
        body.innerHTML = `<pre class="preview-text">${escapeHTML(t.slice(0, 20000))}</pre>`;
      });
    } else {
      body.innerHTML = `<div class="empty-state"><h2>Preview unavailable</h2>
        <p class="muted">Dropora can't render this file type inline. You can still download it below.</p></div>`;
    }

    document.getElementById('previewDownloadBtn').onclick = () => Files.download(file);
    UI.openModal(document.getElementById('previewModal'));
  }

  function escapeHTML(s) { return s.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }
  function escapeAttr(s) { return s.replace(/"/g, '&quot;'); }

  return { open };
})();
