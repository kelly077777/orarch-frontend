const files = [
  { id:1, name:'Floor-Plan-Level-3-Rev4.dwg', desc:'Level 3 floor plan',     no:'A-301',  rev:'Rev 4', by:'Ahmed K.', date:'21 Mar 2026', status:'Pending',  type:'DWG' },
  { id:2, name:'Elevation-North-Rev2.dwg',    desc:'North elevation',         no:'A-201',  rev:'Rev 2', by:'Sara M.',  date:'18 Mar 2026', status:'Approved', type:'DWG' },
  { id:3, name:'Site-Plan-Rev1.pdf',          desc:'Overall site layout',     no:'A-001',  rev:'Rev 1', by:'James O.', date:'10 Mar 2026', status:'Approved', type:'PDF' },
  { id:4, name:'Arch-Specification-v2.docx',  desc:'Materials specification', no:'A-SPEC', rev:'Rev 2', by:'Ahmed K.', date:'8 Mar 2026',  status:'Draft',    type:'DOC' },
  { id:5, name:'Section-AA-Rev3.dwg',         desc:'Cross section A-A',       no:'A-401',  rev:'Rev 3', by:'Sara M.',  date:'5 Mar 2026',  status:'Rejected', type:'DWG' },
];

const typeColors = { DWG:'#DBEAFE', PDF:'#FEE2E2', DOC:'#DCFCE7' };
const typeText   = { DWG:'#1D4ED8', PDF:'#991B1B', DOC:'#166534' };
const statusColors = { Approved:'#DCFCE7', Pending:'#FEF9C3', Rejected:'#FEE2E2', Draft:'#F1F5F9' };
const statusText   = { Approved:'#15803D', Pending:'#A16207', Rejected:'#DC2626', Draft:'#64748B' };

export default function FileTable() {
  const th = { padding:'10px 14px', textAlign:'left', fontSize:'11px', fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.05em', background:'#F8FAFC', borderBottom:'1px solid #E2E8F0' };
  const td = { padding:'10px 14px', borderBottom:'1px solid #F1F5F9', fontSize:'13px', color:'#475569', verticalAlign:'middle' };
  return (
    <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:'10px', overflow:'hidden' }}>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead>
          <tr>
            <th style={th}>File name</th>
            <th style={th}>Drawing no.</th>
            <th style={th}>Revision</th>
            <th style={th}>Uploaded by</th>
            <th style={th}>Date</th>
            <th style={th}>Status</th>
            <th style={th}>Action</th>
          </tr>
        </thead>
        <tbody>
          {files.map((f) => (
            <tr key={f.id} style={{ cursor:'pointer' }}>
              <td style={td}>
                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <span style={{ background: typeColors[f.type]||'#F1F5F9', color: typeText[f.type]||'#475569', fontSize:'10px', fontWeight:700, padding:'2px 6px', borderRadius:'4px', minWidth:'36px', textAlign:'center' }}>{f.type}</span>
                  <div>
                    <div style={{ fontWeight:600, color:'#1E293B', fontSize:'13px' }}>{f.name}</div>
                    <div style={{ fontSize:'11px', color:'#94A3B8' }}>{f.desc}</div>
                  </div>
                </div>
              </td>
              <td style={td}>{f.no}</td>
              <td style={td}><span style={{ background:'#EFF6FF', color:'#2563EB', fontSize:'11px', fontWeight:600, padding:'2px 8px', borderRadius:'20px' }}>{f.rev}</span></td>
              <td style={td}>{f.by}</td>
              <td style={{ ...td, color:'#94A3B8' }}>{f.date}</td>
              <td style={td}><span style={{ background: statusColors[f.status], color: statusText[f.status], fontSize:'11px', fontWeight:600, padding:'2px 10px', borderRadius:'20px' }}>{f.status}</span></td>
              <td style={td}><button style={{ fontSize:'11px', border:'1px solid #E2E8F0', borderRadius:'6px', padding:'4px 10px', background:'#fff', cursor:'pointer', color:'#475569' }}>{f.status==='Rejected'?'Resubmit':f.status==='Pending'?'Review':f.status==='Draft'?'Edit':'Download'}</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}