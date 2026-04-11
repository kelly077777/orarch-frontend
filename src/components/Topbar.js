import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';

export default function Topbar() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const initials = user
    ? `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase()
    : 'U';

  return (
    <header style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', height: '52px', display: 'flex', alignItems: 'center', padding: '0 20px', gap: '12px', flexShrink: 0 }}>
      {/* Logo */}
      <div style={{ fontWeight: 800, fontSize: '18px', color: '#2563EB', letterSpacing: '2px', cursor: 'pointer' }} onClick={() => router.push('/')}>
        OR<span style={{ color: '#0EA5E9' }}>ARCH</span><span style={{ color: '#2563EB' }}>247</span>
      </div>

      {/* Right side */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <input
          placeholder="Search documents..."
          style={{ border: '1px solid #E2E8F0', borderRadius: '6px', padding: '6px 12px', fontSize: '13px', width: '200px', outline: 'none' }}
        />
        <div style={{ fontSize: '12px', color: '#64748B' }}>{user?.firstName} {user?.lastName}</div>
        <div
          title="Logout"
          onClick={logout}
          style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#2563EB', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
          {initials}
        </div>
      </div>
    </header>
  );
}