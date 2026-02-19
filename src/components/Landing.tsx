import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLoginUrl, isAuthenticated, getToken } from '../auth';
import { fetchUserProfile } from '../github';
import './Landing.css';

export function Landing() {
  const [username, setUsername] = useState('');
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated()) {
      fetchUserProfile(getToken()).then(p => setLoggedInUser(p.login)).catch(() => {});
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) navigate(`/${username.trim()}`);
  };

  const examples = [
    ...(loggedInUser ? [loggedInUser] : []),
    'torvalds', 'sindresorhus', 'antfu', 'ljharb', 'gaearon', 'yyx990803', 'austenstone',
  ];

  return (
    <div className="landing">
      <div className="landing-hero">
        <h1>
          <span className="gradient-text">My Contributions</span>
        </h1>
        <p className="landing-subtitle">
          Discover and showcase your open-source contributions,<br />
          ranked by project popularity.
        </p>
        <form className="search-form" onSubmit={handleSubmit}>
          <div className="search-input-wrapper">
            <svg className="search-icon" width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
              <path d="M10.68 11.74a6 6 0 01-7.922-8.982 6 6 0 018.982 7.922l3.04 3.04a.749.749 0 01-.326 1.275.749.749 0 01-.734-.215l-3.04-3.04zM11.5 7a4.499 4.499 0 10-8.997 0A4.499 4.499 0 0011.5 7z" />
            </svg>
            <input
              type="text"
              placeholder="Enter a GitHub username..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
            <button type="submit" disabled={!username.trim()}>
              Explore
            </button>
          </div>
        </form>
        <div className="landing-divider">
          <span>or</span>
        </div>
        {isAuthenticated() ? (
          loggedInUser ? (
            <button className="github-login-btn" onClick={() => navigate(`/${loggedInUser}`)}>
              <img src={`https://github.com/${loggedInUser}.png?size=40`} alt="" style={{ width: 20, height: 20, borderRadius: '50%' }} />
              View your contributions
            </button>
          ) : (
            <p className="auth-status">✅ Signed in</p>
          )
        ) : (
          <a href={getLoginUrl()} className="github-login-btn">
            <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            Sign in with GitHub
          </a>
        )}
        <p className="landing-note">
          Works without signing in! Auth increases API rate limits for heavy contributors.
        </p>
      </div>
      <div className="landing-examples">
        <p>Try these:</p>
        <div className="example-links">
          {examples.map(u => (
            <a key={u} href={`/${u}`} onClick={(e) => { e.preventDefault(); navigate(`/${u}`); }}>
              @{u}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
