import React from 'react';

// Contracts / Accounts / Reports / Settings are explicitly out of scope
// for the Phase 1 MVP (see PRD section 3) — this keeps every nav item
// clickable without pretending those flows are built.
export default function Placeholder({ title }) {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{title}</h1>
          <p>Not part of the Phase 1 MVP — planned for a later phase once the core loop is validated.</p>
        </div>
      </div>
      <div
        className="card"
        style={{
          padding: '48px 20px',
          textAlign: 'center',
          color: 'var(--text-3)',
          fontSize: 13,
        }}
      >
        This screen is intentionally out of scope for now.
      </div>
    </div>
  );
}
