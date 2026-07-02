import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { useState, useEffect, useRef } from 'react';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export default function Topbar({ hideSearch = false, projectSearch = null, onProjectSearch = null, projectName = null }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef();

  const initials = user
    ? `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase()
    : 'U';

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const timeout = setTimeout(async () => {
      try {
        const token = localStorage.getItem('orarch_token');
        const res = await fetch(`${BASE_URL}/documents/all`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        const filtered = (Array.isArray(data) ? data : [])
          .filter(d => (d.title || d.fileName || '').toLowerCase().includes(query.toLowerCase()))
          .slice(0, 6);
        setResults(filtered);
        setShowResults(true);
      } catch (err) { console.error(err); }
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header style={{ background:'#fff', borderBottom:'1px solid #E2E8F0', height:'52px', display:'flex', alignItems:'center', padding:'0 20px', gap:'12px', flexShrink:0 }}>
      <div style={{ fontWeight:800, fontSize:'18px', color:'#2563EB', letterSpacing:'2px', cursor:'pointer' }} onClick={() => router.push('/')}>
        OR<span style={{ color:'#0EA5E9' }}>ARCH </span><span style={{ color:'#2563EB' }}>24/7</span>
      </div>
      {/* Center project selector (Bricsys-style) */}
      {projectName && (
        <div style={{ flex:1, display:'flex', justifyContent:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', cursor:'pointer', padding:'4px 10px', borderRadius:'8px' }}
            onMouseEnter={e => e.currentTarget.style.background='#F8FAFC'}
            onMouseLeave={e => e.currentTarget.style.background='transparent'}
            onClick={() => router.push('/projects')} title="Switch project">
            <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:'#F59E0B', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:700, flexShrink:0 }}>
              {projectName.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize:'14px', fontWeight:600, color:'#1E293B', maxWidth:'320px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{projectName}</span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3.5 5.5L7 9l3.5-3.5" stroke="#64748B" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </div>
      )}
      <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:'12px' }}>
        {!hideSearch && (
          <div ref={searchRef} style={{ position:'relative' }}>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => query && setShowResults(true)}
              placeholder="Search documents..."
              style={{ border:'1px solid #E2E8F0', borderRadius:'20px', padding:'7px 16px', fontSize:'13px', width:'240px', outline:'none' }}
            />
            {showResults && results.length > 0 && (
              <div style={{ position:'absolute', top:'36px', left:0, width:'320px', background:'#fff', border:'1px solid #E2E8F0', borderRadius:'8px', boxShadow:'0 4px 20px rgba(0,0,0,0.12)', zIndex:100, overflow:'hidden' }}>
                {results.map(doc => (
                  <div key={doc.id} onClick={() => {
                    router.push(`/document-detail?id=${doc.id}&projectId=${doc.projectId}`);
                    setShowResults(false);
                    setQuery('');
                  }}
                    style={{ padding:'10px 14px', cursor:'pointer', borderBottom:'1px solid #F1F5F9', display:'flex', alignItems:'center', gap:'10px' }}
                    onMouseEnter={e => e.currentTarget.style.background='#F8FAFC'}
                    onMouseLeave={e => e.currentTarget.style.background='#fff'}>
                    <span style={{ fontSize:'16px' }}>📄</span>
                    <div>
                      <div style={{ fontSize:'13px', fontWeight:600, color:'#1E293B' }}>{doc.title || doc.fileName}</div>
                      <div style={{ fontSize:'11px', color:'#94A3B8' }}>{doc.documentType || '—'} · {doc.status || '—'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {showResults && query && results.length === 0 && (
              <div style={{ position:'absolute', top:'36px', left:0, width:'280px', background:'#fff', border:'1px solid #E2E8F0', borderRadius:'8px', boxShadow:'0 4px 20px rgba(0,0,0,0.12)', zIndex:100, padding:'14px', fontSize:'13px', color:'#94A3B8' }}>
                No documents found
              </div>
            )}
          </div>
        )}
        <div title="Logout" onClick={logout}
          style={{ width:'32px', height:'32px', borderRadius:'50%', background:'#2563EB', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:700, cursor:'pointer' }}>
          {initials}
        </div>
      </div>
    </header>
  );
}