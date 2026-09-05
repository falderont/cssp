import React, { useState } from 'react';
import { facilities, ticketCategories, ticketStatuses, documentCategories, csTeam } from '../data/mockData.js';
import { IconUsers } from './icons.jsx';
import StatusBadge from './StatusBadge.jsx';

const CATEGORY_STYLE = {
  Complaint: { background: 'var(--danger-soft)', color: 'var(--danger)' },
  RFI: { background: 'var(--accent-soft)', color: 'var(--accent)' },
  'Service Request': { background: 'oklch(96% 0.005 255)', color: 'var(--text-3)' },
};

export default function ProviderConsole({
  tickets,
  visitors,
  documents,
  remoteHandsTasks,
  onUpdateTicketStatus,
  onDecideVisitor,
  onPublishDocument,
  onAcceptRemoteHands,
  onStartRemoteHands,
  onCompleteRemoteHands,
}) {
  const [tab, setTab] = useState('tickets');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const openRemoteHands = remoteHandsTasks.filter((r) => r.status !== 'Completed');

  const pendingVisitors = visitors.filter((v) => v.status === 'Pending');
  const openTickets = tickets.filter((t) => t.status !== 'Done');

  const visibleTickets = tickets.filter((t) => {
    const matchesSearch =
      !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.account.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Console</h1>
          <p>Everything customers have submitted, in one place.</p>
        </div>
      </div>

      {pendingVisitors.length > 0 && tab !== 'visitors' && (
        <div className="banner" style={{ background: 'var(--accent-soft)', cursor: 'pointer' }} onClick={() => setTab('visitors')}>
          <IconUsers style={{ color: 'var(--accent)', flexShrink: 0 }} />
          <span>
            {pendingVisitors.length} visitor{pendingVisitors.length === 1 ? '' : 's'} awaiting approval across your facilities.
          </span>
          <span style={{ marginLeft: 'auto', fontWeight: 700, color: 'var(--accent)' }}>Review →</span>
        </div>
      )}

      <div className="card">
        <div className="tabs">
          <button className={`tab ${tab === 'tickets' ? 'active' : ''}`} onClick={() => setTab('tickets')}>
            Ticket Queue ({openTickets.length})
          </button>
          <button className={`tab ${tab === 'remotehands' ? 'active' : ''}`} onClick={() => setTab('remotehands')}>
            Remote Hands ({openRemoteHands.length})
          </button>
          <button className={`tab ${tab === 'visitors' ? 'active' : ''}`} onClick={() => setTab('visitors')}>
            Visitor Approvals ({pendingVisitors.length})
          </button>
          <button className={`tab ${tab === 'documents' ? 'active' : ''}`} onClick={() => setTab('documents')}>
            Documents
          </button>
        </div>

        {tab === 'tickets' && (
          <TicketQueue
            tickets={visibleTickets}
            search={search}
            setSearch={setSearch}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            onUpdateTicketStatus={onUpdateTicketStatus}
          />
        )}
        {tab === 'remotehands' && (
          <RemoteHandsQueue
            tasks={remoteHandsTasks}
            onAcceptRemoteHands={onAcceptRemoteHands}
            onStartRemoteHands={onStartRemoteHands}
            onCompleteRemoteHands={onCompleteRemoteHands}
          />
        )}
        {tab === 'visitors' && <VisitorApprovals visitors={visitors} onDecideVisitor={onDecideVisitor} />}
        {tab === 'documents' && <DocumentPublisher documents={documents} onPublishDocument={onPublishDocument} />}
      </div>
    </div>
  );
}

function TicketQueue({ tickets, search, setSearch, statusFilter, setStatusFilter, onUpdateTicketStatus }) {
  return (
    <>
      <div className="filters" style={{ padding: '16px 20px', margin: 0, borderBottom: '1px solid var(--border)' }}>
        <input className="field" style={{ maxWidth: 280 }} placeholder="Search accounts or tickets" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="field" style={{ width: 'auto' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          {ticketStatuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <table className="req-table">
        <thead>
          <tr>
            <th>Ticket</th>
            <th>Account</th>
            <th>Category</th>
            <th>Status</th>
            <th>Assigned</th>
            <th>Submitted</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t.id}>
              <td style={{ fontWeight: 600 }}>{t.title}</td>
              <td style={{ color: 'var(--text-2)' }}>{t.account}</td>
              <td>
                <span className="badge" style={CATEGORY_STYLE[t.category]}>
                  {t.category}
                </span>
              </td>
              <td>
                <select className="status-select" value={t.status} onChange={(e) => onUpdateTicketStatus(t.id, e.target.value)}>
                  {ticketStatuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </td>
              <td style={{ color: t.assignedTo ? 'var(--text)' : 'var(--text-3)' }}>{t.assignedTo || 'Unassigned'}</td>
              <td style={{ color: 'var(--text-2)' }}>{t.submitted}</td>
            </tr>
          ))}
          {tickets.length === 0 && (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-3)', padding: '24px 0' }}>
                No matching tickets.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}

function RemoteHandsQueue({ tasks, onAcceptRemoteHands, onStartRemoteHands, onCompleteRemoteHands }) {
  const [technician, setTechnician] = useState({});

  return (
    <table className="req-table">
      <thead>
        <tr>
          <th>Task</th>
          <th>Account</th>
          <th>Facility</th>
          <th>Status</th>
          <th>Technician</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {tasks.map((t) => (
          <tr key={t.id}>
            <td style={{ fontWeight: 600 }}>
              {t.taskType} — {t.assetRef}
            </td>
            <td style={{ color: 'var(--text-2)' }}>{t.account}</td>
            <td style={{ color: 'var(--text-2)' }}>
              {facilities.find((f) => f.id === t.facilityId)?.name.split(' — ')[0]}
            </td>
            <td>
              <StatusBadge status={t.status} />
            </td>
            <td style={{ color: t.assignedTechnician ? 'var(--text)' : 'var(--text-3)' }}>
              {t.status === 'Submitted' ? (
                <select
                  className="status-select"
                  value={technician[t.id] || ''}
                  onChange={(e) => setTechnician((prev) => ({ ...prev, [t.id]: e.target.value }))}
                >
                  <option value="">Pick technician…</option>
                  {csTeam.map((r) => (
                    <option key={r.id} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                </select>
              ) : (
                t.assignedTechnician || 'Unassigned'
              )}
            </td>
            <td>
              {t.status === 'Submitted' && (
                <button
                  className="btn-secondary"
                  style={{ padding: '6px 10px', fontSize: 12 }}
                  disabled={!technician[t.id]}
                  onClick={() => onAcceptRemoteHands(t.id, technician[t.id])}
                >
                  Accept &amp; Assign
                </button>
              )}
              {t.status === 'Accepted' && (
                <button className="btn-secondary" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => onStartRemoteHands(t.id)}>
                  Start Task
                </button>
              )}
              {t.status === 'In Progress' && (
                <button className="btn-primary" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => onCompleteRemoteHands(t.id)}>
                  Complete Task
                </button>
              )}
              {t.status === 'Completed' && (
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{t.billableMinutes} min billed</span>
              )}
            </td>
          </tr>
        ))}
        {tasks.length === 0 && (
          <tr>
            <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-3)', padding: '24px 0' }}>
              No remote hands requests.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function VisitorApprovals({ visitors, onDecideVisitor }) {
  const pending = visitors.filter((v) => v.status === 'Pending');
  const decided = visitors.filter((v) => v.status !== 'Pending');

  return (
    <div style={{ padding: '20px' }}>
      <h3 style={{ fontSize: 14, marginBottom: 12 }}>Awaiting approval</h3>
      {pending.length === 0 && <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Nothing pending.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {pending.map((v) => (
          <div key={v.id} className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>
                {v.name} <span style={{ fontWeight: 400, color: 'var(--text-3)' }}>· {v.company}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
                {v.account} · {facilities.find((f) => f.id === v.facilityId)?.name.split(' — ')[0]} · {v.date}, {v.window} · {v.purpose}
              </div>
            </div>
            <button className="btn-secondary" onClick={() => onDecideVisitor(v.id, 'Denied')}>
              Deny
            </button>
            <button className="btn-primary" onClick={() => onDecideVisitor(v.id, 'Approved')}>
              Approve
            </button>
          </div>
        ))}
      </div>

      <h3 style={{ fontSize: 14, marginBottom: 12 }}>Recently decided</h3>
      <table className="req-table" style={{ border: '1px solid var(--border)', borderRadius: 10 }}>
        <thead>
          <tr>
            <th>Visitor</th>
            <th>Account</th>
            <th>Facility</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {decided.map((v) => (
            <tr key={v.id}>
              <td style={{ fontWeight: 600 }}>{v.name}</td>
              <td style={{ color: 'var(--text-2)' }}>{v.account}</td>
              <td style={{ color: 'var(--text-2)' }}>{facilities.find((f) => f.id === v.facilityId)?.name.split(' — ')[0]}</td>
              <td>
                <span
                  className="badge"
                  style={
                    v.status === 'Denied'
                      ? { background: 'var(--danger-soft)', color: 'var(--danger)' }
                      : { background: 'var(--success-soft)', color: 'var(--success)' }
                  }
                >
                  {v.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DocumentPublisher({ documents, onPublishDocument }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(documentCategories[0]);
  const [facilityId, setFacilityId] = useState('');
  const [account, setAccount] = useState('Meridian Logistics');

  function submit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    onPublishDocument({ title, category, facilityId: facilityId || null, account: account || null });
    setTitle('');
  }

  return (
    <div style={{ padding: 20 }}>
      <form className="card" style={{ padding: 16, display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 20 }} onSubmit={submit}>
        <div style={{ flex: 1.4 }}>
          <span className="field-label">Document title</span>
          <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. September 2026 SLA Report" />
        </div>
        <div style={{ flex: 1 }}>
          <span className="field-label">Category</span>
          <select className="field" value={category} onChange={(e) => setCategory(e.target.value)}>
            {documentCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <span className="field-label">Account</span>
          <input className="field" value={account} onChange={(e) => setAccount(e.target.value)} placeholder="Account name" />
        </div>
        <button className="btn-primary" type="submit">
          Publish
        </button>
      </form>

      <table className="req-table" style={{ border: '1px solid var(--border)', borderRadius: 10 }}>
        <thead>
          <tr>
            <th>Document</th>
            <th>Category</th>
            <th>Account</th>
            <th>Published</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((d) => (
            <tr key={d.id}>
              <td style={{ fontWeight: 600 }}>{d.title}</td>
              <td style={{ color: 'var(--text-2)' }}>{d.category}</td>
              <td style={{ color: 'var(--text-2)' }}>{d.account || 'All accounts'}</td>
              <td style={{ color: 'var(--text-2)' }}>{d.published}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
