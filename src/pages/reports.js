import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { users } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/router';

function DonutChart({ data, total }) {
  if (total === 0) return <div style={{ width:'160px', height:'160px', display:'flex', alignItems:'center', justifyContent:'center', color:'#94A3B8', fontSize:'12px' }}>No data</div>;
  let cumulative = 0;
  const radius = 60, cx = 80, cy = 80;
  const circumference = 2 * Math.PI * radius;
  return (
    <svg width="160" height="160" viewBox="0 0 160 160">
      {data.filter(d => d.count > 0).map((d, i) => {
        const pct = d.count / total;
        const offset = circumference * (1 - cumulative);
        cumulative += pct;
        return (
          <circle key={i} cx={cx} cy={cy} r={radius} fill="none" stroke={d.color} strokeWidth="28"
            strokeDasharray={`${circumference * pct} ${circumference * (1 - pct)}`}
            strokeDashoffset={offset} transform={`rotate(-90 ${cx} ${cy})`} />
        );
      })}
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="20" fontWeight="700" fill="#1E293B">{total}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="10" fill="#94A3B8">Total Docs</text>
    </svg>
  );
}

export default function ReportsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState('overview');
  const [docList, setDocList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading]);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
      const token = localStorage.getItem('orarch_token');
      const res = await fetch(`${BASE_URL}/documents/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setDocList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const statusColors = { DRAFT:'#94A3B8', IN_REVIEW:'#7C3AED', APPROVED:'#16A34A', REJECTED:'#DC2626', PENDING:'#D97706' };
  const statusCounts = ['DRAFT','IN_REVIEW','APPROVED','REJECTED','PENDING'].map(s => ({
    label: s.replace('_', ' '), count: docList.filter(d => d.status === s).length, color: statusColors[s]
  }));
  const totalDocs = docList.length;

  const typeMap = {};
  docList.forEach(d => { const k = d.documentType || 'Unknown'; typeMap[k] = (typeMap[k] || 0) + 1; });
  const byType = Object.entries(typeMap).map(([type, count]) => ({ type, count })).sort((a,b) => b.count - a.count);

  const uploaderMap = {};
  docList.forEach(d => { const k = d.uploadedBy ? d.uploadedBy.toString().slice(0,8) : 'Unknown'; uploaderMap[k] = (uploaderMap[k] || 0) + 1; });
  const byUploader = Object.entries(uploaderMap).map(([user, count]) => ({ user, count })).sort((a,b) => b.count - a.count);

  const exportToCSV = () => {
    if (!docList.length) return alert('No data to export');
    const headers = ['Title','Status','Type','Date'];
    const rows = docList.map(d => [d.title || d.fileName, d.status, d.documentType, d.createdAt]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'orarch247_report.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading || !user) return null;

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', fontFamily:'Arial, sans-serif' }}>
      <Topbar />
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        <Sidebar />
        <main style={{ flex:1, background:'#F8FAFC', padding:'24px', overflowY:'auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
            <div>
              <h1 style={{ fontSize:'18px', fontWeight:700, color:'#1E293B', margin:0 }}>Reports</h1>
              <p style={{ fontSize:'12px', color:'#94A3B8', margin:'4px 0 0' }}>Project performance and analytics</p>
            </div>
            <button onClick={exportToCSV}
              style={{ background:'#16A34A', color:'#fff', border:'none', borderRadius:'8px', padding:'8px 16px', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>
              Export to CSV
            </button>
          </div>

          <div style={{ display:'flex', gap:'4px', marginBottom:'20px', background:'#fff', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'4px', width:'fit-content' }}>
            {['overview','by type','by uploader'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ padding:'6px 16px', border:'none', borderRadius:'6px', fontSize:'12px', fontWeight:600, cursor:'pointer', background: tab===t ? '#2563EB' : 'transparent', color: tab===t ? '#fff' : '#64748B', textTransform:'capitalize' }}>
                {t}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign:'center', padding:'60px', color:'#94A3B8' }}>Loading reports...</div>
          ) : (
            <>
              {tab === 'overview' && (
                <div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'14px', marginBottom:'24px' }}>
                    {statusCounts.map(d => (
                      <div key={d.label} style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:'10px', padding:'16px' }}>
                        <div style={{ fontSize:'28px', fontWeight:700, color:d.color }}>{d.count}</div>
                        <div style={{ fontSize:'12px', color:'#64748B', marginTop:'4px' }}>{d.label}</div>
                        <div style={{ fontSize:'11px', color:'#94A3B8', marginTop:'2px' }}>{totalDocs ? Math.round(d.count/totalDocs*100) : 0}% of total</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'200px 1fr', gap:'20px' }}>
                    <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:'10px', padding:'20px', display:'flex', flexDirection:'column', alignItems:'center' }}>
                      <div style={{ fontSize:'12px', fontWeight:700, color:'#1E293B', marginBottom:'12px' }}>Document Status</div>
                      <DonutChart data={statusCounts} total={totalDocs} />
                      <div style={{ marginTop:'12px', width:'100%' }}>
                        {statusCounts.filter(d => d.count > 0).map(d => (
                          <div key={d.label} style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                              <span style={{ width:'10px', height:'10px', borderRadius:'50%', background:d.color, display:'inline-block' }} />
                              <span style={{ fontSize:'12px', color:'#64748B' }}>{d.label}</span>
                            </div>
                            <span style={{ fontSize:'12px', fontWeight:600, color:'#1E293B' }}>{d.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:'10px', padding:'20px' }}>
                      <div style={{ fontSize:'13px', fontWeight:700, color:'#1E293B', marginBottom:'16px' }}>Recent Documents</div>
                      {docList.length === 0 && <div style={{ fontSize:'13px', color:'#94A3B8' }}>No documents yet</div>}
                      {docList.slice(0,8).map((d, i) => (
                        <div key={d.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom: i<7 ? '1px solid #F1F5F9' : 'none' }}>
                          <span style={{ fontSize:'13px', color:'#1E293B' }}>{d.title || d.fileName}</span>
                          <span style={{ fontSize:'11px', fontWeight:600, padding:'2px 8px', borderRadius:'12px',
                            background: d.status==='APPROVED' ? '#DCFCE7' : d.status==='IN_REVIEW' ? '#EDE9FE' : '#F1F5F9',
                            color: d.status==='APPROVED' ? '#16A34A' : d.status==='IN_REVIEW' ? '#7C3AED' : '#64748B' }}>
                            {d.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {tab === 'by type' && (
                <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:'10px', padding:'20px' }}>
                  <div style={{ fontSize:'13px', fontWeight:700, color:'#1E293B', marginBottom:'16px' }}>Documents by Type</div>
                  {byType.length === 0 && <div style={{ fontSize:'13px', color:'#94A3B8' }}>No data yet</div>}
                  {byType.map(r => (
                    <div key={r.type} style={{ marginBottom:'14px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                        <span style={{ fontSize:'13px', color:'#1E293B' }}>{r.type}</span>
                        <span style={{ fontSize:'13px', fontWeight:600, color:'#2563EB' }}>{r.count} docs</span>
                      </div>
                      <div style={{ background:'#F1F5F9', borderRadius:'4px', height:'8px' }}>
                        <div style={{ background:'#2563EB', borderRadius:'4px', height:'8px', width:`${byType[0] ? (r.count/byType[0].count)*100 : 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'by uploader' && (
                <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:'10px', padding:'20px' }}>
                  <div style={{ fontSize:'13px', fontWeight:700, color:'#1E293B', marginBottom:'16px' }}>Documents by Uploader</div>
                  {byUploader.length === 0 && <div style={{ fontSize:'13px', color:'#94A3B8' }}>No data yet</div>}
                  {byUploader.map(u => (
                    <div key={u.user} style={{ marginBottom:'14px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                        <span style={{ fontSize:'13px', color:'#1E293B' }}>{u.user}...</span>
                        <span style={{ fontSize:'13px', fontWeight:600, color:'#0EA5E9' }}>{u.count} docs</span>
                      </div>
                      <div style={{ background:'#F1F5F9', borderRadius:'4px', height:'8px' }}>
                        <div style={{ background:'#0EA5E9', borderRadius:'4px', height:'8px', width:`${byUploader[0] ? (u.count/byUploader[0].count)*100 : 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
