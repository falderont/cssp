import React, { useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './components/Dashboard.jsx';
import Visitors from './components/Visitors.jsx';
import Incidents from './components/Incidents.jsx';
import Documents from './components/Documents.jsx';
import Tickets from './components/Tickets.jsx';
import RemoteHands from './components/RemoteHands.jsx';
import ProviderConsole from './components/ProviderConsole.jsx';
import CSEngagement from './components/CSEngagement.jsx';
import Placeholder from './components/Placeholder.jsx';
import {
  initialVisitors,
  initialTickets,
  initialDocuments,
  initialIncidents,
  initialRemoteHandsTasks,
  initialEngagementLogs,
  currentCustomerUser,
  currentProviderUser,
} from './data/mockData.js';

let ticketCounter = 3302;
let visitorCounter = 206;
let docCounter = 502;
let incidentCounter = 90;
let remoteHandsCounter = 119;
let engagementCounter = 502;

export default function App() {
  const [role, setRole] = useState('customer');
  const [page, setPage] = useState('dashboard');
  const [tickets, setTickets] = useState(initialTickets);
  const [visitors, setVisitors] = useState(initialVisitors);
  const [documents, setDocuments] = useState(initialDocuments);
  const [incidents, setIncidents] = useState(initialIncidents);
  const [remoteHandsTasks, setRemoteHandsTasks] = useState(initialRemoteHandsTasks);
  const [engagementLogs, setEngagementLogs] = useState(initialEngagementLogs);
  // 'all' = Global Admin roll-up across every site enrollment (PRD v4 section
  // 4); a specific facility id simulates what a Site Contact would see.
  const [selectedFacility, setSelectedFacility] = useState('all');

  function handleSwitchRole(nextRole) {
    setRole(nextRole);
    setPage(nextRole === 'provider' ? 'console' : 'dashboard');
  }

  function handleCreateTicket({ title, category, facilityId, description, account }) {
    setTickets((prev) => [
      {
        id: `TCK-${ticketCounter++}`,
        title,
        category,
        facilityId,
        account,
        status: 'Submitted',
        assignedTo: null,
        submitted: new Date().toISOString().slice(0, 10),
        description,
      },
      ...prev,
    ]);
  }

  function handleUpdateTicketStatus(id, status) {
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  }

  function handleRegisterVisitor({ name, company, purpose, facilityId, date, window, host }) {
    setVisitors((prev) => [
      {
        id: `VIS-${visitorCounter++}`,
        name,
        company,
        purpose,
        facilityId,
        account: currentCustomerUser.account,
        host,
        date,
        window,
        status: 'Pending',
      },
      ...prev,
    ]);
  }

  function handleDecideVisitor(id, status) {
    setVisitors((prev) => prev.map((v) => (v.id === id ? { ...v, status } : v)));
  }

  function handlePublishDocument({ title, category, facilityId, account }) {
    setDocuments((prev) => [
      {
        id: `DOC-${docCounter++}`,
        title,
        category,
        facilityId,
        account,
        published: new Date().toISOString().slice(0, 10),
      },
      ...prev,
    ]);
  }

  function handlePostIncident({ title, facilityId, type }) {
    setIncidents((prev) => [
      {
        id: `${type === 'incident' ? 'INC' : 'MNT'}-${incidentCounter++}`,
        title,
        type,
        facilityId,
        status: type === 'incident' ? 'Investigating' : 'Upcoming',
        start: new Date().toISOString().slice(0, 16).replace('T', ' ') + ' WIB',
        description: '',
      },
      ...prev,
    ]);
  }

  function handleRequestRemoteHands({ taskType, facilityId, assetRef, description, requestedDate, requestedWindow, account }) {
    setRemoteHandsTasks((prev) => [
      {
        id: `RH-${remoteHandsCounter++}`,
        taskType,
        facilityId,
        assetRef,
        description,
        account,
        requestedDate,
        requestedWindow,
        status: 'Submitted',
        assignedTechnician: null,
        startedAt: null,
        completedAt: null,
        billableMinutes: null,
        completionNotes: '',
        csatRating: null,
      },
      ...prev,
    ]);
  }

  function handleAcceptRemoteHands(id, technicianName) {
    setRemoteHandsTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'Accepted', assignedTechnician: technicianName } : t))
    );
  }

  function handleStartRemoteHands(id) {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    setRemoteHandsTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'In Progress', startedAt: now } : t)));
  }

  function handleCompleteRemoteHands(id) {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    setRemoteHandsTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const billable = t.startedAt
          ? Math.max(5, Math.round((Date.now() - new Date(t.startedAt.replace(' ', 'T')).getTime()) / 60000))
          : 20;
        return {
          ...t,
          status: 'Completed',
          completedAt: now,
          billableMinutes: Math.min(billable, 90),
          completionNotes: t.completionNotes || 'Task completed on site — no issues encountered.',
        };
      })
    );
    // A completed task rolls into engagement history automatically (PRD v4
    // section 5) rather than needing a separate manual log entry.
    const task = remoteHandsTasks.find((t) => t.id === id);
    if (task) {
      setEngagementLogs((prev) => [
        {
          id: `ENG-${engagementCounter++}`,
          repName: task.assignedTechnician || currentProviderUser.name,
          type: 'ticket',
          account: task.account,
          notes: `Auto-logged from completed Remote Hands task "${task.taskType} — ${task.assetRef}".`,
          occurredAt: new Date().toISOString().slice(0, 10),
          linkedTicketId: null,
        },
        ...prev,
      ]);
    }
  }

  function handleLogEngagement({ repName, type, account, notes }) {
    setEngagementLogs((prev) => [
      {
        id: `ENG-${engagementCounter++}`,
        repName,
        type,
        account,
        notes,
        occurredAt: new Date().toISOString().slice(0, 10),
        linkedTicketId: null,
      },
      ...prev,
    ]);
  }

  const user = role === 'provider' ? currentProviderUser : currentCustomerUser;

  // Site scoping for the customer view (PRD v4 section 4): "all" is the
  // Global Admin roll-up; picking a site simulates a Site Contact's scoped
  // view. Facility-agnostic documents (facilityId null = enterprise-wide)
  // stay visible regardless of the selected site.
  const byFacility = (list) => (selectedFacility === 'all' ? list : list.filter((x) => x.facilityId === selectedFacility));
  const scopedVisitors = byFacility(visitors);
  const scopedTickets = byFacility(tickets);
  const scopedIncidents = byFacility(incidents);
  const scopedRemoteHands = byFacility(remoteHandsTasks);
  const scopedDocuments =
    selectedFacility === 'all' ? documents : documents.filter((d) => !d.facilityId || d.facilityId === selectedFacility);

  return (
    <div className="app-shell">
      <Sidebar
        role={role}
        page={page}
        onNavigate={setPage}
        onSwitchRole={handleSwitchRole}
        user={user}
        selectedFacility={selectedFacility}
        onSelectFacility={setSelectedFacility}
      />
      <div className="main">
        {role === 'customer' && (
          <>
            {page === 'dashboard' && (
              <Dashboard
                user={user}
                tickets={scopedTickets}
                incidents={scopedIncidents}
                visitors={scopedVisitors}
                documents={scopedDocuments}
                remoteHandsTasks={scopedRemoteHands}
              />
            )}
            {page === 'visitors' && <Visitors user={user} visitors={scopedVisitors} onRegisterVisitor={handleRegisterVisitor} />}
            {page === 'incidents' && <Incidents incidents={scopedIncidents} canPost={false} />}
            {page === 'documents' && <Documents user={user} documents={scopedDocuments} />}
            {page === 'tickets' && <Tickets user={user} tickets={scopedTickets} onCreateTicket={handleCreateTicket} />}
            {page === 'remotehands' && (
              <RemoteHands user={user} tasks={scopedRemoteHands} onRequestRemoteHands={handleRequestRemoteHands} />
            )}
            {page === 'settings' && <Placeholder title="Settings" />}
          </>
        )}

        {role === 'provider' && (
          <>
            {page === 'console' && (
              <ProviderConsole
                tickets={tickets}
                visitors={visitors}
                documents={documents}
                remoteHandsTasks={remoteHandsTasks}
                onUpdateTicketStatus={handleUpdateTicketStatus}
                onDecideVisitor={handleDecideVisitor}
                onPublishDocument={handlePublishDocument}
                onAcceptRemoteHands={handleAcceptRemoteHands}
                onStartRemoteHands={handleStartRemoteHands}
                onCompleteRemoteHands={handleCompleteRemoteHands}
              />
            )}
            {page === 'incidents' && <Incidents incidents={incidents} canPost onPostIncident={handlePostIncident} />}
            {page === 'engagement' && (
              <CSEngagement
                user={user}
                engagementLogs={engagementLogs}
                tickets={tickets}
                remoteHandsTasks={remoteHandsTasks}
                onLogEngagement={handleLogEngagement}
              />
            )}
            {page === 'settings' && <Placeholder title="Settings" />}
          </>
        )}
      </div>
    </div>
  );
}
