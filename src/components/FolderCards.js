const folders = [
  { name: 'Floor plans', count: 12, bg: '#DBEAFE', color: '#1D4ED8' },
  { name: 'Elevations',  count: 8,  bg: '#FEF9C3', color: '#A16207' },
  { name: 'Sections',    count: 6,  bg: '#DCFCE7', color: '#15803D' },
  { name: 'Details',     count: 9,  bg: '#F1F5F9', color: '#475569' },
];
export default function FolderCards() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
      {folders.map((f) => (
        <div key={f.name} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>📁</div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>{f.name}</div>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>{f.count} files</div>
          </div>
        </div>
      ))}
    </div>
  );
}