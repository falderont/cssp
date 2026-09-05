import React, { useState } from 'react';
import { csTeam, engagementTypes } from '../data/mockData.js';
import { IconPlus } from './icons.jsx';

export default function CSEngagement({ user, engagementLogs, tickets, remoteHandsTasks, onLogEngagement }) {
  const [tab, setTab] = useState('performance');

  const myLogs = engagementLogs.filter((l) => l.repName === user.name);
  const myTicketsResolved = tickets.filter((t) => t.assignedTo === user.name && t.status === 'Done').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>CS Engagement &amp; Performance</h1>
          <p>Internal only — never visible to customers. Log your own touchpoints, or see the team's numbers if you manage the team.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="tabs">
          <button className={`tab ${tab === 'mine' ? 'active' : ''}`} onClick={() => setTab('mine')}>
            My Engagement
          </button>
          {user.isManager && (
            <button className={`tab ${tab === 'performance' ? 'active' : ''}`} onClick={() => setTab('performance')}>
              Team Performance
            </button>
          )}
        </div>

        {tab === 'performance' && user.isManager && <TeamPerformance />}
        {tab === 'mine' && (
          <MyEngagement user={user} logs={myLogs} ticketsResolved={myTicketsResolved} onLogEngagement={onLogEngagement} />
        )}
      </div>
    </div>
  );
}

function TeamPerformance() {
  const totals = csTeam.reduce(
    (acc, r) => ({
      ticketsResolved: acc.ticketsResolved + r.ticketsResolved,
      touchpoints: acc.touchpoints + r.touchpoints,
    }),
    { ticketsResolved: 0, touchpoints: 0 }
  );
  const avgCsat = (csTeam.reduce((sum, r) => sum + r.avgCsat, 0) / csTeam.length).toFixed(1);
  const avgFirstResponse = (csTeam.reduce((sum, r) => sum + r.avgFirstResponseHrs, 0) / csTeam.length).toFixed(1);
  const avgResolution = (csTeam.reduce((sum, r) => sum + r.avgResolutionHrs, 0) / csTeam.length).toFixed(1);

  return (
    <>
      <div style={{ padding: '18px 20px', display: 'flex', gap: 14, borderBottom: '1px solid var(--border)' }}>
        <div className="card stat-card" style={{ flex: 1, padding: '14px 16px' }}>
          <span className="stat-label" style={{ fontSize: 11 }}>Tickets Resolved (30d)</span>
          <span className="stat-value" style={{ fontSize: 22 }}>{totals.ticketsResolved}</span>
        </div>
        <div className="card stat-card" style={{ flex: 1, padding: '14px 16px' }}>
          <span className="stat-label" style={{ fontSize: 11 }}>Avg First Response</span>
          <span className="stat-value" style={{ fontSize: 22 }}>{avgFirstResponse}h</span>
        </div>
        <div className="card stat-card" style={{ flex: 1, padding: '14px 16px' }}>
          <span className="stat-label" style={{ fontSize: 11 }}>Avg Resolution</span>
          <span className="stat-value" style={{ fontSize: 22 }}>{avgResolution}h</span>
        </div>
        <div className="card stat-card" style={{ flex: 1, padding: '14px 16px' }}>
          <span className="stat-label" style={{ fontSize: 11 }}>Touchpoints Logged</span>
          <span className="stat-value" style={{ fontSize: 22 }}>{totals.touchpoints}</span>
        </div>
        <div className="card stat-card" style={{ flex: 1, padding: '14px 16px' }}>
          <span className="stat-label" style={{ fontSize: 11 }}>Avg CSAT</span>
          <span className="stat-value" style={{ fontSize: 22, color: 'var(--success)' }}>{avgCsat}</span>
        </div>
      </div>

      <table className="req-table">
        <thead>
          <tr>
            <th>Rep</th>
            <th>Tickets Resolved</th>
            <th>Avg First Response</th>
            <th>Avg Resolution</th>
            <th>Touchpoints Logged</th>
            <th>Avg CSAT</th>
          </tr>
        </thead>
        <tbody>
          {csTeam.map((r) => (
            <tr key={r.id}>
              <td style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                <span className="avatar-sm" style={{ color: 'var(--accent)' }}>{r.initials}</span>
                {r.name}
                {r.isManager && <span style={{ fontWeight: 400, color: 'var(--text-3)' }}>(manager)</span>}
              </td>
              <td>{r.ticketsResolved}</td>
              <td>{r.avgFirstResponseHrs}h</td>
              <td>{r.avgResolutionHrs}h</td>
              <td>{r.touchpoints}</td>
              <td>
                <span
                  className="badge"
                  style={
                    r.avgCsat >= 4.5
                      ? { background: 'var(--success-soft)', color: 'var(--success)' }
                      : { background: 'var(--warning-soft)', color: 'var(--warning)' }
                  }
                >
                  {r.avgCsat}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function MyEngagement({ user, logs, ticketsResolved, onLogEngagement }) {
  const [account, setAccount] = useState('Meridian Logistics');
  const [type, setType] = useState(engagementTypes[0]);
  const [notes, setNotes] = useState('');

  function submit(e) {
    e.preventDefault();
    if (!notes.trim()) return;
    onLogEngagement({ repName: user.name, type, account, notes });
    setNotes('');
  }

  return (
    <div style={{ padding: 20 }}>
      <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16 }}>
        {ticketsResolved} tickets resolved and {logs.length} touchpoints logged by you — visible only to you and your manager.
      </p>
      <form className="card" style={{ padding: 16, display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 20 }} onSubmit={submit}>
        <div style={{ flex: 1 }}>
          <span className="field-label">Account</span>
          <input className="field" value={account} onChange={(e) => setAccount(e.target.value)} placeholder="Account name" />
        </div>
        <div style={{ flex: 0.7 }}>
          <span className="field-label">Type</span>
          <select className="field" value={type} onChange={(e) => setType(e.target.value)}>
            {engagementTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div style={{ flex: 2 }}>
          <span className="field-label">Notes</span>
          <input className="field" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What happened?" />
        </div>
        <button className="btn-primary" type="submit">
          <IconPlus />
          Log Touchpoint
        </button>
      </form>

      {logs.length === 0 && <p style={{ color: 'var(--text-3)', fontSize: 13 }}>No touchpoints logged yet.</p>}
      {logs.map((l) => (
        <div key={l.id} style={{ padding: '14px 0', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12 }}>
          <div className="avatar-sm" style={{ color: 'var(--accent)', marginTop: 2 }}>
            {user.initials}
          </div>
          <div>
            <div style={{ fontSize: 13 }}>
              <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{l.type}</span> — {l.notes}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
              {l.account} · {l.occurredAt}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
