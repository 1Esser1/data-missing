import { useState, useEffect } from 'react';
import {
  Activity, GitCommit, AlertTriangle, Clock, RefreshCw,
  GitBranch, Link2, TrendingUp, Users, ChevronDown, ChevronUp, ExternalLink
} from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import doraService from '../services/doraService';
import useAuthStore from '../store/authStore';
import { useAutoT } from '../i18n/LanguageContext';

const STRINGS = {
  title:            'DORA Metrics',
  subtitle:         'DevOps Research & Assessment — live performance indicators',
  rt_elite:         'Elite',
  rt_high:          'High',
  rt_medium:        'Medium',
  rt_low:           'Low',
  rt_no_data:       'No data',
  weekly_activity:  'WEEKLY ACTIVITY',
  deployments:      'Deployments',
  completed:        'Completed',
  no_data_yet:      'No data yet',
  ss_total:         'Subtasks Total',
  ss_completed:     'Completed',
  ss_committed:     'Code Committed',
  ss_gh_commits:    'GitHub Commits (30d)',
  ss_jira_issues:   'Jira Issues',
  ss_jira_bugs:     'Jira Bugs',
  cb_connected:     'Connected',
  cb_not_connected: 'Not connected',
  mc_lead_time:     'Lead Time for Changes',
  mc_deploy_freq:   'Deployment Frequency',
  mc_cfr:           'Change Failure Rate',
  mc_mttr:          'MTTR (Jira-linked subtasks)',
  mc_avg_lead:      'Avg Lead Time',
  mc_total_deploy:  'Total Deployments (30d)',
  mc_avg_cfr:       'Avg Change Failure Rate',
  mc_avg_mttr:      'Avg MTTR',
  u_days_avg:       'days avg',
  u_deploy_30d:     'deployments / 30d',
  u_dept_total:     'dept total',
  u_hours_avg:      'hours avg',
  u_days:           'days',
  u_pct:            '%',
  u_hours:          'hours',
  u_per_week:       'per week',
  lead_time_sub:    'From subtask start to completion',
  lead_time_note:   'ELITE < 1d · HIGH < 1w · MEDIUM < 1mo',
  deploy_note:      'ELITE 7/w or more · HIGH 1/w or more · MEDIUM > 0',
  cfr_no_jira:      'Connect Jira in Settings to enable',
  cfr_note:         'ELITE < 5% · HIGH < 10% · MEDIUM < 15%',
  mttr_sub:         'Mean time to resolve Jira-tracked subtasks',
  mttr_note:        'ELITE < 24h · HIGH < 72h · MEDIUM < 1w',
  tab_my:           'My Metrics',
  tab_dept:         'Department',
  my_perf:          'My Performance',
  refresh:          'Refresh',
  dept_avg:         'Department Average',
  team_members:     'Team Members',
  mr_lead_time:     'Lead Time',
  mr_deploy_freq:   'Deploy Freq',
  mr_cfr:           'CFR',
  mr_mttr:          'MTTR',
  col_member:       'Member',
  rl_developer:     'IT Developer',
  rl_product:       'Product / Mobile',
  rl_manager:       'IT Manager',
  rl_admin:         'Administrator',
};

