import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { projects, documents } from '../lib/api';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
}

function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

const statusBg    = { ACTIVE:'#DCFCE7', ON_HOLD:'#FEF9C3', COMPLETED:'#DBEAFE', ARCHIVED:'#F1F5F9' };
const statusColor = { ACTIVE:'#15803D', ON_HOLD:'#A16207', COMPLETED:'#1D4ED8', ARCHIVED:'#64748B' };

// ── New/Edit Project Modal ────────────────────────────────────
function ProjectModal({ project, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: project?.name || '',
    clientName: project?.clientName || '',
    location: project?.location || '',
    projectCode: project?.projectCode || '',
    description: project?.description || '',
    status: project?.status || 'ACTIVE',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!form.name) { setError('Project name is required'); return; }
    setLoading(true); setError('');
    try {
      if (project) {
        await projects.update(project.id, form);
      } else {
        await projects.create(form);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key:'name',        label:'Project Name *', placeholder:'e.g. Kigali Heights Tower' },
    { key:'clientName',  label:'Client',         placeholder:'Client or owner name' },
    { key:'location',    label:'Location',       placeholder:'City, Country' },
    { key:'projectCode', label:'Project Code',   placeholder:'e.g. KHT-2026' },
    { key:'description', label:'Description',    placeholder:'Brief project description' },
  ];

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
      <div style={{ background:'#fff', borderRadius:'14px', padding:'28px', width:'440px', boxShadow:'0 8px 40px rgba(0,0,0,0.15)' }}>
        <div style={{ fontSize:'16px', fontWeight:700, color:'#1E293B', marginBottom:'20px' }}>
          {project ? 'Edit Project' : 'New Project'}
        </div>

        {fields.map(({ key, label, placeholder }) => (
          <div key={key} style={{ marginBottom:'12px' }}>
            <label style={{ fontSize:'12px', fontWeight:600, color:'#475569', display:'block', marginBottom:'4px' }}>{label}</label>
            <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder}
              style={{ width:'100%', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', outline:'none', boxSizing:'border-box' }} />
          </div>
        ))}

        {project && (
          <div style={{ marginBottom:'12px' }}>
            <label style={{ fontSize:'12px', fontWeight:600, color:'#475569', display:'block', marginBottom:'4px' }}>Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              style={{ width:'100%', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', background:'#fff' }}>
              {['ACTIVE','ON_HOLD','COMPLETED','ARCHIVED'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        )}

        {error && <div style={{ background:'#FEE2E2', color:'#DC2626', fontSize:'12px', padding:'8px 12px', borderRadius:'6px', marginBottom:'12px' }}>{error}</div>}

        <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end', marginTop:'8px' }}>
          <button onClick={onClose} style={{ padding:'8px 18px', border:'1px solid #E2E8F0', borderRadius:'8px', background:'#fff', fontSize:'13px', cursor:'pointer', color:'#475569' }}>Cancel</button>
          <button onClick={handleSave} disabled={loading}
            style={{ padding:'8px 20px', border:'none', borderRadius:'8px', background: loading ? '#93C5FD' : '#2563EB', color:'#fff', fontSize:'13px', fontWeight:600, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Saving...' : project ? 'Save Changes' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Project Detail Panel ──────────────────────────────────────
function ProjectDetail({ project, onClose, onEdit, onDelete }) {
  const [docList, setDocList] = useState([]);
  const router = useRouter();

  useEffect(() => {
    if (project) {
      documents.list(project.id).then(setDocList).catch(() => {});
    }
  }, [project]);

  if (!project) return null;

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
      <div style={{ background:'#fff', borderRadius:'14px', width:'540px', maxHeight:'80vh', overflow:'auto', boxShadow:'0 8px 40px rgba(0,0,0,0.15)' }}>
        <div style={{ padding:'24px 28px 16px', borderBottom:'1px solid #F1F5F9', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ fontSize:'18px', fontWeight:700, color:'#1E293B' }}>{project.name}</div>
            <div style={{ fontSize:'12px', color:'#94A3B8', marginTop:'4px' }}>{project.projectCode || 'No code'} · {project.location || 'No location'}</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'#94A3B8' }}>×</button>
        </div>

        <div style={{ padding:'20px 28px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'20px' }}>
            {[
              { label:'Status', value: <span style={{ background: statusBg[project.status], color: statusColor[project.status], fontSize:'11px', fontWeight:600, padding:'2px 10px', borderRadius:'20px' }}>{project.status}</span> },
              { label:'Client', value: project.clientName || '—' },
              { label:'Start Date', value: formatDate(project.startDate) },
              { label:'End Date', value: formatDate(project.endDate) },
              { label:'Budget', value: project.budget ? `$${Number(project.budget).toLocaleString()}` : '—' },
              { label:'Documents', value: `${docList.length} files` },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize:'11px', color:'#94A3B8', fontWeight:600, textTransform:'uppercase', marginBottom:'4px' }}>{label}</div>
                <div style={{ fontSize:'13px', color:'#1E293B' }}>{value}</div>
              </div>
            ))}
          </div>

          {project.description && (
            <div style={{ marginBottom:'20px' }}>
              <div style={{ fontSize:'11px', color:'#94A3B8', fontWeight:600, textTransform:'uppercase', marginBottom:'6px' }}>Description</div>
              <div style={{ fontSize:'13px', color:'#475569' }}>{project.description}</div>
            </div>
          )}

          {/* Recent documents */}
          <div style={{ marginBottom:'20px' }}>
            <div style={{ fontSize:'11px', color:'#94A3B8', fontWeight:600, textTransform:'uppercase', marginBottom:'8px' }}>Recent Documents ({docList.length})</div>
            {docList.length === 0 ? (
              <div style={{ fontSize:'13px', color:'#94A3B8', fontStyle:'italic' }}>No documents yet</div>
            ) : docList.slice(0, 4).map(d => (
              <div key={d.id} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 0', borderBottom:'1px solid #F1F5F9' }}>
                <span style={{ background:'#DBEAFE', color:'#1D4ED8', fontSize:'10px', fontWeight:700, padding:'2px 6px', borderRadius:'4px' }}>
                  {(d.fileName || '').split('.').pop().toUpperCase() || 'FILE'}
                </span>
                <span style={{ fontSize:'13px', color:'#1E293B', flex:1 }}>{d.title || d.fileName}</span>
                <span style={{ fontSize:'11px', color: d.status === 'APPROVED' ? '#15803D' : d.status === 'REJECTED' ? '#DC2626' : '#A16207' }}>{d.status}</span>
              </div>
            ))}
          </div>

          <div style={{ display:'flex', gap:'8px' }}>
            <button onClick={() => { onClose(); router.push('/'); }}
              style={{ flex:1, padding:'10px', background:'#2563EB', color:'#fff', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>
              Open Documents
            </button>
            <button onClick={onEdit}
              style={{ padding:'10px 16px', border:'1px solid #E2E8F0', borderRadius:'8px', background:'#fff', fontSize:'13px', cursor:'pointer', color:'#475569' }}>
              Edit
            </button>
            <button onClick={onDelete}
              style={{ padding:'10px 16px', border:'1px solid #FEE2E2', borderRadius:'8px', background:'#FEF2F2', fontSize:'13px', cursor:'pointer', color:'#DC2626' }}>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────
export default function ProjectsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [projectList, setProjectList] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [selected, setSelected]       = useState(null);
  const [editProject, setEditProject] = useState(null);
  const [filter, setFilter]           = useState('ALL');
  const [search, setSearch]           = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading]);

  useEffect(() => {
    if (user) loadProjects();
  }, [user]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await projects.list();
      setProjectList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    try {
      await projects.delete(id);
      setSelected(null);
      loadProjects();
    } catch (err) {
      alert(err.message);
    }
  };

  const filtered = projectList
    .filter(p => filter === 'ALL' || p.status === filter)
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.clientName||'').toLowerCase().includes(search.toLowerCase()));

  const counts = {
    ALL: projectList.length,
    ACTIVE: projectList.filter(p => p.status === 'ACTIVE').length,
    ON_HOLD: projectList.filter(p => p.status === 'ON_HOLD').length,
    COMPLETED: projectList.filter(p => p.status === 'COMPLETED').length,
  };

  const colorPalette = ['#2563EB','#0EA5E9','#7C3AED','#059669','#D97706','#DC2626'];

  if (authLoading) return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Arial,sans-serif', color:'#94A3B8' }}>Loading...</div>;
  if (!user) return null;

  return (
    <div style={{ fontFamily:'Arial,sans-serif', minHeight:'100vh', background:'#F8FAFC', display:'flex', flexDirection:'column' }}>

      {/* TOP BAR */}
      <header style={{ background:'#fff', borderBottom:'1px solid #E2E8F0', height:'52px', display:'flex', alignItems:'center', padding:'0 24px', gap:'16px', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ fontWeight:700, fontSize:'18px', letterSpacing:'2px', color:'#2563EB', cursor:'pointer' }} onClick={() => router.push('/')}>
          OR<span style={{ color:'#0EA5E9' }}>ARCH</span>
        </div>
        <nav style={{ display:'flex', gap:'4px', marginLeft:'12px' }}>
          {[
            { label:'Projects', path:'/projects' },
            { label:'Documents', path:'/' },
            { label:'Approvals', path:'/approvals' },
            { label:'Team', path:'/team' },
          ].map(item => (
            <button key={item.label} onClick={() => router.push(item.path)}
              style={{ padding:'6px 14px', borderRadius:'6px', border:'none', cursor:'pointer', fontSize:'13px', fontWeight:500, background: item.path==='/projects' ? '#EFF6FF' : 'transparent', color: item.path==='/projects' ? '#2563EB' : '#64748B' }}>
              {item.label}
            </button>
          ))}
        </nav>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:'12px' }}>
          <input placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ border:'1px solid #E2E8F0', borderRadius:'6px', padding:'6px 12px', fontSize:'13px', width:'180px', outline:'none' }} />
          <div style={{ width:'34px', height:'34px', borderRadius:'50%', background:'#2563EB', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:700, cursor:'pointer' }}
               onClick={logout} title="Logout">
            {getInitials(`${user.firstName} ${user.lastName}`)}
          </div>
        </div>
      </header>

      <div style={{ padding:'24px', maxWidth:'1100px', margin:'0 auto', width:'100%', boxSizing:'border-box' }}>

        {/* Header row */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
          <div>
            <h1 style={{ fontSize:'20px', fontWeight:700, color:'#1E293B', margin:0 }}>Projects</h1>
            <p style={{ fontSize:'13px', color:'#94A3B8', margin:'4px 0 0' }}>{projectList.length} total projects</p>
          </div>
          <button onClick={() => setShowNew(true)}
            style={{ padding:'8px 20px', background:'#2563EB', color:'#fff', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>
            + New Project
          </button>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px', marginBottom:'20px' }}>
          {[
            { label:'Total', count:counts.ALL, bg:'#EFF6FF', color:'#2563EB', icon:'🏗️' },
            { label:'Active', count:counts.ACTIVE, bg:'#DCFCE7', color:'#15803D', icon:'✅' },
            { label:'On Hold', count:counts.ON_HOLD, bg:'#FEF9C3', color:'#A16207', icon:'⏸️' },
            { label:'Completed', count:counts.COMPLETED, bg:'#DBEAFE', color:'#1D4ED8', icon:'🎉' },
          ].map(s => (
            <div key={s.label} style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:'10px', padding:'16px', display:'flex', alignItems:'center', gap:'12px' }}>
              <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>{s.icon}</div>
              <div>
                <div style={{ fontSize:'22px', fontWeight:700, color:s.color }}>{s.count}</div>
                <div style={{ fontSize:'12px', color:'#94A3B8' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ display:'flex', gap:'4px', marginBottom:'16px' }}>
          {['ALL','ACTIVE','ON_HOLD','COMPLETED','ARCHIVED'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding:'6px 14px', borderRadius:'6px', border:'1px solid', fontSize:'12px', fontWeight:500, cursor:'pointer',
                borderColor: filter === f ? '#2563EB' : '#E2E8F0',
                background: filter === f ? '#EFF6FF' : '#fff',
                color: filter === f ? '#2563EB' : '#64748B' }}>
              {f === 'ON_HOLD' ? 'On Hold' : f.charAt(0) + f.slice(1).toLowerCase()} {filter === f && `(${counts[f] ?? filtered.length})`}
            </button>
          ))}
        </div>

        {/* Project cards grid */}
        {loading ? (
          <div style={{ textAlign:'center', padding:'60px', color:'#94A3B8', fontSize:'13px' }}>Loading projects...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px', color:'#94A3B8' }}>
            <div style={{ fontSize:'40px', marginBottom:'12px' }}>🏗️</div>
            <div style={{ fontSize:'16px', fontWeight:600, color:'#1E293B', marginBottom:'8px' }}>No projects yet</div>
            <div style={{ fontSize:'13px', marginBottom:'20px' }}>Create your first construction project</div>
            <button onClick={() => setShowNew(true)}
              style={{ padding:'10px 24px', background:'#2563EB', color:'#fff', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>
              + New Project
            </button>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px' }}>
            {filtered.map((p, i) => {
              const color = colorPalette[i % colorPalette.length];
              return (
                <div key={p.id} onClick={() => setSelected(p)}
                  style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:'12px', overflow:'hidden', cursor:'pointer', transition:'box-shadow 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                  {/* Color bar */}
                  <div style={{ height:'4px', background:color }} />
                  <div style={{ padding:'16px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'10px' }}>
                      <div style={{ width:'36px', height:'36px', borderRadius:'8px', background:`${color}20`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px' }}>🏗️</div>
                      <span style={{ background: statusBg[p.status]||'#F1F5F9', color: statusColor[p.status]||'#64748B', fontSize:'10px', fontWeight:600, padding:'2px 8px', borderRadius:'20px' }}>
                        {p.status}
                      </span>
                    </div>
                    <div style={{ fontWeight:700, color:'#1E293B', fontSize:'14px', marginBottom:'4px' }}>{p.name}</div>
                    <div style={{ fontSize:'12px', color:'#94A3B8', marginBottom:'12px' }}>{p.clientName || 'No client'} · {p.location || 'No location'}</div>
                    {p.projectCode && (
                      <div style={{ fontSize:'11px', color:'#64748B', background:'#F8FAFC', padding:'4px 8px', borderRadius:'4px', display:'inline-block', marginBottom:'12px' }}>
                        {p.projectCode}
                      </div>
                    )}
                    <div style={{ borderTop:'1px solid #F1F5F9', paddingTop:'10px', fontSize:'11px', color:'#94A3B8' }}>
                      Created {formatDate(p.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {showNew && <ProjectModal onClose={() => setShowNew(false)} onSaved={loadProjects} />}
      {editProject && <ProjectModal project={editProject} onClose={() => setEditProject(null)} onSaved={() => { loadProjects(); setSelected(null); }} />}
      {selected && (
        <ProjectDetail
          project={selected}
          onClose={() => setSelected(null)}
          onEdit={() => { setEditProject(selected); setSelected(null); }}
          onDelete={() => handleDelete(selected.id)}
        />
      )}
    </div>
  );
}
