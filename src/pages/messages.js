import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { messages, users } from '../lib/api';
import Topbar from '../components/Topbar';
import Sidebar from '../components/Sidebar';

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [msgList, setMsgList] = useState([]);
  const [input, setInput] = useState('');
  const [teamList, setTeamList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading]);

  useEffect(() => {
    if (user) { loadConversations(); loadTeam(); }
  }, [user]);

  useEffect(() => {
    if (active) loadConversation(active.id);
  }, [active]);

  const loadConversations = async () => {
    try {
      const data = await messages.list();
      const unique = [];
      const seen = new Set();
      (Array.isArray(data) ? data : []).forEach(m => {
        const otherId = m.senderId === user.userId ? m.receiverId : m.senderId;
        const otherName = m.senderId === user.userId ? m.receiverName : m.senderName;
        if (!seen.has(otherId)) {
          seen.add(otherId);
          unique.push({ id: otherId, name: otherName, last: m.content, time: m.createdAt });
        }
      });
      setConversations(unique);
    } catch (err) { console.error(err); }
  };

  const loadConversation = async (receiverId) => {
    try {
      const data = await messages.conversation(receiverId);
      setMsgList(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
  };

  const loadTeam = async () => {
    try {
      const data = await users.list(user.organizationId);
      setTeamList((Array.isArray(data) ? data : []).filter(u => u.id !== user.userId));
    } catch (err) { console.error(err); }
  };

  const handleSend = async () => {
    if (!input.trim() || !active) return;
    try {
      await messages.send({
        receiverId: active.id,
        receiverName: active.name,
        senderName: `${user.firstName} ${user.lastName}`,
        content: input,
      });
      setInput('');
      loadConversation(active.id);
      loadConversations();
    } catch (err) { alert(err.message); }
  };

  const startNewConversation = (member) => {
    setActive({ id: member.id, name: `${member.firstName} ${member.lastName}` });
  };

  if (authLoading) return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#94A3B8' }}>Loading...</div>;
  if (!user) return null;

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', fontFamily:'Arial,sans-serif' }}>
      <Topbar />
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        <Sidebar />
        <main style={{ flex:1, display:'flex', overflow:'hidden' }}>
          {/* Left panel */}
          <div style={{ width:'260px', borderRight:'1px solid #E2E8F0', background:'#fff', overflowY:'auto', display:'flex', flexDirection:'column' }}>
            <div style={{ padding:'16px', borderBottom:'1px solid #E2E8F0', fontSize:'14px', fontWeight:700, color:'#1E293B' }}>Messages</div>
            {conversations.length === 0 && teamList.length === 0 && (
              <div style={{ padding:'20px', fontSize:'12px', color:'#94A3B8' }}>No conversations yet. Invite team members first.</div>
            )}
            {conversations.map(c => (
              <div key={c.id} onClick={() => setActive(c)}
                style={{ padding:'14px 16px', cursor:'pointer', background: active?.id === c.id ? '#EFF6FF' : 'transparent', borderBottom:'1px solid #F1F5F9' }}>
                <div style={{ fontSize:'13px', fontWeight:600, color:'#1E293B' }}>{c.name}</div>
                <div style={{ fontSize:'12px', color:'#64748B', marginTop:'2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.last}</div>
              </div>
            ))}
            {teamList.length > 0 && (
              <>
                <div style={{ padding:'10px 16px 6px', fontSize:'10px', fontWeight:700, color:'#94A3B8', textTransform:'uppercase' }}>Team Members</div>
                {teamList.map(m => (
                  <div key={m.id} onClick={() => startNewConversation(m)}
                    style={{ padding:'10px 16px', cursor:'pointer', borderBottom:'1px solid #F1F5F9', fontSize:'13px', color:'#475569' }}>
                    {m.firstName} {m.lastName}
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Chat area */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', background:'#F8FAFC' }}>
            {active ? (
              <>
                <div style={{ padding:'14px 20px', borderBottom:'1px solid #E2E8F0', background:'#fff' }}>
                  <div style={{ fontSize:'14px', fontWeight:700, color:'#1E293B' }}>{active.name}</div>
                </div>
                <div style={{ flex:1, overflowY:'auto', padding:'20px', display:'flex', flexDirection:'column', gap:'12px' }}>
                  {msgList.map(m => {
                    const mine = m.senderId === user.userId;
                    return (
                      <div key={m.id} style={{ display:'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                        <div style={{ maxWidth:'60%', background: mine ? '#2563EB' : '#fff', color: mine ? '#fff' : '#1E293B', border: mine ? 'none' : '1px solid #E2E8F0', borderRadius:'10px', padding:'10px 14px', fontSize:'13px' }}>
                          {m.content}
                          <div style={{ fontSize:'10px', color: mine ? '#BFDBFE' : '#94A3B8', marginTop:'4px', textAlign:'right' }}>
                            {new Date(m.createdAt).toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ padding:'14px 20px', borderTop:'1px solid #E2E8F0', background:'#fff', display:'flex', gap:'10px' }}>
                  <input value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder="Type a message..."
                    style={{ flex:1, border:'1px solid #E2E8F0', borderRadius:'8px', padding:'10px 12px', fontSize:'13px', outline:'none' }} />
                  <button onClick={handleSend}
                    style={{ background:'#2563EB', color:'#fff', border:'none', borderRadius:'8px', padding:'10px 18px', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>
                    Send
                  </button>
                </div>
              </>
            ) : (
              <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'#94A3B8', fontSize:'13px' }}>
                Select a conversation or team member to start messaging
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}