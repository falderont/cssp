import React, { useState } from 'react';
import { facilities } from '../data/mockData.js';
import { IconAlert } from './icons.jsx';

const DOT_COLOR = {
  Investigating: 'var(--warning)',
  Upcoming: 'var(--text-3)',
  Resolved: 'var(--success)',
};

export default function Incidents({ incidents, canPost, onPostIncident }) {
  const [facilityFilter, setFacilityFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [facilityId, setFacilityId] = useState(facilities[0].id);
  const [postType, setPostType] = useState('maintenance');

  const active = incidents.find((i) => i.status === 'Investigating');
  const visible = incidents.filter((i) => facilityFilter === 'all' || i.facilityId === facilityFilter);

  function submit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    onPostIncident({ title, facilityId, type: postType });
    setTitle('');
    setShowForm(false);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Incidents &amp; Maintenance</h1>
          <p>Consolidated from your provider's operations systems — no more chasing status by email.</p>
        </div>
        {canPost && (
          <button className="btn-secondary" onClick={() => setShowForm((v) => !v)}>
            <IconAlert />
            Post Incident / Maintenance
          </button>
        )}
      </div>

      {showForm && (
        <form className="card" style={{ padding: 16, marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-end' }} onSubmit={submit}>
          <div style={{ flex: 1 }}>
            <span className="field-label">What happened?</span>
            <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Scheduled generator load test" />
          </div>
          <div style={{ width: 180 }}>
            <span className="field-label">Type</span>
            <select className="field" value={postType} onChange={(e) => setPostType(e.target.value)}>
              <option value="maintenance">Maintenance</option>
              <option value="incident">Incident</option>
            </select>
          </div>
          <div style={{ width: 200 }}>
            <span className="field-label">Facility</span>
            <select className="field" value={facilityId} onChange={(e) => setFacilityId(e.target.value)}>
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
          <button className="btn-primary" type="submit">
            Post
          </button>
        </form>
      )}

      {active && !canPost && (
        <div className="banner">
          <IconAlert style={{ color: 'var(--warning)', flexShrink: 0 }} />
          <span>
            Active: {active.title} at {facilities.find((f) => f.id === active.facilityId)?.name.split(' — ')[0]} —
            engineering team investigating since {active.start.split(' ').slice(-2).join(' ')}.
          </span>
        </div>
      )}

      <div className="filters">
        <select className="field" style={{ width: 'auto' }} value={facilityFilter} onChange={(e) => setFacilityFilter(e.target.value)}>
          <option value="all">All facilities</option>
          {facilities.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      <div className="card timeline">
        {visible.map((i, idx) => (
          <div className="timeline-item" key={i.id}>
            {idx < visible.length - 1 && <div className="timeline-line" />}
            <div className="timeline-dot" style={{ background: DOT_COLOR[i.status] || 'var(--text-3)' }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{i.title}</span>
                <span
                  className="badge"
                  style={{
                    background:
                      i.status === 'Investigating' ? 'var(--warning-soft)' : i.status === 'Resolved' ? 'var(--success-soft)' : 'oklch(93% 0.01 255)',
                    color: i.status === 'Investigating' ? 'var(--warning)' : i.status === 'Resolved' ? 'var(--success)' : 'var(--text-2)',
                  }}
                >
                  {i.status}
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>
                {facilities.find((f) => f.id === i.facilityId)?.name.split(' — ')[0]} · {i.start}
              </div>
              {i.description && (
                <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '8px 0 0 0', maxWidth: 560 }}>{i.description}</p>
              )}
            </div>
          </div>
        ))}
        {visible.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-3)', padding: '24px 0' }}>Nothing to show for this facility.</div>
        )}
      </div>
    </div>
  );
}
