export default function Toolbar({ onUpload }) {
  const btn = { padding: '6px 14px', border: '1px solid #E2E8F0', borderRadius: '6px', background: '#fff', fontSize: '12px', color: '#475569', cursor: 'pointer' };
  return (
    <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
      <button onClick={onUpload} style={{ ...btn, background: '#2563EB', color: '#fff', border: 'none', fontWeight: 600 }}>+ Upload</button>
      <button style={btn}>New folder</button>
      <div style={{ width: '1px', height: '20px', background: '#E2E8F0', margin: '0 4px' }} />
      <button style={btn}>Download</button>
      <button style={btn}>Share</button>
      <button style={btn}>Send for approval</button>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '12px', color: '#94A3B8' }}>Sort:</span>
        <select style={{ fontSize: '12px', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '4px 8px', color: '#475569' }}>
          <option>Date modified</option>
          <option>Name</option>
          <option>Revision</option>
        </select>
      </div>
    </div>
  );
}