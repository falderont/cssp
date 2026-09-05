import React, { useState } from 'react';
import { facilities, documentCategories } from '../data/mockData.js';
import { IconDoc2, IconDownload } from './icons.jsx';

const CATEGORY_STYLE = {
  'SLA Report': { background: 'var(--accent-soft)', color: 'var(--accent)' },
  Compliance: { background: 'var(--success-soft)', color: 'var(--success)' },
  Invoice: { background: 'oklch(93% 0.01 255)', color: 'var(--text-2)' },
};

export default function Documents({ user, documents }) {
  const [tab, setTab] = useState('All');
  const mine = documents.filter((d) => !d.account || d.account === user.account);
  const visible = tab === 'All' ? mine : mine.filter((d) => d.category === tab);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Download Center</h1>
          <p>Reports and documents your provider has published for your account — no more asking by email.</p>
        </div>
      </div>

      <div className="card">
        <div className="tabs">
          {['All', ...documentCategories].map((c) => (
            <button key={c} className={`tab ${tab === c ? 'active' : ''}`} onClick={() => setTab(c)}>
              {c} ({c === 'All' ? mine.length : mine.filter((d) => d.category === c).length})
            </button>
          ))}
        </div>
        <table className="req-table">
          <thead>
            <tr>
              <th>Document</th>
              <th>Facility</th>
              <th>Category</th>
              <th>Published</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((d) => (
              <tr key={d.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="icon-wrap" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', width: 32, height: 32 }}>
                      <IconDoc2 />
                    </div>
                    <span style={{ fontWeight: 600 }}>{d.title}</span>
                  </div>
                </td>
                <td style={{ color: 'var(--text-2)' }}>
                  {d.facilityId ? facilities.find((f) => f.id === d.facilityId)?.name.split(' — ')[0] : 'All facilities'}
                </td>
                <td>
                  <span className="badge" style={CATEGORY_STYLE[d.category]}>
                    {d.category}
                  </span>
                </td>
                <td style={{ color: 'var(--text-2)' }}>{d.published}</td>
                <td>
                  <button className="btn-secondary">
                    <IconDownload />
                    Download
                  </button>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-3)', padding: '24px 0' }}>
                  No documents in this category yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
