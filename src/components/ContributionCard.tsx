import type { Contribution } from '../types';
import { getLanguageColor } from '../github';
import './ContributionCard.css';

function formatNumber(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return n.toString();
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

interface Props {
  contribution: Contribution;
}

export function ContributionCard({ contribution: c }: Props) {
  return (
    <a href={c.repo.url} target="_blank" rel="noopener" className="contribution-card">
      <div className="card-header">
        <img src={c.repo.avatarUrl} alt={c.repo.owner} className="card-avatar" />
        <div className="card-repo-info">
          <span className="card-owner">{c.repo.owner} /</span>
          <span className="card-name">{c.repo.name}</span>
        </div>
        <div className="card-stars">
          ⭐ {formatNumber(c.repo.stars)}
        </div>
      </div>
      {c.repo.description && (
        <p className="card-description">{c.repo.description}</p>
      )}
      <div className="card-prs">
        {c.prs.slice(0, 3).map(pr => (
          <div key={pr.number} className="card-pr">
            <span className="pr-icon">🟣</span>
            <span className="pr-title">{pr.title}</span>
            <span className="pr-number">#{pr.number}</span>
          </div>
        ))}
        {c.prs.length > 3 && (
          <div className="card-pr more">
            +{c.prs.length - 3} more merged PRs
          </div>
        )}
      </div>
      <div className="card-footer">
        <div className="card-languages">
          {c.languages.slice(0, 4).map(lang => (
            <span key={lang} className="card-lang">
              <span className="lang-dot" style={{ background: getLanguageColor(lang) }} />
              {lang}
            </span>
          ))}
        </div>
        <span className="card-time">{timeAgo(c.lastContribution)}</span>
      </div>
    </a>
  );
}
