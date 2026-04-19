import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { tasks, projects } from '../lib/api';
import Topbar from '../components/Topbar';
import Sidebar from '../components/Sidebar';

const statusColor = { Open: '#2563EB', 'In Progress': '#7C3AED', Overdue: '#DC2626', Completed: '#16A34A', Canceled: '#94A3B8' };
const priorityColor = { High: '#FEE2E2', Medium: '#FEF3C7', Low: '#F0FDF4' };
const priorityText = { High: '#DC2626', Medium: '#D97706', Low: '#16A34A' };

function TaskModal({ onClose, onSaved, projectList }) {
  const [form, setForm] = useState({ title: '', description: '', projectId: '', assigneeName: '', priority: 'Medium', dueDate: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!form.title) { setError('Title is required'); return; }
    setLoading(true);
    try {
      await tasks.create(form);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
      <div style={{ background:'#fff', borderRadius:'14px', padding:'28px', width:'440px', boxShadow:'0 8px 40px rgba(0,0,0,0.15)' }}>
        <div style={{ fontSize:'16px', fontWeight:700, color:'#1E293B', marginBottom:'20px' }}>New Task</div>
        {[
          { label:'Title', key:'title', type:'text', placeholder:'Task title' },
          { label:'Assignee', key:'assigneeName', type:'text', placeholder:'Name of assignee' },
          { label:'Due Date', key:'dueDate', type:'date', placeholder:'' },
        ].map(({ label, key, type, placeholder }) => (
          <div key={key} style={{ marginBottom:'12px' }}>
            <label style={{ fontSize:'12px', fontWeight:600, color:'#475569', display:'block', marginBottom:'4px' }}>{label}</label>
            <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder}
              style={{ width:'100%', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', outline:'none', boxSizing:'border-box' }} />
          </div>
        ))}
        <div style={{ marginBottom:'12px' }}>
          <label style={{ fontSize:'12px', fontWeight:600, color:'#475569', display:'block', marginBottom:'4px' }}>Project</label>
          <select value={form.projectId} onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))}
            style={{ width:'100%', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', background:'#fff' }}>
            <option value=''>No project</option>
            {projectList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div style={{ marginBottom:'20px' }}>
          <label style={{ fontSize:'12px', fontWeight:600, color:'#475569', display:'block', marginBottom:'4px' }}>Priority</label>
          <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
            style={{ width:'100%', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', background:'#fff' }}>
            {['Low','Medium','High'].map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        {error && <div style={{ background:'#FEE2E2', color:'#DC2626', fontSize:'12px', padding:'8px 12px', borderRadius:'6px', marginBottom:'12px' }}>{error}</div>}
        <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'8px 18px', border:'1px solid #E2E8F0', borderRadius:'8px', background:'#fff', fontSize:'13px', cursor:'pointer', color:'#475569' }}>Cancel</button>
          <button onClick={handleSave} disabled={loading}
            style={{ padding:'8px 20px', border:'none', borderRadius:'8px', background: loading ? '#93C5FD' : '#2563EB', color:'#fff', fontSize:'13px', fontWeight:600, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Saving...' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [taskList, setTaskList] = useState([]);
  const [projectList, setProjectList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading]);

  useEffect(() => {
    if (user) { loadTasks(); loadProjects(); }
  }, [user]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await tasks.list();
      setTaskList(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadProjects = async () => {
    try {
      const data = await projects.list();
      setProjectList(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
  };

  const counts = {
    Open: taskList.filter(t => t.status === 'Open').length,
    Overdue: taskList.filter(t => t.status === 'Overdue').length,
    Completed: taskList.filter(t => t.status === 'Completed').length,
    Canceled: taskList.filter(t => t.status === 'Canceled').length,
  };

  if (authLoading) return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#94A3B8' }}>Loading...</div>;
  if (!user) return null;

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', fontFamily:'Arial,sans-serif' }}>
      <Topbar />
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        <Sidebar />
        <main style={{ flex:1, background:'#F8FAFC', padding:'24px', overflowY:'auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
            <div>
              <h1 style={{ fontSize:'18px', fontWeight:700, color:'#1E293B', margin:0 }}>Tasks</h1>
              <p style={{ fontSize:'12px', color:'#94A3B8', margin:'4px 0 0' }}>Track and manage assigned tasks</p>
            </div>
            <button onClick={() => setShowNew(true)}
              style={{ background:'#2563EB', color:'#fff', border:'none', borderRadius:'8px', padding:'8px 16px', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>
              + New Task
            </button>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'12px', marginBottom:'20px' }}>
            {[
              { label:'Open', count:counts.Open, color:'#2563EB' },
              { label:'Overdue', count:counts.Overdue, color:'#DC2626' },
              { label:'Completed', count:counts.Completed, color:'#16A34A' },
              { label:'Canceled', count:counts.Canceled, color:'#94A3B8' },
            ].map(s => (
              <div key={s.label} style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:'10px', padding:'16px', textAlign:'center' }}>
                <div style={{ fontSize:'24px', fontWeight:700, color:s.color }}>{s.count}</div>
                <div style={{ fontSize:'12px', color:'#64748B', marginTop:'4px' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:'10px', overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#F8FAFC', borderBottom:'1px solid #E2E8F0' }}>
                  {['Task','Project','Assignee','Due Date','Priority','Status'].map(h => (
                    <th key={h} style={{ padding:'10px 14px', fontSize:'11px', fontWeight:700, color:'#94A3B8', textAlign:'left', textTransform:'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ padding:'32px', textAlign:'center', color:'#94A3B8' }}>Loading tasks...</td></tr>
                ) : taskList.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding:'32px', textAlign:'center', color:'#94A3B8' }}>No tasks yet — click + New Task to create one</td></tr>
                ) : taskList.map((task, i) => (
                  <tr key={task.id} style={{ borderBottom: i < taskList.length-1 ? '1px solid #F1F5F9' : 'none' }}>
                    <td style={{ padding:'12px 14px', fontSize:'13px', fontWeight:500, color:'#1E293B' }}>{task.title}</td>
                    <td style={{ padding:'12px 14px', fontSize:'12px', color:'#64748B' }}>{task.projectId || '—'}</td>
                    <td style={{ padding:'12px 14px', fontSize:'12px', color:'#64748B' }}>{task.assigneeName || '—'}</td>
                    <td style={{ padding:'12px 14px', fontSize:'12px', color:'#64748B' }}>{task.dueDate || '—'}</td>
                    <td style={{ padding:'12px 14px' }}>
                      <span style={{ background: priorityColor[task.priority]||'#F1F5F9', color: priorityText[task.priority]||'#64748B', fontSize:'11px', fontWeight:600, padding:'2px 8px', borderRadius:'4px' }}>
                        {task.priority || '—'}
                      </span>
                    </td>
                    <td style={{ padding:'12px 14px' }}>
                      <span style={{ color: statusColor[task.status]||'#64748B', fontSize:'12px', fontWeight:600 }}>● {task.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
      {showNew && <TaskModal onClose={() => setShowNew(false)} onSaved={loadTasks} projectList={projectList} />}
    </div>
  );
}