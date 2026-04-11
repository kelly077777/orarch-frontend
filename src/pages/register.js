import { useState } from 'react';
import { useRouter } from 'next/router';
import { auth as authApi } from '../lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', organizationName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authApi.register(form);
      localStorage.setItem('orarch_token', data.token);
      localStorage.setItem('orarch_user', JSON.stringify(data));
      router.push('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '40px', width: '100%', maxWidth: '400px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontWeight: 800, fontSize: '26px', letterSpacing: '3px', color: '#2563EB' }}>
            OR<span style={{ color: '#0EA5E9' }}>ARCH</span><span style={{ color: '#2563EB' }}>247</span>
          </div>
          <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>Construction Document Management</div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B', marginTop: '12px' }}>Create your account</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>First Name</label>
              <input type="text" required value={form.firstName}
                onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                placeholder="John"
                style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', color: '#1E293B' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Last Name</label>
              <input type="text" required value={form.lastName}
                onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                placeholder="Doe"
                style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', color: '#1E293B' }}
              />
            </div>
          </div>

          {[
            { label: 'Company / Organization Name', key: 'organizationName', type: 'text', placeholder: 'e.g. Kigali Construction Ltd' },
            { label: 'Work Email', key: 'email', type: 'email', placeholder: 'you@yourcompany.com' },
            { label: 'Password', key: 'password', type: 'password', placeholder: '••••••••' },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key} style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>{label}</label>
              <input type={type} required value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', color: '#1E293B' }}
              />
            </div>
          ))}

          {error && (
            <div style={{ background: '#FEE2E2', color: '#DC2626', fontSize: '12px', padding: '8px 12px', borderRadius: '6px', marginBottom: '12px' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '11px', background: loading ? '#93C5FD' : '#2563EB', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#64748B' }}>
          Already have an account?{' '}
          <span onClick={() => router.push('/login')} style={{ color: '#2563EB', fontWeight: 600, cursor: 'pointer' }}>
            Sign in
          </span>
        </div>
      </div>
    </div>
  );
}