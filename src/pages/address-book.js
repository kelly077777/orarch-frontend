import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { contacts } from '../lib/api';
import Topbar from '../components/Topbar';
import Sidebar from '../components/Sidebar';

function ContactModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ name:'', role:'', company:'', email:'', phone:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!form.name || !form.email) { setError('Name and email are required'); return; }
    setLoading(true);
    try {
      await contacts.create(form);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save contact');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
      <div style={{ background:'#fff', borderRadius:'14px', padding:'28px', width:'420px', boxShadow:'0 8px 40px rgba(0,0,0,0.15)' }}>
        <div style={{ fontSize:'16px', fontWeight:700, color:'#1E293B', marginBottom:'20px' }}>Add Contact</div>
        {[
          { label:'Full Name', key:'name', placeholder:'John Doe' },
          { label:'Role', key:'role', placeholder:'e.g. Architect' },
          { label:'Company', key:'company', placeholder:'Company name' },
          { label:'Email', key:'email', placeholder:'john@company.com' },
          { label:'Phone', key:'phone', placeholder:'+250 788 000 000' },
        ].map(({ label, key, placeholder }) => (
          <div key={key} style={{ marginBottom:'12px' }}>
            <label style={{ fontSize:'12px', fontWeight:600, color:'#475569', display:'block', marginBottom:'4px' }}>{label}</label>
            <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder}
              style={{ width:'100%', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', outline:'none', boxSizing:'border-box' }} />
          </div>
        ))}
        {error && <div style={{ background:'#FEE2E2', color:'#DC2626', fontSize:'12px', padding:'8px 12px', borderRadius:'6px', marginBottom:'12px' }}>{error}</div>}
        <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'8px 18px', border:'1px solid #E2E8F0', borderRadius:'8px', background:'#fff', fontSize:'13px', cursor:'pointer', color:'#475569' }}>Cancel</button>
          <button onClick={handleSave} disabled={loading}
            style={{ padding:'8px 20px', border:'none', borderRadius:'8px', background: loading ? '#93C5FD' : '#2563EB', color:'#fff', fontSize:'13px', fontWeight:600, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Saving...' : 'Add Contact'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AddressBookPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [contactList, setContactList] = useState([]);
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading]);

  useEffect(() => {
    if (user) loadContacts();
  }, [user]);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const data = await contacts.list();
      setContactList(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this contact?')) return;
    try {
      await contacts.delete(id);
      loadContacts();
    } catch (err) { alert(err.message); }
  };

  const filtered = contactList.filter(c =>
    !search || `${c.name} ${c.role} ${c.company}`.toLowerCase().includes(search.toLowerCase())
  );

  if (authLoading) return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#94A3B8' }}>Loading...</div>;
  if (!user) return null;

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', fontFamily:'Arial,sans-serif' }}>
      <Topbar />
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        <Sidebar />
        <main style={{ flex:1, background:'#F8FAFC', padding:'24px', overflowY:'auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
            <div>
              <h1 style={{ fontSize:'18px', fontWeight:700, color:'#1E293B', margin:0 }}>Address Book</h1>
              <p style={{ fontSize:'12px', color:'#94A3B8', margin:'4px 0 0' }}>Manage contacts and stakeholders</p>
            </div>
            <button onClick={() => setShowNew(true)}
              style={{ background:'#2563EB', color:'#fff', border:'none', borderRadius:'8px', padding:'8px 16px', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>
              + Add Contact
            </button>
          </div>

          <div style={{ marginBottom:'16px' }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, role, or company..."
              style={{ width:'100%', maxWidth:'400px', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'10px 12px', fontSize:'13px', outline:'none', boxSizing:'border-box' }} />
          </div>

          {loading ? (
            <div style={{ textAlign:'center', padding:'40px', color:'#94A3B8' }}>Loading contacts...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:'60px', color:'#94A3B8' }}>
              <div style={{ fontSize:'32px', marginBottom:'12px' }}>📒</div>
              <div style={{ fontSize:'14px', fontWeight:600, color:'#1E293B', marginBottom:'8px' }}>No contacts yet</div>
              <button onClick={() => setShowNew(true)}
                style={{ background:'#2563EB', color:'#fff', border:'none', borderRadius:'8px', padding:'8px 20px', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>
                + Add Contact
              </button>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'14px' }}>
              {filtered.map(c => (
                <div key={c.id} style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:'10px', padding:'18px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'12px' }}>
                    <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:'#EFF6FF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', fontWeight:700, color:'#2563EB', flexShrink:0 }}>
                      {c.name?.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize:'13px', fontWeight:700, color:'#1E293B' }}>{c.name}</div>
                      <div style={{ fontSize:'11px', color:'#64748B' }}>{c.role}</div>
                    </div>
                    <button onClick={() => handleDelete(c.id)}
                      style={{ marginLeft:'auto', background:'#FEF2F2', border:'1px solid #FEE2E2', borderRadius:'6px', padding:'4px 8px', fontSize:'11px', color:'#DC2626', cursor:'pointer' }}>
                      Delete
                    </button>
                  </div>
                  {c.company && <div style={{ fontSize:'12px', color:'#64748B', marginBottom:'4px' }}>🏢 {c.company}</div>}
                  {c.email && <div style={{ fontSize:'12px', color:'#64748B', marginBottom:'4px' }}>✉️ {c.email}</div>}
                  {c.phone && <div style={{ fontSize:'12px', color:'#64748B' }}>📞 {c.phone}</div>}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
      {showNew && <ContactModal onClose={() => setShowNew(false)} onSaved={loadContacts} />}
    </div>
  );
}