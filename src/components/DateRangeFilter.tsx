import type { DateRange } from '../github';
import './DateRangeFilter.css';

interface Props {
  selected: DateRange;
  onSelect: (range: DateRange) => void;
}

const options: { value: DateRange; label: string }[] = [
  { value: 'all', label: 'All Time' },
  { value: '5y', label: '5 Years' },
  { value: '3y', label: '3 Years' },
  { value: '1y', label: '1 Year' },
];

export function DateRangeFilter({ selected, onSelect }: Props) {
  return (
    <div className="date-range-filter">
      {options.map(o => (
        <button
          key={o.value}
          className={`date-chip ${selected === o.value ? 'active' : ''}`}
          onClick={() => onSelect(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
