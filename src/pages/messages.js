import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { messages, users } from '../lib/api';
import Topbar from '../components/Topbar';
import Sidebar from '../components/Sidebar';

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [section, setSection] = useState('inbox');
  const [allMessages, setAllMessages] = useState([]);
  const [teamList, setTeamList] = useState([]);
  const [active, setActive] = useState(null);
  const [msgList, setMsgList] = useState([]);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeMsg, setComposeMsg] = useState('');

  useEffect(() => { if (!authLoading && !user) router.push('/login'); }, [user, authLoading]);
  useEffect(() => { if (user) { loadMessages(); loadTeam(); } }, [user]);
  useEffect(() => { if (active) loadConversation(active.id); }, [active]);

  const loadMessages = async () => {
    try {
      const data = await messages.list();
      setAllMessages(Array.isArray(data) ? data : []);
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
      loadMessages();
    } catch (err) { alert(err.message); }
  };

  const handleCompose = async () => {
    const receiver = teamList.find(m => `${m.firstName} ${m.lastName}` === composeTo || m.id === composeTo);
    if (!receiver || !composeMsg.trim()) return;
    try {
      await messages.send({
        receiverId: receiver.id,
        receiverName: `${receiver.firstName} ${receiver.lastName}`,
        senderName: `${user.firstName} ${user.lastName}`,
        content: composeMsg,
      });
      setShowCompose(false);
      setComposeTo('');
      setComposeMsg('');
      loadMessages();
      setActive({ id: receiver.id, name: `${receiver.firstName} ${receiver.lastName}` });
    } catch (err) { alert(err.message); }
  };

  // Build inbox (received) and sent lists
  const inbox = allMessages.filter(m => m.receiverId === user?.userId);
  const sent  = allMessages.filter(m => m.senderId === user?.userId);

  // Unique conversations for inbox
  const inboxConvs = [];
  const seen = new Set();
  inbox.forEach(m => {
    if (!seen.has(m.senderId)) {
      seen.add(m.senderId);
      inboxConvs.push({ id: m.senderId, name: m.senderName, last: m.content, time: m.createdAt });
    }
  });

  // Unique conversations for sent
  const sentConvs = [];
  const seenSent = new Set();
  sent.forEach(m => {
    if (!seenSent.has(m.receiverId)) {
      seenSent.add(m.receiverId);
      sentConvs.push({ id: m.receiverId, name: m.receiverName, last: m.content, time: m.createdAt });
    }
  });

  const displayConvs = (section === 'inbox' ? inboxConvs : sentConvs)
    .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.last.toLowerCase().includes(search.toLowerCase()));

  if (authLoading) return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#94A3B8' }}>Loading...</div>;
  if (!user) return null;

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', fontFamily:'Arial,sans-serif' }}>
      <Topbar />
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        <Sidebar />
        <main style={{ flex:1, display:'flex', overflow:'hidden' }}>

          {/* Left panel */}
          <div style={{ width:'260px', borderRight:'1px solid #E2E8F0', background:'#fff', display:'flex', flexDirection:'column', flexShrink:0 }}>
            <div style={{ padding:'16px', borderBottom:'1px solid #E2E8F0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontSize:'15px', fontWeight:700, color:'#1E293B' }}>Messages</div>
              <button onClick={() => setShowCompose(true)}
                style={{ background:'#2563EB', color:'#fff', border:'none', borderRadius:'6px', padding:'5px 12px', fontSize:'12px', fontWeight:600, cursor:'pointer' }}>
                + New
              </button>
            </div>

            {/* PERSONAL section */}
            <div style={{ padding:'10px 16px 4px', fontSize:'10px', fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.5px' }}>Personal</div>
            {[
              { key:'inbox', label:'Inbox', count: inboxConvs.length },
              { key:'sent',  label:'Sent',  count: sentConvs.length },
            ].map(item => (
              <div key={item.key} onClick={() => { setSection(item.key); setActive(null); }}
                style={{ padding:'8px 16px', cursor:'pointer', display:'flex', alignItems:'center', gap:'8px', background: section===item.key ? '#EFF6FF' : 'transparent', borderLeft: section===item.key ? '3px solid #2563EB' : '3px solid transparent' }}>
                <span style={{ fontSize:'14px' }}>{item.key === 'inbox' ? '📥' : '📤'}</span>
                <span style={{ fontSize:'13px', color: section===item.key ? '#2563EB' : '#475569', fontWeight: section===item.key ? 600 : 400 }}>{item.label}</span>
                {item.count > 0 && <span style={{ marginLeft:'auto', fontSize:'11px', background:'#EFF6FF', color:'#2563EB', borderRadius:'10px', padding:'1px 6px', fontWeight:600 }}>{item.count}</span>}
              </div>
            ))}

            {/* PUBLIC section */}
            <div style={{ padding:'10px 16px 4px', marginTop:'8px', fontSize:'10px', fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.5px' }}>Team Members</div>
            {teamList.map(m => (
              <div key={m.id} onClick={() => setActive({ id: m.id, name: `${m.firstName} ${m.lastName}` })}
                style={{ padding:'8px 16px', cursor:'pointer', display:'flex', alignItems:'center', gap:'8px', background: active?.id===m.id ? '#EFF6FF' : 'transparent', borderLeft: active?.id===m.id ? '3px solid #2563EB' : '3px solid transparent' }}>
                <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:'#2563EB', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:700, flexShrink:0 }}>
                  {m.firstName?.charAt(0)}{m.lastName?.charAt(0)}
                </div>
                <span style={{ fontSize:'13px', color:'#475569' }}>{m.firstName} {m.lastName}</span>
              </div>
            ))}
          </div>

          {/* Middle panel - message list */}
          <div style={{ width:'320px', borderRight:'1px solid #E2E8F0', background:'#F8FAFC', display:'flex', flexDirection:'column', flexShrink:0 }}>
            <div style={{ padding:'12px 16px', borderBottom:'1px solid #E2E8F0', background:'#fff' }}>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                style={{ width:'100%', border:'1px solid #E2E8F0', borderRadius:'6px', padding:'7px 10px', fontSize:'13px', outline:'none', boxSizing:'border-box' }} />
            </div>
            <div style={{ flex:1, overflowY:'auto' }}>
              {displayConvs.length === 0 ? (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:'12px', color:'#94A3B8' }}>
                  <div style={{ fontSize:'40px' }}>💤</div>
                  <div style={{ fontSize:'14px', fontWeight:600, color:'#1E293B' }}>it's quiet here</div>
                  <div style={{ fontSize:'12px' }}>No messages yet</div>
                </div>
              ) : displayConvs.map(c => (
                <div key={c.id} onClick={() => setActive(c)}
                  style={{ padding:'14px 16px', cursor:'pointer', background: active?.id===c.id ? '#EFF6FF' : '#fff', borderBottom:'1px solid #F1F5F9', borderLeft: active?.id===c.id ? '3px solid #2563EB' : '3px solid transparent' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                    <span style={{ fontSize:'13px', fontWeight:600, color:'#1E293B' }}>{c.name}</span>
                    <span style={{ fontSize:'11px', color:'#94A3B8' }}>{c.time ? new Date(c.time).toLocaleDateString() : ''}</span>
                  </div>
                  <div style={{ fontSize:'12px', color:'#64748B', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.last}</div>
                </div>
              ))}
            </div>
            <div style={{ padding:'10px 16px', borderTop:'1px solid #E2E8F0', fontSize:'11px', color:'#94A3B8' }}>{displayConvs.length} items</div>
          </div>

          {/* Right panel - chat */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', background:'#F8FAFC' }}>
            {active ? (
              <>
                <div style={{ padding:'14px 20px', borderBottom:'1px solid #E2E8F0', background:'#fff' }}>
                  <div style={{ fontSize:'14px', fontWeight:700, color:'#1E293B' }}>{active.name}</div>
                </div>
                <div style={{ flex:1, overflowY:'auto', padding:'20px', display:'flex', flexDirection:'column', gap:'12px' }}>
                  {msgList.length === 0 && (
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:'12px', color:'#94A3B8' }}>
                      <div style={{ fontSize:'40px' }}>💤</div>
                      <div style={{ fontSize:'14px', fontWeight:600, color:'#1E293B' }}>it's quiet here</div>
                    </div>
                  )}
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
              <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'12px', color:'#94A3B8' }}>
                <div style={{ fontSize:'40px' }}>💤</div>
                <div style={{ fontSize:'14px', fontWeight:600, color:'#1E293B' }}>it's quiet here</div>
                <div style={{ fontSize:'12px' }}>Select a conversation to start messaging</div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
          <div style={{ background:'#fff', borderRadius:'14px', padding:'28px', width:'420px', boxShadow:'0 8px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ fontSize:'16px', fontWeight:700, color:'#1E293B', marginBottom:'20px' }}>New Message</div>
            <div style={{ marginBottom:'12px' }}>
              <label style={{ fontSize:'12px', fontWeight:600, color:'#475569', display:'block', marginBottom:'4px' }}>To</label>
              <select value={composeTo} onChange={e => setComposeTo(e.target.value)}
                style={{ width:'100%', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', background:'#fff' }}>
                <option value=''>Select recipient...</option>
                {teamList.map(m => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:'20px' }}>
              <label style={{ fontSize:'12px', fontWeight:600, color:'#475569', display:'block', marginBottom:'4px' }}>Message</label>
              <textarea value={composeMsg} onChange={e => setComposeMsg(e.target.value)} rows={4}
                placeholder="Write your message..."
                style={{ width:'100%', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', outline:'none', resize:'none', boxSizing:'border-box' }} />
            </div>
            <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
              <button onClick={() => setShowCompose(false)}
                style={{ padding:'8px 18px', border:'1px solid #E2E8F0', borderRadius:'8px', background:'#fff', fontSize:'13px', cursor:'pointer', color:'#475569' }}>
                Cancel
              </button>
              <button onClick={handleCompose}
                style={{ padding:'8px 20px', border:'none', borderRadius:'8px', background:'#2563EB', color:'#fff', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}