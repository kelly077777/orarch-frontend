const projects = [
  { name: 'Kigali Heights Tower', color: '#2563EB', active: true },
  { name: 'Nairobi Road Bridge', color: '#0EA5E9', active: false },
  { name: 'Lagos Port Terminal', color: '#94A3B8', active: false },
];
const folders = ['Architectural', 'Structural', 'MEP', 'Contracts', 'Permits', 'Reports'];

export default function Sidebar({ activeFolder, onFolderClick }) {
  return (
    <aside style={{ width: '220px', background: '#fff', borderRight: '1px solid #E2E8F0', flexShrink: 0 }}>
      <div style={{ padding: '16px 14px 6px', fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Projects</div>
      {projects.map((p) => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', fontSize: '12px', cursor: 'pointer', borderLeft: p.active ? `3px solid ${p.color}` : '3px solid transparent', background: p.active ? '#EFF6FF' : 'transparent', color: p.active ? p.color : '#475569', fontWeight: p.active ? 600 : 400 }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.color, flexShrink: 0 }} />
          {p.name}
        </div>
      ))}
      <div style={{ padding: '16px 14px 6px', fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Folders</div>
      {folders.map((f) => (
        <div key={f} onClick={() => onFolderClick(f)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 14px', fontSize: '12px', cursor: 'pointer', background: activeFolder === f ? '#F0F9FF' : 'transparent', color: activeFolder === f ? '#0EA5E9' : '#475569', fontWeight: activeFolder === f ? 600 : 400 }}>
          <span style={{ fontSize: '14px' }}>📁</span>
          {f}
        </div>
      ))}
    </aside>
  );
}