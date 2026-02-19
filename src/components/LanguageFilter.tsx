import { getLanguageColor } from '../github';
import './LanguageFilter.css';

interface Props {
  languages: string[];
  selected: string | null;
  onSelect: (lang: string | null) => void;
}

export function LanguageFilter({ languages, selected, onSelect }: Props) {
  const sorted = [...languages].sort();

  return (
    <div className="language-filter">
      <button
        className={`lang-chip ${!selected ? 'active' : ''}`}
        onClick={() => onSelect(null)}
      >
        All
      </button>
      {sorted.map(lang => (
        <button
          key={lang}
          className={`lang-chip ${selected === lang ? 'active' : ''}`}
          onClick={() => onSelect(selected === lang ? null : lang)}
        >
          <span className="lang-dot" style={{ background: getLanguageColor(lang) }} />
          {lang}
        </button>
      ))}
    </div>
  );
}
