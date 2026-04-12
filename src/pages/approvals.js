import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { approvals, documents } from '../lib/api';
import Topbar from '../components/Topbar';
import Sidebar from '../components/Sidebar';

const statusBg    = { APPROVED:'#DCFCE7', PENDING:'#FEF9C3', REJECTED:'#FEE2E2', IN_PROGRESS:'#EDE9FE', CANCELLED:'#F1F5F9' };
const statusColor = { APPROVED:'#15803D', PENDING:'#A16207', REJECTED:'#DC2626', IN_PROGRESS:'#7C3AED', CANCELLED:'#64748B' };
const priorityBg  = { LOW:'#F1F5F9', NORMAL:'#DBEAFE', HIGH:'#FEF9C3', URGENT:'#FEE2E2' };
const priorityColor = { LOW:'#64748B', NORMAL:'#2563EB', HIGH:'#D97706', URGENT:'#DC2626' };

function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
}

function getFileType(fileName = '') {
  const ext = (fileName || '').split('.').pop().toUpperCase();
  return ['DWG','PDF','DOC','DOCX'].includes(ext) ? ext : 'FILE';
}

function DecisionModal({ approval, onClose, onDecided }) {
  const [decision, setDecision] = useState('APPROVED');
  const [comments, setComments] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      await approvals.decide(approval.id, decision, comments);
      onDecided();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit decision');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
      <div style={{ background:'#fff', borderRadius:'14px', padding:'28px', width:'420px', boxShadow:'0 8px 40px rgba(0,0,0,0.15)' }}>
        <div style={{ fontSize:'16px', fontWeight:700, color:'#1E293B', marginBottom:'4px' }}>Submit Decision</div>
        <div style={{ fontSize:'12px', color:'#94A3B8', marginBottom:'20px' }}>{approval.title}</div>
        <div style={{ marginBottom:'16px' }}>
          <label style={{ fontSize:'12px', fontWeight:600, color:'#475569', display:'block', marginBottom:'8px' }}>Decision</label>
          <div style={{ display:'flex', gap:'8px' }}>
            {[
              { value:'APPROVED', label:'Approve', bg:'#DCFCE7', color:'#15803D', border:'#86EFAC' },
              { value:'REJECTED', label:'Reject', bg:'#FEE2E2', color:'#DC2626', border:'#FCA5A5' },
              { value:'REVISION_REQUIRED', label:'Revision', bg:'#FEF9C3', color:'#A16207', border:'#FDE047' },
            ].map(d => (
              <button key={d.value} onClick={() => setDecision(d.value)}
                style={{ flex:1, padding:'10px 8px', borderRadius:'8px', border:`2px solid ${decision===d.value ? d.border : '#E2E8F0'}`, background: decision===d.value ? d.bg : '#fff', color: decision===d.value ? d.color : '#475569', fontSize:'12px', fontWeight:600, cursor:'pointer' }}>
                {d.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom:'20px' }}>
          <label style={{ fontSize:'12px', fontWeight:600, color:'#475569', display:'block', marginBottom:'4px' }}>Comments (optional)</label>
          <textarea value={comments} onChange={e => setComments(e.target.value)} placeholder="Add your review comments..."
            style={{ width:'100%', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', outline:'none', boxSizing:'border-box', resize:'vertical', minHeight:'80px' }} />
        </div>
        {error && <div style={{ background:'#FEE2E2', color:'#DC2626', fontSize:'12px', padding:'8px 12px', borderRadius:'6px', marginBottom:'12px' }}>{error}</div>}
        <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'8px 18px', border:'1px solid #E2E8F0', borderRadius:'8px', background:'#fff', fontSize:'13px', cursor:'pointer', color:'#475569' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            style={{ padding:'8px 20px', border:'none', borderRadius:'8px', background: loading ? '#93C5FD' : '#2563EB', color:'#fff', fontSize:'13px', fontWeight:600, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Submitting...' : 'Submit Decision'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ApprovalsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [approvalList, setApprovalList] = useState([]);
  const [docMap, setDocMap]             = useState({});
  const [filter, setFilter]             = useState('ALL');
  const [loading, setLoading]           = useState(false);
  const [selectedApproval, setSelected] = useState(null);
  const [showDecision, setShowDecision] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading]);

  useEffect(() => {
    if (user) loadApprovals();
  }, [user]);

  const loadApprovals = async () => {
    setLoading(true);
    try {
      const data = await approvals.list();
      const list = Array.isArray(data) ? data : [];
      setApprovalList(list);
      const uniqueDocIds = [...new Set(list.map(a => a.documentId).filter(Boolean))];
      const docEntries = await Promise.all(
        uniqueDocIds.map(id => documents.get(id).then(d => [id, d]).catch(() => [id, null]))
      );
      setDocMap(Object.fromEntries(docEntries));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = filter === 'ALL' ? approvalList : approvalList.filter(a => a.status === filter);
  const counts = {
    ALL: approvalList.length,
    PENDING: approvalList.filter(a => a.status === 'PENDING').length,
    IN_PROGRESS: approvalList.filter(a => a.status === 'IN_PROGRESS').length,
    APPROVED: approvalList.filter(a => a.status === 'APPROVED').length,
    REJECTED: approvalList.filter(a => a.status === 'REJECTED').length,
  };

  if (authLoading) return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Arial,sans-serif', color:'#94A3B8' }}>Loading...</div>;
  if (!user) return null;

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', fontFamily:'Arial,sans-serif' }}>
      <Topbar />
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        <Sidebar />
        <main style={{ flex:1, background:'#F8FAFC', padding:'24px', overflowY:'auto' }}>
          <div style={{ marginBottom:'20px' }}>
            <h1 style={{ fontSize:'20px', fontWeight:700, color:'#1E293B', margin:0 }}>Approvals</h1>
            <p style={{ fontSize:'13px', color:'#94A3B8', margin:'4px 0 0' }}>Review and approve construction documents</p>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px', marginBottom:'20px' }}>
            {[
              { label:'Pending', count:counts.PENDING, color:'#A16207' },
              { label:'In Review', count:counts.IN_PROGRESS, color:'#7C3AED' },
              { label:'Approved', count:counts.APPROVED, color:'#15803D' },
              { label:'Rejected', count:counts.REJECTED, color:'#DC2626' },
            ].map(s => (
              <div key={s.label} style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:'10px', padding:'16px', textAlign:'center' }}>
                <div style={{ fontSize:'24px', fontWeight:700, color:s.color }}>{s.count}</div>
                <div style={{ fontSize:'12px', color:'#94A3B8', marginTop:'4px' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:'10px', overflow:'hidden' }}>
            <div style={{ display:'flex', borderBottom:'1px solid #E2E8F0', padding:'0 16px' }}>
              {['ALL','PENDING','IN_PROGRESS','APPROVED','REJECTED'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  style={{ padding:'12px 16px', border:'none', background:'none', cursor:'pointer', fontSize:'12px', fontWeight:600, color: filter===f ? '#2563EB' : '#64748B', borderBottom: filter===f ? '2px solid #2563EB' : '2px solid transparent', marginBottom:'-1px' }}>
                  {f==='IN_PROGRESS' ? 'In Review' : f.charAt(0)+f.slice(1).toLowerCase()} ({counts[f]})
                </button>
              ))}
            </div>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#F8FAFC' }}>
                  {['Title','Document','Priority','Status','Submitted','Action'].map(h => (
                    <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:'11px', fontWeight:700, color:'#94A3B8', textTransform:'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ padding:'40px', textAlign:'center', color:'#94A3B8' }}>Loading approvals...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding:'40px', textAlign:'center', color:'#94A3B8' }}>No approval requests yet</td></tr>
                ) : filtered.map(a => {
                  const doc = docMap[a.documentId];
                  const fType = doc ? getFileType(doc.fileName) : null;
                  return (
                    <tr key={a.id} style={{ borderTop:'1px solid #F1F5F9' }}>
                      <td style={{ padding:'12px 16px' }}>
                        <div style={{ fontWeight:600, color:'#1E293B', fontSize:'13px' }}>{a.title}</div>
                        {a.description && <div style={{ fontSize:'11px', color:'#94A3B8' }}>{a.description}</div>}
                      </td>
                      <td style={{ padding:'12px 16px', fontSize:'12px', color:'#64748B' }}>
                        {doc ? doc.title || doc.fileName : '-'}
                      </td>
                      <td style={{ padding:'12px 16px' }}>
                        <span style={{ background: priorityBg[a.priority]||'#F1F5F9', color: priorityColor[a.priority]||'#64748B', fontSize:'11px', fontWeight:600, padding:'2px 8px', borderRadius:'20px' }}>
                          {a.priority || 'NORMAL'}
                        </span>
                      </td>
                      <td style={{ padding:'12px 16px' }}>
                        <span style={{ background: statusBg[a.status]||'#F1F5F9', color: statusColor[a.status]||'#64748B', fontSize:'11px', fontWeight:600, padding:'2px 10px', borderRadius:'20px' }}>
                          {a.status === 'IN_PROGRESS' ? 'In Review' : a.status}
                        </span>
                      </td>
                      <td style={{ padding:'12px 16px', fontSize:'12px', color:'#94A3B8' }}>{formatDate(a.createdAt)}</td>
                      <td style={{ padding:'12px 16px' }}>
                        <div style={{ display:'flex', gap:'6px' }}>
                          <button onClick={() => setSelected(a)}
                            style={{ fontSize:'11px', border:'1px solid #E2E8F0', borderRadius:'6px', padding:'4px 10px', background:'#fff', cursor:'pointer', color:'#475569' }}>
                            View
                          </button>
                          {(a.status === 'PENDING' || a.status === 'IN_PROGRESS') && (
                            <button onClick={() => setShowDecision(a)}
                              style={{ fontSize:'11px', border:'none', borderRadius:'6px', padding:'4px 10px', background:'#2563EB', cursor:'pointer', color:'#fff', fontWeight:600 }}>
                              Decide
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </main>
      </div>
      {showDecision && (
        <DecisionModal approval={showDecision} onClose={() => setShowDecision(null)}
          onDecided={() => { setShowDecision(null); loadApprovals(); }} />
      )}
    </div>
  );
}