// ── Rating config ──────────────────────────────────────────────────────────────
const RATING_STYLE = {
  ELITE:   { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' },
  HIGH:    { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
  MEDIUM:  { bg: '#FFF7ED', color: '#D97706', border: '#FDE68A' },
  LOW:     { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
  NO_DATA: { bg: '#F9FAFB', color: '#9CA3AF', border: '#E5E7EB' },
};

function getRatingLabel(rating, tx) {
  return { ELITE: tx.rt_elite, HIGH: tx.rt_high, MEDIUM: tx.rt_medium, LOW: tx.rt_low, NO_DATA: tx.rt_no_data }[rating] ?? (tx.rt_no_data || 'No data');
}

function getRoleLabel(role, tx) {
  return { DEVELOPER: tx.rl_developer, PRODUCT_TEAM: tx.rl_product, IT_MANAGER: tx.rl_manager, ADMIN: tx.rl_admin }[role] ?? role;
}

function RatingBadge({ rating, tx }) {
  const r = RATING_STYLE[rating] || RATING_STYLE.NO_DATA;
  return (
    <span style={{
      fontSize: '0.65rem', fontWeight: '700', padding: '0.2rem 0.55rem',
      borderRadius: '9999px', border: `1.5px solid ${r.border}`,
      backgroundColor: r.bg, color: r.color, letterSpacing: '0.04em',
      textTransform: 'uppercase',
    }}>
      {getRatingLabel(rating, tx)}
    </span>
  );
}

// ── Bar chart (CSS-only) ───────────────────────────────────────────────────────
function WeeklyChart({ data, tx }) {
  if (!data || data.length === 0) return null;

  const maxDeploy = Math.max(...data.map(d => d.deploymentsCount), 1);
  const maxCompleted = Math.max(...data.map(d => d.subtasksCompleted), 1);
  const globalMax = Math.max(maxDeploy, maxCompleted);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.7rem', color: '#6B7280', fontWeight: '600' }}>{tx.weekly_activity || 'WEEKLY ACTIVITY'}</span>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.68rem', color: '#6B7280' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#CC2027', display: 'inline-block' }} />
            {tx.deployments || 'Deployments'}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.68rem', color: '#6B7280' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#1A1A2E', display: 'inline-block' }} />
            {tx.completed || 'Completed'}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.4rem', height: '80px' }}>
        {data.map((week, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', height: '100%', justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', width: '100%' }}>
              <div style={{
                flex: 1, borderRadius: '2px 2px 0 0',
                height: `${(week.deploymentsCount / globalMax) * 72}px`,
                backgroundColor: '#CC2027', minHeight: week.deploymentsCount > 0 ? '4px' : '0',
              }} title={`${week.deploymentsCount} deployments`} />
              <div style={{
                flex: 1, borderRadius: '2px 2px 0 0',
                height: `${(week.subtasksCompleted / globalMax) * 72}px`,
                backgroundColor: '#1A1A2E', minHeight: week.subtasksCompleted > 0 ? '4px' : '0',
              }} title={`${week.subtasksCompleted} completed`} />
            </div>
            <span style={{ fontSize: '0.58rem', color: '#9CA3AF' }}>{week.weekLabel}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Single metric card ─────────────────────────────────────────────────────────
function MetricCard({ icon: Icon, iconColor, title, value, unit, rating, sub, note, tx }) {
  return (
    <div style={{
      backgroundColor: 'white', border: '1px solid #F0F0F0', borderRadius: '0.875rem',
      padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '0.5rem',
            backgroundColor: `${iconColor}15`, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={16} color={iconColor} />
          </div>
          <span style={{ fontSize: '0.78rem', fontWeight: '600', color: '#374151' }}>{title}</span>
        </div>
        <RatingBadge rating={rating} tx={tx} />
      </div>

      <div>
        {value !== null && value !== undefined ? (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: '800', color: '#111827', lineHeight: 1 }}>
              {value}
            </span>
            {unit && <span style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: '500' }}>{unit}</span>}
          </div>
        ) : (
          <span style={{ fontSize: '1rem', color: '#9CA3AF', fontStyle: 'italic' }}>{tx.no_data_yet || 'No data yet'}</span>
        )}
        {sub && <p style={{ fontSize: '0.72rem', color: '#6B7280', marginTop: '0.2rem' }}>{sub}</p>}
      </div>

      {note && (
        <p style={{ fontSize: '0.7rem', color: '#9CA3AF', borderTop: '1px solid #F9FAFB', paddingTop: '0.5rem' }}>
          {note}
        </p>
      )}
    </div>
  );
}

// ── Stats strip ───────────────────────────────────────────────────────────────
function StatsStrip({ metrics, tx }) {
  const stats = [
    { label: tx.ss_total || 'Subtasks Total',         value: metrics.totalSubtasks ?? 0 },
    { label: tx.ss_completed || 'Completed',           value: metrics.completedSubtasks ?? 0 },
    { label: tx.ss_committed || 'Code Committed',      value: metrics.committedSubtasks ?? 0 },
    { label: tx.ss_gh_commits || 'GitHub Commits (30d)', value: metrics.githubConnected ? (metrics.githubCommitsLast30Days ?? 0) : '—' },
    { label: tx.ss_jira_issues || 'Jira Issues',      value: metrics.jiraConnected ? (metrics.totalJiraIssues ?? 0) : '—' },
    { label: tx.ss_jira_bugs || 'Jira Bugs',          value: metrics.jiraConnected ? (metrics.jiraBugs ?? 0) : '—' },
  ];
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)',
      backgroundColor: 'white', border: '1px solid #F0F0F0',
      borderRadius: '0.875rem', overflow: 'hidden',
    }}>
      {stats.map((s, i) => (
        <div key={i} style={{
          padding: '1rem', textAlign: 'center',
          borderRight: i < stats.length - 1 ? '1px solid #F0F0F0' : 'none',
        }}>
          <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#111827' }}>{s.value}</div>
          <div style={{ fontSize: '0.65rem', color: '#9CA3AF', fontWeight: '500', marginTop: '0.15rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

// ── Connection badges ─────────────────────────────────────────────────────────
function ConnectionBadges({ metrics, tx }) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <span style={{
        display: 'flex', alignItems: 'center', gap: '0.3rem',
        padding: '0.3rem 0.75rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: '600',
        backgroundColor: metrics.githubConnected ? '#F0FDF4' : '#F9FAFB',
        color: metrics.githubConnected ? '#16A34A' : '#9CA3AF',
        border: `1px solid ${metrics.githubConnected ? '#BBF7D0' : '#E5E7EB'}`,
      }}>
        <GitBranch size={11} /> GitHub {metrics.githubConnected ? (tx.cb_connected || 'Connected') : (tx.cb_not_connected || 'Not connected')}
      </span>
      <span style={{
        display: 'flex', alignItems: 'center', gap: '0.3rem',
        padding: '0.3rem 0.75rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: '600',
        backgroundColor: metrics.jiraConnected ? '#EFF6FF' : '#F9FAFB',
        color: metrics.jiraConnected ? '#0052CC' : '#9CA3AF',
        border: `1px solid ${metrics.jiraConnected ? '#BFDBFE' : '#E5E7EB'}`,
      }}>
        <Link2 size={11} /> Jira {metrics.jiraConnected ? (tx.cb_connected || 'Connected') : (tx.cb_not_connected || 'Not connected')}
      </span>
    </div>
  );
}

// ── Personal metrics panel ────────────────────────────────────────────────────
function PersonalPanel({ metrics, tx }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <ConnectionBadges metrics={metrics} tx={tx} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
        <MetricCard
          icon={Clock} iconColor="#7C3AED"
          title={tx.mc_lead_time || 'Lead Time for Changes'}
          value={metrics.avgLeadTimeDays !== null && metrics.avgLeadTimeDays !== undefined ? metrics.avgLeadTimeDays : null}
          unit={tx.u_days_avg || 'days avg'}
          rating={metrics.leadTimeRating}
          sub={tx.lead_time_sub || 'From subtask start to completion'}
          note={tx.lead_time_note || 'ELITE < 1d · HIGH < 1w · MEDIUM < 1mo'}
          tx={tx}
        />
        <MetricCard
          icon={Activity} iconColor="#CC2027"
          title={tx.mc_deploy_freq || 'Deployment Frequency'}
          value={metrics.deploymentsLast30Days}
          unit={tx.u_deploy_30d || 'deployments / 30d'}
          rating={metrics.deploymentFreqRating}
          sub={`≈ ${metrics.deploymentsPerWeek ?? 0} ${tx.u_per_week || 'per week'}`}
          note={tx.deploy_note || 'ELITE 7/w or more · HIGH 1/w or more · MEDIUM > 0'}
          tx={tx}
        />
        <MetricCard
          icon={AlertTriangle} iconColor="#D97706"
          title={tx.mc_cfr || 'Change Failure Rate'}
          value={metrics.jiraConnected ? (metrics.changeFailureRate !== null ? metrics.changeFailureRate : null) : null}
          unit={tx.u_pct || '%'}
          rating={metrics.changeFailureRating}
          sub={metrics.jiraConnected
            ? `${metrics.jiraBugs ?? 0} bugs / ${metrics.totalJiraIssues ?? 0} total Jira issues`
            : (tx.cfr_no_jira || 'Connect Jira in Settings to enable')}
          note={tx.cfr_note || 'ELITE < 5% · HIGH < 10% · MEDIUM < 15%'}
          tx={tx}
        />
        <MetricCard
          icon={RefreshCw} iconColor="#0052CC"
          title={tx.mc_mttr || 'MTTR (Jira-linked subtasks)'}
          value={metrics.mttrHours !== null && metrics.mttrHours !== undefined ? metrics.mttrHours : null}
          unit={tx.u_hours_avg || 'hours avg'}
          rating={metrics.mttrRating}
          sub={tx.mttr_sub || 'Mean time to resolve Jira-tracked subtasks'}
          note={tx.mttr_note || 'ELITE < 24h · HIGH < 72h · MEDIUM < 1w'}
          tx={tx}
        />
      </div>

      <StatsStrip metrics={metrics} tx={tx} />

      <div style={{
        backgroundColor: 'white', border: '1px solid #F0F0F0',
        borderRadius: '0.875rem', padding: '1.25rem',
      }}>
        <WeeklyChart data={metrics.weeklyActivity} tx={tx} />
      </div>
    </div>
  );
}

// ── Team member row (manager view) ────────────────────────────────────────────
function MemberRow({ member, onExpand, expanded, tx }) {
  const ratings = [
    { label: tx.mr_lead_time || 'Lead Time',     rating: member.leadTimeRating },
    { label: tx.mr_deploy_freq || 'Deploy Freq', rating: member.deploymentFreqRating },
    { label: tx.mr_cfr || 'CFR',                 rating: member.changeFailureRating },
    { label: tx.mr_mttr || 'MTTR',               rating: member.mttrRating },
  ];

  return (
    <div style={{ backgroundColor: 'white', border: '1px solid #F0F0F0', borderRadius: '0.75rem', overflow: 'hidden' }}>
      <div
        onClick={() => onExpand(member.userId)}
        style={{
          display: 'grid', gridTemplateColumns: '2fr repeat(4, 1fr) auto',
          alignItems: 'center', padding: '1rem 1.25rem', cursor: 'pointer', gap: '1rem',
        }}
      >
        {/* Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            backgroundColor: '#1A1A2E', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '0.85rem', flexShrink: 0,
          }}>
            {member.userName?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#111827' }}>{member.userName}</div>
            <div style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>{getRoleLabel(member.userRole, tx)}</div>
          </div>
        </div>

        {/* 4 rating badges */}
        {ratings.map(r => (
          <div key={r.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
            <span style={{ fontSize: '0.6rem', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{r.label}</span>
            <RatingBadge rating={r.rating} tx={tx} />
          </div>
        ))}

        {/* Expand toggle */}
        <div style={{ color: '#9CA3AF', display: 'flex', alignItems: 'center' }}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ borderTop: '1px solid #F0F0F0', padding: '1.25rem', backgroundColor: '#FAFAFA' }}>
          <PersonalPanel metrics={member} tx={tx} />
        </div>
      )}
    </div>
  );
}

// ── Department aggregate cards ────────────────────────────────────────────────
function DepartmentAggregate({ agg, tx }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <MetricCard
          icon={Clock} iconColor="#7C3AED"
          title={tx.mc_avg_lead || 'Avg Lead Time'}
          value={agg.avgLeadTimeDays ?? null}
          unit={tx.u_days || 'days'}
          rating={agg.leadTimeRating}
          tx={tx}
        />
        <MetricCard
          icon={Activity} iconColor="#CC2027"
          title={tx.mc_total_deploy || 'Total Deployments (30d)'}
          value={agg.deploymentsLast30Days}
          unit={tx.u_dept_total || 'dept total'}
          rating={agg.deploymentFreqRating}
          tx={tx}
        />
        <MetricCard
          icon={AlertTriangle} iconColor="#D97706"
          title={tx.mc_avg_cfr || 'Avg Change Failure Rate'}
          value={agg.changeFailureRate !== null ? agg.changeFailureRate : null}
          unit={tx.u_pct || '%'}
          rating={agg.changeFailureRating}
          tx={tx}
        />
        <MetricCard
          icon={RefreshCw} iconColor="#0052CC"
          title={tx.mc_avg_mttr || 'Avg MTTR'}
          value={agg.mttrHours ?? null}
          unit={tx.u_hours || 'hours'}
          rating={agg.mttrRating}
          tx={tx}
        />
      </div>

      <StatsStrip metrics={agg} tx={tx} />

      <div style={{
        backgroundColor: 'white', border: '1px solid #F0F0F0',
        borderRadius: '0.875rem', padding: '1.25rem',
      }}>
        <WeeklyChart data={agg.weeklyActivity} tx={tx} />
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DoraPage() {
  const { user } = useAuthStore();
  const isManager = user?.role === 'IT_MANAGER' || user?.role === 'ADMIN';
  const tx = useAutoT(STRINGS);

  const [tab, setTab] = useState('personal');
  const [myMetrics, setMyMetrics] = useState(null);
  const [deptData, setDeptData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deptLoading, setDeptLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedMember, setExpandedMember] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadPersonal = async () => {
    try {
      const data = await doraService.getMyMetrics();
      setMyMetrics(data);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Unknown error';
      setError(`Failed to load metrics: ${msg}`);
    }
  };

  const loadDepartment = async () => {
    if (!isManager) return;
    setDeptLoading(true);
    try {
      const data = await doraService.getDepartmentMetrics();
      setDeptData(data);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Unknown error';
      setError(`Failed to load department metrics: ${msg}`);
    } finally {
      setDeptLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadPersonal().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab === 'department' && !deptData) loadDepartment();
  }, [tab]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPersonal();
    if (tab === 'department') await loadDepartment();
    setRefreshing(false);
  };

  const toggleMember = (id) => setExpandedMember(prev => prev === id ? null : id);

  if (loading) return (
    <PageWrapper title="">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
        <RefreshCw size={24} color="#CC2027" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    </PageWrapper>
  );

  return (
    <PageWrapper title={tx.title || 'DORA Metrics'} subtitle={tx.subtitle || 'DevOps Research & Assessment — live performance indicators'}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem',
      }}>
        {/* Tabs (manager only) */}
        {isManager ? (
          <div style={{
            display: 'flex', backgroundColor: '#F8F9FB',
            borderRadius: '0.625rem', padding: '0.25rem', gap: '0.25rem',
          }}>
            {[
              { key: 'personal', label: tx.tab_my || 'My Metrics', icon: TrendingUp },
              { key: 'department', label: tx.tab_dept || 'Department', icon: Users },
            ].map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setTab(key)} style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.5rem 1rem', borderRadius: '0.375rem',
                border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600',
                backgroundColor: tab === key ? 'white' : 'transparent',
                color: tab === key ? '#111827' : '#6B7280',
                boxShadow: tab === key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s',
              }}>
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} color="#CC2027" />
            <span style={{ fontSize: '1rem', fontWeight: '700', color: '#111827' }}>{tx.my_perf || 'My Performance'}</span>
          </div>
        )}

        {/* Refresh button */}
        <button onClick={handleRefresh} disabled={refreshing} style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          padding: '0.5rem 1rem', borderRadius: '0.5rem',
          border: '1.5px solid #E5E7EB', backgroundColor: 'white',
          color: '#6B7280', fontSize: '0.8rem', fontWeight: '500',
          cursor: refreshing ? 'not-allowed' : 'pointer', opacity: refreshing ? 0.6 : 1,
        }}>
          <RefreshCw size={13} style={refreshing ? { animation: 'spin 1s linear infinite' } : {}} />
          {tx.refresh || 'Refresh'}
        </button>
      </div>

      {error && (
        <div style={{
          padding: '0.75rem 1rem', backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
          borderRadius: '0.5rem', marginBottom: '1rem', color: '#DC2626', fontSize: '0.82rem',
        }}>
          {error}
        </div>
      )}

      {/* Personal tab */}
      {tab === 'personal' && myMetrics && <PersonalPanel metrics={myMetrics} tx={tx} />}

      {/* Department tab (manager only) */}
      {tab === 'department' && isManager && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {deptLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <RefreshCw size={24} color="#CC2027" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          ) : deptData ? (
            <>
              {/* Aggregate */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <Users size={15} color="#CC2027" />
                  <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {tx.dept_avg || 'Department Average'} — {deptData.totalMembers} members
                  </span>
                </div>
                <DepartmentAggregate agg={deptData.aggregate} tx={tx} />
              </div>

              {/* Team member list */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <TrendingUp size={15} color="#CC2027" />
                  <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {tx.team_members || 'Team Members'}
                  </span>
                </div>

                {/* Column headers */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '2fr repeat(4, 1fr) auto',
                  padding: '0.5rem 1.25rem', gap: '1rem', marginBottom: '0.5rem',
                }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase' }}>{tx.col_member || 'Member'}</span>
                  {[tx.mr_lead_time || 'Lead Time', tx.mr_deploy_freq || 'Deploy Freq', tx.mr_cfr || 'CFR', tx.mr_mttr || 'MTTR'].map(h => (
                    <span key={h} style={{ fontSize: '0.68rem', fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', textAlign: 'center' }}>{h}</span>
                  ))}
                  <span />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {deptData.members.map(member => (
                    <MemberRow
                      key={member.userId}
                      member={member}
                      expanded={expandedMember === member.userId}
                      onExpand={toggleMember}
                      tx={tx}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}
    </PageWrapper>
  );
}
