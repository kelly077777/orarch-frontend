export default function Topbar() {
  return (
    <header style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', height: '52px', display: 'flex', alignItems: 'center', padding: '0 20px', gap: '12px' }}>
      <div style={{ fontWeight: 700, fontSize: '18px', color: '#2563EB', letterSpacing: '2px' }}>
        OR<span style={{ color: '#0EA5E9' }}>ARCH</span>
      </div>
      <nav style={{ display: 'flex', gap: '4px', marginLeft: '16px' }}>
        {['Projects', 'Documents', 'Approvals', 'Team'].map((item) => (
          <button key={item} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: item === 'Documents' ? '#EFF6FF' : 'transparent', color: item === 'Documents' ? '#2563EB' : '#64748B', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
            {item}
          </button>
        ))}
      </nav>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <input placeholder="Search documents..." style={{ border: '1px solid #E2E8F0', borderRadius: '6px', padding: '6px 12px', fontSize: '13px', width: '200px', outline: 'none' }} />
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#2563EB', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>AK</div>
      </div>
    </header>
  );
}