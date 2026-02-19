import { useNavigate } from 'react-router-dom';
import { isAuthenticated, clearToken, getLoginUrl } from '../auth';
import './Header.css';

export function Header() {
  const navigate = useNavigate();
  const authed = isAuthenticated();

  return (
    <header className="app-header">
      <div className="header-inner">
        <a className="header-logo" href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
          <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 010-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1h-6a1 1 0 00-1 1v6.708A2.486 2.486 0 017.5 9h5V1.5zM6 6.25a.75.75 0 01.75-.75h4.5a.75.75 0 010 1.5h-4.5A.75.75 0 016 6.25zM6.75 3.5a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-4.5z" />
          </svg>
          My Contributions
        </a>
        <div className="header-actions">
          {authed ? (
            <button className="header-btn" onClick={() => { clearToken(); window.location.reload(); }}>
              Sign Out
            </button>
          ) : (
            <a href={getLoginUrl()} className="header-btn primary">
              Sign In
            </a>
          )}
          <a href="https://github.com/tag-assistant/my-contributions" target="_blank" rel="noopener" className="header-btn">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
          </a>
        </div>
      </div>
    </header>
  );
}
