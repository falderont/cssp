import React, { useState } from 'react';
import StatusBadge from './StatusBadge.jsx';
import { facilities, remoteHandsTaskTypes, remoteHandsStatuses } from '../data/mockData.js';

const STEPS = remoteHandsStatuses; // Submitted -> Accepted -> In Progress -> Completed

function facilityName(id) {
  return facilities.find((f) => f.id === id)?.name.split(' — ')[0] || id;
}

function StatusSteps({ status }) {
  const currentIndex = STEPS.indexOf(status);
  return (
    <div className="step-track">
      {STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <div className={`step ${i < currentIndex ? 'done' : i === currentIndex ? 'current' : ''}`}>
            <div className={`step-dot ${i < currentIndex ? 'done' : i === currentIndex ? 'current' : ''}`} />
            {s}
          </div>
          {i < STEPS.length - 1 && <div className="step-line" />}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function RemoteHands({ user, tasks, onRequestRemoteHands }) {
  const [taskType, setTaskType] = useState(remoteHandsTaskTypes[0]);
  const [facilityId, setFacilityId] = useState(facilities[0].id);
  const [assetRef, setAssetRef] = useState('');
  const [description, setDescription] = useState('');
  const [requestedDate, setRequestedDate] = useState('');
  const [requestedWindow, setRequestedWindow] = useState('');
  const [justSubmitted, setJustSubmitted] = useState(false);

  const mine = tasks.filter((t) => t.account === user.account);

  function handleSubmit(e) {
    e.preventDefault();
    if (!assetRef.trim()) return;
    onRequestRemoteHands({
      taskType,
      facilityId,
      assetRef,
      description,
      requestedDate,
      requestedWindow,
      account: user.account,
    });
    setAssetRef('');
    setDescription('');
    setRequestedDate('');
    setRequestedWindow('');
    setJustSubmitted(true);
    setTimeout(() => setJustSubmitted(false), 2500);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Remote Hands</h1>
          <p>Request physical work on-site — power cycles, cabling, inspections — and track it through to completion with photo proof.</p>
        </div>
      </div>

      <div className="two-col" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
        <div className="card" style={{ padding: 0 }}>
          <div className="card-head">
            <h3>Your Requests</h3>
          </div>
          {mine.length === 0 && (
            <div style={{ padding: 20, color: 'var(--text-3)', fontSize: 13 }}>No remote hands requests yet.</div>
          )}
          {mine.map((t) => (
            <div key={t.id} style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>
                    {t.taskType} — {t.assetRef}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                    {facilityName(t.facilityId)} · {t.status === 'Completed' ? `Completed ${t.completedAt?.slice(0, 10) || ''}` : `Requested ${t.requestedDate}${t.requestedWindow ? `, ${t.requestedWindow}` : ''}`}
                  </div>
                </div>
                <StatusBadge status={t.status} />
              </div>

              {t.status !== 'Completed' && <StatusSteps status={t.status} />}

              {t.status === 'In Progress' && t.assignedTechnician && (
                <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 10 }}>
                  Assigned to <span style={{ fontWeight: 600, color: 'var(--text)' }}>{t.assignedTechnician}</span>
                  {t.startedAt ? ` — started ${t.startedAt.split(' ')[1] || t.startedAt}` : ''}
                </div>
              )}

              {t.status === 'Completed' && (
                <>
                  {t.completionNotes && (
                    <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '10px 0 0 0' }}>
                      Technician notes: {t.completionNotes}
                    </p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, fontSize: 12, color: 'var(--text-3)' }}>
                    <span>{t.assignedTechnician}</span>
                    {t.billableMinutes != null && <span>· {t.billableMinutes} min billed</span>}
                    {t.csatRating && (
                      <span className="badge" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                        {t.csatRating === 'up' ? '👍 Helpful' : '👎 Needs work'}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <form className="card" style={{ height: 'fit-content' }} onSubmit={handleSubmit}>
          <div className="card-head" style={{ display: 'block' }}>
            <h3>New Remote Hands Request</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: 12, color: 'var(--text-3)' }}>
              Billable per your contract's included-hours allowance.
            </p>
          </div>
          <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <span className="field-label">Task type</span>
              <select className="field" value={taskType} onChange={(e) => setTaskType(e.target.value)}>
                {remoteHandsTaskTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
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
              <span className="field-label">Asset / rack reference</span>
              <input
                className="field"
                value={assetRef}
                onChange={(e) => setAssetRef(e.target.value)}
                placeholder="e.g. Rack C14, Switch SW-C14-02"
              />
            </div>
            <div>
              <span className="field-label">Description</span>
              <textarea
                className="field"
                rows={3}
                style={{ resize: 'none' }}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What should the technician do?"
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <span className="field-label">Requested date</span>
                <input className="field" value={requestedDate} onChange={(e) => setRequestedDate(e.target.value)} placeholder="2026-09-10" />
              </div>
              <div style={{ flex: 1 }}>
                <span className="field-label">Time window</span>
                <input className="field" value={requestedWindow} onChange={(e) => setRequestedWindow(e.target.value)} placeholder="09:00–10:00" />
              </div>
            </div>
            <button className="btn-primary" type="submit" style={{ justifyContent: 'center', marginTop: 4 }}>
              Submit Request
            </button>
            {justSubmitted && (
              <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600, textAlign: 'center' }}>
                Submitted — now visible in the provider's Remote Hands queue.
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
