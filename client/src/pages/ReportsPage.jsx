import React, { useEffect, useState } from 'react';
import { getWeeklyReport, getMonthlyReport } from '../services/reportService';
import ComplianceCard from '../components/ComplianceCard';
import ComplianceChart from '../components/ComplianceChart';
import AdherenceBarChart from '../components/AdherenceBarChart';
import LoadingSpinner from '../components/LoadingSpinner';
import { Download, BarChart3, TrendingUp, Award, Calendar } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ReportsPage = () => {
  const [weeklyData, setWeeklyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const [wRes, mRes] = await Promise.all([
          getWeeklyReport(),
          getMonthlyReport(),
        ]);
        setWeeklyData(wRes.days || []);
        setMonthlyData(mRes);
      } catch (err) {
        console.error('[ReportsPage] Error fetching reports:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const handleExportPDF = () => {
    if (!monthlyData) return;

    const doc = new jsPDF();
    const now = new Date().toLocaleDateString();

    // Title & Header
    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59);
    doc.text('MediTrack — Medication Compliance Report', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on: ${now}`, 14, 28);
    doc.text('Disclaimer: Tool for compliance tracking only. Does not replace medical advice.', 14, 34);

    // Summary Section
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text('Executive Adherence Summary', 14, 46);

    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    doc.text(`Overall 30-Day Compliance: ${monthlyData.overallCompliance}%`, 14, 54);
    doc.text(`Monthly Compliance Shift: ${monthlyData.monthlyChangePercent >= 0 ? '+' : ''}${monthlyData.monthlyChangePercent}%`, 14, 60);

    // Per Medicine Table
    const tableData = (monthlyData.perMedicine || []).map((med) => [
      med.name,
      med.dosage || '—',
      `${med.compliance}%`,
      med.compliance >= 80 ? 'Optimal' : med.compliance >= 60 ? 'Moderate' : 'Sub-optimal',
    ]);

    doc.autoTable({
      startY: 68,
      head: [['Medication Name', 'Dosage', 'Compliance Rate', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241], textColor: 255 },
      styles: { fontSize: 10, cellPadding: 4 },
    });

    doc.save(`MediTrack_Compliance_Report_${now.replace(/\//g, '-')}.pdf`);
  };

  if (loading) return <LoadingSpinner text="Generating compliance analytics..." />;

  const perMed = monthlyData?.perMedicine || [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Compliance Analytics & Reports</h1>
          <p className="page-subtitle">Deep dive into medication adherence patterns and monthly progress</p>
        </div>
        <button onClick={handleExportPDF} className="btn btn-primary">
          <Download size={18} /> Export PDF Report
        </button>
      </div>

      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <ComplianceCard percentage={monthlyData?.overallCompliance || 100} title="30-Day Overall Adherence" />

        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Monthly Trend Shift</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', margin: '0.5rem 0' }}>
            <span style={{
              fontSize: '2.25rem',
              fontWeight: 800,
              color: (monthlyData?.monthlyChangePercent || 0) >= 0 ? '#10b981' : '#f43f5e',
            }}>
              {(monthlyData?.monthlyChangePercent || 0) >= 0 ? `+${monthlyData?.monthlyChangePercent}%` : `${monthlyData?.monthlyChangePercent}%`}
            </span>
            <TrendingUp size={20} color={(monthlyData?.monthlyChangePercent || 0) >= 0 ? '#10b981' : '#f43f5e'} />
          </div>
          <p style={{ fontSize: '0.775rem', color: 'var(--text-subtle)' }}>Compared to preceding 30-day window</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginBottom: '0.25rem' }}>7-Day Adherence Line Chart</h3>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Daily resolved dose breakdown</p>
          <ComplianceChart data={weeklyData} />
        </div>

        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginBottom: '0.25rem' }}>Per-Medication Compliance Bar Chart</h3>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>30-day compliance comparison across medications</p>
          <AdherenceBarChart data={perMed} />
        </div>
      </div>

      {/* Breakdown Table */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '1rem' }}>Medication Adherence Breakdown</h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem' }}>Medication Name</th>
                <th style={{ padding: '0.75rem' }}>Dosage</th>
                <th style={{ padding: '0.75rem' }}>Compliance Rate</th>
                <th style={{ padding: '0.75rem' }}>Adherence Rating</th>
              </tr>
            </thead>
            <tbody>
              {perMed.map((med) => (
                <tr key={med.id || med.name} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '0.75rem', color: '#fff', fontWeight: 700 }}>{med.name}</td>
                  <td style={{ padding: '0.75rem', color: 'var(--accent-teal)' }}>{med.dosage}</td>
                  <td style={{ padding: '0.75rem', fontWeight: 800, color: med.compliance >= 80 ? '#10b981' : med.compliance >= 60 ? '#f59e0b' : '#f43f5e' }}>
                    {med.compliance}%
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span className={`badge ${med.compliance >= 80 ? 'badge-taken' : med.compliance >= 60 ? 'badge-snoozed' : 'badge-missed'}`}>
                      {med.compliance >= 80 ? 'Optimal' : med.compliance >= 60 ? 'Moderate' : 'Needs Attention'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
