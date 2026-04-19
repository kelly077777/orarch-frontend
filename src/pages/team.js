import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { users } from '../lib/api';
import Topbar from '../components/Topbar';
import Sidebar from '../components/Sidebar';

function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(d) {
  if (!d) return 'Never';
  return new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
}

const roleBg    = { ADMIN:'#FEE2E2', MANAGER:'#EDE9FE', ARCHITECT:'#DBEAFE', ENGINEER:'#DCFCE7', VIEWER:'#F1F5F9' };
const roleColor = { ADMIN:'#DC2626', MANAGER:'#7C3AED', ARCHITECT:'#1D4ED8', ENGINEER:'#15803D', VIEWER:'#64748B' };
const roleColors = ['#2563EB','#7C3AED','#059669','#D97706','#0EA5E9'];

function UserModal({ user: editUser, onClose, onSaved }) {
  const [form, setForm] = useState({
    firstName: editUser?.firstName || '',
    lastName: editUser?.lastName || '',
    email: editUser?.email || '',
    password: '',
    role: editUser?.role || 'VIEWER',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!form.firstName || !form.email) { setError('Name and email are required'); return; }
    setLoading(true); setError('');
    try {
      if (editUser) {
        await users.update(editUser.id, { firstName: form.firstName, lastName: form.lastName, role: form.role });
      } else {
  await users.invite({
    firstName: form.firstName,
    lastName: form.lastName,
    email: form.email,
    password: form.password || 'Orarch247@1234',
    role: form.role,
  });
}
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
      <div style={{ background:'#fff', borderRadius:'14px', padding:'28px', width:'420px', boxShadow:'0 8px 40px rgba(0,0,0,0.15)' }}>
        <div style={{ fontSize:'16px', fontWeight:700, color:'#1E293B', marginBottom:'20px' }}>
          {editUser ? 'Edit Team Member' : 'Invite Team Member'}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'12px' }}>
          {[{ key:'firstName', label:'First Name', placeholder:'John' }, { key:'lastName', label:'Last Name', placeholder:'Doe' }].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label style={{ fontSize:'12px', fontWeight:600, color:'#475569', display:'block', marginBottom:'4px' }}>{label}</label>
              <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder}
                style={{ width:'100%', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', outline:'none', boxSizing:'border-box' }} />
            </div>
          ))}
        </div>
        {!editUser && (
          <>
            <div style={{ marginBottom:'12px' }}>
              <label style={{ fontSize:'12px', fontWeight:600, color:'#475569', display:'block', marginBottom:'4px' }}>Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="john@company.com"
                style={{ width:'100%', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', outline:'none', boxSizing:'border-box' }} />
            </div>
            <div style={{ marginBottom:'12px' }}>
              <label style={{ fontSize:'12px', fontWeight:600, color:'#475569', display:'block', marginBottom:'4px' }}>Password (default: Orarch247@1234)</label>
              <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Leave blank for default"
                style={{ width:'100%', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', outline:'none', boxSizing:'border-box' }} />
            </div>
          </>
        )}
        <div style={{ marginBottom:'20px' }}>
          <label style={{ fontSize:'12px', fontWeight:600, color:'#475569', display:'block', marginBottom:'8px' }}>Role</label>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
            {['ADMIN','MANAGER','ARCHITECT','ENGINEER','VIEWER'].map(r => (
              <button key={r} onClick={() => setForm(f => ({ ...f, role: r }))}
                style={{ padding:'8px', borderRadius:'8px', border:`2px solid ${form.role===r ? roleColor[r] : '#E2E8F0'}`, background: form.role===r ? roleBg[r] : '#fff', color: form.role===r ? roleColor[r] : '#475569', fontSize:'12px', fontWeight:600, cursor:'pointer' }}>
                {r}
              </button>
            ))}
          </div>
        </div>
        {error && <div style={{ background:'#FEE2E2', color:'#DC2626', fontSize:'12px', padding:'8px 12px', borderRadius:'6px', marginBottom:'12px' }}>{error}</div>}
        <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'8px 18px', border:'1px solid #E2E8F0', borderRadius:'8px', background:'#fff', fontSize:'13px', cursor:'pointer', color:'#475569' }}>Cancel</button>
          <button onClick={handleSave} disabled={loading}
            style={{ padding:'8px 20px', border:'none', borderRadius:'8px', background: loading ? '#93C5FD' : '#2563EB', color:'#fff', fontSize:'13px', fontWeight:600, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Saving...' : editUser ? 'Save Changes' : 'Send Invite'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TeamPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [teamList, setTeamList]     = useState([]);
  const [loading, setLoading]       = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [editUser, setEditUser]     = useState(null);
  const [search, setSearch]         = useState('');
  const [filterRole, setFilterRole] = useState('ALL');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading]);

  useEffect(() => {
    if (user) loadTeam();
  }, [user]);

  const loadTeam = async () => {
    setLoading(true);
    try {
      const data = await users.list(user.organizationId);
      setTeamList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (u) => {
    try {
      await users.update(u.id, { isActive: !u.isActive });
      loadTeam();
    } catch (err) {
      alert(err.message);
    }
  };

  const filtered = teamList
    .filter(u => filterRole === 'ALL' || u.role === filterRole)
    .filter(u => !search || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase()));

  if (authLoading) return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Arial,sans-serif', color:'#94A3B8' }}>Loading...</div>;
  if (!user) return null;

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', fontFamily:'Arial,sans-serif' }}>
      <Topbar />
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        <Sidebar />
        <main style={{ flex:1, background:'#F8FAFC', padding:'24px', overflowY:'auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
            <div>
              <h1 style={{ fontSize:'20px', fontWeight:700, color:'#1E293B', margin:0 }}>Team</h1>
              <p style={{ fontSize:'13px', color:'#94A3B8', margin:'4px 0 0' }}>{teamList.length} members in your organization</p>
            </div>
            <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
              <input placeholder="Search team..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ border:'1px solid #E2E8F0', borderRadius:'6px', padding:'6px 12px', fontSize:'13px', width:'180px', outline:'none' }} />
              <button onClick={() => setShowInvite(true)}
                style={{ padding:'8px 20px', background:'#2563EB', color:'#fff', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>
                + Invite Member
              </button>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'10px', marginBottom:'20px' }}>
            {['ADMIN','MANAGER','ARCHITECT','ENGINEER','VIEWER'].map(r => (
              <div key={r} onClick={() => setFilterRole(filterRole===r ? 'ALL' : r)}
                style={{ background:'#fff', border:`2px solid ${filterRole===r ? roleColor[r] : '#E2E8F0'}`, borderRadius:'10px', padding:'12px', textAlign:'center', cursor:'pointer' }}>
                <div style={{ fontSize:'20px', fontWeight:700, color:roleColor[r] }}>{teamList.filter(u => u.role===r).length}</div>
                <div style={{ fontSize:'11px', color:'#94A3B8', fontWeight:600 }}>{r}</div>
              </div>
            ))}
          </div>

          <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:'10px', overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#F8FAFC' }}>
                  {['Member','Role','Email','Status','Last Login','Actions'].map(h => (
                    <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:'11px', fontWeight:700, color:'#94A3B8', textTransform:'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ padding:'40px', textAlign:'center', color:'#94A3B8' }}>Loading team...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding:'40px', textAlign:'center', color:'#94A3B8' }}>No team members found</td></tr>
                ) : filtered.map((u, i) => (
                  <tr key={u.id} style={{ borderTop:'1px solid #F1F5F9' }}>
                    <td style={{ padding:'12px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                        <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:roleColors[i%roleColors.length], color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:700, flexShrink:0 }}>
                          {getInitials(`${u.firstName} ${u.lastName}`)}
                        </div>
                        <div>
                          <div style={{ fontWeight:600, color:'#1E293B', fontSize:'13px' }}>{u.firstName} {u.lastName}</div>
                          {u.id === user.userId && <div style={{ fontSize:'10px', color:'#2563EB' }}>You</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:'12px 16px' }}>
                      <span style={{ background:roleBg[u.role]||'#F1F5F9', color:roleColor[u.role]||'#64748B', fontSize:'11px', fontWeight:600, padding:'2px 10px', borderRadius:'20px' }}>{u.role}</span>
                    </td>
                    <td style={{ padding:'12px 16px', fontSize:'13px', color:'#64748B' }}>{u.email}</td>
                    <td style={{ padding:'12px 16px' }}>
                      <span style={{ background:u.isActive ? '#DCFCE7' : '#F1F5F9', color:u.isActive ? '#15803D' : '#64748B', fontSize:'11px', fontWeight:600, padding:'2px 10px', borderRadius:'20px' }}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding:'12px 16px', fontSize:'12px', color:'#94A3B8' }}>{formatDate(u.lastLoginAt)}</td>
                    <td style={{ padding:'12px 16px' }}>
                      <div style={{ display:'flex', gap:'6px' }}>
                        <button onClick={() => setEditUser(u)}
                          style={{ fontSize:'11px', border:'1px solid #E2E8F0', borderRadius:'6px', padding:'4px 10px', background:'#fff', cursor:'pointer', color:'#475569' }}>
                          Edit
                        </button>
                        {u.id !== user.userId && (
                          <button onClick={() => handleToggleActive(u)}
                            style={{ fontSize:'11px', border:`1px solid ${u.isActive ? '#FEE2E2' : '#DCFCE7'}`, borderRadius:'6px', padding:'4px 10px', background:u.isActive ? '#FEF2F2' : '#F0FDF4', cursor:'pointer', color:u.isActive ? '#DC2626' : '#15803D' }}>
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
      {showInvite && <UserModal onClose={() => setShowInvite(false)} onSaved={loadTeam} />}
      {editUser && <UserModal user={editUser} onClose={() => setEditUser(null)} onSaved={loadTeam} />}
    </div>
  );
}