import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { folders as foldersApi } from '../lib/api';

const ico = (d) => <svg width="16" height="16" viewBox="0 0 18 18" fill="none">{d}</svg>;
const menuItems = [
  { label: 'Projects', path: '/projects', icon: <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><rect x="3" y="3" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M3 7h12" stroke="currentColor" strokeWidth="1.4"/></svg> },
  { label: 'Approvals', path: '/approvals', icon: <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M4 9l3 3 7-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { label: 'Team', path: '/team', icon: <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><circle cx="7" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.4"/><path d="M2.5 15a4.5 4.5 0 019 0" stroke="currentColor" strokeWidth="1.4"/><path d="M12 4a2.5 2.5 0 010 5" stroke="currentColor" strokeWidth="1.4"/></svg> },
  { label: 'Address Book', path: '/address-book', icon: <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><rect x="4" y="2" width="10" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><circle cx="9" cy="7" r="1.8" stroke="currentColor" strokeWidth="1.4"/><path d="M6.5 13a2.5 2.5 0 015 0" stroke="currentColor" strokeWidth="1.4"/></svg> },
  { label: 'Tasks', path: '/tasks', icon: <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><rect x="4" y="3" width="10" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M6 7l1.5 1.5L10 6M6 12h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { label: 'Messages', path: '/messages', icon: <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><rect x="2" y="3" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M6 13l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { label: 'Reports', path: '/reports', icon: <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M3 15V3M3 15h12M6 12V8M9 12V5M12 12v-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg> },
];

export default function Sidebar({ activeFolder, onFolderClick, projectId, organizationId }) {
  const router = useRouter();
  const currentPath = router.pathname;
  const [collapsed, setCollapsed] = useState(false);
  const [folderList, setFolderList] = useState([]);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (projectId) {
      foldersApi.list(projectId).then(setFolderList).catch(() => setFolderList([]));
    }
  }, [projectId]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    try {
      const folder = await foldersApi.create({ name: newName.trim(), projectId, organizationId });
      setFolderList(prev => [...prev, folder]);
      setNewName(''); setAdding(false);
    } catch (e) { alert('Failed to create folder'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Delete this folder?')) return;
    await foldersApi.delete(id);
    setFolderList(prev => prev.filter(f => f.id !== id));
  };

  return (
    <aside style={{ width: collapsed ? '56px' : '220px', background: '#1E293B', borderRight: '1px solid #0F172A', flexShrink: 0, display: 'flex', flexDirection: 'column', transition: 'width 0.2s ease', overflow: 'hidden' }}>
      

      {/* Menu items */}
      {!collapsed && (
        <div style={{ padding: '6px 14px 4px', fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '4px' }}>Main Menu</div>
      )}
      {menuItems.map((item) => {
        const isActive = currentPath === item.path;
        return (
          <div key={item.label} onClick={() => router.push(item.path)} title={item.label}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: collapsed ? '10px 0' : '9px 16px', justifyContent: collapsed ? 'center' : 'flex-start', fontSize: '13px', cursor: 'pointer', borderLeft: isActive ? '3px solid #2563EB' : '3px solid transparent', background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent', color: isActive ? '#fff' : '#94A3B8', fontWeight: isActive ? 600 : 400 }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}>
            <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </div>
        );
      })}

      {/* Folders section */}
      {!collapsed && projectId && (
        <>
          <div style={{ padding: '16px 14px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Folders</span>
            {projectId && (
              <button onClick={() => setAdding(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563EB', fontSize: '18px', lineHeight: 1, padding: '0 2px' }} title="New folder">+</button>
            )}
          </div>
          {adding && (
            <div style={{ padding: '4px 14px 8px' }}>
              <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setAdding(false); setNewName(''); } }}
                placeholder="Folder name..."
                style={{ width: '100%', border: '1px solid #2563EB', borderRadius: '5px', padding: '5px 8px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', gap: '6px', marginTop: '5px' }}>
                <button onClick={handleCreate} disabled={loading} style={{ flex: 1, background: '#2563EB', color: '#fff', border: 'none', borderRadius: '5px', padding: '4px', fontSize: '11px', cursor: 'pointer' }}>
                  {loading ? '...' : 'Create'}
                </button>
                <button onClick={() => { setAdding(false); setNewName(''); }} style={{ flex: 1, background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '5px', padding: '4px', fontSize: '11px', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
          {folderList.length === 0 && !adding && projectId && (
            <div style={{ padding: '6px 16px', fontSize: '11px', color: '#64748B' }}>No folders yet</div>
          )}
          {folderList.map((f) => (
            <div key={f.id} onClick={() => onFolderClick && onFolderClick(f.name)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 16px', fontSize: '13px', cursor: 'pointer', background: activeFolder === f.name ? 'rgba(255,255,255,0.12)' : 'transparent', color: activeFolder === f.name ? '#fff' : '#94A3B8', fontWeight: activeFolder === f.name ? 600 : 400 }}
              onMouseEnter={e => e.currentTarget.querySelector('.del-btn').style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.querySelector('.del-btn').style.opacity = '0'}>
              <span>{f.name}</span>
              <button className="del-btn" onClick={(e) => handleDelete(e, f.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: '14px', opacity: 0, transition: 'opacity 0.15s', padding: '0 2px' }}>×</button>
            </div>
          ))}
        </>
      )}

      {/* Collapse/expand button at bottom */}
      <div onClick={() => setCollapsed(c => !c)}
        style={{ marginTop: 'auto', padding: '12px 16px', fontSize: '12px', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: '6px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {collapsed ? '›' : '‹ Collapse Menu'}
      </div>
    </aside>
  );
}