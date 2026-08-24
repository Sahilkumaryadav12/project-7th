import React from 'react';
import { CheckCircle2, XCircle, Clock, AlarmClock } from 'lucide-react';

const StatusBadge = ({ status }) => {
  const normalized = status ? status.toLowerCase() : 'upcoming';

  const config = {
    taken: { label: 'Taken', class: 'badge-taken', icon: CheckCircle2 },
    missed: { label: 'Missed', class: 'badge-missed', icon: XCircle },
    upcoming: { label: 'Upcoming', class: 'badge-upcoming', icon: Clock },
    snoozed: { label: 'Snoozed', class: 'badge-snoozed', icon: AlarmClock },
  };

  const item = config[normalized] || config.upcoming;
  const Icon = item.icon;

  return (
    <span className={`badge ${item.class}`}>
      <Icon size={14} />
      <span>{item.label}</span>
    </span>
  );
};

export default StatusBadge;
