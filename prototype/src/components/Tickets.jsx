import React, { useState } from 'react';
import StatusBadge from './StatusBadge.jsx';
import { facilities, ticketCategories } from '../data/mockData.js';

const CATEGORY_STYLE = {
  Complaint: { background: 'var(--danger-soft)', color: 'var(--danger)' },
  RFI: { background: 'var(--accent-soft)', color: 'var(--accent)' },
  'Service Request': { background: 'oklch(96% 0.005 255)', color: 'var(--text-3)' },
};

export default function Tickets({ user, tickets, onCreateTicket }) {
  const [tab, setTab] = useState('all');
  const [category, setCategory] = useState('RFI');
  const [facilityId, setFacilityId] = useState(facilities[0].id);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [justSubmitted, setJustSubmitted] = useState(false);

  const mine = tickets.filter((t) => t.account === user.account);
  const filtered = mine.filter((t) => {
    if (tab === 'all') return true;
    return t.category === tab;
  });

  function handleSubmit(e) {
    e.preventDefault();
    if (!subject.trim()) return;
    onCreateTicket({ title: subject, category, facilityId, description, account: user.account });
    setSubject('');
    setDescription('');
    setJustSubmitted(true);
    setTimeout(() => setJustSubmitted(false), 2500);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Tickets</h1>
          <p>Complaints, requests for information, and service requests — one place, one status.</p>
        </div>
      </div>

      <div className="two-col" style={{ gridTemplateColumns: '1.3fr 1fr' }}>
        <div className="card">
          <div className="tabs">
            <button className={`tab ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>
              All ({mine.length})
            </button>
            {ticketCategories.map((c) => (
              <button key={c} className={`tab ${tab === c ? 'active' : ''}`} onClick={() => setTab(c)}>
                {c === 'Service Request' ? 'Service Req.' : `${c}s`} ({mine.filter((t) => t.category === c).length})
              </button>
            ))}
          </div>
          <table className="req-table">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Category</th>
                <th>Facility</th>
                <th>Submitted</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 600 }}>{t.title}</td>
                  <td>
                    <span className="badge" style={CATEGORY_STYLE[t.category]}>
                      {t.category}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-2)' }}>
                    {facilities.find((f) => f.id === t.facilityId)?.name.split(' — ')[0]}
                  </td>
                  <td style={{ color: 'var(--text-2)' }}>{t.submitted}</td>
                  <td>
                    <StatusBadge status={t.status} />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-3)', padding: '24px 0' }}>
                    No tickets here yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <form className="card" style={{ height: 'fit-content' }} onSubmit={handleSubmit}>
          <div className="card-head" style={{ display: 'block' }}>
            <h3>New Ticket</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: 12, color: 'var(--text-3)' }}>
              Pick the category that fits — one queue either way.
            </p>
          </div>
          <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <span className="field-label">Category</span>
              <div style={{ display: 'flex', gap: 8 }}>
                {ticketCategories.map((c) => (
                  <div
                    key={c}
                    onClick={() => setCategory(c)}
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      padding: 8,
                      borderRadius: 7,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: category === c ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                      background: category === c ? 'var(--accent-soft)' : 'transparent',
                      color: category === c ? 'var(--text)' : 'var(--text-3)',
                    }}
                  >
                    {c === 'Service Request' ? 'Service Req.' : c}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <span className="field-label">Facility</span>
              <select className="field" value={facilityId} onChange={(e) => setFacilityId(e.target.value)}>
                {facilities.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className="field-label">Subject</span>
              <input className="field" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Short summary" />
            </div>
            <div>
              <span className="field-label">Description</span>
              <textarea
                className="field"
                rows={4}
                style={{ resize: 'none' }}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details..."
              />
            </div>
            <button className="btn-primary" type="submit" style={{ justifyContent: 'center', marginTop: 4 }}>
              Submit Ticket
            </button>
            {justSubmitted && (
              <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600, textAlign: 'center' }}>
                Submitted — now visible in the provider's queue.
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
