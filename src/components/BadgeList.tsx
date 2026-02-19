import type { Badge } from '../types';
import './BadgeList.css';

interface Props {
  badges: Badge[];
}

export function BadgeList({ badges }: Props) {
  return (
    <div className="badge-list">
      {badges.map((b, i) => (
        <div key={i} className="badge" style={{ borderColor: b.color }}>
          <span className="badge-icon">{b.icon}</span>
          <div>
            <span className="badge-label">{b.label}</span>
            <span className="badge-desc">{b.description}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
