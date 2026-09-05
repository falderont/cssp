import React from 'react';
import StatusBadge from './StatusBadge.jsx';
import { IconTicket, IconAlert, IconClock, IconCheck, IconUsers, IconDoc2 } from './icons.jsx';
import { facilities, enterpriseAccount } from '../data/mockData.js';

function facilityName(id) {
  if (!id) return 'All facilities';
  return facilities.find((f) => f.id === id)?.name.split(' — ')[0] || id;
}

export default function Dashboard({ user, tickets, incidents, visitors, documents, remoteHandsTasks }) {
  const myTickets = tickets.filter((t) => t.account === user.account);
  const myVisitors = visitors.filter((v) => v.account === user.account);
  const myDocs = documents.filter((d) => !d.account || d.account === user.account);
  const myRemoteHands = remoteHandsTasks.filter((r) => r.account === user.account);
  const openTickets = myTickets.filter((t) => t.status !== 'Done');
  const activeIncidents = incidents.filter((i) => i.status === 'Investigating');
  const upcomingVisitors = myVisitors.filter((v) => v.status === 'Pending' || v.status === 'Approved');
  const openRemoteHands = myRemoteHands.filter((r) => r.status !== 'Completed');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>
            Welcome back, {user.name.split(' ')[0]} — everything happening across your{' '}
            {enterpriseAccount.siteIds.length} enrolled sites, in one place.
          </p>
        </div>
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}>
        <div className="card stat-card">
          <span className="stat-label">Upcoming Visitors</span>
          <span className="stat-value">{upcomingVisitors.length}</span>
          <span className="stat-sub">
            {upcomingVisitors[0] ? `Next: ${upcomingVisitors[0].date}` : 'None scheduled'}
          </span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Open Tickets</span>
          <span className="stat-value">{openTickets.length}</span>
          <span className="stat-sub">across complaints, RFIs & requests</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Remote Hands</span>
          <span className="stat-value">{openRemoteHands.length}</span>
          <span className="stat-sub">
            {openRemoteHands[0] ? `${openRemoteHands[0].status} · ${facilityName(openRemoteHands[0].facilityId)}` : 'None open'}
          </span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Active Incidents</span>
          <span className="stat-value" style={{ color: activeIncidents.length ? 'var(--warning)' : 'var(--text)' }}>
            {activeIncidents.length}
          </span>
          <span className="stat-sub">
            {activeIncidents[0] ? `${activeIncidents[0].title}` : 'All clear'}
          </span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Documents</span>
          <span className="stat-value">{myDocs.length}</span>
          <span className="stat-sub">available to download</span>
        </div>
      </div>

      <div className="two-col" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-head">
            <h3>Recent Tickets</h3>
          </div>
          {myTickets.slice(0, 3).map((t) => (
            <div className="row-item" key={t.id}>
              <div
                className="icon-wrap"
                style={{
                  background: t.category === 'Complaint' ? 'var(--danger-soft)' : t.status === 'Done' ? 'oklch(96% 0.005 255)' : 'var(--accent-soft)',
                  color: t.category === 'Complaint' ? 'var(--danger)' : t.status === 'Done' ? 'var(--text-3)' : 'var(--accent)',
                }}
              >
                {t.status === 'Done' ? <IconCheck /> : t.category === 'Complaint' ? <IconAlert /> : <IconTicket />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{t.category} — {t.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                  {facilityName(t.facilityId)} · {t.submitted}
                </div>
              </div>
              <StatusBadge status={t.status} />
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Incidents & Maintenance</h3>
          </div>
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {incidents.slice(0, 2).map((i) => {
              const isActive = i.status === 'Investigating';
              const isUpcoming = i.status === 'Upcoming';
              const Icon = isActive ? IconAlert : isUpcoming ? IconClock : IconCheck;
              const bg = isActive ? 'var(--warning-soft)' : isUpcoming ? 'oklch(97% 0.004 255)' : 'var(--success-soft)';
              const color = isActive ? 'var(--warning)' : isUpcoming ? 'var(--text-2)' : 'var(--success)';
              return (
                <div key={i.id} style={{ display: 'flex', gap: 10, padding: 11, borderRadius: 8, background: bg }}>
                  <Icon style={{ color, flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{i.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
                      {facilityName(i.facilityId)} · {i.status}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-head">
            <h3>Upcoming Visitors</h3>
          </div>
          {upcomingVisitors.length === 0 && (
            <div style={{ padding: '20px', color: 'var(--text-3)', fontSize: 13 }}>Nothing scheduled.</div>
          )}
          {upcomingVisitors.slice(0, 3).map((v) => (
            <div className="row-item" key={v.id}>
              <div className="icon-wrap" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                <IconUsers width={15} height={15} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{v.name} — {v.company}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                  {facilityName(v.facilityId)} · {v.date}, {v.window}
                </div>
              </div>
              <StatusBadge status={v.status} />
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Recently Published Documents</h3>
          </div>
          {myDocs.slice(0, 3).map((d) => (
            <div className="row-item" key={d.id}>
              <div className="icon-wrap" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                <IconDoc2 />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{d.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                  {d.category} · {d.published}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
