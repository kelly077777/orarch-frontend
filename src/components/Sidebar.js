import { useRouter } from 'next/router';

const projects = [
  { name: 'Kigali Heights Tower', color: '#2563EB', active: true },
  { name: 'Nairobi Road Bridge', color: '#0EA5E9', active: false },
  { name: 'Lagos Port Terminal', color: '#94A3B8', active: false },
];

const folders = ['Architectural', 'Structural', 'MEP', 'Contracts', 'Permits', 'Reports'];

const menuItems = [
  { label: 'Files', icon: '📁', path: '/' },
  { label: 'Address Book', icon: '📒', path: '/address-book' },
  { label: 'Tasks', icon: '✅', path: '/tasks' },
  { label: 'Messages', icon: '💬', path: '/messages' },
  { label: 'Reports', icon: '📊', path: '/reports' },
];

export default function Sidebar({ activeFolder, onFolderClick }) {
  const router = useRouter();
  const currentPath = router.pathname;

  return (
    <aside style={{ width: '220px', background: '#fff', borderRight: '1px solid #E2E8F0', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>

      {/* Main Menu */}
      <div style={{ padding: '16px 14px 6px', fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Main Menu</div>
      {menuItems.map((item) => {
        const isActive = currentPath === item.path;
        return (
          <div key={item.label}
            onClick={() => router.push(item.path)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', fontSize: '12px', cursor: 'pointer', borderLeft: isActive ? '3px solid #2563EB' : '3px solid transparent', background: isActive ? '#EFF6FF' : 'transparent', color: isActive ? '#2563EB' : '#475569', fontWeight: isActive ? 600 : 400 }}>
            <span style={{ fontSize: '14px' }}>{item.icon}</span>
            {item.label}
          </div>
        );
      })}

      {/* Projects */}
      <div style={{ padding: '16px 14px 6px', fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Projects</div>
      {projects.map((p) => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', fontSize: '12px', cursor: 'pointer', borderLeft: p.active ? `3px solid ${p.color}` : '3px solid transparent', background: p.active ? '#EFF6FF' : 'transparent', color: p.active ? p.color : '#475569', fontWeight: p.active ? 600 : 400 }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.color, flexShrink: 0 }} />
          {p.name}
        </div>
      ))}

      {/* Folders */}
      <div style={{ padding: '16px 14px 6px', fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Folders</div>
      {folders.map((f) => (
        <div key={f} onClick={() => onFolderClick && onFolderClick(f)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 14px', fontSize: '12px', cursor: 'pointer', background: activeFolder === f ? '#F0F9FF' : 'transparent', color: activeFolder === f ? '#0EA5E9' : '#475569', fontWeight: activeFolder === f ? 600 : 400 }}>
          <span style={{ fontSize: '14px' }}>📂</span>
          {f}
        </div>
      ))}
    </aside>
  );
}