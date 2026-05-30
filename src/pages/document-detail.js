import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Topbar from '../components/Topbar';
import { useAuth } from '../hooks/useAuth';

const tabs = ['Info', 'Communication', 'Metadata', 'Workflows', 'Attachments', 'Versions', 'History'];
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('orarch_token') : null; }

async function apiFetch(path) {
  const res = await fetch(`${BASE_URL}${path}`, { headers: { Authorization: `Bearer ${getToken()}` } });
  if (!res.ok) return null;
  return res.json();
}

function WorkflowTab({ docId, projectId, user, token, BASE_URL }) {
  const [approvals, setApprovals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'NORMAL' });
  const [loading, setLoading] = useState(false);

  const loadApprovals = async () => {
    try {
      const res = await fetch(`${BASE_URL}/approvals?projectId=${projectId}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      const filtered = (Array.isArray(data) ? data : []).filter(a => a.documentId === docId);
      setApprovals(filtered);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { if (docId && projectId) loadApprovals(); }, [docId, projectId]);

  const submitApproval = async () => {
    if (!form.title) return;
    setLoading(true);
    try {
      await fetch(`${BASE_URL}/approvals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, documentId: docId, projectId })
      });
      setShowForm(false);
      setForm({ title: '', description: '', priority: 'NORMAL' });
      loadApprovals();
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const decide = async (approvalId, decision) => {
    try {
      await fetch(`${BASE_URL}/approvals/${approvalId}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ decision, comments: '' })
      });
      loadApprovals();
    } catch (err) { console.error(err); }
  };

  const statusColor = { PENDING: '#F59E0B', APPROVED: '#16A34A', REJECTED: '#DC2626', IN_PROGRESS: '#2563EB' };
  const statusBg = { PENDING: '#FEF3C7', APPROVED: '#DCFCE7', REJECTED: '#FEE2E2', IN_PROGRESS: '#EFF6FF' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {!showForm && (
        <button onClick={() => setShowForm(true)}
          style={{ background: '#2563EB', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
          + Send for Approval
        </button>
      )}
      {showForm && (
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#1E293B' }}>New Approval Request</div>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Title (e.g. Validate GO-BDC)"
            style={{ border: '1px solid #E2E8F0', borderRadius: '6px', padding: '7px 10px', fontSize: '12px', outline: 'none' }} />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Description (optional)" rows={2}
            style={{ border: '1px solid #E2E8F0', borderRadius: '6px', padding: '7px 10px', fontSize: '12px', outline: 'none', resize: 'none' }} />
          <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
            style={{ border: '1px solid #E2E8F0', borderRadius: '6px', padding: '7px 10px', fontSize: '12px', background: '#fff' }}>
            {['LOW', 'NORMAL', 'HIGH', 'URGENT'].map(p => <option key={p}>{p}</option>)}
          </select>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={submitApproval} disabled={loading}
              style={{ flex: 1, background: loading ? '#93C5FD' : '#2563EB', color: '#fff', border: 'none', borderRadius: '6px', padding: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              {loading ? 'Sending...' : 'Send'}
            </button>
            <button onClick={() => setShowForm(false)}
              style={{ flex: 1, background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '6px', padding: '7px', fontSize: '12px', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
      {approvals.length === 0 && !showForm && <div style={{ fontSize: '13px', color: '#94A3B8' }}>No approval requests yet.</div>}
      {approvals.map(a => (
        <div key={a.id} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>{a.title}</div>
            <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: statusBg[a.status] || '#F1F5F9', color: statusColor[a.status] || '#64748B' }}>
              {a.status}
            </span>
          </div>
          {a.description && <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '6px' }}>{a.description}</div>}
          <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '8px' }}>
            Priority: {a.priority} · {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ''}
          </div>
          {a.status === 'PENDING' && a.requestedBy !== user?.userId && (
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => decide(a.id, 'APPROVED')}
                style={{ flex: 1, background: '#DCFCE7', color: '#16A34A', border: '1px solid #16A34A', borderRadius: '6px', padding: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                ✓ Approve
              </button>
              <button onClick={() => decide(a.id, 'REJECTED')}
                style={{ flex: 1, background: '#FEE2E2', color: '#DC2626', border: '1px solid #DC2626', borderRadius: '6px', padding: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                ✗ Reject
              </button>
            </div>
          )}
          {a.status !== 'PENDING' && (
            <div style={{ fontSize: '11px', color: statusColor[a.status], fontWeight: 600 }}>
              {a.status === 'APPROVED' ? '✓ Approved' : '✗ Rejected'} · {a.completedAt ? new Date(a.completedAt).toLocaleDateString() : ''}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function VersionsTab({ docId, doc, user, token, BASE_URL }) {
  const [versions, setVersions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const loadVersions = async () => {
    try {
      const res = await fetch(`${BASE_URL}/documents/${docId}/versions`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setVersions(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { if (docId) loadVersions(); }, [docId]);

  const uploadVersion = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', doc?.projectId || '');
      const uploadRes = await fetch(`${BASE_URL}/files/upload`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData,
      });
      const uploadData = await uploadRes.json();
      const nextVersion = String.fromCharCode(65 + versions.length);
      await fetch(`${BASE_URL}/documents/${docId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          versionNumber: `VERSION ${nextVersion}`,
          changeSummary: notes,
          uploadedByName: `${user.firstName} ${user.lastName}`,
          fileUrl: uploadData.url,
          status: 'Attente statut',
        })
      });
      setShowForm(false); setFile(null); setNotes('');
      loadVersions();
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const groupByDate = (list) => {
    const groups = {};
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    list.forEach(v => {
      const d = new Date(v.createdAt);
      const ds = d.toDateString();
      const label = ds === today ? 'TODAY' : ds === yesterday ? 'YESTERDAY' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
      if (!groups[label]) groups[label] = [];
      groups[label].push(v);
    });
    return groups;
  };

  const allVersions = versions.length === 0 && doc ? [{
    id: 'current', versionNumber: 'VERSION A',
    uploadedByName: `${user?.firstName} ${user?.lastName}`,
    createdAt: doc.createdAt, status: doc.status || 'DRAFT', fileUrl: doc.fileUrl,
  }] : versions;

  const grouped = groupByDate(allVersions);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <button onClick={() => setShowForm(f => !f)}
        style={{ background: '#2563EB', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginBottom: '4px' }}>
        + Upload New Version
      </button>
      {showForm && (
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px', marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0])} />
          <div onClick={() => fileRef.current.click()}
            style={{ border: '2px dashed #93C5FD', borderRadius: '8px', padding: '12px', textAlign: 'center', cursor: 'pointer', background: '#EFF6FF' }}>
            {file ? <span style={{ fontSize: '12px', color: '#2563EB' }}>📄 {file.name}</span>
              : <span style={{ fontSize: '12px', color: '#94A3B8' }}>Click to select file</span>}
          </div>
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Change notes (optional)"
            style={{ border: '1px solid #E2E8F0', borderRadius: '6px', padding: '7px 10px', fontSize: '12px', outline: 'none' }} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={uploadVersion} disabled={loading || !file}
              style={{ flex: 1, background: loading ? '#93C5FD' : '#2563EB', color: '#fff', border: 'none', borderRadius: '6px', padding: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              {loading ? 'Uploading...' : 'Upload'}
            </button>
            <button onClick={() => setShowForm(false)}
              style={{ flex: 1, background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '6px', padding: '7px', fontSize: '12px', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
      {Object.entries(grouped).map(([dateLabel, vlist]) => (
        <div key={dateLabel}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', padding: '8px 0 4px', letterSpacing: '0.5px' }}>{dateLabel}</div>
          {vlist.map(v => (
            <div key={v.id} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 12px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', background: '#E2E8F0', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>📄</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '11px', fontWeight: 700, background: '#EFF6FF', color: '#2563EB', padding: '2px 8px', borderRadius: '4px' }}>{v.versionNumber}</span>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>{v.uploadedByName || 'Unknown'}</div>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                  {v.createdAt ? new Date(v.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' · ' + new Date(v.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—'}
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', textAlign: 'right', flexShrink: 0 }}>
                {v.status || '—'}
                {v.fileUrl && <div><a href={v.fileUrl} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#2563EB', textDecoration: 'none' }}>⬇ Download</a></div>}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function DocumentDetailPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { id, projectId } = router.query;
  const [activeTab, setActiveTab] = useState('Info');
  const [doc, setDoc] = useState(null);
  const [comments, setComments] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [allDocs, setAllDocs] = useState([]);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => { if (!authLoading && !user) router.push('/login'); }, [user, authLoading]);
  useEffect(() => { if (id) loadData(); }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [docData, commentsData, allDocsData] = await Promise.all([
        apiFetch(`/documents/${id}`),
        apiFetch(`/comments?documentId=${id}`).catch(() => []),
        projectId ? apiFetch(`/documents?projectId=${projectId}`) : Promise.resolve([]),
      ]);
      setDoc(docData);
      setComments(Array.isArray(commentsData) ? commentsData : []);
      setAllDocs(Array.isArray(allDocsData) ? allDocsData : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const sendComment = async () => {
    if (!message.trim()) return;
    try {
      const res = await fetch(`${BASE_URL}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ documentId: id, content: message, authorName: `${user.firstName} ${user.lastName}` })
      });
      if (res.ok) {
        setMessage('');
        const data = await apiFetch(`/comments?documentId=${id}`);
        setComments(Array.isArray(data) ? data : []);
      }
    } catch (err) { console.error(err); }
  };

  const currentIndex = allDocs.findIndex(d => d.id === id);
  const prevDoc = currentIndex > 0 ? allDocs[currentIndex - 1] : null;
  const nextDoc = currentIndex < allDocs.length - 1 ? allDocs[currentIndex + 1] : null;

  function formatDate(d) { return d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'; }
  function formatSize(bytes) {
    if (!bytes) return '—';
    if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    if (bytes > 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${bytes} B`;
  }

  if (authLoading || !user) return null;
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Arial', color: '#94A3B8' }}>Loading...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <Topbar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Icon sidebar */}
        <div style={{ width: '48px', background: '#1E293B', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '12px', gap: '4px', flexShrink: 0 }}>
          {[
            { title: 'Files', path: `/projects/${projectId}`, active: true, icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="3" y="2" width="10" height="14" rx="1.5" stroke="#fff" strokeWidth="1.4" /><path d="M6 6h6M6 9h4" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" /></svg> },
            { title: 'Address Book', path: '/address-book', icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="6" r="3.5" stroke="#94A3B8" strokeWidth="1.4" /><path d="M2.5 16a6.5 6.5 0 0113 0" stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round" /></svg> },
            { title: 'Tasks', path: '/tasks', icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 7h10M4 11h7M4 3h14" stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round" /></svg> },
            { title: 'Messages', path: '/messages', icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="3" width="14" height="10" rx="1.5" stroke="#94A3B8" strokeWidth="1.4" /><path d="M6 13l3 3 3-3" stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg> },
            { title: 'Reports', path: '/reports', icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 14V6l4 4 4-4 4 4" stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg> },
          ].map(item => (
            <button key={item.title} title={item.title} onClick={() => router.push(item.path)}
              style={{ width: '38px', height: '38px', borderRadius: '8px', background: item.active ? 'rgba(255,255,255,0.15)' : 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onMouseEnter={e => { if (!item.active) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
              onMouseLeave={e => { if (!item.active) e.currentTarget.style.background = 'transparent'; }}>
              {item.icon}
            </button>
          ))}
        </div>

        <main style={{ flex: 1, display: 'flex', overflow: 'hidden', background: '#F8FAFC' }}>

          {/* Document Preview Area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Toolbar */}
            <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span onClick={() => router.back()} style={{ cursor: 'pointer', color: '#64748B', fontSize: '13px' }}>← Back</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>{doc?.title || doc?.fileName || '...'}</span>
                <span style={{ background: '#EFF6FF', color: '#2563EB', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px' }}>v{doc?.currentVersion || '1.0'}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => prevDoc && router.push(`/document-detail?id=${prevDoc.id}&projectId=${projectId}`)} disabled={!prevDoc}
                  style={{ background: '#F1F5F9', color: prevDoc ? '#475569' : '#CBD5E1', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, cursor: prevDoc ? 'pointer' : 'not-allowed' }}>
                  ← Prev
                </button>
                <button onClick={() => nextDoc && router.push(`/document-detail?id=${nextDoc.id}&projectId=${projectId}`)} disabled={!nextDoc}
                  style={{ background: '#F1F5F9', color: nextDoc ? '#475569' : '#CBD5E1', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, cursor: nextDoc ? 'pointer' : 'not-allowed' }}>
                  Next →
                </button>
                <button onClick={() => { if (doc?.fileUrl) window.open(doc.fileUrl, '_blank'); else alert('No file attached yet.'); }}
                  style={{ background: '#2563EB', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                  Download
                </button>
                <button onClick={() => { if (doc?.fileUrl) window.open(doc.fileUrl, '_blank'); else alert('No file attached yet.'); }}
                  style={{ background: '#0EA5E9', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                  Open in Viewer
                </button>
              </div>
            </div>

            {/* PDF / Image Preview */}
            <div style={{ flex: 1, overflow: 'hidden', background: '#E2E8F0' }}>
              {doc?.fileUrl ? (
                doc?.mimeType?.includes('image') ? (
                  <img src={doc.fileUrl} alt={doc.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <iframe src={doc.fileUrl} title={doc.title} style={{ width: '100%', height: '100%', border: 'none' }} />
                )
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '48px' }}>{doc?.mimeType?.includes('pdf') ? '📄' : doc?.mimeType?.includes('image') ? '🖼️' : '📐'}</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B' }}>{doc?.title || doc?.fileName}</div>
                  <div style={{ fontSize: '12px', color: '#94A3B8' }}>{doc?.documentType} · {formatSize(doc?.fileSize)}</div>
                  <div style={{ fontSize: '12px', color: '#94A3B8' }}>No file uploaded yet</div>
                </div>
              )}
            </div>
          </div>

          {/* Side Panel */}
          <div style={{ width: '320px', background: '#fff', borderLeft: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Tabs + ••• menu */}
            <div style={{ display: 'flex', overflowX: 'auto', borderBottom: '1px solid #E2E8F0', padding: '0 8px', alignItems: 'center' }}>
              {tabs.map(t => (
                <button key={t} onClick={() => setActiveTab(t)}
                  style={{ padding: '10px 12px', border: 'none', borderBottom: activeTab === t ? '2px solid #2563EB' : '2px solid transparent', background: 'transparent', fontSize: '12px', fontWeight: activeTab === t ? 700 : 400, color: activeTab === t ? '#2563EB' : '#64748B', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {t}
                </button>
              ))}
              <div style={{ marginLeft: 'auto', position: 'relative', flexShrink: 0 }}>
                <button onClick={() => setShowMenu(m => !m)}
                  style={{ padding: '6px 10px', border: 'none', background: 'transparent', fontSize: '16px', cursor: 'pointer', color: '#64748B' }}>
                  ···
                </button>
                {showMenu && (
                  <div style={{ position: 'absolute', right: 0, top: '36px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', zIndex: 50, minWidth: '180px', overflow: 'hidden' }}>
                    {[
                      { label: 'Copy link', icon: '🔗', action: () => { navigator.clipboard.writeText(window.location.href); setShowMenu(false); alert('Link copied!'); } },
                      { label: 'Generate QR code', icon: '⬛', action: () => { window.open(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.href)}`, '_blank'); setShowMenu(false); } },
                      { label: 'Print to PDF', icon: '🖨️', action: () => { window.print(); setShowMenu(false); } },
                    ].map(item => (
                      <button key={item.label} onClick={item.action}
                        style={{ width: '100%', padding: '10px 16px', border: 'none', background: '#fff', textAlign: 'left', fontSize: '13px', color: '#1E293B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                        {item.icon} {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Tab Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              {activeTab === 'Info' && doc && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { label: 'Document Name', value: doc.title || doc.fileName },
                    { label: 'Type', value: doc.documentType || '—' },
                    { label: 'Version', value: `v${doc.currentVersion || '1.0'}` },
                    { label: 'File Size', value: formatSize(doc.fileSize) },
                    { label: 'Upload Date', value: formatDate(doc.createdAt) },
                    { label: 'Status', value: doc.status || '—' },
                    { label: 'Uploaded By', value: doc.uploadedBy ? doc.uploadedBy.toString().slice(0, 8) + '...' : '—' },
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
                    {comments.length === 0 && <div style={{ fontSize: '13px', color: '#94A3B8' }}>No comments yet</div>}
                    {comments.map((c, i) => (
                      <div key={i} style={{ background: '#F8FAFC', borderRadius: '8px', padding: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#1E293B' }}>{c.authorName || 'User'}</span>
                          <span style={{ fontSize: '11px', color: '#94A3B8' }}>{formatDate(c.createdAt)}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#475569' }}>{c.content}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input value={message} onChange={e => setMessage(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') sendComment(); }}
                      placeholder="Write a comment..."
                      style={{ flex: 1, border: '1px solid #E2E8F0', borderRadius: '6px', padding: '8px 10px', fontSize: '12px', outline: 'none' }} />
                    <button onClick={sendComment}
                      style={{ background: '#2563EB', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 12px', fontSize: '12px', cursor: 'pointer' }}>
                      Send
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'Metadata' && doc && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { label: 'File Name', value: doc.fileName || '—' },
                    { label: 'MIME Type', value: doc.mimeType || '—' },
                    { label: 'File Size', value: formatSize(doc.fileSize) },
                    { label: 'Project ID', value: doc.projectId ? doc.projectId.toString().slice(0, 8) + '...' : '—' },
                    { label: 'Is Locked', value: doc.isLocked ? 'Yes' : 'No' },
                    { label: 'Created At', value: formatDate(doc.createdAt) },
                    { label: 'Updated At', value: formatDate(doc.updatedAt) },
                  ].map(item => (
                    <div key={item.label}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '2px' }}>{item.label}</div>
                      <div style={{ fontSize: '13px', color: '#1E293B' }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'Workflows' && (
                <WorkflowTab docId={id} projectId={projectId} user={user} token={getToken()} BASE_URL={BASE_URL} />
              )}

              {activeTab === 'Attachments' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontSize: '13px', color: '#94A3B8' }}>No attachments yet</div>
                  <button style={{ background: '#F1F5F9', color: '#475569', border: '1px dashed #CBD5E1', borderRadius: '8px', padding: '10px', fontSize: '12px', cursor: 'pointer' }}>
                    + Add Attachment
                  </button>
                </div>
              )}

              {activeTab === 'Versions' && (
                <VersionsTab docId={id} projectId={projectId} doc={doc} user={user} token={getToken()} BASE_URL={BASE_URL} />
              )}

              {activeTab === 'History' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { action: 'Created', date: formatDate(doc?.createdAt) },
                    { action: 'Last Updated', date: formatDate(doc?.updatedAt) },
                    { action: `Status: ${doc?.status}`, date: formatDate(doc?.updatedAt) },
                  ].map((h, i) => (
                    <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', paddingBottom: '8px', borderBottom: i < 2 ? '1px solid #F1F5F9' : 'none' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563EB', marginTop: '4px', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#1E293B' }}>{h.action}</div>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>{h.date}</div>
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