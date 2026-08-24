import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#1e293b',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        padding: '0.65rem 1rem',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
      }}>
        <p style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>{label}</p>
        <p style={{ color: '#10b981', fontSize: '0.95rem', fontWeight: 800 }}>
          Compliance: {payload[0].value}%
        </p>
      </div>
    );
  }
  return null;
};

const ComplianceChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
        No weekly compliance data available yet.
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '260px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
          <XAxis dataKey="day" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
          <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="compliance"
            stroke="#6366f1"
            strokeWidth={3}
            dot={{ r: 5, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
            activeDot={{ r: 7, fill: '#10b981' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ComplianceChart;
