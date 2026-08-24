import React from 'react';
import { TrendingUp, Award, AlertCircle } from 'lucide-react';

const ComplianceCard = ({ percentage, title = 'Overall Compliance', subtitle = 'Based on scheduled vs resolved doses' }) => {
  const rounded = Math.round((percentage || 0) * 10) / 10;
  
  let color = 'var(--status-taken)';
  let rating = 'Excellent Adherence';
  let Icon = Award;

  if (rounded < 60) {
    color = 'var(--status-missed)';
    rating = 'Needs Immediate Attention';
    Icon = AlertCircle;
  } else if (rounded < 80) {
    color = 'var(--status-snoozed)';
    rating = 'Moderate Adherence';
    Icon = TrendingUp;
  }

  return (
    <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
      <div>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{title}</span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', margin: '0.35rem 0' }}>
          <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{rounded}%</span>
          <span style={{ fontSize: '0.85rem', color, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <Icon size={16} /> {rating}
          </span>
        </div>
        <p style={{ fontSize: '0.775rem', color: 'var(--text-subtle)' }}>{subtitle}</p>
      </div>

      {/* Circular Compliance Visual Meter */}
      <div style={{ position: 'relative', width: '80px', height: '80px' }}>
        <svg width="80" height="80" viewBox="0 0 36 36">
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="3.5"
          />
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke={color}
            strokeWidth="3.5"
            strokeDasharray={`${rounded}, 100`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.8s ease' }}
          />
        </svg>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem', color: '#fff' }}>
          {rounded}%
        </div>
      </div>
    </div>
  );
};

export default ComplianceCard;
