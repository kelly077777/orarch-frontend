import { useState } from 'react';
import { useRouter } from 'next/router';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const tabs = ['Info', 'Communication', 'Metadata', 'Workflows', 'Attachments', 'Versions', 'History'];

const mockDoc = {
  name: 'Ground Floor Plan - Rev C',
  type: 'DRAWING',
  discipline: 'Architectural',
  version: 'Rev C',
  size: '4.2 MB',
  date: '2026-04-09',
  author: 'John Doe',
  project: 'Kigali Heights Tower',
};

const mockComments = [
  { id: 1, user: 'Jane Smith', text: 'Please update the staircase dimensions.', time: '10:30 AM' },
  { id: 2, user: 'Paul Mugisha', text: 'Approved for structural review.', time: '11:45 AM' },
];

const mockVersions = [
  { version: 'Rev C', date: '2026-04-09', author: 'John Doe', note: 'Updated staircase' },
  { version: 'Rev B', date: '2026-03-20', author: 'John Doe', note: 'Added dimensions' },
  { version: 'Rev A', date: '2026-03-01', author: 'Alice Uwera', note: 'Initial upload' },
];

const mockHistory = [
  { action: 'Downloaded', user: 'Jane Smith', time: '2026-04-09 11:00' },
  { action: 'Viewed', user: 'Paul Mugisha', time: '2026-04-09 10:50' },
  { action: 'Uploaded Rev C', user: 'John Doe', time: '2026-04-09 09:30' },
  { action: 'Approved', user: 'Elon Admin', time: '2026-03-21 14:00' },
];

const mockAttachments = [
  { name: 'Site_Photo_001.jpg', size: '2.1 MB' },
  { name: 'Calculation_Sheet.pdf', size: '540 KB' },
];

const mockWorkflows = [
  { step: 'Draft', status: 'Completed', user: 'John Doe', date: '2026-03-01' },
  { step: 'Review', status: 'Completed', user: 'Jane Smith', date: '2026-03-20' },
  { step: 'Approval', status: 'In Progress', user: 'Elon Admin', date: '-' },
  { step: 'Issued', status: 'Pending', user: '-', date: '-' },
];

const workflowColor = { Completed: '#16A34A', 'In Progress': '#2563EB', Pending: '#94A3B8' };

