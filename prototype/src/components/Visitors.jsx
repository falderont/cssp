import React, { useState } from 'react';
import StatusBadge from './StatusBadge.jsx';
import { facilities } from '../data/mockData.js';

export default function Visitors({ user, visitors, onRegisterVisitor }) {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [purpose, setPurpose] = useState('');
  const [facilityId, setFacilityId] = useState(facilities[0].id);
  const [date, setDate] = useState('');
  const [window, setWindow] = useState('');
  const [justSubmitted, setJustSubmitted] = useState(false);

  const mine = visitors.filter((v) => v.account === user.account);

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !company.trim()) return;
    onRegisterVisitor({ name, company, purpose, facilityId, date: date || 'TBD', window: window || 'TBD', host: user.name });
    setName('');
    setCompany('');
    setPurpose('');
    setDate('');
    setWindow('');
    setJustSubmitted(true);
    setTimeout(() => setJustSubmitted(false), 2500);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Visitors</h1>
          <p>Register a visitor once — security handles approval and check-in from the same record.</p>
        </div>
      </div>

      <div className="two-col" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
        <div className="card">
          <table className="req-table">
            <thead>
              <tr>
                <th>Visitor</th>
                <th>Facility</th>
                <th>Visit window</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {mine.map((v) => (
                <tr key={v.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{v.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{v.company}</div>
                  </td>
                  <td style={{ color: 'var(--text-2)' }}>
                    {facilities.find((f) => f.id === v.facilityId)?.name.split(' — ')[0]}
                  </td>
                  <td style={{ color: 'var(--text-2)' }}>
                    {v.date}, {v.window}
                  </td>
                  <td>
                    <StatusBadge status={v.status} />
                  </td>
                </tr>
              ))}
              {mine.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-3)', padding: '24px 0' }}>
                    No visitors registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <form className="card" style={{ height: 'fit-content' }} onSubmit={handleSubmit}>
          <div className="card-head" style={{ display: 'block' }}>
            <h3>Register Visitor</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: 12, color: 'var(--text-3)' }}>
              Submitted visits need security approval before check-in.
            </p>
          </div>
          <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <span className="field-label">Visitor name</span>
              <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
            </div>
            <div>
              <span className="field-label">Company</span>
              <input className="field" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company or organization" />
            </div>
            <div>
              <span className="field-label">Purpose of visit</span>
              <input className="field" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. equipment install, audit" />
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
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <span className="field-label">Date</span>
                <input className="field" value={date} onChange={(e) => setDate(e.target.value)} placeholder="2026-09-10" />
              </div>
              <div style={{ flex: 1 }}>
                <span className="field-label">Time window</span>
                <input className="field" value={window} onChange={(e) => setWindow(e.target.value)} placeholder="10:00–11:00" />
              </div>
            </div>
            <button className="btn-primary" type="submit" style={{ justifyContent: 'center', marginTop: 4 }}>
              Submit for Approval
            </button>
            {justSubmitted && (
              <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600, textAlign: 'center' }}>
                Sent to the provider for approval.
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
