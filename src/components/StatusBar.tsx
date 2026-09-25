export default function StatusBar() {
  return (
    <div className="status-bar">
      <span>9:41</span>
      <div className="status-bar__icons">
        <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor">
          <rect x="0" y="4" width="3" height="7" rx=".5" opacity=".4" />
          <rect x="4.5" y="3" width="3" height="8" rx=".5" opacity=".6" />
          <rect x="9" y="1.5" width="3" height="9.5" rx=".5" opacity=".8" />
          <rect x="13.5" y="0" width="3" height="11" rx=".5" />
        </svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
          <circle cx="8" cy="10.5" r="1.5" />
          <path opacity=".7" d="M4.7 7.2A4.8 4.8 0 018 5.5a4.8 4.8 0 013.3 1.7l1-1A6 6 0 008 4a6 6 0 00-4.3 2.2l1 1z" />
          <path opacity=".4" d="M2 4.4A9.2 9.2 0 018 2a9.2 9.2 0 016 2.4l-1 1A7.6 7.6 0 008 3.5 7.6 7.6 0 003 5.4l-1-1z" />
        </svg>
        <svg width="25" height="12" viewBox="0 0 25 12" fill="currentColor">
          <rect x=".5" y=".5" width="20" height="11" rx="3.5" stroke="currentColor" strokeWidth="1.2" fill="none" opacity=".35" />
          <rect x="2" y="2" width="16" height="8" rx="2" />
          <path opacity=".4" d="M22 4.5v3c1-.4 1.7-1.2 1.7-1.5S23 4.9 22 4.5z" />
        </svg>
      </div>
    </div>
  );
}
