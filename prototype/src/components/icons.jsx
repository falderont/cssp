// Small stroke-based icon set shared across the app. Kept as plain inline
// SVGs (no icon library dependency) to match the mockups pixel-for-pixel.
import React from 'react';

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export function IconGrid(props) {
  return (
    <svg {...base} width="18" height="18" {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function IconTicket(props) {
  return (
    <svg {...base} width="18" height="18" {...props}>
      <path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1.5a1.5 1.5 0 0 0 0 3V15a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1.5a1.5 1.5 0 0 0 0-3V9Z" />
      <path d="M13 7v10" strokeDasharray="2 2" />
    </svg>
  );
}

export function IconAlert(props) {
  return (
    <svg {...base} width="18" height="18" {...props}>
      <path d="M10.6 4.3a1.6 1.6 0 0 1 2.8 0l8 14.2a1.6 1.6 0 0 1-1.4 2.4H4a1.6 1.6 0 0 1-1.4-2.4l8-14.2Z" />
      <path d="M12 10v4" />
      <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconDoc(props) {
  return (
    <svg {...base} width="18" height="18" {...props}>
      <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M14 3v5h5" />
      <path d="M8 13h8M8 17h8M8 9h3" />
    </svg>
  );
}

export function IconSettings(props) {
  return (
    <svg {...base} width="18" height="18" {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1h-.2a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h0a1.7 1.7 0 0 0 1-1.6v-.2a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v0a1.7 1.7 0 0 0 1.6 1h.2a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1Z" />
    </svg>
  );
}

export function IconUsers(props) {
  return (
    <svg {...base} width="18" height="18" {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M2 20c0-3.3 3.1-6 7-6s7 2.7 7 6" />
      <circle cx="17" cy="8" r="2.5" />
      <path d="M16 14.2c2.9.5 5 2.7 5 5.8" />
    </svg>
  );
}

export function IconInbox(props) {
  return (
    <svg {...base} width="18" height="18" {...props}>
      <path d="M3 12h4.5l1.5 3h6l1.5-3H21" />
      <path d="M5 6h14l2 6v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-7l2-6Z" />
    </svg>
  );
}

export function IconPlus(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      width="16"
      height="16"
      {...props}
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconClock(props) {
  return (
    <svg {...base} width="14" height="14" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

export function IconCheck(props) {
  return (
    <svg {...base} width="16" height="16" {...props}>
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}

export function IconDownloadFolder(props) {
  return (
    <svg {...base} width="18" height="18" {...props}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
      <path d="M12 10.5v5.5M9.5 13.5l2.5 2.5 2.5-2.5" />
    </svg>
  );
}

export function IconDownload(props) {
  return (
    <svg {...base} width="13" height="13" strokeWidth={1.8} {...props}>
      <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />
    </svg>
  );
}

export function IconDoc2(props) {
  return (
    <svg {...base} width="15" height="15" {...props}>
      <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M14 3v5h5" />
    </svg>
  );
}

export function IconHand(props) {
  return (
    <svg {...base} width="18" height="18" {...props}>
      <path d="M8 13V6a1.5 1.5 0 0 1 3 0v5" />
      <path d="M11 11V4.5a1.5 1.5 0 0 1 3 0V11" />
      <path d="M14 11.5V6a1.5 1.5 0 0 1 3 0v7" />
      <path d="M17 12v-2a1.5 1.5 0 0 1 3 0v6a6 6 0 0 1-6 6h-2a7 7 0 0 1-5.6-2.8L3 15.7c-.6-.8-.4-1.9.4-2.4.7-.5 1.7-.4 2.3.3L8 16" />
    </svg>
  );
}

export function IconTeam(props) {
  return (
    <svg {...base} width="18" height="18" {...props}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="10" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
