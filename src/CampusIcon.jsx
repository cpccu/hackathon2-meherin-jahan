export default function CampusIcon({ name, size = 22 }) {
  const paths = {
    transportation: <><rect x="4" y="3" width="16" height="17" rx="3"/><path d="M4 10h16M8 3v7M16 3v7M7 15h1M16 15h1M7 20v2M17 20v2"/></>,
    notifications: <><path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5l-2 3ZM10 21h4"/></>,
    home: <><path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-7h6v7" /></>,
    resources: <><path d="M3 7h7l2 2h9v11H3zM3 7V4h7l2 3" /></>,
    helpdesk: <><circle cx="12" cy="12" r="9" /><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 4M12 17h.01" /></>,
    events: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M7 3v4M17 3v4M3 11h18M8 15h2M14 15h2M8 18h2" /></>,
    lostfound: <><circle cx="10" cy="10" r="6" /><path d="m14.5 14.5 6 6M7 10h6M10 7v6" /></>,
    notices: <><path d="m4 10 13-5v14L4 14v-4ZM17 9h3v6h-3M6 15l2 6h3l-2-5" /></>,
    courses: <><path d="m2 9 10-5 10 5-10 5-10-5ZM6 11v6c3 3 9 3 12 0v-6M22 9v7" /></>,
    profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    admin: <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" /><path d="m8 12 3 3 5-6" /></>,
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    location: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Z" /><circle cx="12" cy="10" r="2" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    upload: <path d="M12 17V3m-5 5 5-5 5 5M4 17v4h16v-4" />,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V6a4 4 0 0 1 8 0v4M12 14v3" /></>,
    ticket: <><path d="M3 6h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4V6Z" /><path d="M15 6v3m0 2v2m0 2v3" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 6v6l4 2" /></>,
    copy: <><rect x="8" y="8" width="13" height="13" rx="2" /><path d="M16 8V3H3v13h5" /></>,
    edit: <><path d="m16 3 5 5-12 12-6 1 1-6L16 3ZM13 6l5 5" /></>,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5M20 12a8 8 0 0 0-14-5M4 12a8 8 0 0 0 14 5" /></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.resources}</svg>
}
