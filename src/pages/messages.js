import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const mockConversations = [
 
];

const mockMessages = [
  
];

export default function MessagesPage() {
  const [active, setActive] = useState(mockConversations[0]);
  const [input, setInput] = useState('');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <Topbar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Conversations list */}
          <div style={{ width: '260px', borderRight: '1px solid #E2E8F0', background: '#fff', overflowY: 'auto' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #E2E8F0', fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>Messages</div>
            {mockConversations.map(c => (
              <div key={c.id} onClick={() => setActive(c)}
                style={{ padding: '14px 16px', cursor: 'pointer', background: active.id === c.id ? '#EFF6FF' : 'transparent', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>{c.name}</div>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>{c.time}</div>
                </div>
                <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>{c.role}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <div style={{ fontSize: '12px', color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>{c.last}</div>
                  {c.unread > 0 && <span style={{ background: '#2563EB', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '10px' }}>{c.unread}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Chat area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#F8FAFC' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #E2E8F0', background: '#fff' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>{active.name}</div>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>{active.role}</div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {mockMessages.map(m => (
                <div key={m.id} style={{ display: 'flex', justifyContent: m.mine ? 'flex-end' : 'flex-start' }}>
                  <div style={{ maxWidth: '60%', background: m.mine ? '#2563EB' : '#fff', color: m.mine ? '#fff' : '#1E293B', border: m.mine ? 'none' : '1px solid #E2E8F0', borderRadius: '10px', padding: '10px 14px', fontSize: '13px' }}>
                    {m.text}
                    <div style={{ fontSize: '10px', color: m.mine ? '#BFDBFE' : '#94A3B8', marginTop: '4px', textAlign: 'right' }}>{m.time}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: '14px 20px', borderTop: '1px solid #E2E8F0', background: '#fff', display: 'flex', gap: '10px' }}>
              <input value={input} onChange={e => setInput(e.target.value)}
                placeholder="Type a message..."
                style={{ flex: 1, border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', outline: 'none' }}
              />
              <button onClick={() => setInput('')}
                style={{ background: '#2563EB', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                Send
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}