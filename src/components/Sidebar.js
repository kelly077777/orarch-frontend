import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { folders as foldersApi } from '../lib/api';

const menuItems = [
  { label: 'Files', path: '/', icon: '📁' },
  { label: 'Projects', path: '/projects', icon: '🏗️' },
  { label: 'Approvals', path: '/approvals', icon: '✅' },
  { label: 'Team', path: '/team', icon: '👥' },
  { label: 'Address Book', path: '/address-book', icon: '📒' },
  { label: 'Tasks', path: '/tasks', icon: '📋' },
  { label: 'Messages', path: '/messages', icon: '💬' },
  { label: 'Reports', path: '/reports', icon: '📊' },
];

export default function Sidebar({ activeFolder, onFolderClick, projectId, organizationId }) {
  const router = useRouter();
  const currentPath = router.pathname;
  const [collapsed, setCollapsed] = useState(true);
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
    <aside style={{ width: collapsed ? '48px' : '220px', background: '#fff', borderRight: '1px solid #E2E8F0', flexShrink: 0, display: 'flex', flexDirection: 'column', transition: 'width 0.2s ease', overflow: 'hidden' }}>
      
      {/* Toggle button */}
      <div onClick={() => setCollapsed(c => !c)}
        style={{ padding: '12px', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-end', cursor: 'pointer', borderBottom: '1px solid #F1F5F9' }}>
        <span style={{ fontSize: '14px', color: '#94A3B8' }}>{collapsed ? '›' : '‹'}</span>
      </div>

      {/* Menu items */}
      {!collapsed && (
        <div style={{ padding: '6px 14px 4px', fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '4px' }}>Main Menu</div>
      )}
      {menuItems.map((item) => {
        const isActive = currentPath === item.path;
        return (
          <div key={item.label} onClick={() => router.push(item.path)} title={item.label}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: collapsed ? '10px 0' : '8px 14px', justifyContent: collapsed ? 'center' : 'flex-start', fontSize: '12px', cursor: 'pointer', borderLeft: isActive ? '3px solid #2563EB' : '3px solid transparent', background: isActive ? '#EFF6FF' : 'transparent', color: isActive ? '#2563EB' : '#475569', fontWeight: isActive ? 600 : 400 }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#F8FAFC'; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}>
            <span style={{ fontSize: '16px', flexShrink: 0 }}>{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </div>
        );
      })}

      {/* Folders section */}
      {!collapsed && (
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
            <div style={{ padding: '6px 14px', fontSize: '11px', color: '#CBD5E1' }}>No folders yet</div>
          )}
          {folderList.map((f) => (
            <div key={f.id} onClick={() => onFolderClick && onFolderClick(f.name)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 14px', fontSize: '12px', cursor: 'pointer', background: activeFolder === f.name ? '#F0F9FF' : 'transparent', color: activeFolder === f.name ? '#0EA5E9' : '#475569', fontWeight: activeFolder === f.name ? 600 : 400 }}
              onMouseEnter={e => e.currentTarget.querySelector('.del-btn').style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.querySelector('.del-btn').style.opacity = '0'}>
              <span>{f.name}</span>
              <button className="del-btn" onClick={(e) => handleDelete(e, f.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: '14px', opacity: 0, transition: 'opacity 0.15s', padding: '0 2px' }}>×</button>
            </div>
          ))}
        </>
      )}

      {/* Collapse button at bottom */}
      {!collapsed && (
        <div onClick={() => setCollapsed(true)}
          style={{ marginTop: 'auto', padding: '12px 14px', fontSize: '12px', color: '#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', borderTop: '1px solid #F1F5F9' }}>
          ‹ Collapse Menu
        </div>
      )}
    </aside>
  );
}