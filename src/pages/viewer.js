import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';

export default function PDFViewer() {
  const router = useRouter();
  const { url, title } = router.query;
  const canvasRef = useRef();
  const containerRef = useRef();
  const [pdf, setPdf] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!url) return;
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      window.pdfjsLib.getDocument(url).promise.then(pdfDoc => {
        setPdf(pdfDoc);
        setTotalPages(pdfDoc.numPages);
        setLoading(false);
      }).catch(() => setLoading(false));
    };
    document.body.appendChild(script);
  }, [url]);

  useEffect(() => {
    if (!pdf || !canvasRef.current) return;
    pdf.getPage(page).then(p => {
      const viewport = p.getViewport({ scale });
      const canvas = canvasRef.current;
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      p.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    });
  }, [pdf, page, scale]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#525659', fontFamily: 'Arial, sans-serif' }}>
      
      {/* Toolbar */}
      <div style={{ background: '#3c3f41', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, borderBottom: '1px solid #222' }}>
        <button onClick={() => router.back()}
          style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: '20px', padding: '0 4px' }}>
          ←
        </button>
        <span style={{ color: '#fff', fontSize: '14px', fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {title || 'Document Viewer'}
        </span>

        {/* Page controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontSize: '14px' }}>‹</button>
          <span style={{ color: '#ccc', fontSize: '13px', minWidth: '80px', textAlign: 'center' }}>
            {page} / {totalPages}
          </span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontSize: '14px' }}>›</button>
        </div>

        {/* Zoom controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button onClick={() => setScale(s => Math.max(0.5, +(s - 0.25).toFixed(2)))}
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontSize: '16px' }}>−</button>
          <span style={{ color: '#ccc', fontSize: '13px', minWidth: '48px', textAlign: 'center' }}>{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(s => Math.min(4, +(s + 0.25).toFixed(2)))}
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontSize: '16px' }}>+</button>
        </div>

        <a href={url} download
          style={{ background: '#2563EB', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}>
          Download
        </a>
      </div>

      {/* PDF Canvas */}
      <div ref={containerRef} style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '24px' }}>
        {loading && (
          <div style={{ color: '#ccc', fontSize: '14px', marginTop: '40px' }}>Loading document...</div>
        )}
        <canvas ref={canvasRef} style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.5)', display: loading ? 'none' : 'block' }} />
      </div>
    </div>
  );
}