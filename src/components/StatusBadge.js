const styles = {
  Approved: 'bg-green-100  text-green-700',
  Pending:  'bg-yellow-100 text-yellow-700',
  Rejected: 'bg-red-100   text-red-600',
  Draft:    'bg-slate-100  text-slate-500',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles[status] || styles.Draft}`}>
      {status}
    </span>
  );
}