import type { UserProfile, HeroStats } from '../types';
import './HeroSection.css';

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return n.toString();
}

interface Props {
  profile: UserProfile;
  stats: HeroStats;
}

export function HeroSection({ profile, stats }: Props) {
  return (
    <div className="hero-section">
      <div className="hero-profile">
        <img src={profile.avatarUrl} alt={profile.login} className="hero-avatar" />
        <div className="hero-info">
          <h1>{profile.name || profile.login}</h1>
          {profile.name && <p className="hero-username">@{profile.login}</p>}
          {profile.bio && <p className="hero-bio">{profile.bio}</p>}
          <a href={profile.url} target="_blank" rel="noopener" className="hero-github-link">
            View on GitHub →
          </a>
        </div>
      </div>
      <div className="hero-stats">
        <div className="stat-card">
          <span className="stat-value">{stats.totalRepos}</span>
          <span className="stat-label">Projects</span>
        </div>
        <div className="stat-card accent">
          <span className="stat-value">{formatNumber(stats.combinedStars)}</span>
          <span className="stat-label">Combined ⭐</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.totalPRs}</span>
          <span className="stat-label">Merged PRs</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.languagesUsed.length}</span>
          <span className="stat-label">Languages</span>
        </div>
      </div>
    </div>
  );
}
