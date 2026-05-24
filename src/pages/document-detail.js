import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { useAuth } from '../hooks/useAuth';

const tabs = ['Info', 'Communication', 'Metadata', 'Workflows', 'Attachments', 'Versions', 'History'];
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('orarch_token') : null; }

async function apiFetch(path) {
  const res = await fetch(`${BASE_URL}${path}`, { headers: { Authorization: `Bearer ${getToken()}` } });
  if (!res.ok) return null;
  return res.json();
}

export default function DocumentDetailPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { id, projectId } = router.query;
  const [activeTab, setActiveTab] = useState('Info');
  const [doc, setDoc] = useState(null);
  const [comments, setComments] = useState([]);
  const [versions, setVersions] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [allDocs, setAllDocs] = useState([]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading]);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [docData, commentsData, versionsData, allDocsData] = await Promise.all([
        apiFetch(`/documents/${id}`),
        apiFetch(`/comments?documentId=${id}`).catch(() => []),
        apiFetch(`/documents/${id}/versions`).catch(() => []),
        projectId ? apiFetch(`/documents?projectId=${projectId}`) : Promise.resolve([]),
      ]);
      setDoc(docData);
      setComments(Array.isArray(commentsData) ? commentsData : []);
      setVersions(Array.isArray(versionsData) ? versionsData : []);
      setAllDocs(Array.isArray(allDocsData) ? allDocsData : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const sendComment = async () => {
    if (!message.trim()) return;
    try {
      const res = await fetch(`${BASE_URL}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ documentId: id, content: message })
      });
      if (res.ok) {
        setMessage('');
        const data = await apiFetch(`/comments?documentId=${id}`);
        setComments(Array.isArray(data) ? data : []);
      }
    } catch (err) { console.error(err); }
  };

  const currentIndex = allDocs.findIndex(d => d.id === id);
  const prevDoc = currentIndex > 0 ? allDocs[currentIndex - 1] : null;
  const nextDoc = currentIndex < allDocs.length - 1 ? allDocs[currentIndex + 1] : null;

  function formatDate(d) { return d ? new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—'; }
  function formatSize(bytes) {
    if (!bytes) return '—';
    if (bytes > 1024*1024) return `${(bytes/1024/1024).toFixed(1)} MB`;
    if (bytes > 1024) return `${(bytes/1024).toFixed(0)} KB`;
    return `${bytes} B`;
  }

  if (authLoading || !user) return null;
  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:'Arial', color:'#94A3B8' }}>Loading...</div>;

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', fontFamily:'Arial, sans-serif' }}>
      <Topbar />
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
      <div style={{ width:'48px', background:'#1E293B', display:'flex', flexDirection:'column', alignItems:'center', paddingTop:'12px', gap:'4px', flexShrink:0 }}>
  {[
    { title:'Files', path:`/projects/${projectId}`, active:true, icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="3" y="2" width="10" height="14" rx="1.5" stroke="#fff" strokeWidth="1.4"/><path d="M6 6h6M6 9h4" stroke="#fff" strokeWidth="1.4" strokeLinecap="round"/></svg> },
    { title:'Address Book', path:'/address-book', icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="6" r="3.5" stroke="#94A3B8" strokeWidth="1.4"/><path d="M2.5 16a6.5 6.5 0 0113 0" stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round"/></svg> },
    { title:'Tasks', path:'/tasks', icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 7h10M4 11h7M4 3h14" stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round"/></svg> },
    { title:'Messages', path:'/messages', icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="3" width="14" height="10" rx="1.5" stroke="#94A3B8" strokeWidth="1.4"/><path d="M6 13l3 3 3-3" stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    { title:'Reports', path:'/reports', icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 14V6l4 4 4-4 4 4" stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  ].map(item => (
    <button key={item.title} title={item.title} onClick={() => router.push(item.path)}
      style={{ width:'38px', height:'38px', borderRadius:'8px', background: item.active ? 'rgba(255,255,255,0.15)' : 'transparent', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
      onMouseEnter={e => { if (!item.active) e.currentTarget.style.background='rgba(255,255,255,0.08)'; }}
      onMouseLeave={e => { if (!item.active) e.currentTarget.style.background='transparent'; }}>
      {item.icon}
    </button>
  ))}
</div>
        <main style={{ flex:1, display:'flex', overflow:'hidden', background:'#F8FAFC' }}>

          {/* Document Preview Area */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
            {/* Toolbar */}
            <div style={{ background:'#fff', borderBottom:'1px solid #E2E8F0', padding:'10px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                <span onClick={() => router.back()} style={{ cursor:'pointer', color:'#64748B', fontSize:'13px' }}>← Back</span>
                <span style={{ fontSize:'14px', fontWeight:700, color:'#1E293B' }}>{doc?.title || doc?.fileName || '...'}</span>
                <span style={{ background:'#EFF6FF', color:'#2563EB', fontSize:'11px', fontWeight:600, padding:'2px 8px', borderRadius:'4px' }}>v{doc?.currentVersion || '1.0'}</span>
              </div>
              <div style={{ display:'flex', gap:'8px' }}>
                <button onClick={() => prevDoc && router.push(`/document-detail?id=${prevDoc.id}&projectId=${projectId}`)}
                  disabled={!prevDoc}
                  style={{ background:'#F1F5F9', color: prevDoc ? '#475569' : '#CBD5E1', border:'none', borderRadius:'6px', padding:'7px 14px', fontSize:'12px', fontWeight:600, cursor: prevDoc ? 'pointer' : 'not-allowed' }}>
                  ← Prev
                </button>
                <button onClick={() => nextDoc && router.push(`/document-detail?id=${nextDoc.id}&projectId=${projectId}`)}
                  disabled={!nextDoc}
                  style={{ background:'#F1F5F9', color: nextDoc ? '#475569' : '#CBD5E1', border:'none', borderRadius:'6px', padding:'7px 14px', fontSize:'12px', fontWeight:600, cursor: nextDoc ? 'pointer' : 'not-allowed' }}>
                  Next →
                </button>
                <button style={{ background:'#2563EB', color:'#fff', border:'none', borderRadius:'6px', padding:'7px 14px', fontSize:'12px', fontWeight:600, cursor:'pointer' }}>
                  Download
                </button>
                <button style={{ background:'#0EA5E9', color:'#fff', border:'none', borderRadius:'6px', padding:'7px 14px', fontSize:'12px', fontWeight:600, cursor:'pointer' }}>
                  Open in Viewer
                </button>
              </div>
            </div>

            {/* Preview */}
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'#E2E8F0', overflow:'hidden' }}>
              <div style={{ background:'#fff', width:'70%', height:'80%', borderRadius:'8px', boxShadow:'0 4px 24px rgba(0,0,0,0.08)', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'12px' }}>
                <div style={{ fontSize:'48px' }}>
                  {doc?.mimeType?.includes('pdf') ? '📄' : doc?.mimeType?.includes('image') ? '🖼️' : '📐'}
                </div>
                <div style={{ fontSize:'14px', fontWeight:600, color:'#1E293B' }}>{doc?.title || doc?.fileName}</div>
                <div style={{ fontSize:'12px', color:'#94A3B8' }}>{doc?.documentType} · {formatSize(doc?.fileSize)}</div>
                <button style={{ background:'#2563EB', color:'#fff', border:'none', borderRadius:'6px', padding:'8px 20px', fontSize:'13px', fontWeight:600, cursor:'pointer', marginTop:'8px' }}>
                  Open in Viewer
                </button>
              </div>
            </div>
          </div>

          {/* Side Panel */}
          <div style={{ width:'320px', background:'#fff', borderLeft:'1px solid #E2E8F0', display:'flex', flexDirection:'column', overflow:'hidden' }}>
            <div style={{ display:'flex', overflowX:'auto', borderBottom:'1px solid #E2E8F0', padding:'0 8px' }}>
              {tabs.map(t => (
                <button key={t} onClick={() => setActiveTab(t)}
                  style={{ padding:'10px 12px', border:'none', borderBottom: activeTab===t ? '2px solid #2563EB' : '2px solid transparent', background:'transparent', fontSize:'12px', fontWeight: activeTab===t ? 700 : 400, color: activeTab===t ? '#2563EB' : '#64748B', cursor:'pointer', whiteSpace:'nowrap' }}>
                  {t}
                </button>
              ))}
            </div>

            <div style={{ flex:1, overflowY:'auto', padding:'16px' }}>

              {activeTab === 'Info' && doc && (
                <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                  {[
                    { label:'Document Name', value: doc.title || doc.fileName },
                    { label:'Type', value: doc.documentType || '—' },
                    { label:'Version', value: `v${doc.currentVersion || '1.0'}` },
                    { label:'File Size', value: formatSize(doc.fileSize) },
                    { label:'Upload Date', value: formatDate(doc.createdAt) },
                    { label:'Status', value: doc.status || '—' },
                    { label:'Uploaded By', value: doc.uploadedBy ? doc.uploadedBy.toString().slice(0,8)+'...' : '—' },
                  ].map(item => (
                    <div key={item.label}>
                      <div style={{ fontSize:'11px', fontWeight:700, color:'#94A3B8', textTransform:'uppercase', marginBottom:'2px' }}>{item.label}</div>
                      <div style={{ fontSize:'13px', color:'#1E293B' }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'Communication' && (
                <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
                  <div style={{ flex:1, display:'flex', flexDirection:'column', gap:'10px', marginBottom:'12px' }}>
                    {comments.length === 0 && <div style={{ fontSize:'13px', color:'#94A3B8' }}>No comments yet</div>}
                    {comments.map((c, i) => (
                      <div key={i} style={{ background:'#F8FAFC', borderRadius:'8px', padding:'10px' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                          <span style={{ fontSize:'12px', fontWeight:700, color:'#1E293B' }}>{c.userName || 'User'}</span>
                          <span style={{ fontSize:'11px', color:'#94A3B8' }}>{formatDate(c.createdAt)}</span>
                        </div>
                        <div style={{ fontSize:'12px', color:'#475569' }}>{c.content}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display:'flex', gap:'8px' }}>
                    <input value={message} onChange={e => setMessage(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') sendComment(); }}
                      placeholder="Write a comment..."
                      style={{ flex:1, border:'1px solid #E2E8F0', borderRadius:'6px', padding:'8px 10px', fontSize:'12px', outline:'none' }} />
                    <button onClick={sendComment}
                      style={{ background:'#2563EB', color:'#fff', border:'none', borderRadius:'6px', padding:'8px 12px', fontSize:'12px', cursor:'pointer' }}>
                      Send
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'Metadata' && doc && (
                <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                  {[
                    { label:'File Name', value: doc.fileName || '—' },
                    { label:'MIME Type', value: doc.mimeType || '—' },
                    { label:'File Size', value: formatSize(doc.fileSize) },
                    { label:'Project ID', value: doc.projectId ? doc.projectId.toString().slice(0,8)+'...' : '—' },
                    { label:'Is Locked', value: doc.isLocked ? 'Yes' : 'No' },
                    { label:'Created At', value: formatDate(doc.createdAt) },
                    { label:'Updated At', value: formatDate(doc.updatedAt) },
                  ].map(item => (
                    <div key={item.label}>
                      <div style={{ fontSize:'11px', fontWeight:700, color:'#94A3B8', textTransform:'uppercase', marginBottom:'2px' }}>{item.label}</div>
                      <div style={{ fontSize:'13px', color:'#1E293B' }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'Workflows' && (
                <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                  {doc?.status === 'DRAFT' && <div style={{ fontSize:'13px', color:'#94A3B8' }}>No workflow started yet. Send for approval to begin.</div>}
                  {[
                    { step:'Draft', status: 'Completed', date: formatDate(doc?.createdAt) },
                    { step:'In Review', status: doc?.status === 'IN_REVIEW' || doc?.status === 'APPROVED' ? 'Completed' : 'Pending', date:'—' },
                    { step:'Approved', status: doc?.status === 'APPROVED' ? 'Completed' : 'Pending', date:'—' },
                  ].map((w, i) => (
                    <div key={w.step} style={{ display:'flex', gap:'12px', alignItems:'flex-start' }}>
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                        <div style={{ width:'12px', height:'12px', borderRadius:'50%', background: w.status === 'Completed' ? '#16A34A' : w.status === 'In Progress' ? '#2563EB' : '#94A3B8', marginTop:'3px' }} />
                        {i < 2 && <div style={{ width:'2px', height:'30px', background:'#E2E8F0', marginTop:'4px' }} />}
                      </div>
                      <div>
                        <div style={{ fontSize:'13px', fontWeight:600, color:'#1E293B' }}>{w.step}</div>
                        <div style={{ fontSize:'11px', color: w.status === 'Completed' ? '#16A34A' : '#94A3B8', fontWeight:600 }}>{w.status}</div>
                        <div style={{ fontSize:'11px', color:'#94A3B8' }}>{w.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'Attachments' && (
                <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                  <div style={{ fontSize:'13px', color:'#94A3B8' }}>No attachments yet</div>
                  <button style={{ background:'#F1F5F9', color:'#475569', border:'1px dashed #CBD5E1', borderRadius:'8px', padding:'10px', fontSize:'12px', cursor:'pointer' }}>
                    + Add Attachment
                  </button>
                </div>
              )}

              {activeTab === 'Versions' && (
                <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                  {versions.length === 0 && (
                    <div style={{ background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'10px 12px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'4px' }}>
                        <span style={{ fontSize:'13px', fontWeight:700, color:'#1E293B' }}>v{doc?.currentVersion || '1.0'}</span>
                        <span style={{ fontSize:'11px', color:'#94A3B8' }}>{formatDate(doc?.createdAt)}</span>
                      </div>
                      <div style={{ fontSize:'11px', color:'#64748B' }}>Current version</div>
                    </div>
                  )}
                  {versions.map(v => (
                    <div key={v.id} style={{ background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'10px 12px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'4px' }}>
                        <span style={{ fontSize:'13px', fontWeight:700, color:'#1E293B' }}>v{v.versionNumber}</span>
                        <span style={{ fontSize:'11px', color:'#94A3B8' }}>{formatDate(v.createdAt)}</span>
                      </div>
                      <div style={{ fontSize:'11px', color:'#94A3B8' }}>{v.notes || 'No notes'}</div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'History' && (
                <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                  {[
                    { action:'Created', date: formatDate(doc?.createdAt) },
                    { action:'Last Updated', date: formatDate(doc?.updatedAt) },
                    { action:`Status: ${doc?.status}`, date: formatDate(doc?.updatedAt) },
                  ].map((h, i) => (
                    <div key={i} style={{ display:'flex', gap:'10px', alignItems:'flex-start', paddingBottom:'8px', borderBottom: i < 2 ? '1px solid #F1F5F9' : 'none' }}>
                      <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#2563EB', marginTop:'4px', flexShrink:0 }} />
                      <div>
                        <div style={{ fontSize:'12px', fontWeight:600, color:'#1E293B' }}>{h.action}</div>
                        <div style={{ fontSize:'11px', color:'#94A3B8' }}>{h.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
