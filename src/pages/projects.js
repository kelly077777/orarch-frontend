import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { projects, documents } from '../lib/api';
import Topbar from '../components/Topbar';
import Sidebar from '../components/Sidebar';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const statusBg    = { ACTIVE: '#DCFCE7', ON_HOLD: '#FEF9C3', COMPLETED: '#DBEAFE', ARCHIVED: '#F1F5F9' };
const statusColor = { ACTIVE: '#15803D', ON_HOLD: '#A16207', COMPLETED: '#1D4ED8', ARCHIVED: '#64748B' };
const colorPalette = ['#2563EB', '#0EA5E9', '#7C3AED', '#059669', '#D97706', '#DC2626'];

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconGrid() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="11" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="1" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="11" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

function IconList() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <line x1="3" y1="5" x2="15" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="3" y1="9" x2="15" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="3" y1="13" x2="15" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function IconChevron({ open }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
      <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2.5 7L5.5 10L11.5 4" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconLocation() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M6.5 1C4.567 1 3 2.567 3 4.5C3 7 6.5 12 6.5 12C6.5 12 10 7 10 4.5C10 2.567 8.433 1 6.5 1Z" stroke="#94A3B8" strokeWidth="1.2"/>
      <circle cx="6.5" cy="4.5" r="1.2" stroke="#94A3B8" strokeWidth="1.2"/>
    </svg>
  );
}

function IconOrg() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#FEF3C7"/>
      <rect x="6" y="10" width="20" height="14" rx="2" fill="#F59E0B"/>
      <rect x="11" y="6" width="10" height="6" rx="2" fill="#D97706"/>
      <rect x="13" y="18" width="6" height="6" fill="#fff"/>
    </svg>
  );
}

function ProjectAvatar({ name, size = 36 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['#2563EB','#7C3AED','#059669','#D97706','#DC2626','#0EA5E9'];
  const color = colors[name?.charCodeAt(0) % colors.length] || '#2563EB';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontSize: size * 0.35, fontWeight: 700, flexShrink: 0,
    }}>{initials}</div>
  );
}

// ─── View Toggle Dropdown ─────────────────────────────────────────────────────

function ViewToggle({ view, setView }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const label = view === 'org' ? 'BY ORGANISATION' : 'LIST';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {/* Dropdown */}
      <div ref={ref} style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 12px', background: '#fff', border: '1px solid #E2E8F0',
            borderRadius: '6px', fontSize: '12px', fontWeight: 700, color: '#475569',
            cursor: 'pointer', letterSpacing: '0.04em',
          }}
        >
          {label} <IconChevron open={open} />
        </button>
        {open && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 4px)', right: 0,
            background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)', minWidth: '160px', zIndex: 50, overflow: 'hidden',
          }}>
            {[{ key: 'org', label: 'BY ORGANISATION' }, { key: 'list', label: 'LIST' }].map(opt => (
              <button
                key={opt.key}
                onClick={() => { setView(opt.key); setOpen(false); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', background: 'none', border: 'none',
                  fontSize: '12px', fontWeight: 700, color: '#475569', cursor: 'pointer',
                  letterSpacing: '0.04em',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                {opt.label}
                {view === opt.key && <IconCheck />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid icon button */}
      <button
        onClick={() => setView('grid')}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '32px', height: '32px', border: '1px solid #E2E8F0',
          borderRadius: '6px', cursor: 'pointer',
          background: view === 'grid' ? '#EFF6FF' : '#fff',
          color: view === 'grid' ? '#2563EB' : '#94A3B8',
        }}
      >
        <IconGrid />
      </button>
    </div>
  );
}

// ─── Project Row (List & Org views) ──────────────────────────────────────────

function ProjectRow({ project, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px', background: hovered ? '#F8FAFC' : '#fff',
        borderBottom: '1px solid #F1F5F9', cursor: 'pointer', transition: 'background 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
        <ProjectAvatar name={project.name} size={34} />
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B' }}>{project.name}</div>
          {project.clientName && <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>{project.clientName}</div>}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94A3B8', fontSize: '12px' }}>
        <IconLocation />
        {project.location || 'no location available'}
      </div>
    </div>
  );
}

// ─── Project Card (Grid view) ─────────────────────────────────────────────────

function ProjectCard({ project, index, onClick }) {
  const [hovered, setHovered] = useState(false);
  const color = colorPalette[index % colorPalette.length];
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px',
        overflow: 'hidden', cursor: 'pointer',
        boxShadow: hovered ? '0 4px 20px rgba(0,0,0,0.08)' : 'none',
        transition: 'box-shadow 0.2s',
      }}
    >
      <div style={{ height: '4px', background: color }} />
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>{project.name}</div>
          <span style={{
            background: statusBg[project.status] || '#F1F5F9',
            color: statusColor[project.status] || '#64748B',
            fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px',
          }}>{project.status}</span>
        </div>
        <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '8px' }}>
          {project.clientName || 'No client'} · {project.location || 'No location'}
        </div>
        {project.projectCode && (
          <div style={{ fontSize: '11px', color: '#64748B', background: '#F8FAFC', padding: '4px 8px', borderRadius: '4px', display: 'inline-block', marginBottom: '8px' }}>
            {project.projectCode}
          </div>
        )}
        <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '10px', fontSize: '11px', color: '#94A3B8' }}>
          Created {formatDate(project.createdAt)}
        </div>
      </div>
    </div>
  );
}

