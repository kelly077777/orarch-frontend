import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      router.push('/');
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '40px', width: '100%', maxWidth: '380px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontWeight: 800, fontSize: '26px', letterSpacing: '3px', color: '#2563EB' }}>
            OR<span style={{ color: '#0EA5E9' }}>ARCH</span><span style={{ color: '#2563EB' }}>247</span>
          </div>
          <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>Construction Document Management</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="you@yourcompany.com"
              style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', color: '#1E293B' }}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="••••••••"
              style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', color: '#1E293B' }}
            />
          </div>

          {error && (
            <div style={{ background: '#FEE2E2', color: '#DC2626', fontSize: '12px', padding: '8px 12px', borderRadius: '6px', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '11px', background: loading ? '#93C5FD' : '#2563EB', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#64748B' }}>
          Don't have an account?{' '}
          <span
            onClick={() => router.push('/register')}
            style={{ color: '#2563EB', fontWeight: 600, cursor: 'pointer' }}
          >
            Sign up free
          </span>
        </div>
      </div>
    </div>
  );
}