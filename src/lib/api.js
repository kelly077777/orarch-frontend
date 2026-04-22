import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { projects, documents, approvals, notifications } from '../../lib/api';
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

// ── Upload Modal ──────────────────────────────────────────────────────────────

function UploadModal({ projectId, onClose, onUploaded }) {
  const [file, setFile]       = useState(null);
  const [title, setTitle]     = useState('');
  const [docType, setDocType] = useState('DRAWING');
  const [discipline, setDiscipline] = useState('ARCHITECTURAL');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const fileRef = useRef();

  const handleUpload = async () => {
    if (!file) { setError('Please select a file'); return; }
    setLoading(true); setError('');
    try {
      await documents.upload(projectId, file, { title: title || file.name, documentType: docType, discipline });
      onUploaded(); onClose();
    } catch {
      try {
        await documents.create({ projectId, title: title || file.name, documentType: docType, discipline, fileName: file.name, fileSize: file.size, mimeType: file.type, currentVersion: '1.0' });
        onUploaded(); onClose();
      } catch (e2) { setError(e2.message || 'Upload failed'); }
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
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Document title"
            style={{ width:'100%', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', outline:'none', boxSizing:'border-box' }} />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'16px' }}>
          <div>
            <label style={{ fontSize:'12px', fontWeight:600, color:'#475569', display:'block', marginBottom:'4px' }}>Type</label>
            <select value={docType} onChange={e => setDocType(e.target.value)}
              style={{ width:'100%', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', background:'#fff' }}>
              {['DRAWING','SPECIFICATION','CONTRACT','REPORT','RFI','SUBMITTAL'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:'12px', fontWeight:600, color:'#475569', display:'block', marginBottom:'4px' }}>Discipline</label>
            <select value={discipline} onChange={e => setDiscipline(e.target.value)}
              style={{ width:'100%', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', background:'#fff' }}>
              {['ARCHITECTURAL','STRUCTURAL','MEP','CIVIL','LANDSCAPE'].map(d => <option key={d}>{d}</option>)}
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

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProjectWorkspace() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { id } = router.query;

  const [project, setProject]           = useState(null);
  const [fileList, setFileList]         = useState([]);
  const [activeFolder, setActiveFolder] = useState(null); // null = all / Recent files
  const [sortBy, setSortBy]             = useState('date');
  const [dataLoading, setDataLoading]   = useState(false);
  const [showUpload, setShowUpload]     = useState(false);
  const [showApproval, setShowApproval] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading]);

  useEffect(() => {
    if (user && id) {
      loadProject();
      loadDocuments();
    }
  }, [user, id]);

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
      if (!activeFolder) return true;
      return (f.discipline || '').toUpperCase() === activeFolder.toUpperCase();
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
        <aside style={{ width:'240px', background:'#1E293B', color:'#fff', display:'flex', flexDirection:'column', flexShrink:0, overflowY:'auto' }}>

          {/* Project header */}
          <div style={{ padding:'16px 16px 12px', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', cursor:'pointer', marginBottom:'4px' }}
              onClick={() => router.push('/projects')}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 11L5 7L9 3" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontSize:'11px', color:'#94A3B8' }}>All Projects</span>
            </div>
            {project && (
              <div style={{ marginTop:'8px' }}>
                <div style={{ fontSize:'14px', fontWeight:700, color:'#fff' }}>{project.name}</div>
                {project.clientName && <div style={{ fontSize:'11px', color:'#94A3B8', marginTop:'2px' }}>{project.clientName}</div>}
              </div>
            )}
          </div>

          {/* Nav items */}
          <nav style={{ padding:'8px 0' }}>
            {/* Files — active */}
            <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 16px', background:'rgba(37,99,235,0.3)', borderLeft:'3px solid #2563EB', cursor:'pointer' }}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <rect x="2" y="1.5" width="9" height="12" rx="1.5" stroke="#fff" strokeWidth="1.3"/>
                <path d="M5 5.5h5M5 8h3" stroke="#fff" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              <span style={{ fontSize:'13px', fontWeight:600, color:'#fff' }}>Files</span>
            </div>
            {[
              { label:'Address book', icon:'M10 2a4 4 0 11-8 0 4 4 0 018 0zM2 12a6 6 0 0112 0', path:'/address-book' },
              { label:'Tasks', icon:'M3 6h9M3 10h6M3 2h12', path:'/tasks' },
              { label:'Messages', icon:'M2 4h11v7H2zM5 11l2 3 2-3', path:'/messages' },
              { label:'Reports', icon:'M2 12V4l4 4 3-3 4 4', path:'/reports' },
            ].map(item => (
              <div key={item.label} onClick={() => router.push(item.path)}
                style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 16px', cursor:'pointer', borderLeft:'3px solid transparent' }}
                onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.background='transparent'; }}>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path d={item.icon} stroke="#94A3B8" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{ fontSize:'13px', color:'#94A3B8' }}>{item.label}</span>
              </div>
            ))}
          </nav>

          {/* Folders section */}
          <div style={{ padding:'12px 16px 6px', fontSize:'10px', fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.08em' }}>
            Folders
          </div>

          {/* Recent files */}
          <div
            onClick={() => setActiveFolder(null)}
            style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 16px', cursor:'pointer', background: activeFolder === null ? 'rgba(37,99,235,0.2)' : 'transparent', borderLeft: activeFolder === null ? '3px solid #2563EB' : '3px solid transparent' }}
            onMouseEnter={e => { if (activeFolder !== null) e.currentTarget.style.background='rgba(255,255,255,0.04)'; }}
            onMouseLeave={e => { if (activeFolder !== null) e.currentTarget.style.background='transparent'; }}
          >
            <ClockIcon />
            <span style={{ fontSize:'12px', color: activeFolder === null ? '#60A5FA' : '#94A3B8', fontWeight: activeFolder === null ? 600 : 400 }}>Recent files</span>
          </div>

          {/* Discipline folders */}
          {DISCIPLINES.map((d, i) => {
            const key = d.toUpperCase();
            const active = activeFolder === key;
            const folderColors = ['#3B82F6','#F59E0B','#10B981','#6B7280','#8B5CF6'];
            return (
              <div key={d}
                onClick={() => setActiveFolder(key)}
                style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 16px', cursor:'pointer', background: active ? 'rgba(37,99,235,0.2)' : 'transparent', borderLeft: active ? '3px solid #2563EB' : '3px solid transparent' }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background='rgba(255,255,255,0.04)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background='transparent'; }}
              >
                <ChevronRight />
                <FolderIcon color={folderColors[i]} />
                <span style={{ fontSize:'12px', color: active ? '#60A5FA' : '#94A3B8', fontWeight: active ? 600 : 400, flex:1 }}>{d}</span>
                <span style={{ fontSize:'10px', color:'#475569' }}>{disciplineCounts[key] || 0}</span>
              </div>
            );
          })}
        </aside>

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
            {['New folder','Download','Share'].map(b => (
              <button key={b} style={{ padding:'6px 14px', borderRadius:'6px', border:'1px solid #E2E8F0', background:'#fff', fontSize:'12px', color:'#475569', cursor:'pointer' }}>{b}</button>
            ))}
            <button
              onClick={() => {
                const draft = fileList.find(f => f.status === 'DRAFT' || f.status === 'REJECTED');
                if (draft) setShowApproval(draft);
                else alert('Select a Draft or Rejected document first');
              }}
              style={{ padding:'6px 14px', borderRadius:'6px', border:'1px solid #E2E8F0', background:'#fff', fontSize:'12px', color:'#475569', cursor:'pointer' }}>
              Send for approval
            </button>
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

          <div style={{ flex:1, overflowY:'auto', padding:'20px' }}>

            {/* Recent files thumbnails — shown only on "All" view */}
            {!activeFolder && recentFiles.length > 0 && (
              <div style={{ marginBottom:'24px' }}>
                <div style={{ display:'flex', gap:'12px', overflowX:'auto', paddingBottom:'4px' }}>
                  {recentFiles.map(f => <FileThumbnail key={f.id} file={f} />)}
                </div>
              </div>
            )}

            {/* Table label */}
            <div style={{ fontSize:'11px', fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'12px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span>
                {activeFolder
                  ? `Files — ${activeFolder.charAt(0) + activeFolder.slice(1).toLowerCase()}`
                  : `Files — ${project?.name || ''}`
                }
              </span>
              <span style={{ fontWeight:400 }}>{displayFiles.length} document{displayFiles.length !== 1 ? 's' : ''}</span>
            </div>

            {/* File table */}
            <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:'10px', overflow:'hidden' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'#F8FAFC', borderBottom:'1px solid #E2E8F0' }}>
                    {['File name','Type','Version','Uploaded by','Date','Status','Action'].map(h => (
                      <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:'11px', fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dataLoading ? (
                    <tr><td colSpan={7} style={{ padding:'32px', textAlign:'center', color:'#94A3B8', fontSize:'13px' }}>Loading documents...</td></tr>
                  ) : displayFiles.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding:'32px', textAlign:'center', color:'#94A3B8', fontSize:'13px' }}>
                      No documents yet — click Upload to add one
                    </td></tr>
                  ) : displayFiles.map((f, i) => {
                    const fType = getFileType(f.fileName);
                    const fStatus = f.status || 'DRAFT';
                    return (
                      <tr key={f.id} style={{ borderBottom: i < displayFiles.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                        <td style={{ padding:'10px 14px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                            <span style={{ background: typeColors[fType]||'#F1F5F9', color: typeText[fType]||'#475569', fontSize:'10px', fontWeight:700, padding:'2px 6px', borderRadius:'4px', minWidth:'36px', textAlign:'center' }}>
                              {fType}
                            </span>
                            <div>
                              <div style={{ fontWeight:600, color:'#1E293B', fontSize:'13px' }}>{f.title || f.fileName}</div>
                              <div style={{ fontSize:'11px', color:'#94A3B8' }}>{f.documentType}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding:'10px 14px', fontSize:'12px', color:'#64748B' }}>{f.documentType || '—'}</td>
                        <td style={{ padding:'10px 14px' }}>
                          <span style={{ background:'#EFF6FF', color:'#2563EB', fontSize:'11px', fontWeight:600, padding:'2px 10px', borderRadius:'20px' }}>
                            v{f.currentVersion || '1.0'}
                          </span>
                        </td>
                        <td style={{ padding:'10px 14px', fontSize:'13px', color:'#64748B' }}>
                          {f.uploadedBy ? f.uploadedBy.toString().slice(0,8)+'…' : user?.firstName}
                        </td>
                        <td style={{ padding:'10px 14px', fontSize:'13px', color:'#94A3B8' }}>{formatDate(f.createdAt)}</td>
                        <td style={{ padding:'10px 14px' }}>
                          <span style={{ background: statusBg[fStatus]||'#F1F5F9', color: statusColor[fStatus]||'#64748B', fontSize:'11px', fontWeight:600, padding:'2px 10px', borderRadius:'20px' }}>
                            {statusLabel[fStatus] || fStatus}
                          </span>
                        </td>
                        <td style={{ padding:'10px 14px' }}>
                          <button onClick={() => handleActionBtn(f)}
                            style={{ fontSize:'11px', border:'1px solid #E2E8F0', borderRadius:'6px', padding:'4px 10px', background:'#fff', cursor:'pointer', color:'#475569' }}>
                            {actionLabel(fStatus)}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Drop zone */}
            <div onClick={() => setShowUpload(true)}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); setShowUpload(true); }}
              style={{ marginTop:'16px', border:'1.5px dashed #93C5FD', borderRadius:'12px', background:'#EFF6FF', padding:'20px', textAlign:'center', fontSize:'13px', color:'#94A3B8', cursor:'pointer' }}>
              Drag and drop files here to upload, or click <strong style={{ color:'#2563EB' }}>Upload</strong> above
            </div>
          </div>
        </main>
      </div>

      {showUpload && (
        <UploadModal projectId={id} onClose={() => setShowUpload(false)} onUploaded={loadDocuments} />
      )}
      {showApproval && (
        <ApprovalModal document={showApproval} projectId={id} onClose={() => setShowApproval(null)} onSent={loadDocuments} />
      )}
    </div>
  );
}