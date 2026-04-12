import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { projects, documents, approvals, notifications } from '../lib/api';

// ── helpers ──────────────────────────────────────────────────
const typeColors  = { DWG:'#DBEAFE', PDF:'#FEE2E2', DOC:'#DCFCE7', DOCX:'#DCFCE7' };
const typeText    = { DWG:'#1D4ED8', PDF:'#991B1B', DOC:'#166534', DOCX:'#166534' };
const statusBg    = { APPROVED:'#DCFCE7', PENDING:'#FEF9C3', REJECTED:'#FEE2E2', DRAFT:'#F1F5F9', IN_REVIEW:'#EDE9FE' };
const statusColor = { APPROVED:'#15803D', PENDING:'#A16207', REJECTED:'#DC2626', DRAFT:'#64748B', IN_REVIEW:'#7C3AED' };
const statusLabel = { APPROVED:'Approved', PENDING:'Pending', REJECTED:'Rejected', DRAFT:'Draft', IN_REVIEW:'In Review' };

function getFileType(fileName = '') {
  const ext = fileName.split('.').pop().toUpperCase();
  return ['DWG','PDF','DOC','DOCX'].includes(ext) ? ext : 'FILE';
}

function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
}

// ── Upload Modal ──────────────────────────────────────────────
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
      onUploaded();
      onClose();
    } catch (err) {
      // Fallback: create document record without actual file storage
      try {
        await documents.create({
          projectId,
          title: title || file.name,
          documentType: docType,
          discipline,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          currentVersion: '1.0',
        });
        onUploaded();
        onClose();
      } catch (e2) {
        setError(e2.message || 'Upload failed');
      }
    } finally {
      setLoading(false);
    }
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

        {[
          { label:'Title', value:title, set:setTitle, type:'text', placeholder:'Document title' },
        ].map(({ label, value, set, type, placeholder }) => (
          <div key={label} style={{ marginBottom:'12px' }}>
            <label style={{ fontSize:'12px', fontWeight:600, color:'#475569', display:'block', marginBottom:'4px' }}>{label}</label>
            <input type={type} value={value} onChange={e => set(e.target.value)} placeholder={placeholder}
              style={{ width:'100%', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', outline:'none', boxSizing:'border-box' }} />
          </div>
        ))}

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

// ── Approval Modal ────────────────────────────────────────────
function ApprovalModal({ document, projectId, onClose, onSent }) {
  const [title, setTitle]       = useState(`Review: ${document?.title || ''}`);
  const [description, setDesc]  = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSend = async () => {
    setLoading(true); setError('');
    try {
      await approvals.create({ documentId: document.id, projectId, title, description, priority });
      await documents.update(document.id, { status: 'IN_REVIEW' });
      onSent();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to send');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
      <div style={{ background:'#fff', borderRadius:'14px', padding:'28px', width:'400px', boxShadow:'0 8px 40px rgba(0,0,0,0.15)' }}>
        <div style={{ fontSize:'16px', fontWeight:700, color:'#1E293B', marginBottom:'4px' }}>Send for Approval</div>
        <div style={{ fontSize:'12px', color:'#94A3B8', marginBottom:'20px' }}>📄 {document?.title}</div>

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

// ── New Project Modal ─────────────────────────────────────────
function NewProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name:'', clientName:'', location:'', projectCode:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!form.name) { setError('Project name is required'); return; }
    setLoading(true); setError('');
    try {
      await projects.create({ ...form, status: 'ACTIVE' });
      onCreated();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key:'name',        label:'Project Name',   placeholder:'e.g. Kigali Heights Tower' },
    { key:'clientName',  label:'Client',         placeholder:'Client name' },
    { key:'location',    label:'Location',       placeholder:'City, Country' },
    { key:'projectCode', label:'Project Code',   placeholder:'e.g. KHT-2026' },
  ];

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
      <div style={{ background:'#fff', borderRadius:'14px', padding:'28px', width:'400px', boxShadow:'0 8px 40px rgba(0,0,0,0.15)' }}>
        <div style={{ fontSize:'16px', fontWeight:700, color:'#1E293B', marginBottom:'20px' }}>New Project</div>
        {fields.map(({ key, label, placeholder }) => (
          <div key={key} style={{ marginBottom:'12px' }}>
            <label style={{ fontSize:'12px', fontWeight:600, color:'#475569', display:'block', marginBottom:'4px' }}>{label}</label>
            <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder}
              style={{ width:'100%', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', outline:'none', boxSizing:'border-box' }} />
          </div>
        ))}
        {error && <div style={{ background:'#FEE2E2', color:'#DC2626', fontSize:'12px', padding:'8px 12px', borderRadius:'6px', marginBottom:'12px' }}>{error}</div>}
        <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end', marginTop:'8px' }}>
          <button onClick={onClose} style={{ padding:'8px 18px', border:'1px solid #E2E8F0', borderRadius:'8px', background:'#fff', fontSize:'13px', cursor:'pointer', color:'#475569' }}>Cancel</button>
          <button onClick={handleCreate} disabled={loading}
            style={{ padding:'8px 20px', border:'none', borderRadius:'8px', background: loading ? '#93C5FD' : '#2563EB', color:'#fff', fontSize:'13px', fontWeight:600, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────
export default function Home() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [projectList, setProjectList]   = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [fileList, setFileList]         = useState([]);
  const [search, setSearch]             = useState('');
  const [sortBy, setSortBy]             = useState('date');
  const [notifCount, setNotifCount]     = useState(0);
  const [dataLoading, setDataLoading]   = useState(false);

  // Modals
  const [showUpload, setShowUpload]       = useState(false);
  const [showApproval, setShowApproval]   = useState(null); // document object
  const [showNewProject, setShowNewProject] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading]);

  // Load projects on mount
  useEffect(() => {
    if (!user) return;
    loadProjects();
    loadNotifCount();
  }, [user]);

  // Load documents when active project changes
  useEffect(() => {
    if (activeProject) loadDocuments(activeProject.id);
  }, [activeProject]);

  const loadProjects = async () => {
    try {
      const data = await projects.list();
      setProjectList(data);
      if (data.length > 0 && !activeProject) setActiveProject(data[0]);
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  };

  const loadDocuments = async (projectId) => {
    setDataLoading(true);
    try {
      const data = await documents.list(projectId);
      setFileList(data);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setDataLoading(false);
    }
  };

  const loadNotifCount = async () => {
    try {
      const data = await notifications.unreadCount();
      setNotifCount(data.count || 0);
    } catch {}
  };

  const handleActionBtn = async (file) => {
    const status = file.status;
    if (status === 'DRAFT') {
      // Edit — update status to IN_REVIEW prompt
      setShowApproval(file);
    } else if (status === 'REJECTED') {
      // Resubmit — bump version
      try {
        await documents.update(file.id, { status: 'DRAFT' });
        loadDocuments(activeProject.id);
      } catch (err) { alert(err.message); }
    } else if (status === 'PENDING' || status === 'IN_REVIEW') {
      setShowApproval(file);
    } else if (status === 'APPROVED') {
      alert(`Downloading ${file.title || file.fileName}...\n(Connect file storage for real downloads)`);
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

  // Filter + sort--------------
  const displayFiles = fileList
    .filter(f => {
      const q = search.toLowerCase();
      return !q || (f.title||'').toLowerCase().includes(q) || (f.fileName||'').toLowerCase().includes(q) || (f.discipline||'').toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'name') return (a.title||'').localeCompare(b.title||'');
      if (sortBy === 'revision') return (a.currentVersion||'').localeCompare(b.currentVersion||'');
      return new Date(b.createdAt||0) - new Date(a.createdAt||0);
    });

  // Discipline folder counts
  const disciplines = ['ARCHITECTURAL','STRUCTURAL','MEP','CIVIL','LANDSCAPE'];
  const folderBgs   = ['#DBEAFE','#FEF9C3','#DCFCE7','#F1F5F9','#EDE9FE'];
  const disciplineCounts = disciplines.map(d => fileList.filter(f => f.discipline === d).length);

  if (authLoading) return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Arial,sans-serif', color:'#94A3B8' }}>Loading...</div>;
  if (!user) return null;

  return (
    <div style={{ fontFamily:'Arial,sans-serif', minHeight:'100vh', background:'#F8FAFC', display:'flex', flexDirection:'column' }}>

      {/* ── TOP BAR ── */}
      <header style={{ background:'#fff', borderBottom:'1px solid #E2E8F0', height:'52px', display:'flex', alignItems:'center', padding:'0 24px', gap:'16px', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ fontWeight:700, fontSize:'18px', letterSpacing:'2px', color:'#2563EB' }}>
          OR<span style={{ color:'#0EA5E9' }}>ARCH</span><span style={{ color:'#2563EB' }}>247</span>
        </div>
        <nav style={{ display:'flex', gap:'4px', marginLeft:'12px' }}>
         {[
  { label:'Files', path:'/' },
{ label:'Projects', path:'/projects' },
{ label:'Address Book', path:'/address-book' },
{ label:'Tasks', path:'/tasks' },
{ label:'Messages', path:'/messages' },
{ label:'Reports', path:'/reports' },
].map(item => (
  <button key={item.label} onClick={() => router.push(item.path)}
    style={{ padding:'6px 14px', borderRadius:'6px', border:'none', cursor:'pointer', fontSize:'13px', fontWeight:500, background: item.path==='/' ? '#EFF6FF' : 'transparent', color: item.path==='/' ? '#2563EB' : '#64748B' }}>
    {item.label}
  </button>
))}
        </nav>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:'12px' }}>
          <input
            placeholder="Search documents..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ border:'1px solid #E2E8F0', borderRadius:'6px', padding:'6px 12px', fontSize:'13px', width:'200px', outline:'none', color:'#1E293B' }}
          />
          {/* Notification bell */}
          <div style={{ position:'relative', cursor:'pointer' }} onClick={loadNotifCount}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2a6 6 0 00-6 6v3l-1.5 2.5h15L16 11V8a6 6 0 00-6-6zm0 16a2 2 0 002-2H8a2 2 0 002 2z" fill="#94A3B8"/>
            </svg>
            {notifCount > 0 && (
              <span style={{ position:'absolute', top:'-4px', right:'-4px', background:'#DC2626', color:'#fff', fontSize:'9px', fontWeight:700, borderRadius:'50%', width:'14px', height:'14px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {notifCount}
              </span>
            )}
          </div>
          {/* Avatar + logout */}
          <div style={{ position:'relative' }}>
            <div
              style={{ width:'34px', height:'34px', borderRadius:'50%', background:'#2563EB', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:700, cursor:'pointer' }}
              title={`${user.firstName} ${user.lastName} — Click to logout`}
              onClick={logout}
            >
              {getInitials(`${user.firstName} ${user.lastName}`)}
            </div>
          </div>
        </div>
      </header>

      {/* ── BODY ── */}
      <div style={{ display:'flex', flex:1 }}>

        {/* ── SIDEBAR ── */}
        <aside style={{ width:'220px', background:'#fff', borderRight:'1px solid #E2E8F0', flexShrink:0 }}>
          <div style={{ padding:'12px 14px 4px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:'10px', fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.08em' }}>Projects</span>
            <button onClick={() => setShowNewProject(true)} style={{ fontSize:'16px', background:'none', border:'none', color:'#2563EB', cursor:'pointer', lineHeight:1 }} title="New project">+</button>
          </div>

          {projectList.length === 0 && (
            <div style={{ padding:'8px 14px', fontSize:'12px', color:'#94A3B8' }}>No projects yet</div>
          )}

          {projectList.map((p, i) => {
            const colors = ['#2563EB','#0EA5E9','#94A3B8','#7C3AED','#059669'];
            const color = colors[i % colors.length];
            const active = activeProject?.id === p.id;
            return (
              <div key={p.id} onClick={() => setActiveProject(p)}
                style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 14px', fontSize:'12px', cursor:'pointer', borderLeft: active ? `3px solid ${color}` : '3px solid transparent', background: active ? '#EFF6FF' : 'transparent', color: active ? color : '#475569', fontWeight: active ? 600 : 400 }}>
                <span style={{ width:'8px', height:'8px', borderRadius:'50%', background:color, flexShrink:0 }} />
                {p.name}
              </div>
            );
          })}

          <div style={{ padding:'16px 14px 6px', fontSize:'10px', fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.08em' }}>Folders</div>
          {disciplines.map((d, i) => {
            const label = d.charAt(0) + d.slice(1).toLowerCase();
            return (
              <div key={d} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'7px 14px', fontSize:'12px', cursor:'pointer', color:'#475569' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 4.5C1 3.67 1.67 3 2.5 3H5l1.5 1.5H11.5c.83 0 1.5.67 1.5 1.5V10c0 .83-.67 1.5-1.5 1.5h-9C1.67 11.5 1 10.83 1 10V4.5z" fill="#94A3B8" fillOpacity="0.25" stroke="#94A3B8" strokeWidth="1.2"/>
                </svg>
                <span>{label}</span>
                <span style={{ marginLeft:'auto', fontSize:'10px', color:'#CBD5E1' }}>{disciplineCounts[i]}</span>
              </div>
            );
          })}
        </aside>

        {/* ── MAIN ── */}
        <main style={{ flex:1, display:'flex', flexDirection:'column' }}>

          {/* BREADCRUMB */}
          <div style={{ background:'#fff', borderBottom:'1px solid #E2E8F0', padding:'8px 20px', fontSize:'12px', color:'#94A3B8' }}>
            <span style={{ color:'#2563EB', cursor:'pointer' }}>Projects</span>
            {activeProject && <><span> / </span><span style={{ color:'#2563EB', cursor:'pointer' }}>{activeProject.name}</span></>}
            <span> / </span>
            <strong style={{ color:'#1E293B' }}>Documents</strong>
          </div>

          {/* TOOLBAR */}
          <div style={{ background:'#fff', borderBottom:'1px solid #E2E8F0', padding:'8px 20px', display:'flex', alignItems:'center', gap:'8px' }}>
            <button onClick={() => setShowUpload(true)}
              style={{ padding:'7px 16px', borderRadius:'6px', border:'none', background:'#2563EB', color:'#fff', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>
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

          <div style={{ padding:'20px' }}>

            {/* FOLDER CARDS — discipline counts */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px', marginBottom:'20px' }}>
              {disciplines.slice(0, 4).map((d, i) => (
                <div key={d} style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:'10px', padding:'12px 14px', display:'flex', alignItems:'center', gap:'10px', cursor:'pointer' }}>
                  <div style={{ width:'36px', height:'36px', borderRadius:'8px', background:folderBgs[i], display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M2 6C2 5.17 2.67 4.5 3.5 4.5H7L9 6.5H14.5c.83 0 1.5.67 1.5 1.5V13c0 .83-.67 1.5-1.5 1.5h-11C2.67 14.5 2 13.83 2 13V6z" fill="#2563EB" fillOpacity="0.3" stroke="#2563EB" strokeWidth="1.2"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize:'13px', fontWeight:600, color:'#1E293B' }}>{d.charAt(0) + d.slice(1).toLowerCase()}</div>
                    <div style={{ fontSize:'11px', color:'#94A3B8' }}>{disciplineCounts[i]} files</div>
                  </div>
                </div>
              ))}
            </div>

            {/* TABLE LABEL */}
            <div style={{ fontSize:'11px', fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'12px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span>Files — {activeProject?.name || 'Select a project'}</span>
              <span style={{ fontWeight:400 }}>{displayFiles.length} document{displayFiles.length !== 1 ? 's' : ''}</span>
            </div>

            {/* FILE TABLE */}
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
                      {search ? 'No documents match your search' : 'No documents yet — click Upload to add one'}
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
                              <div style={{ fontSize:'11px', color:'#94A3B8' }}>{f.description || f.documentType}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding:'10px 14px', fontSize:'12px', color:'#64748B' }}>{f.documentType || '—'}</td>
                        <td style={{ padding:'10px 14px' }}>
                          <span style={{ background:'#EFF6FF', color:'#2563EB', fontSize:'11px', fontWeight:600, padding:'2px 10px', borderRadius:'20px' }}>
                            v{f.currentVersion || '1.0'}
                          </span>
                        </td>
                        <td style={{ padding:'10px 14px', fontSize:'13px', color:'#64748B' }}>{f.uploadedBy ? f.uploadedBy.toString().slice(0,8)+'…' : user?.firstName}</td>
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

            {/* DROP ZONE */}
            <div
              onClick={() => setShowUpload(true)}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); setShowUpload(true); }}
              style={{ marginTop:'16px', border:'1.5px dashed #93C5FD', borderRadius:'12px', background:'#EFF6FF', padding:'20px', textAlign:'center', fontSize:'13px', color:'#94A3B8', cursor:'pointer' }}>
              Drag and drop files here to upload, or click{' '}
              <strong style={{ color:'#2563EB' }}>Upload</strong> above
            </div>

          </div>
        </main>
      </div>

      {/* ── MODALS ── */}
      {showUpload && (
        <UploadModal
          projectId={activeProject?.id}
          onClose={() => setShowUpload(false)}
          onUploaded={() => loadDocuments(activeProject?.id)}
        />
      )}
      {showApproval && (
        <ApprovalModal
          document={showApproval}
          projectId={activeProject?.id}
          onClose={() => setShowApproval(null)}
          onSent={() => loadDocuments(activeProject?.id)}
        />
      )}
      {showNewProject && (
        <NewProjectModal
          onClose={() => setShowNewProject(false)}
          onCreated={loadProjects}
        />
      )}
    </div>
  );
}

