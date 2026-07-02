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
export function DocumentSlidePanel({ doc, projectId, onClose, user, allDocs = [] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Info');
  const [comments, setComments] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [selectedApproval, setSelectedApproval] = useState(0);
  const [decisions, setDecisions] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [uploadingAtt, setUploadingAtt] = useState(false);
  const [versions, setVersions] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [message, setMessage] = useState('');
  const [selectedComm, setSelectedComm] = useState(0);
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

  useEffect(() => { if (doc && projectId) loadApprovals(); }, [doc, projectId]);
  const loadApprovals = async () => {
    try {
      const res = await fetch(`${BASE_URL}/approvals?projectId=${projectId}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      const mine = Array.isArray(data) ? data.filter(a => String(a.documentId) === String(doc.id)) : [];
      setApprovals(mine);
    } catch (err) { console.error(err); }
  };
  const loadDecisions = async (approvalId) => {
    try {
      const res = await fetch(`${BASE_URL}/approvals/${approvalId}/decisions`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setDecisions(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
  };
  useEffect(() => {
    if (approvals[selectedApproval]) loadDecisions(approvals[selectedApproval].id);
  }, [selectedApproval, approvals]);
  useEffect(() => { if (doc) loadAttachments(); }, [doc]);
  const loadAttachments = async () => {
    try {
      const res = await fetch(`${BASE_URL}/attachments?documentId=${doc.id}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setAttachments(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
  };
  const uploadAttachment = async (file) => {
    if (!file) return;
    setUploadingAtt(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('projectId', projectId);
      const up = await fetch(`${BASE_URL}/files/upload`, { method:'POST', headers:{ Authorization:`Bearer ${token}` }, body: fd });
      const upData = await up.json();
      await fetch(`${BASE_URL}/attachments`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify({ documentId: doc.id, fileName: upData.originalName, fileUrl: upData.url, publicId: upData.publicId, fileSize: upData.bytes, format: upData.format, uploadedByName: `${user.firstName} ${user.lastName}` })
      });
      loadAttachments();
    } catch (err) { console.error(err); alert('Upload failed'); }
    finally { setUploadingAtt(false); }
  };
  const deleteAttachment = async (attId) => {
    try {
      await fetch(`${BASE_URL}/attachments/${attId}`, { method:'DELETE', headers:{ Authorization:`Bearer ${token}` } });
      loadAttachments();
    } catch (err) { console.error(err); }
  };
  useEffect(() => { if (doc) loadVersions(); }, [doc]);
  const loadVersions = async () => {
    try {
      const res = await fetch(`${BASE_URL}/documents/${doc.id}/versions`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setVersions(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
  };
  useEffect(() => { if (doc) loadHistory(); }, [doc]);
  const loadHistory = async () => {
    try {
      const res = await fetch(`${BASE_URL}/audit/entity?entityType=DOCUMENT&entityId=${doc.id}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setHistory(Array.isArray(data) ? data : []);
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
     <div style={{ position:'fixed', top:0, left:0, right:0, height:'100vh', background:'#fff', zIndex:201, display:'flex', flexDirection:'column', boxShadow:'-4px 0 24px rgba(0,0,0,0.15)', animation:'slideIn 0.25s ease-out' }}>
        {/* Logo top bar (Bricsys-style) */}
        <div style={{ height:'52px', minHeight:'52px', borderBottom:'1px solid #E2E8F0', display:'flex', alignItems:'center', padding:'0 20px', flexShrink:0 }}>
          <div onClick={onClose} style={{ fontWeight:800, fontSize:'18px', color:'#2563EB', letterSpacing:'2px', cursor:'pointer' }}>
            OR<span style={{ color:'#0EA5E9' }}>ARCH </span><span style={{ color:'#2563EB' }}>24/7</span>
          </div>
        </div>
        {/* row: strip + content */}
        <div style={{ flex:1, display:'flex', flexDirection:'row', overflow:'hidden' }}>
        {/* 2-column badged strip (Bricsys) */}
        <div style={{ width:'80px', minWidth:'80px', background:'#1E293B', display:'grid', gridTemplateColumns:'40px 40px', justifyContent:'center', paddingTop:'12px', gap:'2px', flexShrink:0, alignContent:'start' }}>
          {[
            // row1
            { title:'Files', onClick: onClose, active:true, icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="3" y="2" width="10" height="14" rx="1.5" stroke="#fff" strokeWidth="1.4"/><path d="M6 6h6M6 9h4" stroke="#fff" strokeWidth="1.4" strokeLinecap="round"/></svg> },
            { title:'Info', tab:'Info', onClick:()=>setActiveTab('Info'), icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="#94A3B8" strokeWidth="1.4"/><path d="M9 8v5M9 6v.5" stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round"/></svg> },
            // row2
            { title:'Address Book', onClick:()=>router.push('/address-book'), icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="6" r="3.5" stroke="#94A3B8" strokeWidth="1.4"/><path d="M2.5 16a6.5 6.5 0 0113 0" stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round"/></svg> },
            { title:'Communication', tab:'Communication', onClick:()=>setActiveTab('Communication'), badge: comments.length, icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="3" width="14" height="10" rx="1.5" stroke="#94A3B8" strokeWidth="1.4"/><path d="M6 13l3 3 3-3" stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg> },
            // row3
            { title:'Tasks', onClick:()=>router.push('/tasks'), icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 7h10M4 11h7M4 3h14" stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round"/></svg> },
            { title:'Metadata', tab:'Metadata', onClick:()=>setActiveTab('Metadata'), icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="3" width="14" height="12" rx="1.5" stroke="#94A3B8" strokeWidth="1.4"/><path d="M2 7h14M7 7v8" stroke="#94A3B8" strokeWidth="1.4"/></svg> },
            // row4
            { title:'Messages', onClick:()=>router.push('/messages'), icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="3" width="14" height="10" rx="1.5" stroke="#94A3B8" strokeWidth="1.4"/><path d="M6 13l3 3 3-3" stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg> },
            { title:'Workflows', tab:'Workflows', onClick:()=>setActiveTab('Workflows'), icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="5" cy="5" r="2" stroke="#94A3B8" strokeWidth="1.4"/><circle cx="13" cy="13" r="2" stroke="#94A3B8" strokeWidth="1.4"/><path d="M7 5h4a2 2 0 012 2v4" stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round"/></svg> },
            // row5
            { title:'Reports', onClick:()=>router.push('/reports'), icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 14V6l4 4 4-4 4 4" stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg> },
            { title:'Attachments', tab:'Attachments', onClick:()=>setActiveTab('Attachments'), icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M12 5l-5 5a2 2 0 002.8 2.8L15 8a3.5 3.5 0 00-5-5l-5.5 5.5" stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round"/></svg> },
            // row6 (left empty spacer + Versions)
            { title:'', onClick:()=>{}, spacer:true, icon:null },
            { title:'Versions', tab:'Versions', onClick:()=>setActiveTab('Versions'), icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 4v5l3 2" stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="9" r="7" stroke="#94A3B8" strokeWidth="1.4"/></svg> },
            // row7 (left empty spacer + History)
            { title:'', onClick:()=>{}, spacer:true, icon:null },
            { title:'History', tab:'History', onClick:()=>setActiveTab('History'), icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="3" y="2" width="12" height="14" rx="1.5" stroke="#94A3B8" strokeWidth="1.4"/><path d="M6 6h6M6 9h6M6 12h4" stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round"/></svg> },
          ].map((item, idx) => (
            item.spacer ? (
              <div key={'spacer'+idx} style={{ width:'38px', height:'38px' }} />
            ) : (
            <button key={item.title} title={item.title} onClick={item.onClick}
              style={{ position:'relative', width:'38px', height:'38px', borderRadius:'8px', background: (item.active || item.tab === activeTab) ? 'rgba(255,255,255,0.15)' : 'transparent', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', justifySelf:'center' }}
              onMouseEnter={e => { if (!item.active && item.tab !== activeTab) e.currentTarget.style.background='rgba(255,255,255,0.08)'; }}
              onMouseLeave={e => { if (!item.active && item.tab !== activeTab) e.currentTarget.style.background='transparent'; }}>
              {item.icon}
              {item.badge > 0 && (<span style={{ position:'absolute', top:'2px', right:'2px', background:'#2563EB', color:'#fff', fontSize:'9px', fontWeight:700, minWidth:'14px', height:'14px', borderRadius:'7px', display:'flex', alignItems:'center', justifyContent:'center', padding:'0 3px' }}>{item.badge}</span>)}
            </button>
            )
          ))}
        </div>
        {/* content column */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

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
          <button onClick={async () => { if (!doc.fileUrl) { alert('No file attached yet.'); return; } try { const proxyUrl = `${BASE_URL}/files/proxy?url=` + encodeURIComponent(doc.publicId || doc.fileUrl); const r = await fetch(proxyUrl, { headers: { Authorization: `Bearer ${token}` } }); if (!r.ok) throw new Error('HTTP ' + r.status); const blob = await r.blob(); const objUrl = window.URL.createObjectURL(blob); const a = window.document.createElement('a'); a.href = objUrl; a.download = doc.fileName || doc.title || 'document'; window.document.body.appendChild(a); a.click(); window.document.body.removeChild(a); window.URL.revokeObjectURL(objUrl); } catch (err) { console.error(err); alert('Download failed: ' + err.message); } }}
            style={{ background:'#2563EB', color:'#fff', border:'none', borderRadius:'6px', padding:'6px 14px', fontSize:'12px', fontWeight:600, cursor:'pointer', flexShrink:0 }}>
            Download
          </button>
          <button onClick={() => { if (doc.fileUrl) router.push('/viewer?url=' + encodeURIComponent(doc.fileUrl) + '&title=' + encodeURIComponent(doc.title || doc.fileName) + '&docId=' + doc.id + '&projectId=' + projectId); else alert('No file attached yet.'); }}
            style={{ background:'#F1F5F9', color:'#475569', border:'none', borderRadius:'6px', padding:'6px 14px', fontSize:'12px', cursor:'pointer', flexShrink:0 }}>
            Open in viewer
          </button>
          <button style={{ background:'#F1F5F9', color:'#475569', border:'none', borderRadius:'6px', padding:'6px 10px', fontSize:'14px', cursor:'pointer', flexShrink:0 }}>···</button>
          <button onClick={() => onClose()} style={{ background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'#94A3B8', flexShrink:0 }}>×</button>
        </div>

        {/* Content */}
        <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

          {/* Communication full view (Bricsys 2-panel) */}
          {activeTab === 'Communication' ? (
          <div style={{ flex:1, display:'flex', overflow:'hidden', background:'#fff' }}>
            {/* left: communication list */}
            <div style={{ width:'340px', borderRight:'1px solid #E2E8F0', display:'flex', flexDirection:'column', overflow:'hidden' }}>
              <div style={{ padding:'12px 16px', borderBottom:'1px solid #E2E8F0', display:'flex', gap:'8px', alignItems:'center' }}>
                <select style={{ flex:1, fontSize:'12px', border:'1px solid #E2E8F0', borderRadius:'6px', padding:'6px 8px', color:'#475569', background:'#fff' }}>
                  <option>ALL COMMUNICATIONS</option>
                  <option>Comments</option>
                  <option>Approvals</option>
                </select>
              </div>
              <div style={{ flex:1, overflowY:'auto' }}>
                {comments.length === 0 && <div style={{ padding:'20px', fontSize:'13px', color:'#94A3B8', textAlign:'center' }}>No communications yet</div>}
                {comments.map((c, i) => {
                  const initials = (c.authorName || 'U').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
                  const colors = ['#2563EB','#10B981','#F59E0B','#8B5CF6','#EC4899'];
                  const color = colors[(c.authorName||'U').charCodeAt(0) % colors.length];
                  const active = selectedComm === i;
                  return (
                    <div key={i} onClick={() => setSelectedComm(i)}
                      style={{ display:'flex', gap:'10px', padding:'12px 16px', cursor:'pointer', borderBottom:'1px solid #F1F5F9', background: active ? '#EFF6FF' : 'transparent', borderLeft: active ? '3px solid #2563EB' : '3px solid transparent' }}
                      onMouseEnter={e => { if(!active) e.currentTarget.style.background='#F8FAFC'; }}
                      onMouseLeave={e => { if(!active) e.currentTarget.style.background='transparent'; }}>
                      <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:color, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:700, flexShrink:0 }}>{initials}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                          <span style={{ fontSize:'13px', fontWeight:600, color:'#1E293B', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.authorName || 'User'}</span>
                          <span style={{ fontSize:'11px', color:'#94A3B8', flexShrink:0, marginLeft:'6px' }}>{c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : ''}</span>
                        </div>
                        <div style={{ fontSize:'12px', color:'#64748B', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginTop:'2px' }}>
                          {c.subject ? <><span style={{ color:'#2563EB' }}>&#9095; </span>{c.subject}{c.status ? ' - ' + c.status : ''}</> : c.content}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* new message input */}
              <div style={{ padding:'12px 16px', borderTop:'1px solid #E2E8F0', display:'flex', gap:'6px' }}>
                <input value={message} onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => { if (e.key==='Enter') sendComment(); }}
                  placeholder="Write a message..."
                  style={{ flex:1, border:'1px solid #E2E8F0', borderRadius:'6px', padding:'7px 10px', fontSize:'12px', outline:'none' }} />
                <button onClick={sendComment} style={{ background:'#2563EB', color:'#fff', border:'none', borderRadius:'6px', padding:'7px 12px', fontSize:'12px', cursor:'pointer' }}>Send</button>
              </div>
            </div>
            {/* right: selected communication detail */}
            <div style={{ flex:1, overflowY:'auto', padding:'24px 32px' }}>
              {comments[selectedComm] ? (() => {
                const c = comments[selectedComm];
                const initials = (c.authorName || 'U').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
                const colors = ['#2563EB','#10B981','#F59E0B','#8B5CF6','#EC4899'];
                const color = colors[(c.authorName||'U').charCodeAt(0) % colors.length];
                return (
                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'20px' }}>
                      <div style={{ display:'flex', gap:'12px', alignItems:'center' }}>
                        <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:color, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:700 }}>{initials}</div>
                        <div>
                          <div style={{ fontSize:'14px', fontWeight:600, color:'#1E293B' }}>{c.authorName || 'User'}</div>
                          {c.subject && <div style={{ fontSize:'12px', color:'#64748B' }}><span style={{ color:'#2563EB' }}>&#9095; </span>{c.subject}{c.status ? ' - ' + c.status : ''}</div>}
                        </div>
                      </div>
                      <span style={{ fontSize:'12px', color:'#94A3B8' }}>{c.createdAt ? new Date(c.createdAt).toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : ''}</span>
                    </div>
                    <div style={{ fontSize:'14px', color:'#334155', lineHeight:1.6 }}>{c.content}</div>
                  </div>
                );
              })() : (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#94A3B8', fontSize:'13px' }}>Select a communication to view</div>
              )}
            </div>
          </div>
          ) : activeTab === 'Metadata' ? (
          /* Metadata full view (Bricsys) */
          <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'auto', background:'#fff' }}>
            <div style={{ padding:'12px 0', display:'flex', justifyContent:'center', borderBottom:'1px solid #F1F5F9' }}>
              <select style={{ fontSize:'12px', border:'1px solid #E2E8F0', borderRadius:'6px', padding:'6px 24px 6px 10px', color:'#475569', background:'#fff' }}>
                <option>C</option>
              </select>
            </div>
            <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'16px' }}>
              <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
                <path d="M8 14l4-4M60 14l4 4M12 58l-4 4M60 58l4-4" stroke="#BFDBFE" strokeWidth="2" strokeLinecap="round"/>
                <rect x="24" y="20" width="28" height="34" rx="3" stroke="#2563EB" strokeWidth="2.5" fill="#EFF6FF"/>
                <path d="M30 30h10M30 37h16M30 44h12" stroke="#2563EB" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="50" cy="48" r="9" fill="#fff" stroke="#2563EB" strokeWidth="2.5"/>
                <path d="M50 44v8M46 48h8" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              <div style={{ fontSize:'14px', fontWeight:600, color:'#64748B' }}>No metadata</div>
            </div>
          </div>
          ) : activeTab === 'Workflows' ? (
          /* Workflows full view (Bricsys 2-panel) */
          <div style={{ flex:1, display:'flex', overflow:'hidden', background:'#fff' }}>
            {/* left: workflow list */}
            <div style={{ width:'320px', borderRight:'1px solid #E2E8F0', display:'flex', flexDirection:'column', overflow:'hidden' }}>
              <div style={{ padding:'12px 16px', borderBottom:'1px solid #E2E8F0' }}>
                <select style={{ width:'100%', fontSize:'12px', border:'1px solid #E2E8F0', borderRadius:'6px', padding:'6px 8px', color:'#475569', background:'#fff' }}>
                  <option>ACTIVE AUTOMATIONS</option>
                  <option>All</option>
                  <option>Completed</option>
                </select>
              </div>
              <div style={{ flex:1, overflowY:'auto' }}>
                {approvals.length === 0 && <div style={{ padding:'20px', fontSize:'13px', color:'#94A3B8', textAlign:'center' }}>No workflows yet</div>}
                {approvals.map((a, i) => {
                  const active = selectedApproval === i;
                  return (
                    <div key={i} onClick={() => setSelectedApproval(i)}
                      style={{ display:'flex', gap:'10px', padding:'12px 16px', cursor:'pointer', borderBottom:'1px solid #F1F5F9', background: active ? '#EFF6FF' : 'transparent', borderLeft: active ? '3px solid #2563EB' : '3px solid transparent' }}>
                      <div style={{ width:'52px', height:'40px', background:'#F1F5F9', borderRadius:'4px', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px' }}>&#128196;</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:'12px', fontWeight:600, color:'#1E293B', lineHeight:1.3 }}>{a.title}</div>
                        <div style={{ fontSize:'11px', color:'#94A3B8', marginTop:'3px' }}>Coordinator: {a.requestedByName || '\u2014'}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* right: workflow detail */}
            <div style={{ flex:1, overflowY:'auto', padding:'24px 32px' }}>
              {approvals[selectedApproval] ? (() => {
                const a = approvals[selectedApproval];
                const daysOpen = a.createdAt ? Math.max(0, Math.floor((Date.now() - new Date(a.createdAt)) / 86400000)) : 0;
                const statusColors = { PENDING:'#F59E0B', APPROVED:'#10B981', REJECTED:'#EF4444', COMPLETED:'#10B981' };
                const sc = statusColors[a.status] || '#F59E0B';
                const colors = ['#2563EB','#10B981','#F59E0B','#8B5CF6','#EC4899'];
                return (
                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'16px' }}>
                      <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                        <span style={{ fontSize:'18px' }}>&#128196;</span>
                        <span style={{ fontSize:'15px', fontWeight:600, color:'#1E293B' }}>{a.description || a.title}</span>
                      </div>
                      <span style={{ fontSize:'12px', color:'#2563EB', cursor:'pointer', display:'flex', alignItems:'center', gap:'4px', whiteSpace:'nowrap' }}>&#128337; View complete task history</span>
                    </div>
                    <div style={{ fontSize:'13px', color:'#475569', marginBottom:'8px' }}>
                      <span style={{ fontWeight:600 }}>Assigned to:</span> {a.assignedToName || 'Reviewers'} <span style={{ color:'#94A3B8' }}>(The first who reacts)</span>
                    </div>
                    <div style={{ fontSize:'12px', color:'#94A3B8', marginBottom:'16px', display:'flex', alignItems:'center', gap:'4px' }}>&#128337; open for {daysOpen} day(s)</div>
                    <div style={{ display:'inline-block', background:'#FEF3C7', color:'#B45309', fontSize:'11px', fontWeight:700, padding:'5px 12px', borderRadius:'4px', border:'1px solid #FDE68A', marginBottom:'20px' }}>
                      {a.status === 'PENDING' ? 'NOT RESPONDED YET' : a.status}
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                      {decisions.length === 0 && <div style={{ fontSize:'12px', color:'#94A3B8' }}>No responses yet</div>}
                      {decisions.map((d, i) => {
                        const name = d.decidedByName || 'Reviewer';
                        const initials = name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
                        const color = colors[name.charCodeAt(0) % colors.length];
                        return (
                          <div key={i} style={{ display:'flex', gap:'10px', alignItems:'center' }}>
                            <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:color, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:700 }}>{initials}</div>
                            <span style={{ fontSize:'13px', color:'#334155' }}>{name}</span>
                            {d.decision && <span style={{ fontSize:'11px', color: d.decision==='APPROVED' ? '#10B981' : '#EF4444', fontWeight:600 }}>&#183; {d.decision}</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })() : (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#94A3B8', fontSize:'13px' }}>Select a workflow to view</div>
              )}
            </div>
          </div>
          ) : activeTab === 'Attachments' ? (
          /* Attachments full view */
          <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'auto', background:'#fff' }}>
            <div style={{ padding:'16px 24px', borderBottom:'1px solid #E2E8F0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontSize:'15px', fontWeight:600, color:'#1E293B' }}>Attachments {attachments.length > 0 && `(${attachments.length})`}</span>
              <label style={{ background:'#2563EB', color:'#fff', fontSize:'12px', fontWeight:600, padding:'8px 16px', borderRadius:'20px', cursor:'pointer', display:'inline-flex', alignItems:'center', gap:'6px' }}>
                {uploadingAtt ? 'Uploading...' : '+ Add attachment'}
                <input type="file" style={{ display:'none' }} disabled={uploadingAtt}
                  onChange={e => { if (e.target.files[0]) uploadAttachment(e.target.files[0]); e.target.value=''; }} />
              </label>
            </div>
            {attachments.length === 0 ? (
              <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'14px' }}>
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none"><path d="M42 18L22 38a6 6 0 008.5 8.5L52 25a10 10 0 00-14-14L18 31" stroke="#BFDBFE" strokeWidth="3" strokeLinecap="round"/></svg>
                <div style={{ fontSize:'14px', fontWeight:600, color:'#64748B' }}>No attachments</div>
              </div>
            ) : (
              <div style={{ flex:1, overflowY:'auto', padding:'12px 24px' }}>
                {attachments.map((att, i) => {
                  const ext = (att.format || att.fileName?.split('.').pop() || '').toUpperCase();
                  const sizeKb = att.fileSize ? (att.fileSize > 1048576 ? (att.fileSize/1048576).toFixed(1)+' MB' : Math.round(att.fileSize/1024)+' KB') : '';
                  return (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px', borderBottom:'1px solid #F1F5F9' }}>
                      <div style={{ width:'40px', height:'40px', borderRadius:'6px', background:'#EFF6FF', color:'#2563EB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:700, flexShrink:0 }}>{ext || 'FILE'}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:'13px', fontWeight:600, color:'#1E293B', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{att.fileName}</div>
                        <div style={{ fontSize:'11px', color:'#94A3B8' }}>{sizeKb}{att.uploadedByName ? ' \u00b7 ' + att.uploadedByName : ''}{att.createdAt ? ' \u00b7 ' + new Date(att.createdAt).toLocaleDateString() : ''}</div>
                      </div>
                      <a href={att.fileUrl} target="_blank" rel="noreferrer" style={{ fontSize:'12px', color:'#2563EB', textDecoration:'none', padding:'4px 8px' }}>Download</a>
                      <button onClick={() => deleteAttachment(att.id)} style={{ background:'none', border:'none', color:'#EF4444', fontSize:'14px', cursor:'pointer', padding:'4px 8px' }}>&#215;</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          ) : activeTab === 'Versions' ? (
          /* Versions timeline (Bricsys) */
          <div style={{ flex:1, overflowY:'auto', background:'#fff', padding:'24px 40px' }}>
            {(() => {
              const rows = versions.length > 0 ? versions : [{ versionNumber: doc.currentVersion || '1.0', fileName: doc.fileName, uploadedByName: null, createdAt: doc.createdAt, _current:true }];
              const fmtDay = (d) => {
                if (!d) return 'UNKNOWN';
                const date = new Date(d); const today = new Date(); const yest = new Date(); yest.setDate(today.getDate()-1);
                if (date.toDateString() === today.toDateString()) return 'TODAY';
                if (date.toDateString() === yest.toDateString()) return 'YESTERDAY';
                return date.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }).toUpperCase();
              };
              let lastDay = null;
              return rows.map((v, i) => {
                const day = fmtDay(v.createdAt);
                const showHeader = day !== lastDay; lastDay = day;
                return (
                  <div key={i}>
                    {showHeader && <div style={{ textAlign:'center', fontSize:'11px', fontWeight:600, color:'#94A3B8', margin:'16px 0 12px' }}>{day}</div>}
                    <div onClick={() => { const furl = v.fileUrl || v.filePath || doc.fileUrl; if (furl) router.push('/viewer?url=' + encodeURIComponent(furl) + '&title=' + encodeURIComponent((doc.title||doc.fileName) + ' - v' + v.versionNumber) + '&docId=' + doc.id + '&projectId=' + projectId); else alert('No file for this version.'); }}
                      style={{ display:'flex', alignItems:'center', gap:'16px', background:'#fff', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'12px 16px', marginBottom:'8px', cursor:'pointer', transition:'box-shadow 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.boxShadow='0 2px 8px rgba(37,99,235,0.15)'}
                      onMouseLeave={e => e.currentTarget.style.boxShadow='none'}>
                      <div style={{ width:'44px', height:'52px', background:'#F1F5F9', borderRadius:'4px', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>&#128196;</div>
                      <span style={{ background:'#EFF6FF', color:'#2563EB', fontSize:'11px', fontWeight:700, padding:'4px 10px', borderRadius:'6px', border:'1px solid #BFDBFE', whiteSpace:'nowrap' }}>VERSION {v.versionNumber}</span>
                      <span style={{ color:'#CBD5E1' }}>&#8212;</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <span style={{ fontSize:'13px', color:'#475569' }}>{v.changeSummary || v.fileName || ''}</span>
                      </div>
                      <span style={{ fontSize:'13px', color:'#334155', whiteSpace:'nowrap' }}>{v.uploadedByName || 'ORARCH user'}</span>
                      <span style={{ fontSize:'12px', color:'#94A3B8', whiteSpace:'nowrap', minWidth:'150px', textAlign:'right' }}>{v.createdAt ? new Date(v.createdAt).toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '\u2014'}</span>
                      <span style={{ fontSize:'12px', color:'#64748B', whiteSpace:'nowrap', minWidth:'110px', textAlign:'right' }}>{doc.status || 'DRAFT'}</span>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
          ) : activeTab === 'History' ? (
          /* History table (Bricsys) */
          <div style={{ flex:1, overflowY:'auto', background:'#fff' }}>
            <div style={{ display:'flex', padding:'12px 24px', borderBottom:'1px solid #E2E8F0', fontSize:'11px', fontWeight:600, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.5px' }}>
              <div style={{ flex:2 }}>User</div>
              <div style={{ flex:2 }}>Date &#8595;</div>
              <div style={{ flex:1 }}>Version</div>
              <div style={{ flex:2 }}>Action</div>
            </div>
            {(() => {
              const rows = history.length > 0 ? history.map(h => ({
                user: h.userName || 'ORARCH user',
                date: h.createdAt,
                version: (h.newValues && (()=>{ try { return JSON.parse(h.newValues).version; } catch { return null; } })()) || doc.currentVersion || '1.0',
                action: h.action,
                raw: h
              })) : [
                { user: 'ORARCH user', date: doc.createdAt, version: doc.currentVersion || '1.0', action: 'Document created' },
                { user: 'ORARCH user', date: doc.updatedAt, version: doc.currentVersion || '1.0', action: `Status set to ${doc.status || 'DRAFT'}` },
              ];
              return rows.map((r, i) => (
                <div key={i} onClick={() => setSelectedHistory(r)}
                  style={{ display:'flex', padding:'14px 24px', borderBottom:'1px solid #F1F5F9', fontSize:'13px', color:'#334155', alignItems:'center', cursor:'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background='#F8FAFC'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <div style={{ flex:2, display:'flex', alignItems:'center', gap:'8px' }}>
                    <div style={{ width:'26px', height:'26px', borderRadius:'50%', background:'#2563EB', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:700 }}>{(r.user||'U').slice(0,2).toUpperCase()}</div>
                    {r.user}
                  </div>
                  <div style={{ flex:2, color:'#64748B' }}>{r.date ? new Date(r.date).toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '\u2014'}</div>
                  <div style={{ flex:1 }}><span style={{ background:'#EFF6FF', color:'#2563EB', fontSize:'11px', fontWeight:600, padding:'2px 8px', borderRadius:'4px' }}>{r.version}</span></div>
                  <div style={{ flex:2, color:'#475569' }}>{r.action}</div>
                </div>
              ));
            })()}
            {selectedHistory && (
              <div onClick={() => setSelectedHistory(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:'10px', width:'440px', maxWidth:'90%', maxHeight:'80vh', overflow:'auto', boxShadow:'0 10px 40px rgba(0,0,0,0.2)' }}>
                  <div style={{ padding:'16px 20px', borderBottom:'1px solid #E2E8F0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <span style={{ fontSize:'15px', fontWeight:700, color:'#1E293B' }}>Activity detail</span>
                    <button onClick={() => setSelectedHistory(null)} style={{ background:'none', border:'none', fontSize:'18px', color:'#94A3B8', cursor:'pointer' }}>&#215;</button>
                  </div>
                  <div style={{ padding:'20px' }}>
                    <div style={{ fontSize:'15px', fontWeight:600, color:'#2563EB', marginBottom:'16px' }}>{selectedHistory.action}</div>
                    {[
                      { label:'User', value: selectedHistory.user },
                      { label:'Date', value: selectedHistory.date ? new Date(selectedHistory.date).toLocaleString('en-GB', { day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '\u2014' },
                      { label:'Version', value: selectedHistory.version },
                    ].map((row, k) => (
                      <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #F1F5F9' }}>
                        <span style={{ fontSize:'13px', color:'#94A3B8' }}>{row.label}</span>
                        <span style={{ fontSize:'13px', color:'#334155', fontWeight:500 }}>{row.value}</span>
                      </div>
                    ))}
                    {selectedHistory.raw && (selectedHistory.raw.oldValues || selectedHistory.raw.newValues) && (
                      <div style={{ marginTop:'16px' }}>
                        <div style={{ fontSize:'12px', fontWeight:600, color:'#64748B', marginBottom:'8px' }}>Changes</div>
                        {selectedHistory.raw.oldValues && <div style={{ fontSize:'12px', color:'#EF4444', background:'#FEF2F2', padding:'8px', borderRadius:'6px', marginBottom:'6px', wordBreak:'break-all' }}>Before: {selectedHistory.raw.oldValues}</div>}
                        {selectedHistory.raw.newValues && <div style={{ fontSize:'12px', color:'#059669', background:'#F0FDF4', padding:'8px', borderRadius:'6px', wordBreak:'break-all' }}>After: {selectedHistory.raw.newValues}</div>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          ) : (
          <>
          {/* PDF Preview */}
          <div style={{ flex:1, background:'#E2E8F0', overflow:'auto', position:'relative', display:'flex', alignItems:'center', justifyContent:'center', padding:'32px' }}>
            {doc.fileUrl ? (
              doc.mimeType?.includes('image') ? (
                <div style={{ position:'relative', maxWidth:'560px', width:'100%', background:'#fff', borderRadius:'8px', boxShadow:'0 4px 20px rgba(0,0,0,0.12)', overflow:'hidden', cursor:'pointer' }}
                  onClick={() => router.push('/viewer?url=' + encodeURIComponent(doc.fileUrl) + '&title=' + encodeURIComponent(doc.title || doc.fileName) + '&docId=' + doc.id + '&projectId=' + projectId)}
                  onMouseEnter={e => { const o = e.currentTarget.querySelector('.viewer-overlay'); if(o) o.style.opacity='1'; }}
                  onMouseLeave={e => { const o = e.currentTarget.querySelector('.viewer-overlay'); if(o) o.style.opacity='0'; }}>
                  <img src={doc.fileUrl} alt={doc.title} style={{ width:'100%', display:'block' }} />
                  <div className="viewer-overlay" style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', opacity:0, transition:'opacity 0.2s' }}>
                    <span style={{ background:'rgba(0,0,0,0.6)', color:'#fff', padding:'8px 18px', borderRadius:'20px', fontSize:'13px', display:'flex', alignItems:'center', gap:'6px' }}>👁 Open in viewer</span>
                  </div>
                </div>
    ) : (
           doc.mimeType?.includes('pdf') || doc.fileName?.toLowerCase().endsWith('.pdf') ? (
                  <div style={{ position:'relative', maxWidth:'560px', width:'100%', background:'#fff', borderRadius:'8px', boxShadow:'0 4px 20px rgba(0,0,0,0.12)', overflow:'hidden', cursor:'pointer' }}
                  onClick={() => router.push('/viewer?url=' + encodeURIComponent(doc.fileUrl) + '&title=' + encodeURIComponent(doc.title || doc.fileName) + '&docId=' + doc.id + '&projectId=' + projectId)}
                  onMouseEnter={e => { const o = e.currentTarget.querySelector('.viewer-overlay'); if(o) o.style.opacity='1'; }}
                  onMouseLeave={e => { const o = e.currentTarget.querySelector('.viewer-overlay'); if(o) o.style.opacity='0'; }}>
                  <PdfPreview url={doc.fileUrl} />
                  <div className="viewer-overlay" style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', opacity:0, transition:'opacity 0.2s', pointerEvents:'none' }}>
                    <span style={{ background:'rgba(0,0,0,0.6)', color:'#fff', padding:'8px 18px', borderRadius:'20px', fontSize:'13px', display:'flex', alignItems:'center', gap:'6px' }}>👁 Open in viewer</span>
                  </div>
                </div>
                ) : (
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', flexDirection:'column', gap:'16px' }}>
                    <div style={{ fontSize:'64px' }}>📐</div>
                    <div style={{ fontSize:'13px', fontWeight:600, color:'#1E293B' }}>{doc.title || doc.fileName}</div>
                    <button onClick={() =>router.push('/viewer?url=' + encodeURIComponent(doc.fileUrl) + '&title=' + encodeURIComponent(doc.title || doc.fileName) + '&docId=' + doc.id + '&projectId=' + projectId)}
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
                <button onClick={() => { if (doc.fileUrl) router.push('/viewer?url=' + encodeURIComponent(doc.fileUrl) + '&title=' + encodeURIComponent(doc.title || doc.fileName) + '&docId=' + doc.id + '&projectId=' + projectId); }}
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
          </>
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
  // Sync document overlay with URL (?doc=<id>) — opens on click, deep-link, and back-from-viewer
  useEffect(() => {
    if (!router.isReady) return;  // wait until query is parsed
    const docId = router.query.doc;
    if (docId && fileList.length > 0) {
      const found = fileList.find(f => String(f.id) === String(docId));
      if (found) setSelectedDoc(found);
    }
    if (!docId) setSelectedDoc(null);
  }, [router.isReady, router.query.doc, fileList]);
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
  const [navExpanded, setNavExpanded] = useState(false);
  const [foldersPanelOpen, setFoldersPanelOpen] = useState(true);
  const [folderMenu, setFolderMenu] = useState(null);
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
      <Topbar projectName={project?.name} />
      {/* Folder right-click context menu (ADMIN) */}
      {folderMenu && (
        <>
          <div onClick={() => setFolderMenu(null)} onContextMenu={(e) => { e.preventDefault(); setFolderMenu(null); }}
            style={{ position:'fixed', inset:0, zIndex:998 }} />
          <div style={{ position:'fixed', top: folderMenu.y, left: folderMenu.x, background:'#fff', border:'1px solid #E2E8F0', borderRadius:'8px', boxShadow:'0 4px 20px rgba(0,0,0,0.15)', zIndex:999, minWidth:'160px', overflow:'hidden', padding:'4px' }}>
            <div style={{ padding:'6px 12px', fontSize:'11px', color:'#94A3B8', borderBottom:'1px solid #F1F5F9', marginBottom:'4px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{folderMenu.folder.name}</div>
            <button onClick={() => { const f = folderMenu.folder; setFolderMenu(null); deleteFolder({ stopPropagation: () => {} }, f.id); }}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:'8px', padding:'8px 12px', background:'none', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'13px', color:'#EF4444', textAlign:'left' }}
              onMouseEnter={e => e.currentTarget.style.background='#FEF2F2'}
              onMouseLeave={e => e.currentTarget.style.background='none'}>
              🗑 Delete folder
            </button>
          </div>
        </>
      )}

      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

        {/* ── LEFT SIDEBAR ─────────────────────────────────────────────────── */}
        {/* ── NARROW DARK ICON STRIP ── */}

        
<div style={{ width: navExpanded ? '200px' : '80px', background:'#1E293B', display:'flex', flexDirection:'column', alignItems: navExpanded ? 'stretch' : 'center', flexShrink:0, paddingTop:'8px', transition:'width 0.2s ease', overflow:'hidden' }}>
  {[
    { title:'Files', active:true, path:null, icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="3" y="2" width="10" height="14" rx="1.5" stroke="#fff" strokeWidth="1.4"/><path d="M6 6h6M6 9h4" stroke="#fff" strokeWidth="1.4" strokeLinecap="round"/></svg> },
    { title:'Address Book', path:'/address-book', icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="6" r="3.5" stroke="#94A3B8" strokeWidth="1.4"/><path d="M2.5 16a6.5 6.5 0 0113 0" stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round"/></svg> },
    { title:'Tasks', path:'/tasks', icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 7h10M4 11h7M4 3h14" stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round"/></svg> },
    { title:'Messages', path:'/messages', icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="3" width="14" height="10" rx="1.5" stroke="#94A3B8" strokeWidth="1.4"/><path d="M6 13l3 3 3-3" stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    { title:'Reports', path:'/reports', icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 14V6l4 4 4-4 4 4" stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  ].map(item => (
    <button key={item.title} title={item.title} onClick={() => item.path && router.push(item.path)}
      style={{ width: navExpanded ? '90%' : '38px', height:'38px', borderRadius:'8px', background: item.active ? 'rgba(255,255,255,0.15)' : 'transparent', border:'none', cursor: item.path ? 'pointer' : 'default', display:'flex', alignItems:'center', justifyContent: navExpanded ? 'flex-start' : 'center', gap:'12px', margin:'1px auto', padding: navExpanded ? '0 14px' : '0' }}
      onMouseEnter={e => { if (!item.active && item.path) e.currentTarget.style.background='rgba(255,255,255,0.08)'; }}
      onMouseLeave={e => { if (!item.active) e.currentTarget.style.background='transparent'; }}>
      {item.icon}
      {navExpanded && <span style={{ color: item.active ? '#fff' : '#94A3B8', fontSize:'13px', fontWeight: item.active ? 600 : 400, whiteSpace:'nowrap' }}>{item.title}</span>}
    </button>
  ))}
  {/* Collapse/Expand toggle at bottom (Bricsys-style) */}
  <button onClick={() => setNavExpanded(v => !v)} title={navExpanded ? 'Collapse Menu' : 'Expand'}
    style={{ marginTop:'auto', background:'none', border:'none', borderTop:'1px solid rgba(255,255,255,0.08)', cursor:'pointer', color:'#94A3B8', padding:'14px', display:'flex', alignItems:'center', justifyContent: navExpanded ? 'flex-start' : 'center', gap:'10px', fontSize:'13px' }}>
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
      <path d={navExpanded ? "M11 5l-4 4 4 4" : "M7 5l4 4-4 4"} stroke="#94A3B8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    {navExpanded && <span>Collapse Menu</span>}
  </button>
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
          <div style={{ background:'#fff', borderBottom:'1px solid #E2E8F0', padding:'10px 20px', display:'flex', alignItems:'center', gap:'8px' }}>
            {/* Files title (left) - width matches folders panel */}
            <div style={{ width:'260px', display:'flex', alignItems:'center', gap:'8px', flexShrink:0 }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="3" y="2" width="11" height="16" rx="1.5" stroke="#2563EB" strokeWidth="1.5"/>
                <path d="M6 7h6M6 10h5" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span style={{ fontSize:'17px', fontWeight:700, color:'#1E293B' }}>Files</span>
            </div>
            {/* Upload (left of content area, like Bricsys) */}
            <div style={{ flex:1, display:'flex', justifyContent:'flex-start' }}>
              <button onClick={() => setShowUpload(true)}
              style={{ padding:'8px 20px', borderRadius:'20px', border:'none', background:'#2563EB', color:'#fff', fontSize:'13px', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:'6px', boxShadow:'0 2px 8px rgba(37,99,235,0.3)' }}>
              + Upload
            </button>
            </div>
           
            
           
            {/* panel toggle (right) - matches Bricsys */}
            <div style={{ width:'160px', display:'flex', justifyContent:'flex-end', flexShrink:0 }}>
              <button onClick={() => setFoldersPanelOpen(v => !v)} title={foldersPanelOpen ? 'Hide folders panel' : 'Show folders panel'}
                style={{ background:'none', border:'1px solid #E2E8F0', borderRadius:'6px', padding:'6px', cursor:'pointer', display:'flex', alignItems:'center' }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="2" y="3" width="14" height="12" rx="1.5" stroke="#64748B" strokeWidth="1.4"/>
                  <path d="M7 3v12" stroke="#64748B" strokeWidth="1.4"/>
                </svg>
              </button>
            </div>
          </div>
          <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
            {/* ── FOLDERS PANEL ── */}
            <div style={{ width: foldersPanelOpen ? '260px' : '0px', borderRight: foldersPanelOpen ? '1px solid #E2E8F0' : 'none', background:'#fff', overflowY:'auto', flexShrink:0, transition:'width 0.2s ease' }}>
             <div style={{ padding:'12px 16px', borderBottom:'1px solid #E2E8F0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontSize:'11px', fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.06em' }}>Folders</span>
                <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                <button onClick={() => setAddingFolder(true)} title="New folder"
                  style={{ background:'none', border:'none', cursor:'pointer', color:'#2563EB', display:'flex', alignItems:'center', padding:0 }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 3v10M3 8h10" stroke="#2563EB" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                </button>
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
                      onContextMenu={(e) => { if (user?.role === 'ADMIN') { e.preventDefault(); setFolderMenu({ x: e.clientX, y: e.clientY, folder: f }); } }}
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
                                <div onClick={() => { setSelectedDoc(f); router.push('/projects/' + id + '?doc=' + f.id, undefined, { shallow: true }); }} style={{ fontWeight:600, color:'#2563EB', fontSize:'13px', cursor:'pointer' }}>{f.title || f.fileName}</div>
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
       {selectedDoc && <DocumentSlidePanel doc={selectedDoc} projectId={id} onClose={(newDoc) => { if (newDoc) { setSelectedDoc(newDoc); router.push('/projects/' + id + '?doc=' + newDoc.id, undefined, { shallow: true }); } else { setSelectedDoc(null); router.push('/projects/' + id, undefined, { shallow: true }); } }} user={user} allDocs={fileList} />}
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
