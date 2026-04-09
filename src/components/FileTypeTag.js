const styles = {
  DWG:  'bg-blue-100  text-blue-700',
  PDF:  'bg-red-100   text-red-600',
  DOC:  'bg-green-100 text-green-700',
  DOCX: 'bg-green-100 text-green-700',
  XLS:  'bg-emerald-100 text-emerald-700',
  XLSX: 'bg-emerald-100 text-emerald-700',
  PNG:  'bg-purple-100  text-purple-700',
  JPG:  'bg-purple-100  text-purple-700',
};

export default function FileTypeTag({ type }) {
  const ext = type.toUpperCase();
  return (
    <span className={`text-xs font-bold px-1.5 py-0.5 rounded w-10 text-center inline-block ${styles[ext] || 'bg-slate-100 text-slate-500'}`}>
      {ext}
    </span>
  );
}