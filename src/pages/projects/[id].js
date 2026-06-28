import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { projects, documents, approvals, notifications, folders as foldersApi, documentTypes as docTypesApi } from '../../lib/api';
import Topbar from '../../components/Topbar';

// ── Helpers ───────────────────────────────────────────────────────────────────

const typeColors  = { DWG:'#DBEAFE', PDF:'#FEE2E2', DOC:'#DCFCE7', DOCX:'#DCFCE7' };
const typeText    = { DWG:'#1D4ED8', PDF:'#991B1B', DOC:'#166534', DOCX:'#166534' };
const statusBg    = { APPROVED:'#DCFCE7', PENDING:'#FEF9C3', REJECTED:'#FEE2E2', DRAFT:'#F1F5F9', IN_REVIEW:'#EDE9FE' };
const statusColor = { APPROVED:'#15803D', PENDING:'#A16207', REJECTED:'#DC2626', DRAFT:'#64748B', IN_REVIEW:'#7C3AED' };
const statusLabel = { APPROVED:'Approved', PENDING:'Pending', REJECTED:'Rejected', DRAFT:'Draft', IN_REVIEW:'In Review' };

const DISCIPLINES = ['Architectural','Structural','Mep','Civil','Landscape'];

function getFileType(fileName = '') {
  const ext = fileName.split('.').pop().toUpperCase();
  return ['DWG','PDF','DOC','DOCX'].includes(ext) ? ext : 'FILE';
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
}

