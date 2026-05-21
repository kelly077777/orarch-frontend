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

// ── Upload Modal ──────────────────────────────────────────────────────────────

function UploadModal({ projectId, onClose, onUploaded, folderList = [], docTypeList = [], onAddDocType }) {
  const [file, setFile]       = useState(null);
  const [title, setTitle]     = useState('');
  const [docType, setDocType] = useState('');
  const [discipline, setDiscipline] = useState('');
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
            <select value={docType} onChange={e => { if (e.target.value === '__add__') { onAddDocType(); } else { setDocType(e.target.value); } }}
              style={{ width:'100%', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', background:'#fff' }}>
              <option value="">-- Select type --</option>
              {docTypeList.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              <option value="__add__">+ Add new type...</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize:'12px', fontWeight:600, color:'#475569', display:'block', marginBottom:'4px' }}>Discipline</label>
            <select value={discipline} onChange={e => setDiscipline(e.target.value)}
              style={{ width:'100%', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', background:'#fff' }}>
              <option value="">-- Select folder --</option>
{folderList.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
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
  const [folderList, setFolderList]     = useState([]);
  const [addingFolder, setAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderCode, setNewFolderCode] = useState('');
  const [newFolderParentId, setNewFolderParentId] = useState('');
  const [expandedFolders, setExpandedFolders] = useState({});
  const [docTypeList, setDocTypeList]       = useState([]);
  const [addingDocType, setAddingDocType]   = useState(false);
  const [newDocTypeName, setNewDocTypeName] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
      if (!activeFolder) return true;
      return f.folderId === activeFolder || f.discipline === activeFolder;
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
        <aside style={{ width: sidebarCollapsed ? '52px' : '240px', background:'#1E293B', color:'#fff', display:'flex', flexDirection:'column', flexShrink:0, overflowY:'auto', transition:'width 0.2s ease', position:'relative' }}>

          {/* Project header */}
          <div style={{ padding:'12px 12px 10px', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            {!sidebarCollapsed && (
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', marginBottom:'4px' }}
                  onClick={() => router.push('/projects')}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M9 11L5 7L9 3" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span style={{ fontSize:'11px', color:'#94A3B8' }}>All Projects</span>
                </div>
                {project && (
                  <div style={{ marginTop:'6px' }}>
                    <div style={{ fontSize:'14px', fontWeight:700, color:'#fff' }}>{project.name}</div>
                    {project.clientName && <div style={{ fontSize:'11px', color:'#94A3B8', marginTop:'2px' }}>{project.clientName}</div>}
                  </div>
                )}
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
              {!sidebarCollapsed && <span style={{ fontSize:'13px', fontWeight:600, color:'#fff' }}>Folders</span>}
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
                {!sidebarCollapsed && <span style={{ fontSize:'13px', color:'#94A3B8' }}>{item.label}</span>}
              </div>
            ))}
          </nav>

          

          

          
          

          {folderList.length === 0 && !addingFolder && (
            <div style={{ padding:'6px 16px', fontSize:'11px', color:'#475569' }}>No folders yet</div>
          )}

          {/* Tree folder rendering */}
          {folderList.filter(f => !f.parentId).map((f, i) => {
            const folderColors = ['#3B82F6','#F59E0B','#10B981','#6B7280','#8B5CF6'];
            const children = folderList.filter(c => c.parentId === f.id);
            const isExpanded = expandedFolders[f.id];
            const active = activeFolder === f.id;
            return (
              <div key={f.id}>
                {/* Root folder */}
                <div
                  style={{ display:'flex', alignItems:'center', gap:'6px', padding:'7px 12px', cursor:'pointer', background: active ? 'rgba(37,99,235,0.2)' : 'transparent', borderLeft: active ? '3px solid #2563EB' : '3px solid transparent' }}
                  onMouseEnter={e => { e.currentTarget.style.background = active ? 'rgba(37,99,235,0.2)' : 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = active ? 'rgba(37,99,235,0.2)' : 'transparent'; }}
                >
                  {children.length > 0 ? (
                    <button onClick={() => setExpandedFolders(prev => ({ ...prev, [f.id]: !prev[f.id] }))}
                      style={{ background:'none', border:'none', cursor:'pointer', color:'#94A3B8', padding:'0', display:'flex', alignItems:'center' }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d={isExpanded ? 'M2 4l4 4 4-4' : 'M4 2l4 4-4 4'} stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  ) : (
                    <span style={{ width:'12px' }} />
                  )}
                  <div onClick={() => setActiveFolder(f.id)} style={{ display:'flex', alignItems:'center', gap:'6px', flex:1 }}>
                    <FolderIcon color={folderColors[i % folderColors.length]} />
                    {!sidebarCollapsed && (
                      <span style={{ fontSize:'12px', color: active ? '#60A5FA' : '#94A3B8', fontWeight: active ? 600 : 400, flex:1 }}>
                        {f.name}{f.code ? <span style={{ fontSize:'10px', color:'#475569', marginLeft:'4px' }}>({f.code})</span> : ''}
                      </span>
                    )}
                  </div>
                  {!sidebarCollapsed && user?.role === 'ADMIN' && (
                    <button onClick={(e) => deleteFolder(e, f.id)}
                      style={{ background:'none', border:'none', cursor:'pointer', color:'#EF4444', fontSize:'14px', opacity:0, transition:'opacity 0.15s', padding:'0 2px' }}
                      onMouseEnter={e => e.currentTarget.style.opacity='1'}
                      onMouseLeave={e => e.currentTarget.style.opacity='0'}>×</button>
                  )}
                </div>

                {/* Children */}
                {isExpanded && children.map((child, j) => {
                  const childActive = activeFolder === child.id;
                  return (
                    <div key={child.id}
                      onClick={() => setActiveFolder(child.id)}
                      style={{ display:'flex', alignItems:'center', gap:'6px', padding:'6px 12px 6px 28px', cursor:'pointer', background: childActive ? 'rgba(37,99,235,0.2)' : 'transparent', borderLeft: childActive ? '3px solid #2563EB' : '3px solid transparent' }}
                      onMouseEnter={e => { e.currentTarget.style.background = childActive ? 'rgba(37,99,235,0.2)' : 'rgba(255,255,255,0.04)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = childActive ? 'rgba(37,99,235,0.2)' : 'transparent'; }}
                    >
                      <FolderIcon color={folderColors[j % folderColors.length]} />
                      {!sidebarCollapsed && (
                        <span style={{ fontSize:'11px', color: childActive ? '#60A5FA' : '#94A3B8', fontWeight: childActive ? 600 : 400, flex:1 }}>
                          {child.name}{child.code ? <span style={{ fontSize:'10px', color:'#475569', marginLeft:'4px' }}>({child.code})</span> : ''}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        <div style={{ marginTop:'auto', borderTop:'1px solid rgba(255,255,255,0.08)', padding:'12px', display:'flex', justifyContent: sidebarCollapsed ? 'center' : 'flex-end' }}>
            <button onClick={() => setSidebarCollapsed(c => !c)}
              style={{ background:'none', border:'none', cursor:'pointer', color:'#94A3B8', padding:'4px', display:'flex', alignItems:'center', gap:'6px' }}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d={sidebarCollapsed ? 'M6 3l5 5-5 5' : 'M10 3L5 8l5 5'} stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {!sidebarCollapsed && <span style={{ fontSize:'11px', color:'#64748B' }}>Collapse</span>}
            </button>
          </div>
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
            <button onClick={() => setAddingFolder(true)} style={{ padding:'6px 14px', borderRadius:'6px', border:'1px solid #E2E8F0', background:'#fff', fontSize:'12px', color:'#475569', cursor:'pointer' }}>New folder</button>
            {['Download','Share'].map(b => (
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

            {/* Folder cards — shown when no folder is selected */}
            {!activeFolder && (
              <div style={{ marginBottom:'24px' }}>
                {folderList.filter(f => !f.parentId).length > 0 && (
                  <>
                    <div style={{ fontSize:'11px', fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'12px' }}>Folders</div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:'12px', marginBottom:'24px' }}>
                      {folderList.filter(f => !f.parentId).map((f, i) => {
                        const folderColors = ['#3B82F6','#F59E0B','#10B981','#6B7280','#8B5CF6'];
                        const fileCount = fileList.filter(file => file.folderId === f.id || file.discipline === f.name).length;
                        const children = folderList.filter(c => c.parentId === f.id);
                        return (
                          <div key={f.id} onClick={() => setActiveFolder(f.id)}
                            style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:'10px', padding:'16px', cursor:'pointer', transition:'box-shadow 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'}
                            onMouseLeave={e => e.currentTarget.style.boxShadow='none'}>
                            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' }}>
                              <FolderIcon color={folderColors[i % folderColors.length]} />
                              <div>
                                <div style={{ fontSize:'13px', fontWeight:600, color:'#1E293B' }}>{f.name}</div>
                                {f.code && <div style={{ fontSize:'10px', color:'#94A3B8' }}>{f.code}</div>}
                              </div>
                            </div>
                            <div style={{ fontSize:'11px', color:'#94A3B8' }}>
                              {fileCount} file{fileCount !== 1 ? 's' : ''}
                              {children.length > 0 && ` · ${children.length} subfolder${children.length !== 1 ? 's' : ''}`}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Back button when inside a folder */}
            {activeFolder && (
              <div style={{ marginBottom:'16px', display:'flex', alignItems:'center', gap:'8px' }}>
                <button onClick={() => setActiveFolder(null)}
                  style={{ display:'flex', alignItems:'center', gap:'6px', background:'none', border:'none', cursor:'pointer', color:'#2563EB', fontSize:'13px', padding:0 }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M9 11L5 7L9 3" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Back to folders
                </button>
                <span style={{ color:'#94A3B8', fontSize:'13px' }}>/ {folderList.find(f => f.id === activeFolder)?.name}</span>

                {/* Subfolders inside active folder */}
                {folderList.filter(f => f.parentId === activeFolder).length > 0 && (
                  <div style={{ marginLeft:'auto', display:'flex', gap:'8px' }}>
                    {folderList.filter(f => f.parentId === activeFolder).map((sf, i) => {
                      const folderColors = ['#3B82F6','#F59E0B','#10B981','#6B7280','#8B5CF6'];
                      return (
                        <div key={sf.id} onClick={() => setActiveFolder(sf.id)}
                          style={{ display:'flex', alignItems:'center', gap:'6px', background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'6px 12px', cursor:'pointer', fontSize:'12px', color:'#475569' }}>
                          <FolderIcon color={folderColors[i % folderColors.length]} />
                          {sf.name}{sf.code ? ` (${sf.code})` : ''}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Table label */}
            <div style={{ fontSize:'11px', fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'12px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span>
                {activeFolder
                  ? `Files — ${folderList.find(f => f.id === activeFolder)?.name || ''}`
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
                          <div style={{ display:'flex', gap:'6px' }}>
                            <button onClick={() => handleActionBtn(f)}
                              style={{ fontSize:'11px', border:'1px solid #E2E8F0', borderRadius:'6px', padding:'4px 10px', background:'#fff', cursor:'pointer', color:'#475569' }}>
                              {actionLabel(fStatus)}
                            </button>
                            {user?.role === 'ADMIN' && (
                              <button onClick={async () => { if (!confirm('Delete this file?')) return; try { await documents.delete(f.id); loadDocuments(); } catch(e) { alert(e.message); } }}
                                style={{ fontSize:'11px', border:'1px solid #FEE2E2', borderRadius:'6px', padding:'4px 10px', background:'#FFF5F5', cursor:'pointer', color:'#EF4444' }}>
                                Delete
                              </button>
                            )}
                          </div>
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
    </div>
  );
}