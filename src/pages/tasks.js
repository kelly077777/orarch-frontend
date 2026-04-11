import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const mockTasks = [
];

const statusColor = { Open: '#2563EB', Overdue: '#DC2626', Completed: '#16A34A', Canceled: '#94A3B8' };
const priorityColor = { High: '#FEE2E2', Medium: '#FEF3C7', Low: '#F0FDF4' };
const priorityText = { High: '#DC2626', Medium: '#D97706', Low: '#16A34A' };

export default function TasksPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <Topbar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <main style={{ flex: 1, background: '#F8FAFC', padding: '24px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1E293B', margin: 0 }}>Tasks</h1>
              <p style={{ fontSize: '12px', color: '#94A3B8', margin: '4px 0 0' }}>Track and manage assigned tasks</p>
            </div>
            <button style={{ background: '#2563EB', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              + New Task
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
            {[
              { label: 'Open', count: mockTasks.filter(t => t.status === 'Open').length, color: '#2563EB' },
              { label: 'Overdue', count: mockTasks.filter(t => t.status === 'Overdue').length, color: '#DC2626' },
              { label: 'Completed', count: mockTasks.filter(t => t.status === 'Completed').length, color: '#16A34A' },
              { label: 'Canceled', count: mockTasks.filter(t => t.status === 'Canceled').length, color: '#94A3B8' },
            ].map(s => (
              <div key={s.label} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: s.color }}>{s.count}</div>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  {['Task', 'Project', 'Assignee', 'Due Date', 'Priority', 'Status'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', fontSize: '11px', fontWeight: 700, color: '#94A3B8', textAlign: 'left', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mockTasks.map((task, i) => (
                  <tr key={task.id} style={{ borderBottom: i < mockTasks.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                    <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 500, color: '#1E293B' }}>{task.title}</td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: '#64748B' }}>{task.project}</td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: '#64748B' }}>{task.assignee}</td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: '#64748B' }}>{task.due}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ background: priorityColor[task.priority], color: priorityText[task.priority], fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px' }}>{task.priority}</span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ color: statusColor[task.status], fontSize: '12px', fontWeight: 600 }}>● {task.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}