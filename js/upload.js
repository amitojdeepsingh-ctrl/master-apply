/**
 * upload.js
 * Handles document uploads to Supabase Storage.
 * Replace SUPABASE_URL and SUPABASE_ANON_KEY with your project values.
 */

const SUPABASE_URL      = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
const BUCKET            = 'student-documents';

const uploadedDocs = {};  // { docType: { name, path, url } }

async function uploadFile(file, docType, studentEmail) {
  const ext      = file.name.split('.').pop();
  const safeName = studentEmail.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const path     = `${safeName}/${docType}_${Date.now()}.${ext}`;

  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`,
    {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type':  file.type || 'application/octet-stream',
        'x-upsert':      'true',
      },
      body: file,
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Upload failed: ${err}`);
  }

  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
  return { name: file.name, path, url: publicUrl };
}

// ── Wire up all file inputs ───────────────────────────────────────────
function initUploads() {
  document.querySelectorAll('.doc-input').forEach(input => {
    input.addEventListener('change', async function() {
      const docType = this.dataset.doc;
      const files   = Array.from(this.files);
      if (!files.length) return;

      const statusEl  = document.getElementById(`status-${docType}`);
      const itemEl    = document.getElementById(`doc-${docType}`);
      const email     = document.getElementById('email').value.trim() || 'unknown';

      statusEl.textContent = 'Uploading...';
      statusEl.style.color = '#64748B';

      try {
        const results = [];
        for (const file of files) {
          const r = await uploadFile(file, docType, email);
          results.push(r);
        }
        uploadedDocs[docType] = results;
        statusEl.textContent = files.length > 1
          ? `${files.length} files uploaded ✓`
          : `${files[0].name} ✓`;
        statusEl.style.color = '#22C55E';
        itemEl.classList.add('uploaded');
      } catch (e) {
        console.error(e);
        statusEl.textContent = 'Upload failed — will attach on submit';
        statusEl.style.color = '#F59E0B';
      }
    });
  });
}

function getUploadedDocs() {
  return uploadedDocs;
}