// ─── By Organisation View ─────────────────────────────────────────────────────

function OrgView({ projects, onSelect }) {
  // Group by clientName (org). Ungrouped → "Other"
  const groups = {};
  projects.forEach(p => {
    const org = p.clientName || 'Other';
    if (!groups[org]) groups[org] = [];
    groups[org].push(p);
  });

  return (
    <div>
      {Object.entries(groups).map(([org, items]) => (
        <div key={org} style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', padding: '0 4px' }}>
            <IconOrg />
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B' }}>{org}</span>
          </div>
          <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden', background: '#fff' }}>
            {items.map((p, i) => (
              <div key={p.id} style={{ borderBottom: i < items.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                <ProjectRow project={p} onClick={() => onSelect(p)} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── List View ────────────────────────────────────────────────────────────────

function ListView({ projects, onSelect }) {
  return (
    <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden', background: '#fff' }}>
      {projects.map((p, i) => (
        <div key={p.id} style={{ borderBottom: i < projects.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
          <ProjectRow project={p} onClick={() => onSelect(p)} />
        </div>
      ))}
    </div>
  );
}

// ─── Modals (unchanged) ───────────────────────────────────────────────────────

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
      if (project) { await projects.update(project.id, form); }
      else { await projects.create(form); }
      onSaved(); onClose();
    } catch (err) {
      setError(err.message || 'Failed to save project');
    } finally { setLoading(false); }
  };

  const fields = [
    { key: 'name', label: 'Project Name', placeholder: 'e.g. Kigali Heights Tower' },
    { key: 'clientName', label: 'Client / Organisation', placeholder: 'Client name' },
    { key: 'location', label: 'Location', placeholder: 'City, Country' },
    { key: 'projectCode', label: 'Project Code', placeholder: 'e.g. KHT-2026' },
    { key: 'description', label: 'Description', placeholder: 'Project description' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: '#fff', borderRadius: '14px', padding: '28px', width: '440px', boxShadow: '0 8px 40px rgba(0,0,0,0.15)' }}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', marginBottom: '20px' }}>
          {project ? 'Edit Project' : 'New Project'}
        </div>
        {fields.map(({ key, label, placeholder }) => (
          <div key={key} style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>{label}</label>
            <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              placeholder={placeholder}
              style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
        ))}
        {project && (
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', background: '#fff' }}>
              {['ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        )}
        {error && <div style={{ background: '#FEE2E2', color: '#DC2626', fontSize: '12px', padding: '8px 12px', borderRadius: '6px', marginBottom: '12px' }}>{error}</div>}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button onClick={onClose} style={{ padding: '8px 18px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#fff', fontSize: '13px', cursor: 'pointer', color: '#475569' }}>Cancel</button>
          <button onClick={handleSave} disabled={loading}
            style={{ padding: '8px 20px', border: 'none', borderRadius: '8px', background: loading ? '#93C5FD' : '#2563EB', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Saving...' : project ? 'Save Changes' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProjectDetail({ project, onClose, onEdit, onDelete }) {
  const [docList, setDocList] = useState([]);
  const router = useRouter();

  useEffect(() => {
    if (project) documents.list(project.id).then(setDocList).catch(() => {});
  }, [project]);

  if (!project) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: '#fff', borderRadius: '14px', width: '540px', maxHeight: '80vh', overflow: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.15)' }}>
        <div style={{ padding: '24px 28px 16px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#1E293B' }}>{project.name}</div>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>{project.projectCode || 'No code'} · {project.location || 'No location'}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94A3B8' }}>×</button>
        </div>
        <div style={{ padding: '20px 28px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            {[
              { label: 'Status', value: <span style={{ background: statusBg[project.status], color: statusColor[project.status], fontSize: '11px', fontWeight: 600, padding: '2px 10px', borderRadius: '20px' }}>{project.status}</span> },
              { label: 'Client', value: project.clientName || '—' },
              { label: 'Location', value: project.location || '—' },
              { label: 'Documents', value: `${docList.length} files` },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
                <div style={{ fontSize: '13px', color: '#1E293B' }}>{value}</div>
              </div>
            ))}
          </div>
          {project.description && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>Description</div>
              <div style={{ fontSize: '13px', color: '#475569' }}>{project.description}</div>
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => { onClose(); router.push('/'); }}
              style={{ flex: 1, padding: '10px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              Open Files
            </button>
            <button onClick={onEdit}
              style={{ padding: '10px 16px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#fff', fontSize: '13px', cursor: 'pointer', color: '#475569' }}>
              Edit
            </button>
            <button onClick={onDelete}
              style={{ padding: '10px 16px', border: '1px solid #FEE2E2', borderRadius: '8px', background: '#FEF2F2', fontSize: '13px', cursor: 'pointer', color: '#DC2626' }}>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [projectList, setProjectList] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [selected, setSelected]       = useState(null);
  const [editProject, setEditProject] = useState(null);
  const [search, setSearch]           = useState('');
  const [view, setView]               = useState('org'); // 'org' | 'list' | 'grid'

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

  const filtered = projectList.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.clientName || '').toLowerCase().includes(search.toLowerCase())
  );

  if (authLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial,sans-serif', color: '#94A3B8' }}>
      Loading...
    </div>
  );
  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'Arial,sans-serif' }}>
      <Topbar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <main style={{ flex: 1, background: '#F8FAFC', overflowY: 'auto' }}>

          {/* Top bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 28px', borderBottom: '1px solid #E2E8F0', background: '#fff' }}>
            {/* Search */}
            <div style={{ position: 'relative', width: '280px' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
                <circle cx="6" cy="6" r="4.5" stroke="#94A3B8" strokeWidth="1.4"/>
                <path d="M9.5 9.5L12 12" stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Filter projects"
                style={{
                  width: '100%', padding: '7px 12px 7px 30px',
                  border: '1px solid #E2E8F0', borderRadius: '6px',
                  fontSize: '13px', outline: 'none', background: '#F8FAFC',
                  boxSizing: 'border-box', color: '#1E293B',
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ViewToggle view={view} setView={setView} />
              <button
                onClick={() => setShowNew(true)}
                style={{ padding: '7px 18px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                + New Project
              </button>
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: '24px 28px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#94A3B8' }}>Loading projects...</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#94A3B8' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏗️</div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#1E293B', marginBottom: '8px' }}>No projects yet</div>
                <div style={{ fontSize: '13px', marginBottom: '20px' }}>Create your first project to get started</div>
                <button onClick={() => setShowNew(true)}
                  style={{ padding: '10px 24px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  + New Project
                </button>
              </div>
            ) : view === 'org' ? (
              <OrgView projects={filtered} onSelect={setSelected} />
            ) : view === 'list' ? (
              <ListView projects={filtered} onSelect={setSelected} />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px' }}>
                {filtered.map((p, i) => (
                  <ProjectCard key={p.id} project={p} index={i} onClick={() => setSelected(p)} />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

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