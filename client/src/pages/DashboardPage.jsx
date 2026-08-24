import React, { useEffect, useState } from 'react';
import { getDashboardData } from '../services/dashboardService';
import { getWeeklyReport } from '../services/reportService';
import { updateLogStatus } from '../services/logService';
import ComplianceCard from '../components/ComplianceCard';
import ComplianceChart from '../components/ComplianceChart';
import MissedDoseAlert from '../components/MissedDoseAlert';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { CheckCircle2, XCircle, Clock, Pill, ShieldAlert, ArrowRight, AlarmClock } from 'lucide-react';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [weeklyChartData, setWeeklyChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    try {
      const [dashRes, weeklyRes] = await Promise.all([
        getDashboardData(),
        getWeeklyReport(),
      ]);
      setData(dashRes);
      setWeeklyChartData(weeklyRes.days || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleStatusUpdate = async (logId, status, minutes = 15) => {
    try {
      await updateLogStatus(logId, { status, snoozedMinutes: minutes });
      await fetchDashboard();
    } catch (err) {
      console.error('[Dashboard] Error updating log status:', err);
    }
  };

  if (loading) return <LoadingSpinner text="Loading dashboard metrics..." />;
  if (error) return <div style={{ color: '#f43f5e', padding: '1rem' }}>{error}</div>;

  const taken = data?.takenToday || { count: 0, total: 0 };
  const missed = data?.missedToday || { count: 0, total: 0 };
  const upcoming = data?.upcoming || { count: 0, nextInMinutes: null };
  const schedule = data?.todaySchedule || [];

  // Find first missed dose log for alert banner
  const firstMissedLog = schedule.find(item => item.log?.status === 'missed');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Patient Dashboard</h1>
          <p className="page-subtitle">Track your medication adherence and upcoming doses today</p>
        </div>
        <Link to="/medicines/new" className="btn btn-primary">
          <Pill size={18} /> Add Medicine
        </Link>
      </div>

      {/* Healthcare Safety Constraint Disclaimer Banner */}
      <div className="disclaimer-banner">
        <ShieldAlert size={22} className="disclaimer-icon" />
        <p className="disclaimer-text">
          <strong>Medical Disclaimer:</strong> MediTrack is a medication management and reminder tool. It does not replace professional medical advice. Always follow your healthcare professional's prescription.
        </p>
      </div>

      {/* Missed Dose Alert Banner */}
      {firstMissedLog && <MissedDoseAlert missedDose={firstMissedLog.log} />}

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <ComplianceCard percentage={data?.weeklyCompliance || 100} title="Weekly Compliance" />

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Doses Taken Today</span>
            <CheckCircle2 size={20} color="var(--status-taken)" />
          </div>
          <span style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>{taken.count} / {taken.total}</span>
          <p style={{ fontSize: '0.775rem', color: 'var(--text-subtle)', marginTop: '0.25rem' }}>Successfully logged</p>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Missed Doses Today</span>
            <XCircle size={20} color="var(--status-missed)" />
          </div>
          <span style={{ fontSize: '2rem', fontWeight: 800, color: missed.count > 0 ? '#f43f5e' : '#fff' }}>{missed.count}</span>
          <p style={{ fontSize: '0.775rem', color: 'var(--text-subtle)', marginTop: '0.25rem' }}>Doses past scheduled time</p>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Upcoming Doses</span>
            <Clock size={20} color="var(--status-upcoming)" />
          </div>
          <span style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>{upcoming.count}</span>
          <p style={{ fontSize: '0.775rem', color: 'var(--text-subtle)', marginTop: '0.25rem' }}>
            {upcoming.nextInMinutes !== null ? `Next dose in ~${upcoming.nextInMinutes} minutes` : 'No more doses due today'}
          </p>
        </div>
      </div>

      {/* Main Charts & Schedule Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* Today's Schedule Card */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>Today's Medication Schedule</h3>
            <Link to="/today" style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              Full Timeline <ArrowRight size={14} />
            </Link>
          </div>

          {schedule.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem' }}>
              No medications scheduled for today. Add a medicine to get started!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {schedule.map((item) => {
                const log = item.log;
                const med = item.medicine || {};
                return (
                  <div
                    key={log._id}
                    style={{
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        fontWeight: 800,
                        color: 'var(--accent-teal)',
                      }}>
                        {log.scheduledTime}
                      </div>
                      <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>{med.name}</h4>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{med.dosage}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <StatusBadge status={log.status} />

                      {(log.status === 'upcoming' || log.status === 'snoozed' || log.status === 'missed') && (
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <button
                            onClick={() => handleStatusUpdate(log._id, 'taken')}
                            className="btn btn-success btn-sm"
                            title="Mark as Taken"
                          >
                            <CheckCircle2 size={14} /> Taken
                          </button>
                          {log.status === 'upcoming' && (
                            <button
                              onClick={() => handleStatusUpdate(log._id, 'snoozed', 15)}
                              className="btn btn-warning btn-sm"
                              title="Snooze 15 minutes"
                            >
                              <AlarmClock size={14} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Weekly Trend Chart Card */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginBottom: '0.25rem' }}>Weekly Compliance Trend</h3>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>7-day rolling adherence rate</p>
          <ComplianceChart data={weeklyChartData} />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
