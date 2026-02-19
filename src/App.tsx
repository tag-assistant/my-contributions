import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { fetchUserProfile, fetchContributions, computeHeroStats, computeBadges } from './github';
import { getToken, setToken, exchangeCode } from './auth';
import type { Contribution, UserProfile, HeroStats, Badge } from './types';
import { HeroSection } from './components/HeroSection';
import { BadgeList } from './components/BadgeList';
import { LanguageFilter } from './components/LanguageFilter';
import { ContributionCard } from './components/ContributionCard';
import { Timeline } from './components/Timeline';
import { Header } from './components/Header';
import { Landing } from './components/Landing';
import { LoadingScreen } from './components/LoadingScreen';
import './App.css';

function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [stats, setStats] = useState<HeroStats | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [loadingPct, setLoadingPct] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedLang, setSelectedLang] = useState<string | null>(null);
  const [view, setView] = useState<'cards' | 'timeline'>('cards');
  const token = getToken();

  const load = useCallback(async () => {
    if (!username) return;
    setLoading(true);
    setError(null);
    try {
      const [prof, contribs] = await Promise.all([
        fetchUserProfile(token, username),
        fetchContributions(token, username, (msg, pct) => {
          setLoadingMsg(msg);
          setLoadingPct(pct);
        }),
      ]);
      setProfile(prof);
      setContributions(contribs);
      const s = computeHeroStats(contribs);
      setStats(s);
      setBadges(computeBadges(contribs, s));
    } catch (err: any) {
      setError(err.message || 'Failed to load contributions');
    } finally {
      setLoading(false);
    }
  }, [username, token]);

  useEffect(() => { load(); }, [load]);

  const filtered = selectedLang
    ? contributions.filter(c => c.languages.includes(selectedLang))
    : contributions;

  if (loading) return <LoadingScreen message={loadingMsg} percent={loadingPct} />;
  if (error) return <div className="error-screen"><h2>😵 Something went wrong</h2><p>{error}</p><button onClick={load}>Try Again</button></div>;
  if (!profile || !stats) return null;

  return (
    <div className="profile-page">
      <HeroSection profile={profile} stats={stats} />
      {badges.length > 0 && <BadgeList badges={badges} />}
      <div className="content-controls">
        <LanguageFilter
          languages={stats.languagesUsed}
          selected={selectedLang}
          onSelect={setSelectedLang}
        />
        <div className="view-toggle">
          <button className={view === 'cards' ? 'active' : ''} onClick={() => setView('cards')}>
            <span>▦</span> Cards
          </button>
          <button className={view === 'timeline' ? 'active' : ''} onClick={() => setView('timeline')}>
            <span>⏱</span> Timeline
          </button>
        </div>
      </div>
      {view === 'cards' ? (
        <div className="contributions-grid">
          {filtered.map(c => (
            <ContributionCard key={c.repo.fullName} contribution={c} />
          ))}
          {filtered.length === 0 && (
            <div className="empty-state">
              <p>No contributions found{selectedLang ? ` for ${selectedLang}` : ''}.</p>
            </div>
          )}
        </div>
      ) : (
        <Timeline contributions={filtered} />
      )}
    </div>
  );
}

function CallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state') || '/';
    if (code) {
      exchangeCode(code).then(token => {
        setToken(token);
        navigate(state);
      }).catch(() => navigate('/'));
    } else {
      navigate('/');
    }
  }, [searchParams, navigate]);

  return <LoadingScreen message="Signing in..." percent={50} />;
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/callback" element={<CallbackPage />} />
          <Route path="/:username" element={<ProfilePage />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
