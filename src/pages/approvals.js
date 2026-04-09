import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { approvals, documents } from '../lib/api';

const statusBg    = { APPROVED:'#DCFCE7', PENDING:'#FEF9C3', REJECTED:'#FEE2E2', IN_PROGRESS:'#EDE9FE', CANCELLED:'#F1F5F9' };
const statusColor = { APPROVED:'#15803D', PENDING:'#A16207', REJECTED:'#DC2626', IN_PROGRESS:'#7C3AED', CANCELLED:'#64748B' };
const priorityBg  = { LOW:'#F1F5F9', NORMAL:'#DBEAFE', HIGH:'#FEF9C3', URGENT:'#FEE2E2' };
const priorityColor = { LOW:'#64748B', NORMAL:'#2563EB', HIGH:'#D97706', URGENT:'#DC2626' };

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
}

function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getFileType(fileName = '') {
  const ext = (fileName || '').split('.').pop().toUpperCase();
  return ['DWG','PDF','DOC','DOCX'].includes(ext) ? ext : 'FILE';
}

// ── Decision Modal ────────────────────────────────────────────
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
        <div style={{ fontSize:'12px', color:'#94A3B8', marginBottom:'20px' }}>📄 {approval.title}</div>

        <div style={{ marginBottom:'16px' }}>
          <label style={{ fontSize:'12px', fontWeight:600, color:'#475569', display:'block', marginBottom:'8px' }}>Decision</label>
          <div style={{ display:'flex', gap:'8px' }}>
            {[
              { value:'APPROVED', label:'✅ Approve', bg:'#DCFCE7', color:'#15803D', border:'#86EFAC' },
              { value:'REJECTED', label:'❌ Reject',  bg:'#FEE2E2', color:'#DC2626', border:'#FCA5A5' },
              { value:'REVISION_REQUIRED', label:'🔄 Revision', bg:'#FEF9C3', color:'#A16207', border:'#FDE047' },
            ].map(d => (
              <button key={d.value} onClick={() => setDecision(d.value)}
                style={{ flex:1, padding:'10px 8px', borderRadius:'8px', border:`2px solid ${decision === d.value ? d.border : '#E2E8F0'}`, background: decision === d.value ? d.bg : '#fff', color: decision === d.value ? d.color : '#475569', fontSize:'12px', fontWeight:600, cursor:'pointer' }}>
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

// ── Approval Detail Panel ─────────────────────────────────────
function ApprovalDetail({ approval, onClose, onDecide }) {
  const [decisionsHistory, setDecisionsHistory] = useState([]);
  const [doc, setDoc] = useState(null);

  useEffect(() => {
    if (approval) {
      approvals.decisions(approval.id).then(setDecisionsHistory).catch(() => {});
      if (approval.documentId) {
        documents.get(approval.documentId).then(setDoc).catch(() => {});
      }
    }
  }, [approval]);

  if (!approval) return null;

  const fType = doc ? getFileType(doc.fileName) : 'FILE';
  const typeColors = { DWG:'#DBEAFE', PDF:'#FEE2E2', DOC:'#DCFCE7', DOCX:'#DCFCE7', FILE:'#F1F5F9' };
  const typeText   = { DWG:'#1D4ED8', PDF:'#991B1B', DOC:'#166534', DOCX:'#166534', FILE:'#475569' };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
      <div style={{ background:'#fff', borderRadius:'14px', width:'540px', maxHeight:'85vh', overflow:'auto', boxShadow:'0 8px 40px rgba(0,0,0,0.15)' }}>
        <div style={{ padding:'24px 28px 16px', borderBottom:'1px solid #F1F5F9', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ fontSize:'16px', fontWeight:700, color:'#1E293B' }}>{approval.title}</div>
            <div style={{ fontSize:'12px', color:'#94A3B8', marginTop:'4px' }}>{approval.description || 'No description'}</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'#94A3B8', lineHeight:1 }}>×</button>
        </div>

        <div style={{ padding:'20px 28px' }}>

          {/* Document info */}
          {doc && (
            <div style={{ background:'#F8FAFC', borderRadius:'10px', padding:'14px', marginBottom:'20px', display:'flex', alignItems:'center', gap:'12px' }}>
              <span style={{ background: typeColors[fType], color: typeText[fType], fontSize:'11px', fontWeight:700, padding:'4px 8px', borderRadius:'6px' }}>{fType}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, color:'#1E293B', fontSize:'13px' }}>{doc.title || doc.fileName}</div>
                <div style={{ fontSize:'11px', color:'#94A3B8' }}>{doc.documentType} · v{doc.currentVersion} · {doc.discipline}</div>
              </div>
              <span style={{ background: statusBg[doc.status]||'#F1F5F9', color: statusColor[doc.status]||'#64748B', fontSize:'10px', fontWeight:600, padding:'2px 8px', borderRadius:'20px' }}>
                {doc.status}
              </span>
            </div>
          )}

          {/* Approval details */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'20px' }}>
            {[
              { label:'Status', value: <span style={{ background: statusBg[approval.status], color: statusColor[approval.status], fontSize:'11px', fontWeight:600, padding:'2px 10px', borderRadius:'20px' }}>{approval.status === 'IN_PROGRESS' ? 'In Review' : approval.status}</span> },
              { label:'Priority', value: <span style={{ background: priorityBg[approval.priority], color: priorityColor[approval.priority], fontSize:'11px', fontWeight:600, padding:'2px 10px', borderRadius:'20px' }}>{approval.priority || 'NORMAL'}</span> },
              { label:'Submitted', value: formatDate(approval.createdAt) },
              { label:'Due Date', value: formatDate(approval.dueDate) },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize:'11px', color:'#94A3B8', fontWeight:600, textTransform:'uppercase', marginBottom:'4px' }}>{label}</div>
                <div style={{ fontSize:'13px', color:'#1E293B' }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Review history */}
          <div style={{ marginBottom:'20px' }}>
            <div style={{ fontSize:'12px', fontWeight:700, color:'#94A3B8', textTransform:'uppercase', marginBottom:'10px' }}>Review History</div>
            {decisionsHistory.length === 0 ? (
              <div style={{ fontSize:'13px', color:'#94A3B8', fontStyle:'italic', padding:'12px', background:'#F8FAFC', borderRadius:'8px' }}>No decisions yet — waiting for review</div>
            ) : decisionsHistory.map((d, i) => (
              <div key={i} style={{ background:'#F8FAFC', borderRadius:'8px', padding:'12px', marginBottom:'8px', borderLeft:`3px solid ${d.decision === 'APPROVED' ? '#22C55E' : d.decision === 'REJECTED' ? '#EF4444' : '#F59E0B'}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                  <span style={{ fontSize:'12px', fontWeight:600, color: d.decision === 'APPROVED' ? '#15803D' : d.decision === 'REJECTED' ? '#DC2626' : '#A16207' }}>
                    {d.decision === 'APPROVED' ? '✅' : d.decision === 'REJECTED' ? '❌' : '🔄'} {d.decision}
                  </span>
                  <span style={{ fontSize:'11px', color:'#94A3B8' }}>{formatDate(d.decidedAt)}</span>
                </div>
                {d.comments && <div style={{ fontSize:'12px', color:'#475569', marginTop:'4px' }}>{d.comments}</div>}
              </div>
            ))}
          </div>

          {/* Action */}
          {(approval.status === 'PENDING' || approval.status === 'IN_PROGRESS') && (
            <button onClick={onDecide}
              style={{ width:'100%', padding:'10px', background:'#2563EB', color:'#fff', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>
              Submit My Decision
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────
export default function ApprovalsPage() {
  const { user, loading: authLoading, logout } = useAuth();
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

      // Fetch all related documents
      const uniqueDocIds = [...new Set(list.map(a => a.documentId).filter(Boolean))];
      const docEntries = await Promise.all(
        uniqueDocIds.map(id => documents.get(id).then(d => [id, d]).catch(() => [id, null]))
      );
      setDocMap(Object.fromEntries(docEntries));
    } catch (err) {
      console.error('Failed to load approvals:', err);
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
    <div style={{ fontFamily:'Arial,sans-serif', minHeight:'100vh', background:'#F8FAFC', display:'flex', flexDirection:'column' }}>

      {/* TOP BAR */}
      <header style={{ background:'#fff', borderBottom:'1px solid #E2E8F0', height:'52px', display:'flex', alignItems:'center', padding:'0 24px', gap:'16px', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ fontWeight:700, fontSize:'18px', letterSpacing:'2px', color:'#2563EB', cursor:'pointer' }} onClick={() => router.push('/')}>
          OR<span style={{ color:'#0EA5E9' }}>ARCH</span>
        </div>
        <nav style={{ display:'flex', gap:'4px', marginLeft:'12px' }}>
          {[
            { label:'Projects', path:'/projects' },
            { label:'Documents', path:'/' },
            { label:'Approvals', path:'/approvals' },
            { label:'Team', path:'/team' },
          ].map(item => (
            <button key={item.label} onClick={() => router.push(item.path)}
              style={{ padding:'6px 14px', borderRadius:'6px', border:'none', cursor:'pointer', fontSize:'13px', fontWeight:500, background: item.path==='/approvals' ? '#EFF6FF' : 'transparent', color: item.path==='/approvals' ? '#2563EB' : '#64748B' }}>
              {item.label}
            </button>
          ))}
        </nav>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:'12px' }}>
          <div style={{ width:'34px', height:'34px', borderRadius:'50%', background:'#2563EB', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:700, cursor:'pointer' }}
               title="Click to logout" onClick={logout}>
            {getInitials(`${user.firstName} ${user.lastName}`)}
          </div>
        </div>
      </header>

      <div style={{ padding:'24px', maxWidth:'1100px', margin:'0 auto', width:'100%', boxSizing:'border-box' }}>

        <div style={{ marginBottom:'20px' }}>
          <h1 style={{ fontSize:'20px', fontWeight:700, color:'#1E293B', margin:0 }}>Approvals</h1>
          <p style={{ fontSize:'13px', color:'#94A3B8', margin:'4px 0 0' }}>Review and approve construction documents</p>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px', marginBottom:'20px' }}>
          {[
            { label:'Pending', count:counts.PENDING, bg:'#FEF9C3', color:'#A16207', icon:'⏳' },
            { label:'In Review', count:counts.IN_PROGRESS, bg:'#EDE9FE', color:'#7C3AED', icon:'🔍' },
            { label:'Approved', count:counts.APPROVED, bg:'#DCFCE7', color:'#15803D', icon:'✅' },
            { label:'Rejected', count:counts.REJECTED, bg:'#FEE2E2', color:'#DC2626', icon:'❌' },
          ].map(s => (
            <div key={s.label} style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:'10px', padding:'16px', display:'flex', alignItems:'center', gap:'12px' }}>
              <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>{s.icon}</div>
              <div>
                <div style={{ fontSize:'22px', fontWeight:700, color:s.color }}>{s.count}</div>
                <div style={{ fontSize:'12px', color:'#94A3B8' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:'10px', overflow:'hidden' }}>
          <div style={{ display:'flex', borderBottom:'1px solid #E2E8F0', padding:'0 16px' }}>
            {['ALL','PENDING','IN_PROGRESS','APPROVED','REJECTED'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding:'12px 16px', border:'none', background:'none', cursor:'pointer', fontSize:'12px', fontWeight:600, color: filter === f ? '#2563EB' : '#64748B', borderBottom: filter === f ? '2px solid #2563EB' : '2px solid transparent', marginBottom:'-1px' }}>
                {f === 'IN_PROGRESS' ? 'In Review' : f.charAt(0) + f.slice(1).toLowerCase()}
                <span style={{ marginLeft:'6px', background: filter === f ? '#EFF6FF' : '#F1F5F9', color: filter === f ? '#2563EB' : '#94A3B8', fontSize:'10px', padding:'1px 6px', borderRadius:'10px' }}>
                  {counts[f]}
                </span>
              </button>
            ))}
          </div>

          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#F8FAFC' }}>
                {['Title', 'Document', 'Priority', 'Status', 'Submitted', 'Due Date', 'Action'].map(h => (
                  <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:'11px', fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding:'40px', textAlign:'center', color:'#94A3B8', fontSize:'13px' }}>Loading approvals...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding:'40px', textAlign:'center', color:'#94A3B8', fontSize:'13px' }}>
                  {filter === 'ALL' ? 'No approval requests yet' : `No ${filter.toLowerCase()} approvals`}
                </td></tr>
              ) : filtered.map((a) => {
                const doc = docMap[a.documentId];
                const fType = doc ? getFileType(doc.fileName) : null;
                const typeColors = { DWG:'#DBEAFE', PDF:'#FEE2E2', DOC:'#DCFCE7', DOCX:'#DCFCE7' };
                const typeText   = { DWG:'#1D4ED8', PDF:'#991B1B', DOC:'#166534', DOCX:'#166534' };
                return (
                  <tr key={a.id} style={{ borderTop:'1px solid #F1F5F9', cursor:'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding:'12px 16px' }}>
                      <div style={{ fontWeight:600, color:'#1E293B', fontSize:'13px' }}>{a.title}</div>
                      {a.description && <div style={{ fontSize:'11px', color:'#94A3B8', marginTop:'2px' }}>{a.description}</div>}
                    </td>
                    <td style={{ padding:'12px 16px' }}>
                      {doc ? (
                        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                          {fType && <span style={{ background: typeColors[fType]||'#F1F5F9', color: typeText[fType]||'#475569', fontSize:'10px', fontWeight:700, padding:'2px 6px', borderRadius:'4px' }}>{fType}</span>}
                          <span style={{ fontSize:'12px', color:'#475569', maxWidth:'150px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{doc.title || doc.fileName}</span>
                        </div>
                      ) : (
                        <span style={{ fontSize:'12px', color:'#94A3B8' }}>—</span>
                      )}
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
                    <td style={{ padding:'12px 16px', fontSize:'12px', color: a.dueDate && new Date(a.dueDate) < new Date() ? '#DC2626' : '#94A3B8' }}>
                      {formatDate(a.dueDate)}
                    </td>
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
      </div>

      {selectedApproval && (
        <ApprovalDetail
          approval={selectedApproval}
          onClose={() => setSelected(null)}
          onDecide={() => { setShowDecision(selectedApproval); setSelected(null); }}
        />
      )}
      {showDecision && (
        <DecisionModal
          approval={showDecision}
          onClose={() => setShowDecision(null)}
          onDecided={() => { setShowDecision(null); loadApprovals(); }}
        />
      )}
    </div>
  );
}
