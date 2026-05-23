import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { projects, documents, approvals, folders as foldersApi, documentTypes as docTypesApi } from '../../lib/api';

const typeColors  = { DWG:'#DBEAFE', PDF:'#FEE2E2', DOC:'#DCFCE7', DOCX:'#DCFCE7' };
const typeText    = { DWG:'#1D4ED8', PDF:'#991B1B', DOC:'#166534', DOCX:'#166534' };
const statusBg    = { APPROVED:'#DCFCE7', PENDING:'#FEF9C3', REJECTED:'#FEE2E2', DRAFT:'#F1F5F9', IN_REVIEW:'#EDE9FE' };
const statusColor = { APPROVED:'#15803D', PENDING:'#A16207', REJECTED:'#DC2626', DRAFT:'#64748B', IN_REVIEW:'#7C3AED' };
const statusLabel = { APPROVED:'Approved', PENDING:'Pending', REJECTED:'Rejected', DRAFT:'Draft', IN_REVIEW:'In Review' };

function getFileType(fileName = '') {
  const ext = fileName.split('.').pop().toUpperCase();
  return ['DWG','PDF','DOC','DOCX'].includes(ext) ? ext : 'FILE';
}
function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
}

function FolderIcon({ color = '#94A3B8' }) {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M1.5 5C1.5 4.17 2.17 3.5 3 3.5H6L7.5 5H13c.83 0 1.5.67 1.5 1.5V12c0 .83-.67 1.5-1.5 1.5H3C2.17 13.5 1.5 12.83 1.5 12V5z"
        fill={color} fillOpacity="0.15" stroke={color} strokeWidth="1.2"/>
    </svg>
  );
}

function FileThumbnail({ file, onClick }) {
  const fType = getFileType(file.fileName);
  const color = typeText[fType] || '#475569';
  const bg = typeColors[fType] || '#F1F5F9';
  return (
    <div onClick={onClick} style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:'8px', overflow:'hidden', width:'150px', flexShrink:0, cursor:'pointer' }}>
      <div style={{ height:'90px', background:bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ fontSize:'22px', fontWeight:800, color, opacity:0.5 }}>{fType}</div>
      </div>
      <div style={{ padding:'8px 10px' }}>
        <div style={{ fontSize:'12px', fontWeight:600, color:'#1E293B', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{file.title || file.fileName}</div>
        <div style={{ fontSize:'10px', color:'#94A3B8', marginTop:'2px' }}>{formatDate(file.createdAt)}</div>
      </div>
    </div>
  );
}

