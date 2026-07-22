import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';

export default function PDFViewer() {
  const router = useRouter();
  const { url, title, docId, projectId } = router.query;
  const canvasRef = useRef();
  const containerRef = useRef();
  const [pdf, setPdf] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [loading, setLoading] = useState(true);
  // --- measurement state ---
  const overlayRef = useRef();
  const [mode, setMode] = useState(null);            // null | 'calibrate' | 'measure'
  const [unitsPerPx, setUnitsPerPx] = useState(null); // real units per CSS pixel at scale=1
  const [unit, setUnit] = useState('m');
  const [pending, setPending] = useState([]);         // points clicked in current action
  const [measurements, setMeasurements] = useState([]); // [{x1,y1,x2,y2,label}] in scale-1 coords
  const [calibPrompt, setCalibPrompt] = useState(null); // {px, p1, p2} when awaiting input
  const [calibInput, setCalibInput] = useState('');
  const [snapHover, setSnapHover] = useState(null); // nearest snap-eligible point while hovering
  const [cursorPos, setCursorPos] = useState(null); // {x,y} in scale-1 coords, for coordinate readout

  // Load saved calibration for this document, if any
  useEffect(() => {
    if (!docId) return;
    const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
    const token = typeof window !== 'undefined' ? localStorage.getItem('orarch_token') : null;
    fetch(`${BASE_URL}/documents/${docId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(doc => {
        if (doc && doc.unitsPerPx) {
          setUnitsPerPx(doc.unitsPerPx);
          if (doc.calibrationUnit) setUnit(doc.calibrationUnit);
        }
      })
      .catch(e => console.error('Failed to load calibration:', e));
  }, [docId]);

  useEffect(() => {
    if (!url) return;
    const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
    const token = typeof window !== 'undefined' ? localStorage.getItem('orarch_token') : null;
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = async () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      try {
        // Fetch the PDF bytes through the authenticated proxy (avoids CORS + signature issues)
        const proxyUrl = `${BASE_URL}/files/proxy?url=` + encodeURIComponent(url);
        const resp = await fetch(proxyUrl, { headers: { Authorization: `Bearer ${token}` } });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const buf = await resp.arrayBuffer();
        const pdfDoc = await window.pdfjsLib.getDocument({ data: buf }).promise;
        setPdf(pdfDoc);
        setTotalPages(pdfDoc.numPages);
        setLoading(false);
      } catch (e) {
        console.error('PDF load failed:', e);
        setLoading(false);
      }
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

  // --- measurement: keep overlay canvas sized to the PDF canvas, then redraw ---
  useEffect(() => {
    const c = canvasRef.current, o = overlayRef.current;
    if (!c || !o) return;
    o.width = c.width; o.height = c.height;
    drawOverlay();
  }, [pdf, page, scale, measurements, pending, snapHover]);

  const drawOverlay = () => {
    const o = overlayRef.current;
    if (!o) return;
    const ctx = o.getContext('2d');
    ctx.clearRect(0, 0, o.width, o.height);

    const drawSeg = (p1, p2, label, color) => {
      ctx.strokeStyle = color; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(p1.x*scale, p1.y*scale); ctx.lineTo(p2.x*scale, p2.y*scale); ctx.stroke();
      // end ticks
      [p1, p2].forEach(pt => { ctx.beginPath(); ctx.arc(pt.x*scale, pt.y*scale, 4, 0, Math.PI*2); ctx.fillStyle = color; ctx.fill(); });
      if (label) {
        const mx = (p1.x+p2.x)/2*scale, my = (p1.y+p2.y)/2*scale;
        ctx.font = 'bold 13px Arial';
        const w = ctx.measureText(label).width + 10;
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.fillRect(mx - w/2, my - 22, w, 20);
        ctx.strokeStyle = color; ctx.lineWidth = 1;
        ctx.strokeRect(mx - w/2, my - 22, w, 20);
        ctx.fillStyle = '#111';
        ctx.textAlign = 'center';
        ctx.fillText(label, mx, my - 8);
      }
    };

    measurements.forEach(m => drawSeg({x:m.x1,y:m.y1}, {x:m.x2,y:m.y2}, m.label, '#EF4444'));
    if (pending.length === 1) {
      const p1 = pending[0];
      ctx.fillStyle = '#2563EB';
      ctx.beginPath(); ctx.arc(p1.x*scale, p1.y*scale, 4, 0, Math.PI*2); ctx.fill();
    }
    if (snapHover) {
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(snapHover.x*scale, snapHover.y*scale, 8, 0, Math.PI*2); ctx.stroke();
    }
  };

  const dist = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);

  const applyCalibration = async () => {
    const real = parseFloat(calibInput);
    if (isNaN(real) || real <= 0 || !calibPrompt || calibPrompt.px <= 0) {
      alert('Please enter a valid number.');
      return;
    }
    const perPx = real / calibPrompt.px;
    setUnitsPerPx(perPx);
    setCalibPrompt(null);
    setMode('measure');   // jump straight into measuring

    // Save calibration to the document so it persists across sessions
    try {
      const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
      const token = localStorage.getItem('orarch_token');
      await fetch(`${BASE_URL}/documents/${docId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ unitsPerPx: perPx, calibrationUnit: unit })
      });
    } catch (e) {
      console.error('Failed to save calibration:', e);
    }
  };

  const SNAP_RADIUS_PX = 10; // canvas pixels at current zoom

  const findNearestCandidate = (pt) => {
    const candidates = [];
    measurements.forEach(m => {
      candidates.push({ x: m.x1, y: m.y1 });
      candidates.push({ x: m.x2, y: m.y2 });
    });
    let nearest = null;
    let nearestDist = Infinity;
    candidates.forEach(c => {
      const d = dist(pt, c) * scale; // convert to screen pixels for threshold check
      if (d < SNAP_RADIUS_PX && d < nearestDist) {
        nearest = c;
        nearestDist = d;
      }
    });
    return nearest;
  };

  const snapToNearbyPoint = (pt) => findNearestCandidate(pt) || pt;

  const pointFromEvent = (e) => {
    const o = overlayRef.current;
    const rect = o.getBoundingClientRect();
    const ratioX = o.width / rect.width;
    const ratioY = o.height / rect.height;
    const canvasX = (e.clientX - rect.left) * ratioX;
    const canvasY = (e.clientY - rect.top) * ratioY;
    return { x: canvasX / scale, y: canvasY / scale };
  };

  const handleOverlayMouseMove = (e) => {
    const rawPt = pointFromEvent(e);
    setCursorPos(rawPt);
    if (!mode) { if (snapHover) setSnapHover(null); return; }
    const nearest = findNearestCandidate(rawPt);
    setSnapHover(nearest);
  };

  const handleOverlayMouseLeave = () => {
    setCursorPos(null);
    setSnapHover(null);
  };

  const handleOverlayClick = (e) => {
    if (!mode) return;
    const rawPt = pointFromEvent(e);
    const pt = snapToNearbyPoint(rawPt);
    const next = [...pending, pt];

    if (next.length < 2) { setPending(next); return; }

    const [p1, p2] = next;
    const px = dist(p1, p2);

    if (mode === 'calibrate') {
      setCalibPrompt({ px, p1, p2 });
      setCalibInput('');
      setPending([]);
      return;
    }

    if (mode === 'measure') {
      if (!unitsPerPx) { alert('Please calibrate first (click Calibrate, then click a line of known length).'); setPending([]); setMode(null); return; }
      const real = px * unitsPerPx;
      const label = `${real.toFixed(2)} ${unit}`;
      setMeasurements(ms => [...ms, { x1:p1.x, y1:p1.y, x2:p2.x, y2:p2.y, label }]);
      setPending([]);
      // stay in measure mode so they can take several measurements
      return;
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#525659', fontFamily: 'Arial, sans-serif' }}>
      
      {/* Toolbar */}
      <div style={{ background: '#3c3f41', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, borderBottom: '1px solid #222', position: 'relative' }}>
        <button onClick={() => { if (docId && projectId) router.push('/projects/' + projectId + '?doc=' + docId); else router.back(); }}
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

        {/* Measurement tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderLeft: '1px solid #555', paddingLeft: '12px' }}>
          <select value={unit} onChange={e => setUnit(e.target.value)}
            style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 6px', fontSize: '12px' }}>
            <option value="m">m</option>
            <option value="cm">cm</option>
            <option value="mm">mm</option>
          </select>
          <button onClick={() => { setMode(mode === 'calibrate' ? null : 'calibrate'); setPending([]); }}
            title="Click two points on a line of known length, then enter its real length"
            style={{ background: mode === 'calibrate' ? '#F59E0B' : 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer', fontSize: '12px', whiteSpace: 'nowrap' }}>
            Calibrate
          </button>
          <button onClick={() => { setMode(mode === 'measure' ? null : 'measure'); setPending([]); }}
            title="Click two points to measure the distance"
            style={{ background: mode === 'measure' ? '#2563EB' : 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer', fontSize: '12px', whiteSpace: 'nowrap' }}>
            Measure
          </button>
          <button onClick={() => { setMeasurements([]); setPending([]); setMode(null); }}
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer', fontSize: '12px' }}>
            Clear
          </button>
          <span style={{ color: unitsPerPx ? '#10B981' : '#94A3B8', fontSize: '11px', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
            {unitsPerPx ? 'Scale set' : 'Not calibrated'}
          </span>
        </div>
        {mode === 'calibrate' && pending.length === 0 && (
          <div style={{ position: 'absolute', top: '52px', left: '50%', transform: 'translateX(-50%)', background: '#F59E0B', color: '#1E293B', fontSize: '13px', fontWeight: 600, padding: '8px 16px', borderRadius: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', zIndex: 10, whiteSpace: 'nowrap' }}>
            Click two points on the drawing where you can see a number (like a measurement), then type in that number
          </div>
        )}
        <a href={url} download
          style={{ background: '#2563EB', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}>
          Download
        </a>
      </div>

      {/* Calibration dialog */}
      {calibPrompt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '10px', padding: '24px', width: '380px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', marginBottom: '8px' }}>Set drawing scale</div>
            <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '10px', lineHeight: 1.5 }}>
              You clicked a line on the drawing. Enter its real length as printed on the drawing (e.g. if the drawing labels it "250", enter 250).
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '18px' }}>
              <input autoFocus type="number" value={calibInput}
                onChange={e => setCalibInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') applyCalibration(); if (e.key === 'Escape') setCalibPrompt(null); }}
                placeholder="e.g. 250"
                style={{ flex: 1, border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', outline: 'none' }} />
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#475569', minWidth: '30px' }}>{unit}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setCalibPrompt(null); setMode(null); }}
                style={{ padding: '9px 16px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#fff', color: '#475569', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={applyCalibration}
                style={{ padding: '9px 20px', border: 'none', borderRadius: '8px', background: '#2563EB', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Set scale</button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Canvas */}
      <div ref={containerRef} style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '24px' }}>
        {loading && (
          <div style={{ color: '#ccc', fontSize: '14px', marginTop: '40px' }}>Loading document...</div>
        )}
        <div style={{ position: 'relative', display: loading ? 'none' : 'block', boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>
          <canvas ref={canvasRef} style={{ display: 'block' }} />
          <canvas ref={overlayRef} onClick={handleOverlayClick} onMouseMove={handleOverlayMouseMove} onMouseLeave={handleOverlayMouseLeave}
            style={{ position: 'absolute', top: 0, left: 0, cursor: snapHover ? 'pointer' : (mode ? 'crosshair' : 'default'), pointerEvents: 'auto' }} />
          <div style={{ position: 'absolute', bottom: '30px', left: '8px', background: 'red', color: '#fff', fontSize: '11px', padding: '4px 8px', zIndex: 999 }}>
            DEBUG: cursorPos is {cursorPos ? 'SET' : 'NULL'}
          </div>
          {cursorPos && (
            <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(0,0,0,0.7)', color: '#10B981', fontSize: '11px', fontFamily: 'monospace', padding: '4px 8px', borderRadius: '4px', pointerEvents: 'none' }}>
              X: {unitsPerPx ? (cursorPos.x * unitsPerPx).toFixed(2) : cursorPos.x.toFixed(1)}{unitsPerPx ? ` ${unit}` : 'px'}
              {'  '}
              Y: {unitsPerPx ? (cursorPos.y * unitsPerPx).toFixed(2) : cursorPos.y.toFixed(1)}{unitsPerPx ? ` ${unit}` : 'px'}
              {'  '}
              Scale: {Math.round(scale * 100)}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}