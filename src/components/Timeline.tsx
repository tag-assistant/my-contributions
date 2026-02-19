import type { Contribution } from '../types';
import './Timeline.css';

interface Props {
  contributions: Contribution[];
}

export function Timeline({ contributions }: Props) {
  // Group contributions by year-month
  const grouped = new Map<string, Contribution[]>();
  for (const c of contributions) {
    for (const pr of c.prs) {
      const d = new Date(pr.mergedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!grouped.has(key)) grouped.set(key, []);
      const existing = grouped.get(key)!.find(x => x.repo.fullName === c.repo.fullName);
      if (!existing) {
        grouped.get(key)!.push({ ...c, prs: [pr] });
      } else {
        existing.prs.push(pr);
      }
    }
  }

  const sortedMonths = Array.from(grouped.keys()).sort().reverse();

  const formatMonth = (key: string) => {
    const [y, m] = key.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  return (
    <div className="timeline">
      {sortedMonths.map(month => (
        <div key={month} className="timeline-month">
          <div className="timeline-month-header">
            <div className="timeline-dot" />
            <h3>{formatMonth(month)}</h3>
            <span className="timeline-count">
              {grouped.get(month)!.reduce((sum, c) => sum + c.prs.length, 0)} contributions
            </span>
          </div>
          <div className="timeline-items">
            {grouped.get(month)!
              .sort((a, b) => b.repo.stars - a.repo.stars)
              .map(c => (
                <div key={c.repo.fullName} className="timeline-item">
                  <img src={c.repo.avatarUrl} alt={c.repo.owner} className="timeline-avatar" />
                  <div className="timeline-item-info">
                    <a href={c.repo.url} target="_blank" rel="noopener" className="timeline-repo">
                      {c.repo.fullName}
                    </a>
                    <span className="timeline-stars">⭐ {c.repo.stars.toLocaleString()}</span>
                    <div className="timeline-pr-list">
                      {c.prs.map(pr => (
                        <a key={pr.number} href={pr.url} target="_blank" rel="noopener" className="timeline-pr">
                          🟣 {pr.title} <span>#{pr.number}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
