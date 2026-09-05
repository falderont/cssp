import React from 'react';
import {
  IconGrid,
  IconTicket,
  IconAlert,
  IconSettings,
  IconUsers,
  IconInbox,
  IconDownloadFolder,
  IconHand,
  IconTeam,
} from './icons.jsx';
import { facilities, enterpriseAccount } from '../data/mockData.js';

const CUSTOMER_NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: IconGrid },
  { id: 'visitors', label: 'Visitors', icon: IconUsers },
  { id: 'incidents', label: 'Incidents & Maintenance', icon: IconAlert },
  { id: 'documents', label: 'Download Center', icon: IconDownloadFolder },
  { id: 'tickets', label: 'Tickets', icon: IconTicket },
  { id: 'remotehands', label: 'Remote Hands', icon: IconHand },
];

const PROVIDER_NAV = [
  { id: 'console', label: 'Console', icon: IconInbox },
  { id: 'incidents', label: 'Incidents & Maintenance', icon: IconAlert },
  { id: 'engagement', label: 'CS Engagement', icon: IconTeam },
];

export default function Sidebar({ role, page, onNavigate, onSwitchRole, user, selectedFacility, onSelectFacility }) {
  const items = role === 'provider' ? PROVIDER_NAV : CUSTOMER_NAV;

  return (
    <div className="sidebar">
      <div className="brand">
        <div className="brand-mark">C</div>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16 }}>
          CSSP
        </div>
        {role === 'provider' && (
          <span className="badge" style={{ background: 'oklch(93% 0.01 255)', color: 'var(--text-2)', marginLeft: 'auto' }}>
            Provider
          </span>
        )}
      </div>

      {role === 'customer' && (
        <div className="switcher">
          <div className="switcher-row">
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="switcher-label">Enterprise Account</span>
              <span className="switcher-value">{enterpriseAccount.name}</span>
            </div>
          </div>
          <div className="switcher-row" style={{ borderBottom: 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
              <span className="switcher-label">Site</span>
              <select
                className="switcher-select"
                value={selectedFacility}
                onChange={(e) => onSelectFacility(e.target.value)}
              >
                <option value="all">All sites ({enterpriseAccount.siteIds.length}) · Global Admin</option>
                {facilities
                  .filter((f) => enterpriseAccount.siteIds.includes(f.id))
                  .map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="role-toggle">
        <button
          className={role === 'customer' ? 'active' : ''}
          onClick={() => onSwitchRole('customer')}
        >
          Customer view
        </button>
        <button
          className={role === 'provider' ? 'active' : ''}
          onClick={() => onSwitchRole('provider')}
        >
          Provider view
        </button>
      </div>

      <div className="nav">
        {items.map((item) => (
          <button
            key={item.id}
            className={`nav-link ${page === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <item.icon />
            {item.label}
          </button>
        ))}
        <button
          className={`nav-link ${page === 'settings' ? 'active' : ''}`}
          onClick={() => onNavigate('settings')}
        >
          <IconSettings />
          Settings
        </button>
      </div>

      <div className="user-chip">
        <div className="avatar">{user.initials}</div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{user.name}</span>
          <span
            style={{
              fontSize: 11,
              color: 'var(--text-3)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {user.role}
          </span>
        </div>
      </div>
    </div>
  );
}
