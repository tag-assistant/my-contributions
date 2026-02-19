import './LoadingScreen.css';

interface Props {
  message: string;
  percent: number;
}

export function LoadingScreen({ message, percent }: Props) {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-spinner" />
        <p className="loading-message">{message || 'Loading...'}</p>
        <div className="loading-bar-track">
          <div className="loading-bar-fill" style={{ width: `${Math.min(percent, 100)}%` }} />
        </div>
      </div>
    </div>
  );
}