function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function FolderIcon({ color = '#94A3B8' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1.5 5C1.5 4.17 2.17 3.5 3 3.5H6L7.5 5H13c.83 0 1.5.67 1.5 1.5V12c0 .83-.67 1.5-1.5 1.5H3C2.17 13.5 1.5 12.83 1.5 12V5z"
        fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1.2"/>
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M4.5 3L7.5 6L4.5 9" stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5.5" stroke="#2563EB" strokeWidth="1.3"/>
      <path d="M7 4.5V7L8.5 8.5" stroke="#2563EB" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}


function AdvancedSearchModal({ onClose, onSearch, folderList }) {
  const [form, setForm] = useState({ title: '', status: '', extension: '', folderId: '' });
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
      <div style={{ background:'#fff', borderRadius:'14px', padding:'28px', width:'500px', boxShadow:'0 8px 40px rgba(0,0,0,0.15)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
          <div style={{ fontSize:'16px', fontWeight:700, color:'#1E293B' }}>Advanced Search</div>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:'18px', cursor:'pointer', color:'#94A3B8' }}>×</button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'16px' }}>
          <div>
            <label style={{ fontSize:'12px', fontWeight:600, color:'#475569', display:'block', marginBottom:'4px' }}>Search by title</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Document title..."
              style={{ width:'100%', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', outline:'none', boxSizing:'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize:'12px', fontWeight:600, color:'#475569', display:'block', marginBottom:'4px' }}>Search by extension</label>
            <input value={form.extension} onChange={e => setForm(f => ({ ...f, extension: e.target.value }))}
              placeholder="e.g. pdf, dwg, docx..."
              style={{ width:'100%', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', outline:'none', boxSizing:'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize:'12px', fontWeight:600, color:'#475569', display:'block', marginBottom:'4px' }}>Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              style={{ width:'100%', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', background:'#fff', boxSizing:'border-box' }}>
              <option value=''>Any status</option>
              {['DRAFT','IN_REVIEW','APPROVED','REJECTED','PENDING'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:'12px', fontWeight:600, color:'#475569', display:'block', marginBottom:'4px' }}>Search in folder</label>
            <select value={form.folderId} onChange={e => setForm(f => ({ ...f, folderId: e.target.value }))}
              style={{ width:'100%', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', background:'#fff', boxSizing:'border-box' }}>
              <option value=''>Any folder</option>
              {folderList.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
          <button onClick={() => { onSearch({ title:'', status:'', extension:'', folderId:'' }); onClose(); }}
            style={{ padding:'8px 18px', border:'1px solid #E2E8F0', borderRadius:'8px', background:'#fff', fontSize:'13px', cursor:'pointer', color:'#475569' }}>
            Reset
          </button>
          <button onClick={() => { onSearch(form); onClose(); }}
            style={{ padding:'8px 20px', border:'none', borderRadius:'8px', background:'#2563EB', color:'#fff', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>
            Search
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Upload Modal ──────────────────────────────────────────────────────────────

function UploadModal({ projectId, onClose, onUploaded, folderList = [], docTypeList = [], onAddDocType }) {
  const [file, setFile]       = useState(null);
  const [title, setTitle]     = useState('');
  const [docType, setDocType] = useState('');
 const [folderId, setFolderId] = useState('');
 const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const fileRef = useRef();

  const handleUpload = async () => {
  if (!file) { setError('Please select a file'); return; }
  setLoading(true); setError('');
  try {
    // Step 1 — upload file to Cloudinary
    const token = typeof window !== 'undefined' ? localStorage.getItem('orarch_token') : null;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId);
    const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/files/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const uploadData = await uploadRes.json();
    if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed');

    // Step 2 — save document metadata + Cloudinary URL
    await documents.create({
      projectId,
      title: title || file.name,
      documentType: docType,
      folderId,
      description,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      currentVersion: '1.0',
      fileUrl: uploadData.url,
      publicId: uploadData.publicId,
    });
    onUploaded(); onClose();
  } catch (err) {
    setError(err.message || 'Upload failed');
  } finally { setLoading(false); }
};

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
      <div style={{ background:'#fff', borderRadius:'14px', padding:'28px', width:'420px', boxShadow:'0 8px 40px rgba(0,0,0,0.15)' }}>
        <div style={{ fontSize:'16px', fontWeight:700, color:'#1E293B', marginBottom:'20px' }}>Upload Document</div>
        <div style={{ border:'2px dashed #93C5FD', borderRadius:'10px', background:'#EFF6FF', padding:'20px', textAlign:'center', marginBottom:'16px', cursor:'pointer' }}
          onClick={() => fileRef.current.click()}>
          <input ref={fileRef} type="file" style={{ display:'none' }} accept=".dwg,.pdf,.doc,.docx,.xls,.xlsx,.jpg,.png"
            onChange={e => { setFile(e.target.files[0]); setTitle(e.target.files[0]?.name || ''); }} />
          {file
            ? <div style={{ fontSize:'13px', color:'#2563EB', fontWeight:600 }}>📄 {file.name}</div>
            : <div style={{ fontSize:'13px', color:'#94A3B8' }}>Click to select file<br/><span style={{ fontSize:'11px' }}>DWG, PDF, DOC, DOCX</span></div>
          }
        </div>
        <div style={{ marginBottom:'12px' }}>
          <label style={{ fontSize:'12px', fontWeight:600, color:'#475569', display:'block', marginBottom:'4px' }}>Title</label>
          <div style={{ marginBottom:'12px' }}>
          <label style={{ fontSize:'12px', fontWeight:600, color:'#475569', display:'block', marginBottom:'4px' }}>Description <span style={{ fontWeight:400, color:'#94A3B8' }}>(optional)</span></label>
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of this document..."
            style={{ width:'100%', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', outline:'none', boxSizing:'border-box' }} />
        </div>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Document title"
            style={{ width:'100%', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', outline:'none', boxSizing:'border-box' }} />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'16px' }}>
          <div>
            <label style={{ fontSize:'12px', fontWeight:600, color:'#475569', display:'block', marginBottom:'4px' }}>Type</label>
            <select value={docType} onChange={e => { if (e.target.value === '__add__') { onAddDocType(); } else { setDocType(e.target.value); } }}
              style={{ width:'100%', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', background:'#fff' }}>
              <option value="">-- Select type --</option>
              {docTypeList.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              <option value="__add__">+ Add new type...</option>
            </select>
          </div>
          <div>
           <label style={{ fontSize:'12px', fontWeight:600, color:'#475569', display:'block', marginBottom:'4px' }}>Folder</label>
            <select value={folderId} onChange={e => setFolderId(e.target.value)}
              style={{ width:'100%', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', background:'#fff' }}>
              <option value="">-- Select folder --</option>
{folderList.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
        </div>
        {error && <div style={{ background:'#FEE2E2', color:'#DC2626', fontSize:'12px', padding:'8px 12px', borderRadius:'6px', marginBottom:'12px' }}>{error}</div>}
        <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'8px 18px', border:'1px solid #E2E8F0', borderRadius:'8px', background:'#fff', fontSize:'13px', cursor:'pointer', color:'#475569' }}>Cancel</button>
          <button onClick={handleUpload} disabled={loading}
            style={{ padding:'8px 20px', border:'none', borderRadius:'8px', background: loading ? '#93C5FD' : '#2563EB', color:'#fff', fontSize:'13px', fontWeight:600, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Approval Modal ────────────────────────────────────────────────────────────

function ApprovalModal({ document: doc, projectId, onClose, onSent }) {
  const [title, setTitle]       = useState(`Review: ${doc?.title || ''}`);
  const [description, setDesc]  = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSend = async () => {
    setLoading(true); setError('');
    try {
      await approvals.create({ documentId: doc.id, projectId, title, description, priority });
      await documents.update(doc.id, { status: 'IN_REVIEW' });
      onSent(); onClose();
    } catch (err) { setError(err.message || 'Failed to send'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
      <div style={{ background:'#fff', borderRadius:'14px', padding:'28px', width:'400px', boxShadow:'0 8px 40px rgba(0,0,0,0.15)' }}>
        <div style={{ fontSize:'16px', fontWeight:700, color:'#1E293B', marginBottom:'4px' }}>Send for Approval</div>
        <div style={{ fontSize:'12px', color:'#94A3B8', marginBottom:'20px' }}>📄 {doc?.title}</div>
        {[
          { label:'Approval Title', value:title, set:setTitle, placeholder:'e.g. Review Floor Plan Rev 4' },
          { label:'Description', value:description, set:setDesc, placeholder:'What needs to be reviewed?' },
        ].map(({ label, value, set, placeholder }) => (
          <div key={label} style={{ marginBottom:'12px' }}>
            <label style={{ fontSize:'12px', fontWeight:600, color:'#475569', display:'block', marginBottom:'4px' }}>{label}</label>
            <input value={value} onChange={e => set(e.target.value)} placeholder={placeholder}
              style={{ width:'100%', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', outline:'none', boxSizing:'border-box' }} />
          </div>
        ))}
        <div style={{ marginBottom:'20px' }}>
          <label style={{ fontSize:'12px', fontWeight:600, color:'#475569', display:'block', marginBottom:'4px' }}>Priority</label>
          <select value={priority} onChange={e => setPriority(e.target.value)}
            style={{ width:'100%', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', background:'#fff' }}>
            {['LOW','NORMAL','HIGH','URGENT'].map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        {error && <div style={{ background:'#FEE2E2', color:'#DC2626', fontSize:'12px', padding:'8px 12px', borderRadius:'6px', marginBottom:'12px' }}>{error}</div>}
        <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'8px 18px', border:'1px solid #E2E8F0', borderRadius:'8px', background:'#fff', fontSize:'13px', cursor:'pointer', color:'#475569' }}>Cancel</button>
          <button onClick={handleSend} disabled={loading}
            style={{ padding:'8px 20px', border:'none', borderRadius:'8px', background: loading ? '#93C5FD' : '#2563EB', color:'#fff', fontSize:'13px', fontWeight:600, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Sending...' : 'Send for Approval'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── File Thumbnail ────────────────────────────────────────────────────────────

function FileThumbnail({ file }) {
  const fType = getFileType(file.fileName);
  const color = typeText[fType] || '#475569';
  const bg = typeColors[fType] || '#F1F5F9';
  return (
    <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:'8px', overflow:'hidden', width:'160px', flexShrink:0 }}>
      <div style={{ height:'90px', background: bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ fontSize:'24px', fontWeight:800, color, opacity:0.4 }}>{fType}</div>
      </div>
      <div style={{ padding:'8px 10px' }}>
        <div style={{ fontSize:'12px', fontWeight:600, color:'#1E293B', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {file.title || file.fileName}
        </div>
        <div style={{ fontSize:'11px', color:'#94A3B8', marginTop:'2px' }}>
          {file.discipline ? file.discipline.charAt(0) + file.discipline.slice(1).toLowerCase() : '—'} · {formatDate(file.createdAt)}
        </div>
      </div>
    </div>
  );
}

function PdfPreview({ url }) {
  const canvasRef = useRef();
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!url) return;
    setLoaded(false);
    setError(false);

    const loadPdf = async () => {
      try {
        if (!window.pdfjsLib) {
          await new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            s.onload = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
          });
        }
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

   const token = localStorage.getItem('orarch_token');
        const proxyUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/files/proxy?url=${encodeURIComponent(url)}`;
        const pdf = await window.pdfjsLib.getDocument({
          url: proxyUrl,
          httpHeaders: { Authorization: `Bearer ${token}` },
          withCredentials: false,
        }).promise;

        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        setLoaded(true);
      } catch (err) {
        console.error('PDF load error:', err);
        setError(true);
      }
    };

    loadPdf();
  }, [url]);

  return (
    <div style={{ width:'100%', height:'100%', background:'#525659', display:'flex', alignItems:'center', justifyContent:'center', overflow:'auto', position:'relative' }}>
      {!loaded && !error && (
        <div style={{ color:'#ccc', fontSize:'13px' }}>Loading PDF...</div>
      )}
      {error && (
        <div style={{ color:'#ccc', fontSize:'13px', textAlign:'center' }}>
          <div style={{ fontSize:'48px', marginBottom:'12px' }}>📄</div>
          <div>Cannot preview this file</div>
          <button onClick={() => window.open(url, '_blank')}
            style={{ marginTop:'12px', background:'#2563EB', color:'#fff', border:'none', borderRadius:'8px', padding:'8px 20px', fontSize:'13px', cursor:'pointer' }}>
            Open in Browser
          </button>
        </div>
      )}
      <canvas ref={canvasRef} style={{ display: loaded ? 'block' : 'none', boxShadow:'0 4px 24px rgba(0,0,0,0.5)', maxWidth:'90%' }} />
    </div>
  );
}
function DocumentSlidePanel({ doc, projectId, onClose, user, allDocs = [] }) {
  const [activeTab, setActiveTab] = useState('Info');
  const [comments, setComments] = useState([]);
  const [message, setMessage] = useState('');
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
  const token = typeof window !== 'undefined' ? localStorage.getItem('orarch_token') : null;

  const currentIndex = allDocs.findIndex(d => d.id === doc.id);
  const prevDoc = currentIndex > 0 ? allDocs[currentIndex - 1] : null;
  const nextDoc = currentIndex < allDocs.length - 1 ? allDocs[currentIndex + 1] : null;

  useEffect(() => { if (doc) loadComments(); }, [doc]);

  const loadComments = async () => {
    try {
      const res = await fetch(`${BASE_URL}/comments?documentId=${doc.id}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setComments(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
  };

  const sendComment = async () => {
    if (!message.trim()) return;
    try {
      await fetch(`${BASE_URL}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ documentId: doc.id, content: message, authorName: `${user.firstName} ${user.lastName}` })
      });
      setMessage(''); loadComments();
    } catch (err) { console.error(err); }
  };

  function formatSize(bytes) {
    if (!bytes) return '—';
    if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    if (bytes > 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${bytes} B`;
  }

  const tabs = ['Communication', 'Workflows', 'Versions', 'History'];

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', top:0, left:'80px', right:0, bottom:0, background:'rgba(0,0,0,0.3)', zIndex:200 }} />
     <div style={{ position:'fixed', top:0, left:'80px', right:0, height:'100vh', background:'#fff', zIndex:201, display:'flex', flexDirection:'column', boxShadow:'-4px 0 24px rgba(0,0,0,0.15)', animation:'slideIn 0.25s ease-out' }}>

        {/* Toolbar */}
        <div style={{ padding:'10px 16px', borderBottom:'1px solid #E2E8F0', display:'flex', alignItems:'center', gap:'10px', background:'#fff' }}>
          <span style={{ fontSize:'14px', fontWeight:700, color:'#1E293B', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{doc.title || doc.fileName}</span>
          <span style={{ background:'#EFF6FF', color:'#2563EB', fontSize:'11px', fontWeight:600, padding:'2px 8px', borderRadius:'4px', flexShrink:0 }}>v{doc.currentVersion || '1.0'}</span>
          <div style={{ display:'flex', gap:'4px', flexShrink:0 }}>
            <button onClick={() => prevDoc && onClose(prevDoc)} disabled={!prevDoc}
              style={{ background:'none', border:'1px solid #E2E8F0', borderRadius:'4px', padding:'4px 8px', cursor: prevDoc ? 'pointer' : 'not-allowed', color: prevDoc ? '#475569' : '#CBD5E1', fontSize:'14px' }}>‹</button>
            <button onClick={() => nextDoc && onClose(nextDoc)} disabled={!nextDoc}
              style={{ background:'none', border:'1px solid #E2E8F0', borderRadius:'4px', padding:'4px 8px', cursor: nextDoc ? 'pointer' : 'not-allowed', color: nextDoc ? '#475569' : '#CBD5E1', fontSize:'14px' }}>›</button>
          </div>
          <button onClick={() => { if (doc.fileUrl) router.push('/viewer?url=' + encodeURIComponent(doc.fileUrl) + '&title=' + encodeURIComponent(doc.title || doc.fileName)); else alert('No file attached yet.'); }}
            style={{ background:'#2563EB', color:'#fff', border:'none', borderRadius:'6px', padding:'6px 14px', fontSize:'12px', fontWeight:600, cursor:'pointer', flexShrink:0 }}>
            Download
          </button>
          <button onClick={() => { if (doc.fileUrl) router.push('/viewer?url=' + encodeURIComponent(doc.fileUrl) + '&title=' + encodeURIComponent(doc.title || doc.fileName)); else alert('No file attached yet.'); }}
            style={{ background:'#F1F5F9', color:'#475569', border:'none', borderRadius:'6px', padding:'6px 14px', fontSize:'12px', cursor:'pointer', flexShrink:0 }}>
            Open in viewer
          </button>
          <button style={{ background:'#F1F5F9', color:'#475569', border:'none', borderRadius:'6px', padding:'6px 10px', fontSize:'14px', cursor:'pointer', flexShrink:0 }}>···</button>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'#94A3B8', flexShrink:0 }}>×</button>
        </div>

        {/* Content */}
        <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

          {/* PDF Preview */}
          <div style={{ flex:1, background:'#E2E8F0', overflow:'hidden', position:'relative' }}>
            {doc.fileUrl ? (
              doc.mimeType?.includes('image') ? (
                <img src={doc.fileUrl} alt={doc.title} style={{ width:'100%', height:'100%', objectFit:'contain' }} />
    ) : (
           doc.mimeType?.includes('pdf') || doc.fileName?.toLowerCase().endsWith('.pdf') ? (
                  <PdfPreview url={doc.fileUrl} />
                ) : (
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', flexDirection:'column', gap:'16px' }}>
                    <div style={{ fontSize:'64px' }}>📐</div>
                    <div style={{ fontSize:'13px', fontWeight:600, color:'#1E293B' }}>{doc.title || doc.fileName}</div>
                    <button onClick={() =>router.push('/viewer?url=' + encodeURIComponent(doc.fileUrl) + '&title=' + encodeURIComponent(doc.title || doc.fileName))}
                      style={{ background:'#2563EB', color:'#fff', border:'none', borderRadius:'8px', padding:'10px 24px', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>
                      Open in Viewer ↗
                    </button>
                  </div>
                )
              )
            ) : (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', flexDirection:'column', gap:'12px' }}>
                <div style={{ fontSize:'64px' }}>{doc.mimeType?.includes('pdf') ? '📄' : doc.mimeType?.includes('image') ? '🖼️' : '📐'}</div>
                <div style={{ fontSize:'13px', color:'#94A3B8' }}>No file uploaded yet</div>
                <button onClick={() => { if (doc.fileUrl) router.push('/viewer?url=' + encodeURIComponent(doc.fileUrl) + '&title=' + encodeURIComponent(doc.title || doc.fileName)); }}
                  style={{ background:'rgba(0,0,0,0.5)', color:'#fff', border:'none', borderRadius:'20px', padding:'8px 20px', fontSize:'13px', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px' }}>
                  👁 Open in viewer
                </button>
              </div>
            )}
          </div>

          {/* Right Info Panel */}
          <div style={{ width:'220px', borderLeft:'1px solid #E2E8F0', display:'flex', flexDirection:'column', overflow:'hidden', background:'#fff' }}>

            {/* Info section - always visible, no tab */}
            <div style={{ padding:'14px', borderBottom:'1px solid #E2E8F0' }}>
              {[
                { label:'Uploaded by', value: doc.uploadedBy ? doc.uploadedBy.toString().slice(0,8)+'...' : '—' },
                { label:'Locked by', value: '—' },
                { label:'Version', value: `v${doc.currentVersion || '1.0'}` },
                { label:'Upload date', value: doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—' },
                { label:'Size', value: formatSize(doc.fileSize) },
                { label:'Extension', value: doc.fileName?.split('.').pop()?.toLowerCase() || '—' },
                { label:'Location', value: doc.documentType || '—' },
              ].map(item => (
                <div key={item.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'8px' }}>
                  <span style={{ fontSize:'11px', color:'#94A3B8', flexShrink:0 }}>{item.label}</span>
                  <span style={{ fontSize:'11px', color:'#1E293B', fontWeight:500, textAlign:'right', marginLeft:'8px' }}>{item.value}</span>
                </div>
              ))}
              <div style={{ marginBottom:'8px' }}>
                <span style={{ fontSize:'11px', color:'#94A3B8' }}>Status</span>
                <div style={{ fontSize:'11px', color:'#1E293B', fontWeight:600, marginTop:'2px' }}>{doc.status || 'DRAFT'}</div>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
                <span style={{ fontSize:'11px', color:'#94A3B8' }}>Messages</span>
                <span style={{ fontSize:'11px', color:'#1E293B' }}>💬 {comments.length} Messages</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
                <span style={{ fontSize:'11px', color:'#94A3B8' }}>Attachments</span>
                <span style={{ fontSize:'11px', color:'#1E293B' }}>📎 0 Attachments</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontSize:'11px', color:'#94A3B8' }}>Shared with</span>
                <span style={{ fontSize:'11px', color:'#1E293B' }}>—</span>
              </div>
            </div>

            {/* Tabs for Communication etc */}
            <div style={{ display:'flex', overflowX:'auto', borderBottom:'1px solid #E2E8F0', flexShrink:0 }}>
              {tabs.map(t => (
                <button key={t} onClick={() => setActiveTab(t)}
                  style={{ padding:'7px 10px', border:'none', borderBottom: activeTab===t ? '2px solid #2563EB' : '2px solid transparent', background:'transparent', fontSize:'10px', fontWeight: activeTab===t ? 700 : 400, color: activeTab===t ? '#2563EB' : '#64748B', cursor:'pointer', whiteSpace:'nowrap' }}>
                  {t}
                </button>
              ))}
            </div>

            <div style={{ flex:1, overflowY:'auto', padding:'12px' }}>
              {activeTab === 'Communication' && (
                <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
                  <div style={{ flex:1, display:'flex', flexDirection:'column', gap:'8px', marginBottom:'8px' }}>
                    {comments.length === 0 && <div style={{ fontSize:'12px', color:'#94A3B8' }}>No comments yet</div>}
                    {comments.map((c, i) => (
                      <div key={i} style={{ background:'#F8FAFC', borderRadius:'6px', padding:'8px' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                          <span style={{ fontSize:'11px', fontWeight:700, color:'#1E293B' }}>{c.authorName || 'User'}</span>
                          <span style={{ fontSize:'10px', color:'#94A3B8' }}>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''}</span>
                        </div>
                        <div style={{ fontSize:'11px', color:'#475569' }}>{c.content}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display:'flex', gap:'6px' }}>
                    <input value={message} onChange={e => setMessage(e.target.value)}
                      onKeyDown={e => { if (e.key==='Enter') sendComment(); }}
                      placeholder="Write a comment..."
                      style={{ flex:1, border:'1px solid #E2E8F0', borderRadius:'6px', padding:'6px 8px', fontSize:'11px', outline:'none' }} />
                    <button onClick={sendComment}
                      style={{ background:'#2563EB', color:'#fff', border:'none', borderRadius:'6px', padding:'6px 10px', fontSize:'11px', cursor:'pointer' }}>Send</button>
                  </div>
                </div>
              )}
              {(activeTab === 'Workflows' || activeTab === 'Versions') && (
                <div style={{ fontSize:'12px', color:'#94A3B8', textAlign:'center', paddingTop:'20px' }}>
                  <button onClick={() => { window.location.href = `/document-detail?id=${doc.id}&projectId=${projectId}`; }}
                    style={{ background:'#2563EB', color:'#fff', border:'none', borderRadius:'6px', padding:'7px 14px', fontSize:'12px', cursor:'pointer' }}>
                    Open Full Page
                  </button>
                </div>
              )}
              {activeTab === 'History' && (
                <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                  {[
                    { action:'Created', date: doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : '—' },
                    { action:`Status: ${doc.status}`, date: doc.updatedAt ? new Date(doc.updatedAt).toLocaleDateString() : '—' },
                  ].map((h, i) => (
                    <div key={i} style={{ display:'flex', gap:'8px', paddingBottom:'8px', borderBottom:'1px solid #F1F5F9' }}>
                      <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#2563EB', marginTop:'4px', flexShrink:0 }} />
                      <div>
                        <div style={{ fontSize:'11px', fontWeight:600, color:'#1E293B' }}>{h.action}</div>
                        <div style={{ fontSize:'10px', color:'#94A3B8' }}>{h.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProjectWorkspace() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { id } = router.query;

  const [project, setProject]           = useState(null);
  const [fileList, setFileList]         = useState([]);
  const [activeFolder, setActiveFolder] = useState(null); // null = all / Recent files
  const [sortBy, setSortBy]             = useState('date');
  const [showAdvSearch, setShowAdvSearch] = useState(false);
const [advSearch, setAdvSearch] = useState({ title: '', status: '', extension: '', folderId: '' });
  const [dataLoading, setDataLoading]   = useState(false);
  const [showUpload, setShowUpload]     = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [showToolbarMenu, setShowToolbarMenu] = useState(false);
  
  const [showApproval, setShowApproval] = useState(null);
  const [folderList, setFolderList]     = useState([]);
  const [addingFolder, setAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderCode, setNewFolderCode] = useState('');
  const [newFolderParentId, setNewFolderParentId] = useState('');
  const [expandedFolders, setExpandedFolders] = useState({});
  const [folderFilter, setFolderFilter] = useState('');
  const [showFolderFilter, setShowFolderFilter] = useState(false);
  const [docTypeList, setDocTypeList]       = useState([]);
  const [addingDocType, setAddingDocType]   = useState(false);
  const [newDocTypeName, setNewDocTypeName] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [navCollapsed, setNavCollapsed] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading]);

  useEffect(() => {
    if (user && id) {
      loadProject();
      loadDocuments();
      loadFolders();
      loadDocTypes();
    }
  }, [user, id]);


  const loadFolders = async () => {
    try {
      const data = await foldersApi.list(id);
      setFolderList(data);
    } catch (err) {
      console.error(err);
    }
  };
  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const folder = await foldersApi.create({
        name: newFolderName.trim(),
        code: newFolderCode.trim(),
        parentId: newFolderParentId || null,
        projectId: id,
        organizationId: user.organizationId
      });
      setFolderList(prev => [...prev, folder]);
      setNewFolderName('');
      setNewFolderCode('');
      setNewFolderParentId('');
      setAddingFolder(false);
    } catch (err) {
      alert('Failed to create folder');
    }
  };
  const deleteFolder = async (e, folderId) => {
    e.stopPropagation();
    if (!confirm('Delete this folder?')) return;
    await foldersApi.delete(folderId);
    setFolderList(prev => prev.filter(f => f.id !== folderId));
  };

  const loadDocTypes = async () => {
    try {
      const data = await docTypesApi.list(id);
      setDocTypeList(data);
    } catch (err) { console.error(err); }
  };
  const createDocType = async () => {
    if (!newDocTypeName.trim()) return;
    try {
      const type = await docTypesApi.create({ name: newDocTypeName.trim(), projectId: id, organizationId: user.organizationId });
      setDocTypeList(prev => [...prev, type]);
      setNewDocTypeName('');
      setAddingDocType(false);
    } catch (err) { alert('Failed to create type'); }
  };

  const loadProject = async () => {
    try {
      const data = await projects.get(id);
      setProject(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadDocuments = async () => {
    setDataLoading(true);
    try {
      const data = await documents.list(id);
      setFileList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setDataLoading(false);
    }
  };

  const handleActionBtn = async (file) => {
    const status = file.status;
    if (status === 'DRAFT' || status === 'PENDING' || status === 'IN_REVIEW') {
      setShowApproval(file);
    } else if (status === 'REJECTED') {
      try { await documents.update(file.id, { status: 'DRAFT' }); loadDocuments(); } catch (err) { alert(err.message); }
    } else if (status === 'APPROVED') {
      alert(`Downloading ${file.title || file.fileName}...`);
    }
  };

  const actionLabel = (status) => {
    switch (status) {
      case 'DRAFT':     return 'Send';
      case 'REJECTED':  return 'Resubmit';
      case 'PENDING':
      case 'IN_REVIEW': return 'Review';
      case 'APPROVED':  return 'Download';
      default:          return 'View';
    }
  };

  // Discipline counts
  const disciplineCounts = DISCIPLINES.reduce((acc, d) => {
    acc[d.toUpperCase()] = fileList.filter(f => f.discipline === d.toUpperCase()).length;
    return acc;
  }, {});

  // Filtered files
  const displayFiles = fileList
  .filter(f => {
    if (activeFolder && f.folderId !== activeFolder && f.discipline !== activeFolder) return false;
    if (advSearch.title && !(f.title || f.fileName || '').toLowerCase().includes(advSearch.title.toLowerCase())) return false;
    if (advSearch.status && f.status !== advSearch.status) return false;
    if (advSearch.extension && !(f.fileName || '').toLowerCase().endsWith(advSearch.extension.toLowerCase())) return false;
    if (advSearch.folderId && f.folderId !== advSearch.folderId) return false;
    return true;
  })
    .sort((a, b) => {
      if (sortBy === 'name') return (a.title||'').localeCompare(b.title||'');
      if (sortBy === 'revision') return (a.currentVersion||'').localeCompare(b.currentVersion||'');
      return new Date(b.createdAt||0) - new Date(a.createdAt||0);
    });

  // Recent files = last 4 by date
  const recentFiles = [...fileList]
    .sort((a, b) => new Date(b.createdAt||0) - new Date(a.createdAt||0))
    .slice(0, 4);

  if (authLoading || !user) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Arial,sans-serif', color:'#94A3B8' }}>
      Loading...
    </div>
  );

  return (
    <div style={{ fontFamily:'Arial,sans-serif', height:'100vh', display:'flex', flexDirection:'column', background:'#F8FAFC' }}>
      <Topbar />

      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

        {/* ── LEFT SIDEBAR ─────────────────────────────────────────────────── */}
        {/* ── NARROW DARK ICON STRIP ── */}

        
<div style={{ width:'80px', background:'#1E293B', display:'grid', gridTemplateColumns:'1fr 1fr', alignContent:'start', flexShrink:0, paddingTop:'12px', gap:'2px' }}>
  {[
    { title:'Files', active:true, path:null, icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="3" y="2" width="10" height="14" rx="1.5" stroke="#fff" strokeWidth="1.4"/><path d="M6 6h6M6 9h4" stroke="#fff" strokeWidth="1.4" strokeLinecap="round"/></svg> },
    { title:'Info', path:null, icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="#94A3B8" strokeWidth="1.4"/><path d="M9 8v5M9 6v.5" stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round"/></svg> },
    { title:'Address Book', path:'/address-book', icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="6" r="3.5" stroke="#94A3B8" strokeWidth="1.4"/><path d="M2.5 16a6.5 6.5 0 0113 0" stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round"/></svg> },
    { title:'Grid', path:null, icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="6" height="6" rx="1" stroke="#94A3B8" strokeWidth="1.4"/><rect x="10" y="2" width="6" height="6" rx="1" stroke="#94A3B8" strokeWidth="1.4"/><rect x="2" y="10" width="6" height="6" rx="1" stroke="#94A3B8" strokeWidth="1.4"/><rect x="10" y="10" width="6" height="6" rx="1" stroke="#94A3B8" strokeWidth="1.4"/></svg> },
    { title:'Tasks', path:'/tasks', icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 7h10M4 11h7M4 3h14" stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round"/></svg> },
    { title:'Bookmark', path:null, icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M5 2h8a1 1 0 011 1v13l-4.5-3L5 16V3a1 1 0 011-1z" stroke="#94A3B8" strokeWidth="1.4" strokeLinejoin="round"/></svg> },
    { title:'Messages', path:'/messages', icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="3" width="14" height="10" rx="1.5" stroke="#94A3B8" strokeWidth="1.4"/><path d="M6 13l3 3 3-3" stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    { title:'Settings', path:null, icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="2.5" stroke="#94A3B8" strokeWidth="1.4"/><path d="M9 2v2M9 14v2M2 9h2M14 9h2M4.2 4.2l1.4 1.4M12.4 12.4l1.4 1.4M4.2 13.8l1.4-1.4M12.4 5.6l1.4-1.4" stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round"/></svg> },
    { title:'Reports', path:'/reports', icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 14V6l4 4 4-4 4 4" stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    { title:'Link', path:null, icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M7.5 10.5a3.5 3.5 0 005 0l2-2a3.5 3.5 0 00-5-5L8 5" stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round"/><path d="M10.5 7.5a3.5 3.5 0 00-5 0l-2 2a3.5 3.5 0 005 5L10 13" stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round"/></svg> },
  ].map(item => (
    <button key={item.title} title={item.title} onClick={() => item.path && router.push(item.path)}
      style={{ width:'38px', height:'38px', borderRadius:'8px', background: item.active ? 'rgba(255,255,255,0.15)' : 'transparent', border:'none', cursor: item.path ? 'pointer' : 'default', display:'flex', alignItems:'center', justifyContent:'center', margin:'1px auto' }}
      onMouseEnter={e => { if (!item.active && item.path) e.currentTarget.style.background='rgba(255,255,255,0.08)'; }}
      onMouseLeave={e => { if (!item.active) e.currentTarget.style.background='transparent'; }}>
      {item.icon}
    </button>
  ))}
</div>

  

       
        {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
        <main style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

          {/* Breadcrumb */}
          <div style={{ background:'#fff', borderBottom:'1px solid #E2E8F0', padding:'0 20px', height:'40px', display:'flex', alignItems:'center', gap:'6px', fontSize:'13px', color:'#94A3B8' }}>
            <span style={{ color:'#2563EB', cursor:'pointer' }} onClick={() => router.push('/projects')}>Projects</span>
            <span>/</span>
            <span style={{ color:'#2563EB', cursor:'pointer' }}>{project?.name || '...'}</span>
            {project?.clientName && <><span>{'>'}</span><span>{project.clientName}</span></>}
            <span>/</span>
            <strong style={{ color:'#1E293B' }}>Documents</strong>
          </div>

          {/* Toolbar */}
          <div style={{ background:'#fff', borderBottom:'1px solid #E2E8F0', padding:'8px 20px', display:'flex', alignItems:'center', gap:'8px' }}>
            <button onClick={() => setShowUpload(true)}
              style={{ padding:'7px 16px', borderRadius:'6px', border:'none', background:'#2563EB', color:'#fff', fontSize:'13px', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:'6px' }}>
              + Upload
            </button>
           
            <button onClick={() => setAddingFolder(true)} style={{ padding:'6px 14px', borderRadius:'6px', border:'1px solid #E2E8F0', background:'#fff', fontSize:'12px', color:'#475569', cursor:'pointer' }}>New folder</button>
            <div style={{ position:'relative' }}>
  <button onClick={() => setShowToolbarMenu(m => !m)}
    style={{ padding:'6px 14px', borderRadius:'6px', border:'1px solid #E2E8F0', background:'#fff', fontSize:'12px', color:'#475569', cursor:'pointer' }}>
    ···
  </button>
  {showToolbarMenu && (
    <div style={{ position:'absolute', top:'32px', left:0, background:'#fff', border:'1px solid #E2E8F0', borderRadius:'8px', boxShadow:'0 4px 20px rgba(0,0,0,0.12)', zIndex:50, minWidth:'200px', overflow:'hidden' }}>
      {[
        { label:'Export to .xls', icon:'📊', action: () => {
          const rows = displayFiles.map(f => `${f.title||f.fileName}\t${f.documentType||''}\t${f.status||''}\t${f.currentVersion||'1.0'}`);
          const content = ['Name\tType\tStatus\tVersion', ...rows].join('\n');
          const blob = new Blob([content], { type:'application/vnd.ms-excel' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a'); a.href=url; a.download='documents.xls'; a.click();
          URL.revokeObjectURL(url);
          setShowToolbarMenu(false);
        }},
        { label:'Folder notifications', icon:'🔔', action: () => { alert('Folder notifications enabled!'); setShowToolbarMenu(false); }},
      ].map(item => (
        <button key={item.label} onClick={item.action}
          style={{ width:'100%', padding:'10px 16px', border:'none', background:'#fff', textAlign:'left', fontSize:'13px', color:'#1E293B', cursor:'pointer', display:'flex', alignItems:'center', gap:'10px' }}
          onMouseEnter={e => e.currentTarget.style.background='#F8FAFC'}
          onMouseLeave={e => e.currentTarget.style.background='#fff'}>
          {item.icon} {item.label}
        </button>
      ))}
    </div>
  )}
</div>
           
            <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:'8px' }}>
              <span style={{ fontSize:'12px', color:'#94A3B8' }}>Sort:</span>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                style={{ fontSize:'12px', border:'1px solid #E2E8F0', borderRadius:'6px', padding:'4px 8px', color:'#475569', background:'#fff' }}>
                <option value="date">Date modified</option>
                <option value="name">Name</option>
                <option value="revision">Revision</option>
              </select>
            </div>
          </div>
          <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
            {/* ── FOLDERS PANEL ── */}
            <div style={{ width:'260px', borderRight:'1px solid #E2E8F0', background:'#fff', overflowY:'auto', flexShrink:0 }}>
             <div style={{ padding:'12px 16px', borderBottom:'1px solid #E2E8F0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontSize:'11px', fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.06em' }}>Folders</span>
                <div style={{ position:'relative' }}>
                  <button onClick={() => setShowFolderFilter(f => !f)} style={{ background:'none', border:'none', cursor:'pointer', color: showFolderFilter ? '#2563EB' : '#94A3B8', display:'flex', alignItems:'center' }} title="Filter folders">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M1 3h12M3 7h8M5 11h4" stroke={showFolderFilter ? '#2563EB' : '#94A3B8'} strokeWidth="1.4" strokeLinecap="round"/>
                    </svg>
                  </button>
                  {showFolderFilter && (
                    <div style={{ position:'absolute', right:0, top:'24px', background:'#fff', border:'1px solid #E2E8F0', borderRadius:'8px', boxShadow:'0 4px 12px rgba(0,0,0,0.1)', padding:'8px', zIndex:50, width:'180px' }}>
                      <input autoFocus value={folderFilter} onChange={e => setFolderFilter(e.target.value)}
                        placeholder="Search folders..."
                        style={{ width:'100%', border:'1px solid #E2E8F0', borderRadius:'6px', padding:'6px 8px', fontSize:'12px', outline:'none', boxSizing:'border-box' }} />
                      {folderFilter && (
                        <button onClick={() => setFolderFilter('')}
                          style={{ marginTop:'6px', width:'100%', background:'none', border:'none', cursor:'pointer', fontSize:'11px', color:'#94A3B8' }}>
                          Clear filter
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div> 

              <div onClick={() => setActiveFolder(null)}
  style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 16px', cursor:'pointer', background: activeFolder === null ? '#EFF6FF' : 'transparent', borderLeft: activeFolder === null ? '3px solid #2563EB' : '3px solid transparent' }}
  onMouseEnter={e => { if (activeFolder !== null) e.currentTarget.style.background='#F8FAFC'; }}
  onMouseLeave={e => { if (activeFolder !== null) e.currentTarget.style.background='transparent'; }}>
  <span style={{ fontSize:'12px', fontWeight: activeFolder === null ? 600 : 400, color: activeFolder === null ? '#2563EB' : '#475569' }}>🕐 Recent files</span>
</div>
              {folderList.length === 0 && (
                <div style={{ padding:'20px 16px', fontSize:'12px', color:'#94A3B8' }}>No folders yet</div>
              )}
             {folderList.filter(f => !f.parentId && (folderFilter === '' || f.name.toLowerCase().includes(folderFilter.toLowerCase()) || (f.code && f.code.toLowerCase().includes(folderFilter.toLowerCase())))).map((f, i) => {
                const folderColors = ['#3B82F6','#F59E0B','#10B981','#6B7280','#8B5CF6'];
                const children = folderList.filter(c => c.parentId === f.id);
                const isExpanded = expandedFolders[f.id];
                const isActive = activeFolder === f.id;
                return (
                  <div key={f.id}>
                    <div style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 16px', cursor:'pointer', background: isActive ? '#EFF6FF' : 'transparent', borderLeft: isActive ? '3px solid #2563EB' : '3px solid transparent' }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background='#F8FAFC'; }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background='transparent'; }}>
                      <button onClick={() => setExpandedFolders(prev => ({ ...prev, [f.id]: !prev[f.id] }))}
                        style={{ background:'none', border:'none', cursor:'pointer', color:'#94A3B8', padding:'0', width:'14px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        {children.length > 0 ? (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d={isExpanded ? 'M2 3l3 4 3-4' : 'M3 2l4 3-4 3'} stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : <span style={{ width:'10px' }} />}
                      </button>
                      <div onClick={() => setActiveFolder(isActive ? null : f.id)} style={{ display:'flex', alignItems:'center', gap:'8px', flex:1 }}>
                        <FolderIcon color={folderColors[i % folderColors.length]} />
                        <span style={{ fontSize:'13px', color: isActive ? '#2563EB' : '#475569', fontWeight: isActive ? 600 : 400 }}>
                          {f.name}{f.code ? <span style={{ fontSize:'10px', color:'#94A3B8', marginLeft:'4px' }}>({f.code})</span> : ''}
                        </span>
                      </div>
                      {user?.role === 'ADMIN' && (
                        <button onClick={(e) => deleteFolder(e, f.id)}
                          style={{ background:'none', border:'none', cursor:'pointer', color:'#EF4444', fontSize:'14px', opacity:0, padding:'0 2px' }}
                          onMouseEnter={e => e.currentTarget.style.opacity='1'}
                          onMouseLeave={e => e.currentTarget.style.opacity='0'}>×</button>
                      )}
                    </div>
                    {isExpanded && children.map((child, j) => {
                      const childActive = activeFolder === child.id;
                      return (
                        <div key={child.id} onClick={() => setActiveFolder(childActive ? null : child.id)}
                          style={{ display:'flex', alignItems:'center', gap:'8px', padding:'7px 16px 7px 36px', cursor:'pointer', background: childActive ? '#EFF6FF' : 'transparent', borderLeft: childActive ? '3px solid #2563EB' : '3px solid transparent' }}
                          onMouseEnter={e => { if (!childActive) e.currentTarget.style.background='#F8FAFC'; }}
                          onMouseLeave={e => { if (!childActive) e.currentTarget.style.background='transparent'; }}>
                          <FolderIcon color={folderColors[j % folderColors.length]} />
                          <span style={{ fontSize:'12px', color: childActive ? '#2563EB' : '#64748B', fontWeight: childActive ? 600 : 400 }}>
                            {child.name}{child.code ? <span style={{ fontSize:'10px', color:'#94A3B8', marginLeft:'4px' }}>({child.code})</span> : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
            {/* ── FILES PANEL ── */}
            <div style={{ flex:1, overflowY:'auto', padding:'20px' }}>
              {!activeFolder && recentFiles.length > 0 && (
                <div style={{ marginBottom:'24px' }}>
                  <div style={{ display:'flex', gap:'12px', overflowX:'auto', paddingBottom:'4px' }}>
                    {recentFiles.map(f => <FileThumbnail key={f.id} file={f} />)}
                  </div>
                </div>
              )}
              <div style={{ fontSize:'11px', fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'12px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span>{activeFolder ? `Files — ${folderList.find(f => f.id === activeFolder)?.name || ''}` : `Files — ${project?.name || ''}`}</span>
                <span style={{ fontWeight:400 }}>{displayFiles.length} document{displayFiles.length !== 1 ? 's' : ''}</span>
              </div>
              
             <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:'10px', overflowX:'auto' }}>
               <table style={{ width:'100%', minWidth:'1100px', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ background:'#F8FAFC', borderBottom:'1px solid #E2E8F0' }}>
                    {[
  { label:'File name', width:'200px' },
  { label:'Folder', width:'100px' },
  { label:'Description', width:'150px' },
  { label:'Type', width:'100px' },
  { label:'Version', width:'80px' },
  { label:'Uploaded by', width:'110px' },
  { label:'Date', width:'90px' },
  { label:'Status', width:'90px' },
  { label:'Inspector', width:'90px' },
  { label:'Action', width:'120px' },
].map(h => (
  <th key={h.label} style={{ padding:'10px 14px', textAlign:'left', fontSize:'11px', fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.04em', whiteSpace:'nowrap', minWidth: h.width }}>{h.label}</th>
))}
                    </tr>
                  </thead>
                  <tbody>
                    {dataLoading ? (
                      <tr><td colSpan={7} style={{ padding:'32px', textAlign:'center', color:'#94A3B8', fontSize:'13px' }}>Loading documents...</td></tr>
                    ) : displayFiles.length === 0 ? (
                      <tr><td colSpan={7} style={{ padding:'32px', textAlign:'center', color:'#94A3B8', fontSize:'13px' }}>No documents yet — click Upload to add one</td></tr>
                    ) : displayFiles.map((f, i) => {
                      const fType = getFileType(f.fileName);
                      const fStatus = f.status || 'DRAFT';
                      return (
                        <tr key={f.id} style={{ borderBottom: i < displayFiles.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                          <td style={{ padding:'10px 14px' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                              <span style={{ background: typeColors[fType]||'#F1F5F9', color: typeText[fType]||'#475569', fontSize:'10px', fontWeight:700, padding:'2px 6px', borderRadius:'4px', minWidth:'36px', textAlign:'center' }}>{fType}</span>
                              <div>
                                <div onClick={() => setSelectedDoc(f)} style={{ fontWeight:600, color:'#2563EB', fontSize:'13px', cursor:'pointer' }}>{f.title || f.fileName}</div>
                                <div style={{ fontSize:'11px', color:'#94A3B8' }}>{f.documentType}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding:'10px 14px', fontSize:'12px', color:'#64748B' }}>
                            {folderList.find(folder => folder.id === f.folderId)?.name || '—'}
                          </td> 
                          <td style={{ padding:'10px 14px', fontSize:'12px', color:'#64748B' }}>{f.description || '—'}</td>
                          <td style={{ padding:'10px 14px', fontSize:'12px', color:'#64748B' }}>{f.documentType || '—'}</td>
                          <td style={{ padding:'10px 14px' }}>
                            <span style={{ background:'#EFF6FF', color:'#2563EB', fontSize:'11px', fontWeight:600, padding:'2px 10px', borderRadius:'20px' }}>v{f.currentVersion || '1.0'}</span>
                            {f.revisionLabel && <span style={{ background:'#F1F5F9', color:'#475569', fontSize:'10px', fontWeight:700, padding:'2px 6px', borderRadius:'4px', marginLeft:'4px' }}>{f.revisionLabel}</span>}
                          </td>
                          <td style={{ padding:'10px 14px', fontSize:'13px', color:'#64748B' }}>{f.uploadedBy ? f.uploadedBy.toString().slice(0,8)+'…' : user?.firstName}</td>
                          <td style={{ padding:'10px 14px', fontSize:'13px', color:'#94A3B8' }}>{formatDate(f.createdAt)}</td>
                          <td style={{ padding:'10px 14px' }}>
                            <span style={{ background: statusBg[fStatus]||'#F1F5F9', color: statusColor[fStatus]||'#64748B', fontSize:'11px', fontWeight:600, padding:'2px 10px', borderRadius:'20px' }}>{statusLabel[fStatus] || fStatus}</span>
                          </td>
                          <td style={{ padding:'10px 14px', fontSize:'12px', color:'#64748B' }}>—</td>
                          <td style={{ padding:'10px 14px' }}>
                            <div style={{ display:'flex', gap:'6px' }}>
                              <button onClick={() => handleActionBtn(f)} style={{ fontSize:'11px', border:'1px solid #E2E8F0', borderRadius:'6px', padding:'4px 10px', background:'#fff', cursor:'pointer', color:'#475569' }}>{actionLabel(fStatus)}</button>
                              {user?.role === 'ADMIN' && (
                                <button onClick={async () => { if (!confirm('Delete this file?')) return; try { await documents.delete(f.id); loadDocuments(); } catch(e) { alert(e.message); } }}
                                  style={{ fontSize:'11px', border:'1px solid #FEE2E2', borderRadius:'6px', padding:'4px 10px', background:'#FFF5F5', cursor:'pointer', color:'#EF4444' }}>Delete</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div onClick={() => setShowUpload(true)} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); setShowUpload(true); }}
                style={{ marginTop:'16px', border:'1.5px dashed #93C5FD', borderRadius:'12px', background:'#EFF6FF', padding:'20px', textAlign:'center', fontSize:'13px', color:'#94A3B8', cursor:'pointer' }}>
                Drag and drop files here to upload, or click <strong style={{ color:'#2563EB' }}>Upload</strong> above
              </div>
            </div>
          </div>
        </main>
      </div>


      {addingDocType && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200 }}>
          <div style={{ background:'#fff', borderRadius:'14px', padding:'28px', width:'380px', boxShadow:'0 8px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ fontSize:'16px', fontWeight:700, color:'#1E293B', marginBottom:'8px' }}>New Document Type</div>
            <div style={{ fontSize:'12px', color:'#94A3B8', marginBottom:'16px' }}>e.g. Drawing, Specification, Contract, Report, RFI, Submittal, Shop Drawing</div>
            <input autoFocus value={newDocTypeName} onChange={e => setNewDocTypeName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') createDocType(); if (e.key === 'Escape') { setAddingDocType(false); setNewDocTypeName(''); } }}
              placeholder="Type name..."
              style={{ width:'100%', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'10px 12px', fontSize:'13px', outline:'none', boxSizing:'border-box', marginBottom:'16px' }} />
            <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
              <button onClick={() => { setAddingDocType(false); setNewDocTypeName(''); }}
                style={{ padding:'8px 18px', border:'1px solid #E2E8F0', borderRadius:'8px', background:'#fff', fontSize:'13px', cursor:'pointer', color:'#475569' }}>Cancel</button>
              <button onClick={createDocType}
                style={{ padding:'8px 20px', border:'none', borderRadius:'8px', background:'#2563EB', color:'#fff', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>Create</button>
            </div>
          </div>
        </div>
      )}


      {addingFolder && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
          <div style={{ background:'#fff', borderRadius:'14px', padding:'28px', width:'420px', boxShadow:'0 8px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ fontSize:'16px', fontWeight:700, color:'#1E293B', marginBottom:'20px' }}>New Folder</div>
            <div style={{ marginBottom:'14px' }}>
              <label style={{ fontSize:'12px', fontWeight:600, color:'#475569', display:'block', marginBottom:'6px' }}>Folder Name</label>
              <input autoFocus value={newFolderName} onChange={e => setNewFolderName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Escape') { setAddingFolder(false); setNewFolderName(''); } }}
                placeholder="e.g. Execution, As Built, Clients..."
                style={{ width:'100%', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'10px 12px', fontSize:'13px', outline:'none', boxSizing:'border-box' }} />
            </div>
            <div style={{ marginBottom:'14px' }}>
              <label style={{ fontSize:'12px', fontWeight:600, color:'#475569', display:'block', marginBottom:'6px' }}>Short Code <span style={{ fontWeight:400, color:'#94A3B8' }}>(optional)</span></label>
              <input value={newFolderCode} onChange={e => setNewFolderCode(e.target.value.toUpperCase())}
                placeholder="e.g. EXE, ASB, CLI..."
                maxLength={10}
                style={{ width:'100%', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'10px 12px', fontSize:'13px', outline:'none', boxSizing:'border-box' }} />
            </div>
            <div style={{ marginBottom:'20px' }}>
              <label style={{ fontSize:'12px', fontWeight:600, color:'#475569', display:'block', marginBottom:'6px' }}>Parent Folder <span style={{ fontWeight:400, color:'#94A3B8' }}>(optional)</span></label>
              <select value={newFolderParentId} onChange={e => setNewFolderParentId(e.target.value)}
                style={{ width:'100%', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'10px 12px', fontSize:'13px', background:'#fff' }}>
                <option value="">-- No parent (root folder) --</option>
                {folderList.filter(f => !f.parentId).map(f => (
                  <option key={f.id} value={f.id}>{f.name}{f.code ? ` (${f.code})` : ''}</option>
                ))}
              </select>
            </div>
            <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
              <button onClick={() => { setAddingFolder(false); setNewFolderName(''); setNewFolderCode(''); setNewFolderParentId(''); }}
                style={{ padding:'8px 18px', border:'1px solid #E2E8F0', borderRadius:'8px', background:'#fff', fontSize:'13px', cursor:'pointer', color:'#475569' }}>Cancel</button>
              <button onClick={createFolder}
                style={{ padding:'8px 20px', border:'none', borderRadius:'8px', background:'#2563EB', color:'#fff', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>Create</button>
            </div>
          </div>
        </div>
      )}

      {showUpload && (
        <UploadModal projectId={id} onClose={() => setShowUpload(false)} onUploaded={loadDocuments} folderList={folderList} docTypeList={docTypeList} onAddDocType={() => setAddingDocType(true)} />
      )}
      {showApproval && (
        <ApprovalModal document={showApproval} projectId={id} onClose={() => setShowApproval(null)} onSent={loadDocuments} />
      )}
      {showAdvSearch && <AdvancedSearchModal onClose={() => setShowAdvSearch(false)} onSearch={s => setAdvSearch(s)} folderList={folderList} />}
       {selectedDoc && <DocumentSlidePanel doc={selectedDoc} projectId={id} onClose={(newDoc) => newDoc ? setSelectedDoc(newDoc) : setSelectedDoc(null)} user={user} allDocs={fileList} />}
    </div>
  );
}
// ── Static export support (client-side rendered; id read from router.query) ──
export async function getStaticPaths() {
  return { paths: [], fallback: false };
}

export async function getStaticProps() {
  return { props: {} };
}