export default function DocumentDetailPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Info');
  const [message, setMessage] = useState('');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <Topbar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <main style={{ flex: 1, display: 'flex', overflow: 'hidden', background: '#F8FAFC' }}>

          {/* Document Preview Area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Toolbar */}
            <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span onClick={() => router.back()} style={{ cursor: 'pointer', color: '#64748B', fontSize: '13px' }}>← Back</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>{mockDoc.name}</span>
                <span style={{ background: '#EFF6FF', color: '#2563EB', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px' }}>{mockDoc.version}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={{ background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '6px', padding: '7px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                  ← Prev
                </button>
                <button style={{ background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '6px', padding: '7px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                  Next →
                </button>
                <button style={{ background: '#2563EB', color: '#fff', border: 'none', borderRadius: '6px', padding: '7px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                  Download
                </button>
                <button style={{ background: '#0EA5E9', color: '#fff', border: 'none', borderRadius: '6px', padding: '7px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                  Open in Viewer
                </button>
              </div>
            </div>

            {/* Preview */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#E2E8F0', overflow: 'hidden' }}>
              <div style={{ background: '#fff', width: '70%', height: '80%', borderRadius: '8px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '48px' }}>📐</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B' }}>{mockDoc.name}</div>
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>{mockDoc.type} · {mockDoc.discipline} · {mockDoc.size}</div>
                <button style={{ background: '#2563EB', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginTop: '8px' }}>
                  Open in Viewer
                </button>
              </div>
            </div>
          </div>

          {/* Side Panel */}
          <div style={{ width: '320px', background: '#fff', borderLeft: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', overflowX: 'auto', borderBottom: '1px solid #E2E8F0', padding: '0 8px' }}>
              {tabs.map(t => (
                <button key={t} onClick={() => setActiveTab(t)}
                  style={{ padding: '10px 12px', border: 'none', borderBottom: activeTab === t ? '2px solid #2563EB' : '2px solid transparent', background: 'transparent', fontSize: '12px', fontWeight: activeTab === t ? 700 : 400, color: activeTab === t ? '#2563EB' : '#64748B', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {t}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

              {activeTab === 'Info' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { label: 'Document Name', value: mockDoc.name },
                    { label: 'Type', value: mockDoc.type },
                    { label: 'Discipline', value: mockDoc.discipline },
                    { label: 'Version', value: mockDoc.version },
                    { label: 'File Size', value: mockDoc.size },
                    { label: 'Upload Date', value: mockDoc.date },
                    { label: 'Author', value: mockDoc.author },
                    { label: 'Project', value: mockDoc.project },
                  ].map(item => (
                    <div key={item.label}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '2px' }}>{item.label}</div>
                      <div style={{ fontSize: '13px', color: '#1E293B' }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'Communication' && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
                    {mockComments.map(c => (
                      <div key={c.id} style={{ background: '#F8FAFC', borderRadius: '8px', padding: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#1E293B' }}>{c.user}</span>
                          <span style={{ fontSize: '11px', color: '#94A3B8' }}>{c.time}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#475569' }}>{c.text}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input value={message} onChange={e => setMessage(e.target.value)}
                      placeholder="Write a comment..."
                      style={{ flex: 1, border: '1px solid #E2E8F0', borderRadius: '6px', padding: '8px 10px', fontSize: '12px', outline: 'none' }}
                    />
                    <button onClick={() => setMessage('')}
                      style={{ background: '#2563EB', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 12px', fontSize: '12px', cursor: 'pointer' }}>
                      Send
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'Metadata' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { label: 'Format', value: 'PDF / DWG' },
                    { label: 'Resolution', value: '300 DPI' },
                    { label: 'Pages', value: '4' },
                    { label: 'Language', value: 'English' },
                    { label: 'Classification', value: 'Confidential' },
                    { label: 'Tags', value: 'floor plan, ground, architecture' },
                  ].map(item => (
                    <div key={item.label}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '2px' }}>{item.label}</div>
                      <div style={{ fontSize: '13px', color: '#1E293B' }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'Workflows' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {mockWorkflows.map((w, i) => (
                    <div key={w.step} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: workflowColor[w.status], marginTop: '3px' }} />
                        {i < mockWorkflows.length - 1 && <div style={{ width: '2px', height: '30px', background: '#E2E8F0', marginTop: '4px' }} />}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>{w.step}</div>
                        <div style={{ fontSize: '11px', color: workflowColor[w.status], fontWeight: 600 }}>{w.status}</div>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>{w.user} · {w.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'Attachments' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {mockAttachments.map(a => (
                    <div key={a.name} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#1E293B' }}>📎 {a.name}</div>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>{a.size}</div>
                      </div>
                      <button style={{ background: '#EFF6FF', color: '#2563EB', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                        Download
                      </button>
                    </div>
                  ))}
                  <button style={{ background: '#F1F5F9', color: '#475569', border: '1px dashed #CBD5E1', borderRadius: '8px', padding: '10px', fontSize: '12px', cursor: 'pointer', marginTop: '4px' }}>
                    + Add Attachment
                  </button>
                </div>
              )}

              {activeTab === 'Versions' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {mockVersions.map(v => (
                    <div key={v.version} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>{v.version}</span>
                        <span style={{ fontSize: '11px', color: '#94A3B8' }}>{v.date}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>by {v.author}</div>
                      <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>{v.note}</div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'History' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {mockHistory.map((h, i) => (
                    <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', paddingBottom: '8px', borderBottom: i < mockHistory.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563EB', marginTop: '4px', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#1E293B' }}>{h.action}</div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>{h.user}</div>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>{h.time}</div>
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