import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Handle GitHub Pages SPA redirect from 404.html
;(function() {
  const params = new URLSearchParams(window.location.search);
  const path = params.get('p');
  const query = params.get('q');
  if (path) {
    const base = window.location.pathname.replace(/\/$/, '');
    const newUrl = base + path + (query ? '?' + decodeURIComponent(query) : '') + window.location.hash;
    window.history.replaceState(null, '', newUrl);
  }
})();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
