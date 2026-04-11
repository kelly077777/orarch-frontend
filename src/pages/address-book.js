import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const mockContacts = [
];

export default function AddressBookPage() {
  const [search, setSearch] = useState('');
  const filtered = mockContacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.role.toLowerCase().includes(search.toLowerCase()) ||
    c.company.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <Topbar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <main style={{ flex: 1, background: '#F8FAFC', padding: '24px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1E293B', margin: 0 }}>Address Book</h1>
              <p style={{ fontSize: '12px', color: '#94A3B8', margin: '4px 0 0' }}>Manage contacts and stakeholders</p>
            </div>
            <button style={{ background: '#2563EB', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              + Add Contact
            </button>
          </div>

          {/* Search */}
          <div style={{ marginBottom: '16px' }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, role, or company..."
              style={{ width: '100%', maxWidth: '400px', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Contacts grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
            {filtered.map(c => (
              <div key={c.id} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, color: '#2563EB', flexShrink: 0 }}>
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>{c.name}</div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>{c.role}</div>
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '6px' }}>🏢 {c.company}</div>
                <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '6px' }}>✉️ {c.email}</div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>📞 {c.phone}</div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}