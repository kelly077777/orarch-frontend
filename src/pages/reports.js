import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const taskData = [
  { label: 'Completed', count: 12, color: '#16A34A' },
  { label: 'Open', count: 8, color: '#2563EB' },
  { label: 'Overdue', count: 3, color: '#DC2626' },
  { label: 'Canceled', count: 2, color: '#94A3B8' },
];

const topByRole = [
  { role: 'Project Manager', tasks: 10 },
  { role: 'Contractor', tasks: 7 },
  { role: 'Architect', tasks: 5 },
  { role: 'Engineer', tasks: 3 },
];

const topByUser = [
  { user: 'John Doe', tasks: 8 },
  { user: 'Jane Smith', tasks: 6 },
  { user: 'Paul Mugisha', tasks: 5 },
  { user: 'Alice Uwera', tasks: 4 },
  { user: 'Robert Nkusi', tasks: 2 },
];

const folderStats = [
  { folder: 'Architectural', items: 24, owned: 10, inFolders: 36, size: '128 MB' },
  { folder: 'Structural', items: 18, owned: 8, inFolders: 22, size: '94 MB' },
  { folder: 'MEP', items: 12, owned: 5, inFolders: 15, size: '47 MB' },
  { folder: 'Contracts', items: 8, owned: 8, inFolders: 8, size: '12 MB' },
  { folder: 'Permits', items: 6, owned: 3, inFolders: 9, size: '8 MB' },
  { folder: 'Reports', items: 4, owned: 4, inFolders: 4, size: '5 MB' },
];

const total = taskData.reduce((s, t) => s + t.count, 0);

function DonutChart({ data, total }) {
  let cumulative = 0;
  const radius = 60;
  const cx = 80;
  const cy = 80;
  const circumference = 2 * Math.PI * radius;

  return (
    <svg width="160" height="160" viewBox="0 0 160 160">
      {data.map((d, i) => {
        const pct = d.count / total;
        const offset = circumference * (1 - cumulative);
        cumulative += pct;
        return (
          <circle key={i} cx={cx} cy={cy} r={radius}
            fill="none" stroke={d.color} strokeWidth="28"
            strokeDasharray={`${circumference * pct} ${circumference * (1 - pct)}`}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        );
      })}
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="20" fontWeight="700" fill="#1E293B">{total}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="10" fill="#94A3B8">Total Tasks</text>
    </svg>
  );
}

function exportToCSV() {
  const headers = ['Folder', 'Items', 'Owned Items', 'Items in Folders', 'Size'];
  const rows = folderStats.map(f => [f.folder, f.items, f.owned, f.inFolders, f.size]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'orarch247_report.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [tab, setTab] = useState('overview');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <Topbar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <main style={{ flex: 1, background: '#F8FAFC', padding: '24px', overflowY: 'auto' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1E293B', margin: 0 }}>Reports</h1>
              <p style={{ fontSize: '12px', color: '#94A3B8', margin: '4px 0 0' }}>Project performance and analytics</p>
            </div>
            <button onClick={exportToCSV}
              style={{ background: '#16A34A', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              Export to CSV
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '4px', width: 'fit-content' }}>
            {['overview', 'by role', 'by user', 'folders'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ padding: '6px 16px', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', background: tab === t ? '#2563EB' : 'transparent', color: tab === t ? '#fff' : '#64748B', textTransform: 'capitalize' }}>
                {t}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {tab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '20px', alignItems: 'start' }}>
              <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#1E293B', marginBottom: '12px' }}>Task Distribution</div>
                <DonutChart data={taskData} total={total} />
                <div style={{ marginTop: '12px', width: '100%' }}>
                  {taskData.map(d => (
                    <div key={d.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: d.color, display: 'inline-block' }} />
                        <span style={{ fontSize: '12px', color: '#64748B' }}>{d.label}</span>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#1E293B' }}>{d.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                {taskData.map(d => (
                  <div key={d.label} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '20px' }}>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: d.color }}>{d.count}</div>
                    <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>{d.label} Tasks</div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>{Math.round(d.count / total * 100)}% of total</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* By Role Tab */}
          {tab === 'by role' && (
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', marginBottom: '16px' }}>Top Tasks by Role</div>
              {topByRole.map((r, i) => (
                <div key={r.role} style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', color: '#1E293B' }}>{r.role}</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#2563EB' }}>{r.tasks} tasks</span>
                  </div>
                  <div style={{ background: '#F1F5F9', borderRadius: '4px', height: '8px' }}>
                    <div style={{ background: '#2563EB', borderRadius: '4px', height: '8px', width: `${(r.tasks / topByRole[0].tasks) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* By User Tab */}
          {tab === 'by user' && (
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', marginBottom: '16px' }}>Top Tasks by User</div>
              {topByUser.map((u) => (
                <div key={u.user} style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', color: '#1E293B' }}>{u.user}</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#0EA5E9' }}>{u.tasks} tasks</span>
                  </div>
                  <div style={{ background: '#F1F5F9', borderRadius: '4px', height: '8px' }}>
                    <div style={{ background: '#0EA5E9', borderRadius: '4px', height: '8px', width: `${(u.tasks / topByUser[0].tasks) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Folders Tab */}
          {tab === 'folders' && (
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    {['Folder', 'Items', 'Owned Items', 'Items in Folders', 'Size'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', fontSize: '11px', fontWeight: 700, color: '#94A3B8', textAlign: 'left', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {folderStats.map((f, i) => (
                    <tr key={f.folder} style={{ borderBottom: i < folderStats.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                      <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 500, color: '#1E293B' }}>📂 {f.folder}</td>
                      <td style={{ padding: '12px 14px', fontSize: '13px', color: '#64748B' }}>{f.items}</td>
                      <td style={{ padding: '12px 14px', fontSize: '13px', color: '#64748B' }}>{f.owned}</td>
                      <td style={{ padding: '12px 14px', fontSize: '13px', color: '#64748B' }}>{f.inFolders}</td>
                      <td style={{ padding: '12px 14px', fontSize: '13px', color: '#64748B' }}>{f.size}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}