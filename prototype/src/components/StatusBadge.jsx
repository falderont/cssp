import React from 'react';

const STYLES = {
  Submitted: { background: 'oklch(93% 0.01 255)', color: 'var(--text-2)' },
  'In Progress': { background: 'var(--warning-soft)', color: 'var(--warning)' },
  Done: { background: 'var(--success-soft)', color: 'var(--success)' },
  Investigating: { background: 'var(--warning-soft)', color: 'var(--warning)' },
  Upcoming: { background: 'oklch(93% 0.01 255)', color: 'var(--text-2)' },
  Resolved: { background: 'var(--success-soft)', color: 'var(--success)' },
  Pending: { background: 'oklch(93% 0.01 255)', color: 'var(--text-2)' },
  Approved: { background: 'var(--success-soft)', color: 'var(--success)' },
  Denied: { background: 'var(--danger-soft)', color: 'var(--danger)' },
  'Checked In': { background: 'var(--accent-soft)', color: 'var(--accent)' },
  'Checked Out': { background: 'oklch(93% 0.01 255)', color: 'var(--text-2)' },
  Accepted: { background: 'var(--accent-soft)', color: 'var(--accent)' },
  Completed: { background: 'var(--success-soft)', color: 'var(--success)' },
};

export default function StatusBadge({ status }) {
  const style = STYLES[status] || { background: 'oklch(93% 0.01 255)', color: 'var(--text-2)' };
  return (
    <span className="badge" style={style}>
      {status}
    </span>
  );
}
