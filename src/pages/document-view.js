import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { DocumentSlidePanel } from './projects/[id]';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export default function DocumentViewPage() {
  const router = useRouter();
  const { id, projectId } = router.query;
  const { user, loading: authLoading } = useAuth();
  const [doc, setDoc] = useState(null);
  const [allDocs, setAllDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!authLoading && !user) router.push('/login'); }, [user, authLoading]);

  useEffect(() => {
    if (!id) return;
    const token = localStorage.getItem('orarch_token');
    const headers = { Authorization: `Bearer ${token}` };
    (async () => {
      setLoading(true);
      try {
        const docRes = await fetch(`${BASE_URL}/documents/${id}`, { headers });
        const docData = await docRes.json();
        setDoc(docData);
        if (projectId) {
          const listRes = await fetch(`${BASE_URL}/documents?projectId=${projectId}`, { headers });
          const listData = await listRes.json();
          setAllDocs(Array.isArray(listData) ? listData : []);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [id, projectId]);

  const handleClose = (targetDoc) => {
    if (targetDoc && targetDoc.id) {
      router.push(`/document-view?id=${targetDoc.id}&projectId=${projectId || ''}`);
    } else {
      router.push(`/projects/${projectId || ''}`);
    }
  };

  if (authLoading || !user) return null;
  if (loading || !doc) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:'Arial', color:'#94A3B8' }}>Loading...</div>;

  return <DocumentSlidePanel doc={doc} projectId={projectId} onClose={handleClose} user={user} allDocs={allDocs} />;
}
