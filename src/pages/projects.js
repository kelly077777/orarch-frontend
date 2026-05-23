import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      router.push('/projects');
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Segoe UI', Arial, sans-serif" }}>
      {/* Left Panel */}
      <div style={{
        flex: 1, background: 'linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '60px', color: '#fff',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '48px' }}>
          <div style={{
            width: '52px', height: '52px', background: '#fff', borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect x="4" y="4" width="10" height="10" rx="2" fill="#2563EB"/>
              <rect x="18" y="4" width="10" height="10" rx="2" fill="#2563EB"/>
              <rect x="4" y="18" width="10" height="10" rx="2" fill="#2563EB"/>
              <rect x="18" y="18" width="10" height="10" rx="2" fill="#93C5FD"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '2px' }}>ORARCH<span style={{ color: '#93C5FD' }}>247</span></div>
            <div style={{ fontSize: '11px', color: '#93C5FD', letterSpacing: '1px' }}>CONSTRUCTION DOCUMENT MANAGEMENT</div>
          </div>
        </div>

        {/* Features list */}
        <div style={{ maxWidth: '320px', width: '100%' }}>
          {[
            { icon: '📁', text: 'Centralized document management' },
            { icon: '✅', text: 'Approval workflows & versioning' },
            { icon: '👥', text: 'Team collaboration & messaging' },
            { icon: '📊', text: 'Reports & analytics' },
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <span style={{ fontSize: '20px' }}>{f.icon}</span>
              <span style={{ fontSize: '14px', color: '#BFDBFE' }}>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div style={{
        width: '440px', background: '#fff', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '48px 40px',
      }}>
        <div style={{ width: '100%', maxWidth: '340px' }}>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
            Log in with your account
          </div>
          <div style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '32px' }}>
            Welcome back to ORARCH247
          </div>

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                Email
              </label>
              <input
                type="email" required value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="you@yourcompany.com"
                style={{
                  width: '100%', border: '1px solid #CBD5E1', borderRadius: '6px',
                  padding: '10px 12px', fontSize: '13px', outline: 'none',
                  boxSizing: 'border-box', color: '#1E293B', background: '#F8FAFC',
                }}
                onFocus={e => e.target.style.borderColor = '#2563EB'}
                onBlur={e => e.target.style.borderColor = '#CBD5E1'}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'} required value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  style={{
                    width: '100%', border: '1px solid #CBD5E1', borderRadius: '6px',
                    padding: '10px 40px 10px 12px', fontSize: '13px', outline: 'none',
                    boxSizing: 'border-box', color: '#1E293B', background: '#F8FAFC',
                  }}
                  onFocus={e => e.target.style.borderColor = '#2563EB'}
                  onBlur={e => e.target.style.borderColor = '#CBD5E1'}
                />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: '12px' }}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Remember me + Forgot password */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#475569' }}>
                <div onClick={() => setRemember(r => !r)}
                  style={{
                    width: '36px', height: '20px', borderRadius: '10px', cursor: 'pointer',
                    background: remember ? '#2563EB' : '#CBD5E1', transition: 'background 0.2s',
                    position: 'relative', flexShrink: 0,
                  }}>
                  <div style={{
                    position: 'absolute', top: '3px', left: remember ? '19px' : '3px',
                    width: '14px', height: '14px', borderRadius: '50%', background: '#fff',
                    transition: 'left 0.2s',
                  }} />
                </div>
                Remember me
              </label>
              <span
                onClick={() => alert('Contact your administrator to reset your password.')}
                style={{ fontSize: '13px', color: '#2563EB', cursor: 'pointer', fontWeight: 500 }}>
                Forgot Password?
              </span>
            </div>

            {error && (
              <div style={{ background: '#FEE2E2', color: '#DC2626', fontSize: '12px', padding: '8px 12px', borderRadius: '6px', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{
                width: '100%', padding: '11px', background: loading ? '#93C5FD' : '#2563EB',
                color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px',
                fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '20px',
              }}>
              {loading ? 'Signing in...' : 'Log in'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
            <span style={{ fontSize: '12px', color: '#94A3B8' }}>Or sign in with</span>
            <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
          </div>

          {/* Social buttons */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '28px' }}>
            {[
              { label: 'f', bg: '#1877F2', title: 'Facebook' },
              { label: 'G', bg: '#EA4335', title: 'Google' },
              { label: 'in', bg: '#0A66C2', title: 'LinkedIn' },
            ].map((s) => (
              <button key={s.title} title={s.title}
                onClick={() => alert(`${s.title} login coming soon`)}
                style={{
                  flex: 1, padding: '9px', background: s.bg, color: '#fff',
                  border: 'none', borderRadius: '6px', fontSize: '14px',
                  fontWeight: 700, cursor: 'pointer',
                }}>
                {s.label}
              </button>
            ))}
          </div>

          {/* Register */}
          <div style={{ textAlign: 'center', fontSize: '13px', color: '#64748B' }}>
            Need to create a new account?{' '}
            <span onClick={() => router.push('/register')}
              style={{ color: '#2563EB', fontWeight: 600, cursor: 'pointer' }}>
              Register here →
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}