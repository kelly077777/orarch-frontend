import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/router';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('orarch_token') : null; }

function DonutChart({ segments, total, label }) {
  if (total === 0) return (
    <div style={{ width:'120px', height:'120px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
      <div style={{ fontSize:'24px', fontWeight:700, color:'#1E293B' }}>0</div>
      <div style={{ fontSize:'11px', color:'#94A3B8' }}>{label}</div>
    </div>
  );
  let cumulative = 0;
  const r = 48, cx = 60, cy = 60;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
      <svg width="120" height="120" viewBox="0 0 120 120">
        {segments.filter(s => s.count > 0).map((s, i) => {
          const pct = s.count / total;
          const offset = circ * (1 - cumulative);
          cumulative += pct;
          return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth="20"
            strokeDasharray={`${circ * pct} ${circ * (1 - pct)}`}
            strokeDashoffset={offset} transform={`rotate(-90 ${cx} ${cy})`} />;
        })}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="18" fontWeight="700" fill="#1E293B">{total}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="9" fill="#94A3B8">{label}</text>
      </svg>
    </div>
  );
}

function SummaryDonutRow({ taskList }) {
  const completed = taskList.filter(t => t.status === 'COMPLETED').length;
  const open = taskList.filter(t => t.status === 'OPEN' || t.status === 'In Progress').length;
  const overdue = taskList.filter(t => t.status === 'OVERDUE' || (t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED')).length;
  const cancelled = taskList.filter(t => t.status === 'CANCELLED' || t.status === 'Canceled').length;
  const segments = [
    { label:'Completed', count: completed, color:'#16A34A' },
    { label:'Open', count: open, color:'#F59E0B' },
    { label:'Overdue', count: overdue, color:'#EF4444' },
    { label:'Canceled', count: cancelled, color:'#94A3B8' },
  ];
  const total = taskList.length;
  return (
    <div style={{ display:'flex', gap:'32px', alignItems:'center', background:'#fff', border:'1px solid #E2E8F0', borderRadius:'10px', padding:'20px', marginBottom:'20px' }}>
      <DonutChart segments={segments} total={total} label="Tasks" />
      <div style={{ display:'flex', gap:'24px' }}>
        {segments.map(s => (
          <div key={s.label} style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <span style={{ width:'10px', height:'10px', borderRadius:'50%', background:s.color, display:'inline-block' }} />
            <span style={{ fontSize:'12px', color:'#64748B' }}>{s.label}</span>
          </div>
        ))}
      </div>
      <div style={{ display:'flex', gap:'20px', marginLeft:'auto' }}>
        {[{ label:'Completed', count: completed, color:'#16A34A' }, { label:'Open', count: open, color:'#F59E0B' }, { label:'Overdue', count: overdue, color:'#EF4444' }, { label:'Canceled', count: cancelled, color:'#94A3B8' }].map(s => (
          <DonutChart key={s.label} segments={[{ ...s, count: s.count }, { count: total - s.count, color:'#F1F5F9' }]} total={total} label={s.label} />
        ))}
      </div>
    </div>
  );
}

function BarRow({ label, completed, open, overdue, cancelled, max }) {
  const total = completed + open + overdue + cancelled;
  return (
    <div style={{ display:'grid', gridTemplateColumns:'200px 80px 80px 80px 80px 1fr', gap:'8px', alignItems:'center', padding:'8px 0', borderBottom:'1px solid #F1F5F9' }}>
      <span style={{ fontSize:'13px', color:'#1E293B', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{label}</span>
      <span style={{ fontSize:'12px', color:'#16A34A', textAlign:'center' }}>{completed}</span>
      <span style={{ fontSize:'12px', color:'#F59E0B', textAlign:'center' }}>{open}</span>
      <span style={{ fontSize:'12px', color:'#EF4444', textAlign:'center' }}>{overdue}</span>
      <span style={{ fontSize:'12px', color:'#94A3B8', textAlign:'center' }}>{cancelled}</span>
      <div style={{ background:'#F1F5F9', borderRadius:'4px', height:'8px', display:'flex', overflow:'hidden' }}>
        {completed > 0 && <div style={{ background:'#16A34A', height:'8px', width:`${(completed/max)*100}%` }} />}
        {open > 0 && <div style={{ background:'#F59E0B', height:'8px', width:`${(open/max)*100}%` }} />}
        {overdue > 0 && <div style={{ background:'#EF4444', height:'8px', width:`${(overdue/max)*100}%` }} />}
        {cancelled > 0 && <div style={{ background:'#94A3B8', height:'8px', width:`${(cancelled/max)*100}%` }} />}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState('dashboard');
  const [docList, setDocList] = useState([]);
  const [taskList, setTaskList] = useState([]);
  const [folderList, setFolderList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!authLoading && !user) router.push('/login'); }, [user, authLoading]);
  useEffect(() => { if (user) loadData(); }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const headers = { Authorization: `Bearer ${token}` };
      const [docsRes, tasksRes, foldersRes] = await Promise.all([
        fetch(`${BASE_URL}/documents/all`, { headers }),
        fetch(`${BASE_URL}/tasks`, { headers }),
        fetch(`${BASE_URL}/folders/list/all`, { headers }).catch(() => ({ json: () => [] })),
      ]);
      const [docsData, tasksData] = await Promise.all([docsRes.json(), tasksRes.json()]);
      setDocList(Array.isArray(docsData) ? docsData : []);
      setTaskList(Array.isArray(tasksData) ? tasksData : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const exportToXLS = () => {
    if (!taskList.length && !docList.length) return alert('No data to export');
    const taskRows = taskList.map(t => `${t.title}\t${t.status}\t${t.priority}\t${t.assigneeName || ''}\t${t.dueDate || ''}`);
    const content = ['Title\tStatus\tPriority\tAssignee\tDue Date', ...taskRows].join('\n');
    const blob = new Blob([content], { type:'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'orarch247_report.xls'; a.click();
    URL.revokeObjectURL(url);
  };

  // By assignee
  const byAssignee = {};
  taskList.forEach(t => {
    const k = t.assigneeName || 'Unassigned';
    if (!byAssignee[k]) byAssignee[k] = { completed:0, open:0, overdue:0, cancelled:0 };
    if (t.status === 'COMPLETED') byAssignee[k].completed++;
    else if (t.status === 'OVERDUE') byAssignee[k].overdue++;
    else if (t.status === 'CANCELLED') byAssignee[k].cancelled++;
    else byAssignee[k].open++;
  });
  const assigneeRows = Object.entries(byAssignee).sort((a,b) => (b[1].completed+b[1].open) - (a[1].completed+a[1].open));
  const maxAssignee = Math.max(...assigneeRows.map(([,v]) => v.completed+v.open+v.overdue+v.cancelled), 1);

  // By priority
  const byPriority = {};
  taskList.forEach(t => {
    const k = t.priority || 'MEDIUM';
    if (!byPriority[k]) byPriority[k] = { completed:0, open:0, overdue:0, cancelled:0 };
    if (t.status === 'COMPLETED') byPriority[k].completed++;
    else if (t.status === 'OVERDUE') byPriority[k].overdue++;
    else if (t.status === 'CANCELLED') byPriority[k].cancelled++;
    else byPriority[k].open++;
  });
  const priorityRows = Object.entries(byPriority);
  const maxPriority = Math.max(...priorityRows.map(([,v]) => v.completed+v.open+v.overdue+v.cancelled), 1);

  // Doc stats
  const statusColors = { DRAFT:'#94A3B8', IN_REVIEW:'#7C3AED', APPROVED:'#16A34A', REJECTED:'#DC2626', PENDING:'#D97706' };
  const docSegments = ['DRAFT','IN_REVIEW','APPROVED','REJECTED','PENDING'].map(s => ({
    label: s.replace('_',' '), count: docList.filter(d => d.status === s).length, color: statusColors[s]
  }));

  // Folder stats
  const folderStats = folderList.map(f => ({
    name: `${f.name}${f.code ? ` (${f.code})` : ''}`,
    items: docList.filter(d => d.folderId === f.id).length,
    owned: docList.filter(d => d.folderId === f.id && d.uploadedBy === user?.id).length,
    size: docList.filter(d => d.folderId === f.id).reduce((s, d) => s + (d.fileSize || 0), 0),
  }));

  function formatSize(bytes) {
    if (!bytes) return '0 B';
    if (bytes > 1024*1024*1024) return `${(bytes/1024/1024/1024).toFixed(1)} GB`;
    if (bytes > 1024*1024) return `${(bytes/1024/1024).toFixed(1)} MB`;
    if (bytes > 1024) return `${(bytes/1024).toFixed(0)} KB`;
    return `${bytes} B`;
  }

  const tabs = [
    { key:'dashboard', label:'Dashboard' },
    { key:'byUser', label:'By User' },
    { key:'byPriority', label:'By Priority' },
    { key:'documents', label:'Documents' },
    { key:'byFolder', label:'By Folder' },
  ];

  if (authLoading || !user) return null;

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', fontFamily:'Arial, sans-serif' }}>
      <Topbar />
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        <Sidebar />
        <main style={{ flex:1, background:'#F8FAFC', overflow:'hidden', display:'flex', flexDirection:'column' }}>
          {/* Header */}
          <div style={{ background:'#fff', borderBottom:'1px solid #E2E8F0', padding:'12px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', gap:'4px' }}>
              {tabs.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  style={{ padding:'6px 16px', border:'none', borderRadius:'6px', fontSize:'12px', fontWeight:600, cursor:'pointer', background: tab===t.key ? '#2563EB' : 'transparent', color: tab===t.key ? '#fff' : '#64748B' }}>
                  {t.label}
                </button>
              ))}
            </div>
            <button onClick={exportToXLS}
              style={{ background:'#16A34A', color:'#fff', border:'none', borderRadius:'8px', padding:'8px 16px', fontSize:'13px', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:'6px' }}>
              Export to .xls
            </button>
          </div>

          <div style={{ flex:1, overflowY:'auto', padding:'24px' }}>
            {loading ? (
              <div style={{ textAlign:'center', padding:'60px', color:'#94A3B8' }}>Loading reports...</div>
            ) : (
              <>
                {/* Dashboard */}
                {tab === 'dashboard' && (
                  <div>
                    <div style={{ fontSize:'13px', fontWeight:700, color:'#1E293B', marginBottom:'12px' }}>Summary</div>
                    <SummaryDonutRow taskList={taskList} />
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px' }}>
                      <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:'10px', padding:'20px' }}>
                        <div style={{ fontSize:'13px', fontWeight:700, color:'#1E293B', marginBottom:'16px' }}>Top tasks by user</div>
                        <div style={{ display:'grid', gridTemplateColumns:'200px 80px 80px 80px 80px 1fr', gap:'8px', marginBottom:'8px' }}>
                          {['','Completed','Open','Overdue','Canceled',''].map((h,i) => (
                            <span key={i} style={{ fontSize:'10px', fontWeight:700, color:'#94A3B8', textAlign:'center' }}>{h}</span>
                          ))}
                        </div>
                        {assigneeRows.slice(0,6).map(([name, v]) => (
                          <BarRow key={name} label={name} completed={v.completed} open={v.open} overdue={v.overdue} cancelled={v.cancelled} max={maxAssignee} />
                        ))}
                        {assigneeRows.length === 0 && <div style={{ fontSize:'13px', color:'#94A3B8' }}>No tasks yet</div>}
                      </div>
                      <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:'10px', padding:'20px' }}>
                        <div style={{ fontSize:'13px', fontWeight:700, color:'#1E293B', marginBottom:'16px' }}>Top tasks by priority</div>
                        <div style={{ display:'grid', gridTemplateColumns:'200px 80px 80px 80px 80px 1fr', gap:'8px', marginBottom:'8px' }}>
                          {['','Completed','Open','Overdue','Canceled',''].map((h,i) => (
                            <span key={i} style={{ fontSize:'10px', fontWeight:700, color:'#94A3B8', textAlign:'center' }}>{h}</span>
                          ))}
                        </div>
                        {priorityRows.map(([name, v]) => (
                          <BarRow key={name} label={name} completed={v.completed} open={v.open} overdue={v.overdue} cancelled={v.cancelled} max={maxPriority} />
                        ))}
                        {priorityRows.length === 0 && <div style={{ fontSize:'13px', color:'#94A3B8' }}>No tasks yet</div>}
                      </div>
                    </div>
                  </div>
                )}

                {/* By User */}
                {tab === 'byUser' && (
                  <div>
                    <SummaryDonutRow taskList={taskList} />
                    <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:'10px', padding:'20px' }}>
                      <div style={{ fontSize:'13px', fontWeight:700, color:'#1E293B', marginBottom:'16px' }}>Tasks by user</div>
                      <div style={{ display:'grid', gridTemplateColumns:'200px 80px 80px 80px 80px 1fr', gap:'8px', marginBottom:'8px' }}>
                        {['User','Completed','Open','Overdue','Canceled',''].map((h,i) => (
                          <span key={i} style={{ fontSize:'10px', fontWeight:700, color:'#94A3B8', textAlign: i===0?'left':'center' }}>{h}</span>
                        ))}
                      </div>
                      {assigneeRows.map(([name, v]) => (
                        <BarRow key={name} label={name} completed={v.completed} open={v.open} overdue={v.overdue} cancelled={v.cancelled} max={maxAssignee} />
                      ))}
                      {assigneeRows.length === 0 && <div style={{ fontSize:'13px', color:'#94A3B8' }}>No tasks yet</div>}
                    </div>
                  </div>
                )}

                {/* By Priority */}
                {tab === 'byPriority' && (
                  <div>
                    <SummaryDonutRow taskList={taskList} />
                    <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:'10px', padding:'20px' }}>
                      <div style={{ fontSize:'13px', fontWeight:700, color:'#1E293B', marginBottom:'16px' }}>Tasks by priority</div>
                      <div style={{ display:'grid', gridTemplateColumns:'200px 80px 80px 80px 80px 1fr', gap:'8px', marginBottom:'8px' }}>
                        {['Priority','Completed','Open','Overdue','Canceled',''].map((h,i) => (
                          <span key={i} style={{ fontSize:'10px', fontWeight:700, color:'#94A3B8', textAlign: i===0?'left':'center' }}>{h}</span>
                        ))}
                      </div>
                      {priorityRows.map(([name, v]) => (
                        <BarRow key={name} label={name} completed={v.completed} open={v.open} overdue={v.overdue} cancelled={v.cancelled} max={maxPriority} />
                      ))}
                      {priorityRows.length === 0 && <div style={{ fontSize:'13px', color:'#94A3B8' }}>No tasks yet</div>}
                    </div>
                  </div>
                )}

                {/* Documents */}
                {tab === 'documents' && (
                  <div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'14px', marginBottom:'24px' }}>
                      {docSegments.map(d => (
                        <div key={d.label} style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:'10px', padding:'16px' }}>
                          <div style={{ fontSize:'28px', fontWeight:700, color:d.color }}>{d.count}</div>
                          <div style={{ fontSize:'12px', color:'#64748B', marginTop:'4px' }}>{d.label}</div>
                          <div style={{ fontSize:'11px', color:'#94A3B8', marginTop:'2px' }}>{docList.length ? Math.round(d.count/docList.length*100) : 0}% of total</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:'10px', overflow:'hidden' }}>
                      <table style={{ width:'100%', borderCollapse:'collapse' }}>
                        <thead>
                          <tr style={{ background:'#F8FAFC', borderBottom:'1px solid #E2E8F0' }}>
                            {['File Name','Type','Status','Date'].map(h => (
                              <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:'11px', fontWeight:700, color:'#94A3B8', textTransform:'uppercase' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {docList.length === 0 && <tr><td colSpan={4} style={{ padding:'24px', textAlign:'center', color:'#94A3B8' }}>No documents yet</td></tr>}
                          {docList.slice(0,15).map((d,i) => (
                            <tr key={d.id} style={{ borderBottom: i<docList.length-1 ? '1px solid #F1F5F9' : 'none' }}>
                              <td style={{ padding:'10px 14px', fontSize:'13px', color:'#1E293B', fontWeight:500 }}>{d.title || d.fileName}</td>
                              <td style={{ padding:'10px 14px', fontSize:'12px', color:'#64748B' }}>{d.documentType || '—'}</td>
                              <td style={{ padding:'10px 14px' }}>
                                <span style={{ fontSize:'11px', fontWeight:600, padding:'2px 8px', borderRadius:'12px', background: statusColors[d.status] ? statusColors[d.status]+'20' : '#F1F5F9', color: statusColors[d.status] || '#64748B' }}>
                                  {d.status}
                                </span>
                              </td>
                              <td style={{ padding:'10px 14px', fontSize:'12px', color:'#94A3B8' }}>{d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* By Folder */}
                {tab === 'byFolder' && (
                  <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:'10px', overflow:'hidden' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse' }}>
                      <thead>
                        <tr style={{ background:'#F8FAFC', borderBottom:'1px solid #E2E8F0' }}>
                          {['Folder','Items','Owned Items','Size'].map(h => (
                            <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:'11px', fontWeight:700, color:'#94A3B8', textTransform:'uppercase' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {folderStats.length === 0 && (
                          <tr><td colSpan={4} style={{ padding:'24px', textAlign:'center', color:'#94A3B8' }}>No folders yet</td></tr>
                        )}
                        {folderStats.map((f,i) => (
                          <tr key={i} style={{ borderBottom: i<folderStats.length-1 ? '1px solid #F1F5F9' : 'none' }}>
                            <td style={{ padding:'12px 14px', fontSize:'13px', fontWeight:500, color:'#1E293B' }}>📂 {f.name}</td>
                            <td style={{ padding:'12px 14px', fontSize:'13px', color:'#64748B' }}>{f.items}</td>
                            <td style={{ padding:'12px 14px', fontSize:'13px', color:'#64748B' }}>{f.owned}</td>
                            <td style={{ padding:'12px 14px', fontSize:'13px', color:'#64748B' }}>{formatSize(f.size)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