function UploadModal({ projectId, onClose, onUploaded, folderList=[], docTypeList=[], onAddDocType }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState('');
  const [folderId, setFolderId] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleUpload = async () => {
    if (!file) { setError('Please select a file'); return; }
    setLoading(true); setError('');
    try {
      await documents.upload(projectId, file, { title: title || file.name, documentType: docType, folderId });
      onUploaded(); onClose();
    } catch {
      try {
        await documents.create({ projectId, title: title || file.name, documentType: docType, folderId, description, fileName: file.name, fileSize: file.size, mimeType: file.type, currentVersion: '1.0' });
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
          {file ? <div style={{ fontSize:'13px', color:'#2563EB', fontWeight:600 }}>📄 {file.name}</div>
            : <div style={{ fontSize:'13px', color:'#94A3B8' }}>Click to select file<br/><span style={{ fontSize:'11px' }}>DWG, PDF, DOC, DOCX</span></div>}
        </div>
        <div style={{ marginBottom:'12px' }}>
          <label style={{ fontSize:'12px', fontWeight:600, color:'#475569', display:'block', marginBottom:'4px' }}>Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Document title"
            style={{ width:'100%', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', outline:'none', boxSizing:'border-box' }} />
        </div>
        <div style={{ marginBottom:'12px' }}>
          <label style={{ fontSize:'12px', fontWeight:600, color:'#475569', display:'block', marginBottom:'4px' }}>Description <span style={{ fontWeight:400, color:'#94A3B8' }}>(optional)</span></label>
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description..."
            style={{ width:'100%', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', outline:'none', boxSizing:'border-box' }} />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'16px' }}>
          <div>
            <label style={{ fontSize:'12px', fontWeight:600, color:'#475569', display:'block', marginBottom:'4px' }}>Type</label>
            <select value={docType} onChange={e => { if (e.target.value === '__add__') onAddDocType(); else setDocType(e.target.value); }}
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
            style={{ padding:'8px 20px', border:'none', borderRadius:'8px', background:loading?'#93C5FD':'#2563EB', color:'#fff', fontSize:'13px', fontWeight:600, cursor:loading?'not-allowed':'pointer' }}>
            {loading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ApprovalModal({ document: doc, projectId, onClose, onSent }) {
  const [title, setTitle] = useState(`Review: ${doc?.title || ''}`);
  const [description, setDesc] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        {[{ label:'Approval Title', value:title, set:setTitle, placeholder:'e.g. Review Floor Plan Rev 4' },
          { label:'Description', value:description, set:setDesc, placeholder:'What needs to be reviewed?' }].map(({ label, value, set, placeholder }) => (
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
            style={{ padding:'8px 20px', border:'none', borderRadius:'8px', background:loading?'#93C5FD':'#2563EB', color:'#fff', fontSize:'13px', fontWeight:600, cursor:loading?'not-allowed':'pointer' }}>
            {loading ? 'Sending...' : 'Send for Approval'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProjectWorkspace() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { id } = router.query;

  const [project, setProject] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [activeFolder, setActiveFolder] = useState(null);
  const [sortBy, setSortBy] = useState('date');
  const [dataLoading, setDataLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showApproval, setShowApproval] = useState(null);
  const [folderList, setFolderList] = useState([]);
  const [addingFolder, setAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderCode, setNewFolderCode] = useState('');
  const [newFolderParentId, setNewFolderParentId] = useState('');
  const [expandedFolders, setExpandedFolders] = useState({});
  const [docTypeList, setDocTypeList] = useState([]);
  const [addingDocType, setAddingDocType] = useState(false);
  const [newDocTypeName, setNewDocTypeName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { if (!authLoading && !user) router.push('/login'); }, [user, authLoading]);
  useEffect(() => { if (user && id) { loadProject(); loadDocuments(); loadFolders(); loadDocTypes(); } }, [user, id]);

  const loadFolders = async () => { try { const data = await foldersApi.list(id); setFolderList(data); } catch {} };
  const loadProject = async () => { try { const data = await projects.get(id); setProject(data); } catch {} };
  const loadDocuments = async () => {
    setDataLoading(true);
    try { const data = await documents.list(id); setFileList(Array.isArray(data) ? data : []); } catch {} finally { setDataLoading(false); }
  };
  const loadDocTypes = async () => { try { const data = await docTypesApi.list(id); setDocTypeList(data); } catch {} };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const folder = await foldersApi.create({ name: newFolderName.trim(), code: newFolderCode.trim(), parentId: newFolderParentId || null, projectId: id, organizationId: user.organizationId });
      setFolderList(prev => [...prev, folder]);
      setNewFolderName(''); setNewFolderCode(''); setNewFolderParentId(''); setAddingFolder(false);
    } catch { alert('Failed to create folder'); }
  };

  const deleteFolder = async (e, folderId) => {
    e.stopPropagation();
    if (!confirm('Delete this folder?')) return;
    await foldersApi.delete(folderId);
    setFolderList(prev => prev.filter(f => f.id !== folderId));
  };

  const createDocType = async () => {
    if (!newDocTypeName.trim()) return;
    try {
      const type = await docTypesApi.create({ name: newDocTypeName.trim(), projectId: id, organizationId: user.organizationId });
      setDocTypeList(prev => [...prev, type]);
      setNewDocTypeName(''); setAddingDocType(false);
    } catch { alert('Failed to create type'); }
  };

  const actionLabel = (status) => ({ DRAFT:'Send', REJECTED:'Resubmit', PENDING:'Review', IN_REVIEW:'Review', APPROVED:'Download' }[status] || 'View');

  const handleActionBtn = async (file) => {
    if (['DRAFT','PENDING','IN_REVIEW','REJECTED'].includes(file.status)) setShowApproval(file);
    else if (file.status === 'APPROVED') alert(`Downloading ${file.title || file.fileName}...`);
  };

  const recentFiles = [...fileList].sort((a, b) => new Date(b.createdAt||0) - new Date(a.createdAt||0)).slice(0, 5);

  const displayFiles = fileList
    .filter(f => {
      if (activeFolder && f.folderId !== activeFolder) return false;
      if (searchQuery && !((f.title||'').toLowerCase().includes(searchQuery.toLowerCase()) || (f.fileName||'').toLowerCase().includes(searchQuery.toLowerCase()))) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return (a.title||'').localeCompare(b.title||'');
      return new Date(b.createdAt||0) - new Date(a.createdAt||0);
    });

  const folderColors = ['#3B82F6','#F59E0B','#10B981','#6B7280','#8B5CF6','#EC4899'];

  if (authLoading || !user) return null;

  return (
    <div style={{ fontFamily:"'Segoe UI', Arial, sans-serif", height:'100vh', display:'flex', flexDirection:'column', background:'#F8FAFC' }}>

      {/* ── TOPBAR ── */}
      <div style={{ height:'52px', background:'#fff', borderBottom:'1px solid #E2E8F0', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', flexShrink:0 }}>
        {/* Left: Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:'10px', cursor:'pointer' }} onClick={() => router.push('/projects')}>
          <div style={{ width:'30px', height:'30px', background:'#2563EB', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="2" width="6" height="6" rx="1" fill="#fff"/>
              <rect x="10" y="2" width="6" height="6" rx="1" fill="#fff"/>
              <rect x="2" y="10" width="6" height="6" rx="1" fill="#fff"/>
              <rect x="10" y="10" width="6" height="6" rx="1" fill="#93C5FD"/>
            </svg>
          </div>
          <span style={{ fontSize:'15px', fontWeight:800, color:'#1E293B', letterSpacing:'1px' }}>ORARCH <span style={{ color:'#2563EB' }}>24/7</span></span>
        </div>

        {/* Center: Project name + breadcrumb */}
        <div style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'14px', color:'#94A3B8' }}>
          <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:'#F59E0B', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="5" width="14" height="9" rx="1.5" fill="#fff" fillOpacity="0.3" stroke="#fff" strokeWidth="1"/>
              <rect x="5" y="2" width="6" height="5" rx="1" fill="#fff" fillOpacity="0.5"/>
            </svg>
          </div>
          <span style={{ color:'#1E293B', fontWeight:600 }}>{project?.name || '...'}</span>
          {project?.clientName && <><span>›</span><span style={{ color:'#64748B' }}>{project.clientName}</span></>}
          <span>›</span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2h8v8H2z" stroke="#94A3B8" strokeWidth="1.2" strokeLinejoin="round"/><path d="M4 5h4M4 7h2" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round"/></svg>
        </div>

        {/* Right: Search + Avatar */}
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <div style={{ position:'relative' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ position:'absolute', left:'9px', top:'50%', transform:'translateY(-50%)' }}>
              <circle cx="6" cy="6" r="4.5" stroke="#94A3B8" strokeWidth="1.4"/>
              <path d="M9.5 9.5L12 12" stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search documents..."
              style={{ padding:'6px 12px 6px 30px', border:'1px solid #E2E8F0', borderRadius:'6px', fontSize:'12px', outline:'none', background:'#F8FAFC', width:'200px', color:'#1E293B' }} />
          </div>
          <div style={{ width:'34px', height:'34px', borderRadius:'50%', background:'#EC4899', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:'13px', fontWeight:700, cursor:'pointer' }}>
            {(user?.name || user?.email || 'U').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}
          </div>
        </div>
      </div>

      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

        {/* ── LEFT SIDEBAR — white like Bricsys ── */}
        <aside style={{ width:'200px', background:'#fff', borderRight:'1px solid #E2E8F0', display:'flex', flexDirection:'column', flexShrink:0 }}>

          {/* Nav items */}
          <nav style={{ padding:'8px 0' }}>
            {[
              { label:'Files', icon:<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="2" y="1.5" width="9" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 5.5h5M5 8h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>, active:true, onClick:() => setActiveFolder(null) },
              { label:'Address book', icon:<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="5" r="3" stroke="currentColor" strokeWidth="1.3"/><path d="M2 13a5.5 5.5 0 0111 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>, onClick:() => router.push('/address-book') },
              { label:'Tasks', icon:<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M3 6h9M3 10h6M3 2h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>, onClick:() => router.push('/tasks') },
              { label:'Messages', icon:<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1" y="2" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M4 11l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>, onClick:() => router.push('/messages') },
              { label:'Reports', icon:<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M2 12V4l4 4 3-3 4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>, onClick:() => router.push('/reports') },
            ].map(item => (
              <div key={item.label} onClick={item.onClick}
                style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 16px', cursor:'pointer', borderLeft: item.active ? '3px solid #2563EB' : '3px solid transparent', background: item.active ? '#EFF6FF' : 'transparent', color: item.active ? '#2563EB' : '#64748B' }}
                onMouseEnter={e => { if (!item.active) { e.currentTarget.style.background='#F8FAFC'; e.currentTarget.style.color='#1E293B'; } }}
                onMouseLeave={e => { if (!item.active) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#64748B'; } }}>
                <span style={{ color: item.active ? '#2563EB' : 'currentColor' }}>{item.icon}</span>
                <span style={{ fontSize:'13px', fontWeight: item.active ? 600 : 400 }}>{item.label}</span>
              </div>
            ))}
          </nav>

          {/* Folders section */}
          <div style={{ padding:'12px 16px 6px', display:'flex', alignItems:'center', justifyContent:'space-between', borderTop:'1px solid #F1F5F9' }}>
            <span style={{ fontSize:'10px', fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.08em' }}>Folders</span>
            <button onClick={() => setAddingFolder(true)} style={{ background:'none', border:'none', cursor:'pointer', color:'#2563EB', fontSize:'18px', lineHeight:1 }} title="New folder">+</button>
          </div>

          <div style={{ flex:1, overflowY:'auto' }}>
            {/* Recent files link */}
            <div onClick={() => setActiveFolder(null)}
              style={{ display:'flex', alignItems:'center', gap:'8px', padding:'7px 16px', cursor:'pointer', background: !activeFolder ? '#EFF6FF' : 'transparent', borderLeft: !activeFolder ? '3px solid #2563EB' : '3px solid transparent', color: !activeFolder ? '#2563EB' : '#64748B' }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.3"/><path d="M6.5 4v2.5l1.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
              <span style={{ fontSize:'12px', fontWeight: !activeFolder ? 600 : 400 }}>Recent files</span>
            </div>

            {folderList.filter(f => !f.parentId).map((f, i) => {
              const children = folderList.filter(c => c.parentId === f.id);
              const isExpanded = expandedFolders[f.id];
              const isActive = activeFolder === f.id;
              return (
                <div key={f.id}>
                  <div style={{ display:'flex', alignItems:'center', gap:'6px', padding:'7px 16px', cursor:'pointer', background: isActive ? '#EFF6FF' : 'transparent', borderLeft: isActive ? '3px solid #2563EB' : '3px solid transparent', color: isActive ? '#2563EB' : '#64748B' }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background='#F8FAFC'; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background='transparent'; }}>
                    {children.length > 0 && (
                      <button onClick={() => setExpandedFolders(prev => ({ ...prev, [f.id]: !prev[f.id] }))}
                        style={{ background:'none', border:'none', cursor:'pointer', padding:0, color:'#94A3B8', display:'flex' }}>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d={isExpanded ? 'M2 3l3 4 3-4' : 'M3 2l4 3-4 3'} stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    )}
                    <div onClick={() => setActiveFolder(isActive ? null : f.id)} style={{ display:'flex', alignItems:'center', gap:'7px', flex:1 }}>
                      <FolderIcon color={folderColors[i % folderColors.length]} />
                      <span style={{ fontSize:'12px', fontWeight: isActive ? 600 : 400, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {f.name}{f.code ? ` (${f.code})` : ''}
                      </span>
                    </div>
                    {user?.role === 'ADMIN' && (
                      <button onClick={(e) => deleteFolder(e, f.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#EF4444', fontSize:'13px', opacity:0, padding:'0 2px' }}
                        onMouseEnter={e => e.currentTarget.style.opacity='1'}
                        onMouseLeave={e => e.currentTarget.style.opacity='0'}>×</button>
                    )}
                  </div>
                  {isExpanded && children.map((child, j) => {
                    const childActive = activeFolder === child.id;
                    return (
                      <div key={child.id} onClick={() => setActiveFolder(childActive ? null : child.id)}
                        style={{ display:'flex', alignItems:'center', gap:'7px', padding:'6px 16px 6px 32px', cursor:'pointer', background: childActive ? '#EFF6FF' : 'transparent', borderLeft: childActive ? '3px solid #2563EB' : '3px solid transparent', color: childActive ? '#2563EB' : '#64748B' }}>
                        <FolderIcon color={folderColors[j % folderColors.length]} />
                        <span style={{ fontSize:'12px', fontWeight: childActive ? 600 : 400 }}>{child.name}{child.code ? ` (${child.code})` : ''}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

          {/* Toolbar */}
          <div style={{ background:'#fff', borderBottom:'1px solid #E2E8F0', padding:'8px 20px', display:'flex', alignItems:'center', gap:'8px', flexShrink:0 }}>
            <button onClick={() => setShowUpload(true)}
              style={{ padding:'7px 16px', borderRadius:'6px', border:'none', background:'#2563EB', color:'#fff', fontSize:'13px', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:'6px' }}>
              + Upload
            </button>
            <button onClick={() => setAddingFolder(true)} style={{ padding:'6px 14px', borderRadius:'6px', border:'1px solid #E2E8F0', background:'#fff', fontSize:'12px', color:'#475569', cursor:'pointer' }}>New folder</button>
            <button style={{ padding:'6px 14px', borderRadius:'6px', border:'1px solid #E2E8F0', background:'#fff', fontSize:'12px', color:'#475569', cursor:'pointer' }}>Download</button>
            <button style={{ padding:'6px 14px', borderRadius:'6px', border:'1px solid #E2E8F0', background:'#fff', fontSize:'12px', color:'#475569', cursor:'pointer' }}>Share</button>
            <button onClick={() => { const draft = fileList.find(f => ['DRAFT','REJECTED'].includes(f.status)); if (draft) setShowApproval(draft); else alert('No draft documents found'); }}
              style={{ padding:'6px 14px', borderRadius:'6px', border:'1px solid #E2E8F0', background:'#fff', fontSize:'12px', color:'#475569', cursor:'pointer' }}>
              Send for approval
            </button>
            <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:'8px' }}>
              <span style={{ fontSize:'12px', color:'#94A3B8' }}>Sort:</span>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                style={{ fontSize:'12px', border:'1px solid #E2E8F0', borderRadius:'6px', padding:'4px 8px', color:'#475569', background:'#fff' }}>
                <option value="date">Date modified</option>
                <option value="name">Name</option>
              </select>
            </div>
          </div>

          {/* Files area */}
          <div style={{ flex:1, overflowY:'auto', padding:'20px' }}>

            {/* Recent files thumbnails */}
            {!activeFolder && recentFiles.length > 0 && (
              <div style={{ marginBottom:'24px' }}>
                <div style={{ fontSize:'11px', fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'12px', display:'flex', alignItems:'center', gap:'6px' }}>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5" stroke="#94A3B8" strokeWidth="1.3"/><path d="M6.5 4v2.5l1.5 1.5" stroke="#94A3B8" strokeWidth="1.3" strokeLinecap="round"/></svg>
                  Recent files
                </div>
                <div style={{ display:'flex', gap:'12px', overflowX:'auto', paddingBottom:'4px' }}>
                  {recentFiles.map(f => <FileThumbnail key={f.id} file={f} onClick={() => router.push(`/document-detail?id=${f.id}&projectId=${id}`)} />)}
                </div>
              </div>
            )}

            {/* Files table */}
            <div style={{ fontSize:'11px', fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'12px', display:'flex', justifyContent:'space-between' }}>
              <span>{activeFolder ? `Files — ${folderList.find(f => f.id === activeFolder)?.name || ''}` : `Files — ${project?.name || ''}`}</span>
              <span style={{ fontWeight:400 }}>{displayFiles.length} document{displayFiles.length !== 1 ? 's' : ''}</span>
            </div>

            <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:'10px', overflowX:'auto' }}>
              <table style={{ width:'100%', minWidth:'900px', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'#F8FAFC', borderBottom:'1px solid #E2E8F0' }}>
                    {['File name','Folder','Description','Type','Version','Uploaded by','Date','Status','Action'].map(h => (
                      <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:'11px', fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.04em', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dataLoading ? (
                    <tr><td colSpan={9} style={{ padding:'32px', textAlign:'center', color:'#94A3B8' }}>Loading documents...</td></tr>
                  ) : displayFiles.length === 0 ? (
                    <tr><td colSpan={9} style={{ padding:'32px', textAlign:'center', color:'#94A3B8' }}>No documents yet — click Upload to add one</td></tr>
                  ) : displayFiles.map((f, i) => {
                    const fType = getFileType(f.fileName);
                    const fStatus = f.status || 'DRAFT';
                    return (
                      <tr key={f.id} style={{ borderBottom: i < displayFiles.length-1 ? '1px solid #F1F5F9' : 'none' }}
                        onMouseEnter={e => e.currentTarget.style.background='#FAFAFA'}
                        onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                        <td style={{ padding:'10px 14px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                            <span style={{ background:typeColors[fType]||'#F1F5F9', color:typeText[fType]||'#475569', fontSize:'10px', fontWeight:700, padding:'2px 6px', borderRadius:'4px', minWidth:'34px', textAlign:'center' }}>{fType}</span>
                            <div onClick={() => router.push(`/document-detail?id=${f.id}&projectId=${id}`)} style={{ fontWeight:600, color:'#2563EB', fontSize:'13px', cursor:'pointer' }}>{f.title || f.fileName}</div>
                          </div>
                        </td>
                        <td style={{ padding:'10px 14px', fontSize:'12px', color:'#64748B' }}>{folderList.find(folder => folder.id === f.folderId)?.name || '—'}</td>
                        <td style={{ padding:'10px 14px', fontSize:'12px', color:'#64748B' }}>{f.description || '—'}</td>
                        <td style={{ padding:'10px 14px', fontSize:'12px', color:'#64748B' }}>{f.documentType || '—'}</td>
                        <td style={{ padding:'10px 14px' }}>
                          <span style={{ background:'#EFF6FF', color:'#2563EB', fontSize:'11px', fontWeight:600, padding:'2px 8px', borderRadius:'20px' }}>v{f.currentVersion||'1.0'}</span>
                        </td>
                        <td style={{ padding:'10px 14px', fontSize:'12px', color:'#64748B' }}>{f.uploadedBy ? f.uploadedBy.toString().slice(0,8)+'…' : (user?.firstName || user?.email?.split('@')[0])}</td>
                        <td style={{ padding:'10px 14px', fontSize:'12px', color:'#94A3B8' }}>{formatDate(f.createdAt)}</td>
                        <td style={{ padding:'10px 14px' }}>
                          <span style={{ background:statusBg[fStatus]||'#F1F5F9', color:statusColor[fStatus]||'#64748B', fontSize:'11px', fontWeight:600, padding:'2px 8px', borderRadius:'20px' }}>{statusLabel[fStatus]||fStatus}</span>
                        </td>
                        <td style={{ padding:'10px 14px' }}>
                          <div style={{ display:'flex', gap:'6px' }}>
                            <button onClick={() => handleActionBtn(f)} style={{ fontSize:'11px', border:'1px solid #E2E8F0', borderRadius:'6px', padding:'4px 10px', background:'#fff', cursor:'pointer', color:'#475569' }}>{actionLabel(fStatus)}</button>
                            {user?.role === 'ADMIN' && (
                              <button onClick={async () => { if (!confirm('Delete?')) return; try { await documents.delete(f.id); loadDocuments(); } catch(e) { alert(e.message); } }}
                                style={{ fontSize:'11px', border:'1px solid #FEE2E2', borderRadius:'6px', padding:'4px 8px', background:'#FFF5F5', cursor:'pointer', color:'#EF4444' }}>×</button>
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
              style={{ marginTop:'16px', border:'1.5px dashed #93C5FD', borderRadius:'12px', background:'#EFF6FF', padding:'20px', textAlign:'center', fontSize:'13px', color:'#94A3B8', cursor:'pointer' }}>
              Drag and drop files here to upload, or click <strong style={{ color:'#2563EB' }}>Upload</strong> above
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      {addingDocType && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200 }}>
          <div style={{ background:'#fff', borderRadius:'14px', padding:'28px', width:'380px', boxShadow:'0 8px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ fontSize:'16px', fontWeight:700, color:'#1E293B', marginBottom:'8px' }}>New Document Type</div>
            <input autoFocus value={newDocTypeName} onChange={e => setNewDocTypeName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') createDocType(); if (e.key === 'Escape') { setAddingDocType(false); setNewDocTypeName(''); } }}
              placeholder="e.g. Drawing, Report, Contract..."
              style={{ width:'100%', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'10px 12px', fontSize:'13px', outline:'none', boxSizing:'border-box', marginBottom:'16px' }} />
            <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
              <button onClick={() => { setAddingDocType(false); setNewDocTypeName(''); }} style={{ padding:'8px 18px', border:'1px solid #E2E8F0', borderRadius:'8px', background:'#fff', fontSize:'13px', cursor:'pointer', color:'#475569' }}>Cancel</button>
              <button onClick={createDocType} style={{ padding:'8px 20px', border:'none', borderRadius:'8px', background:'#2563EB', color:'#fff', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>Create</button>
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
              <input autoFocus value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="e.g. Execution, As Built..."
                style={{ width:'100%', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'10px 12px', fontSize:'13px', outline:'none', boxSizing:'border-box' }} />
            </div>
            <div style={{ marginBottom:'14px' }}>
              <label style={{ fontSize:'12px', fontWeight:600, color:'#475569', display:'block', marginBottom:'6px' }}>Short Code <span style={{ fontWeight:400, color:'#94A3B8' }}>(optional)</span></label>
              <input value={newFolderCode} onChange={e => setNewFolderCode(e.target.value.toUpperCase())} placeholder="e.g. EXE, ASB..." maxLength={10}
                style={{ width:'100%', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'10px 12px', fontSize:'13px', outline:'none', boxSizing:'border-box' }} />
            </div>
            <div style={{ marginBottom:'20px' }}>
              <label style={{ fontSize:'12px', fontWeight:600, color:'#475569', display:'block', marginBottom:'6px' }}>Parent Folder <span style={{ fontWeight:400, color:'#94A3B8' }}>(optional)</span></label>
              <select value={newFolderParentId} onChange={e => setNewFolderParentId(e.target.value)}
                style={{ width:'100%', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'10px 12px', fontSize:'13px', background:'#fff' }}>
                <option value="">-- No parent (root folder) --</option>
                {folderList.filter(f => !f.parentId).map(f => <option key={f.id} value={f.id}>{f.name}{f.code ? ` (${f.code})` : ''}</option>)}
              </select>
            </div>
            <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
              <button onClick={() => { setAddingFolder(false); setNewFolderName(''); setNewFolderCode(''); setNewFolderParentId(''); }}
                style={{ padding:'8px 18px', border:'1px solid #E2E8F0', borderRadius:'8px', background:'#fff', fontSize:'13px', cursor:'pointer', color:'#475569' }}>Cancel</button>
              <button onClick={createFolder} style={{ padding:'8px 20px', border:'none', borderRadius:'8px', background:'#2563EB', color:'#fff', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>Create</button>
            </div>
          </div>
        </div>
      )}

      {showUpload && <UploadModal projectId={id} onClose={() => setShowUpload(false)} onUploaded={loadDocuments} folderList={folderList} docTypeList={docTypeList} onAddDocType={() => setAddingDocType(true)} />}
      {showApproval && <ApprovalModal document={showApproval} projectId={id} onClose={() => setShowApproval(null)} onSent={loadDocuments} />}
    </div>
  );
}
