import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, User, Calendar, Tag, Brain, ExternalLink,
  BriefcaseBusiness, Link2, GitBranch, Clock, CheckCircle2,
  AlertCircle, Loader2,
} from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import taskService from '../services/taskService';
import workplaceService from '../services/workplaceService';
import { useLanguage, useTranslatedTask } from '../i18n/LanguageContext';

const KANO_COLORS = {
  BASIC:        { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA', label: 'Basic' },
  PERFORMANCE:  { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE', label: 'Performance' },
  DELIGHTER:    { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0', label: 'Delighter' },
  INDIFFERENT:  { bg: '#F9FAFB', color: '#6B7280', border: '#E5E7EB', label: 'Indifferent' },
  REVERSE:      { bg: '#FFF7ED', color: '#EA580C', border: '#FED7AA', label: 'Reverse' },
};
const MOSCOW_COLORS = {
  MUST:   { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
  SHOULD: { bg: '#FFF7ED', color: '#D97706', border: '#FDE68A' },
  COULD:  { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
  WONT:   { bg: '#F9FAFB', color: '#6B7280', border: '#E5E7EB' },
};
const STATUS_LABELS = {
  AI_SCORED:          { label: 'AI Scored',           bg: '#F0FDF4', color: '#16A34A' },
  PENDING_SCORING:    { label: 'Pending Scoring',      bg: '#FFF7ED', color: '#D97706' },
  APPROVED:           { label: 'Approved',              bg: '#EFF6FF', color: '#2563EB' },
  REJECTED:           { label: 'Rejected',              bg: '#FEF2F2', color: '#DC2626' },
  OVERRIDE_REQUESTED: { label: 'Override Requested',   bg: '#F5F3FF', color: '#7C3AED' },
};

function ScoreBar({ label, value, max = 10 }) {
  const pct   = Math.min((value / max) * 100, 100);
  const color = pct >= 70 ? '#16A34A' : pct >= 40 ? '#D97706' : '#DC2626';
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
        <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>{label}</span>
        <span style={{ fontSize: '0.78rem', fontWeight: '700', color }}>{value?.toFixed(1)}</span>
      </div>
      <div style={{ height: '6px', backgroundColor: '#F3F4F6', borderRadius: '9999px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: '9999px' }} />
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value, accent }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
      padding: '1rem', backgroundColor: accent || '#F9FAFB',
      borderRadius: '0.65rem', border: '1px solid #F0F0F0',
    }}>
      <div style={{
        width: '34px', height: '34px', borderRadius: '0.5rem',
        backgroundColor: 'white', border: '1px solid #E5E7EB',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={16} color="#6B7280" />
      </div>
      <div>
        <p style={{ fontSize: '0.68rem', color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>
          {label}
        </p>
        <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>{value}</p>
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <p style={{
      fontSize: '0.72rem', fontWeight: '700', color: '#9CA3AF',
      textTransform: 'uppercase', letterSpacing: '0.09em',
      marginBottom: '0.75rem',
    }}>
      {children}
    </p>
  );
}

function Badge({ label, style }) {
  return (
    <span style={{
      padding: '0.25rem 0.65rem', borderRadius: '9999px',
      fontSize: '0.72rem', fontWeight: '600',
      border: `1px solid ${style.border}`,
      backgroundColor: style.bg, color: style.color,
    }}>
      {label}
    </span>
  );
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function TaskDetail() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { t }        = useLanguage();

  const [task,      setTask]      = useState(null);
  const [workplace, setWorkplace] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [wpLoading, setWpLoading] = useState(false);
  const [error,     setError]     = useState('');

  const tx = useTranslatedTask(task, !!task);

  useEffect(() => {
    setLoading(true);
    taskService.getById(id)
      .then(data => {
        setTask(data);
        // Try to load existing workplace for this task
        setWpLoading(true);
        return workplaceService.getByTask(data.id).catch(() => null);
      })
      .then(wp => { setWorkplace(wp); })
      .catch(err => {
        if (err?.response?.status === 403) {
          setError("You don't have permission to view this task.");
        } else {
          setError('Task not found or server is unavailable.');
        }
      })
      .finally(() => { setLoading(false); setWpLoading(false); });
  }, [id]);

  if (loading) {
    return (
      <PageWrapper title="Task Detail">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '0.75rem', color: '#9CA3AF' }}>
          <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
          <span>Loading task…</span>
        </div>
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper title="Task Detail">
        <div style={{ maxWidth: '500px', margin: '3rem auto', textAlign: 'center' }}>
          <AlertCircle size={36} color="#DC2626" style={{ marginBottom: '1rem' }} />
          <p style={{ fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>{error}</p>
          <button onClick={() => navigate(-1)} style={{
            marginTop: '1rem', padding: '0.5rem 1.25rem',
            backgroundColor: '#1A1A2E', color: 'white',
            border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.875rem',
          }}>
            Go back
          </button>
        </div>
      </PageWrapper>
    );
  }

  const kano   = KANO_COLORS[task.kanoCategory]  || null;
  const moscow = MOSCOW_COLORS[task.moscowLabel]  || null;
  const status = STATUS_LABELS[task.status]       || { label: task.status, bg: '#F3F4F6', color: '#6B7280' };
  const multiplier = task.multiplierApplied ?? 1.0;

  return (
    <PageWrapper title={tx?.title || task.title} subtitle="Task detail">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          padding: '0.4rem 0.85rem', marginBottom: '1.25rem',
          backgroundColor: 'white', border: '1.5px solid #E5E7EB',
          borderRadius: '0.5rem', fontSize: '0.8rem', color: '#6B7280',
          cursor: 'pointer',
        }}
      >
        <ArrowLeft size={14} /> Back
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.25rem', alignItems: 'start' }}>

        {/* ── Left column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Title + badges */}
          <div style={{
            backgroundColor: 'white', borderRadius: '0.85rem',
            border: '1px solid #F0F0F0', padding: '1.5rem',
            borderLeft: `4px solid ${moscow?.color || '#E5E7EB'}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              <span style={{
                fontSize: '0.72rem', fontWeight: '600',
                padding: '0.2rem 0.65rem', borderRadius: '9999px',
                backgroundColor: status.bg, color: status.color,
              }}>
                {status.label}
              </span>
              {kano   && <Badge label={kano.label}        style={kano} />}
              {moscow && <Badge label={task.moscowLabel}  style={moscow} />}
              {task.taskType && (
                <span style={{
                  fontSize: '0.72rem', fontWeight: '500',
                  padding: '0.2rem 0.65rem', borderRadius: '4px',
                  backgroundColor: task.taskTypeColor ? `${task.taskTypeColor}15` : '#F3F4F6',
                  color: task.taskTypeColor || '#6B7280',
                  border: `1px solid ${task.taskTypeColor ? `${task.taskTypeColor}30` : '#E5E7EB'}`,
                }}>
                  {task.taskType}
                </span>
              )}
            </div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#111827', marginBottom: '0.75rem', lineHeight: 1.4 }}>
              {tx?.title || task.title}
            </h2>
            {task.description && (
              <p style={{ fontSize: '0.875rem', color: '#6B7280', lineHeight: 1.7 }}>
                {tx?.description || task.description}
              </p>
            )}
          </div>

          {/* AI Industry Context */}
          {task.industryContext && (
            <div style={{ backgroundColor: '#1A1A2E', borderRadius: '0.85rem', padding: '1.25rem' }}>
              <SectionTitle><span style={{ color: '#4B5563' }}>AI Industry Context</span></SectionTitle>
              <p style={{ fontSize: '0.825rem', color: '#9CA3AF', lineHeight: 1.7 }}>
                {tx?.industryContext || task.industryContext}
              </p>
              {task.modelUsed && (
                <p style={{ fontSize: '0.68rem', color: '#4B5563', marginTop: '0.75rem' }}>
                  🤖 {task.modelUsed}
                </p>
              )}
            </div>
          )}

          {/* Kano + MoSCoW reasoning */}
          {(task.kanoReasoning || task.moscowReasoning) && (
            <div style={{
              backgroundColor: 'white', borderRadius: '0.85rem',
              border: '1px solid #F0F0F0', padding: '1.5rem',
            }}>
              {task.kanoReasoning && (
                <div style={{ marginBottom: task.moscowReasoning ? '1.25rem' : 0 }}>
                  <SectionTitle>Kano Reasoning</SectionTitle>
                  <p style={{ fontSize: '0.825rem', color: '#6B7280', lineHeight: 1.7 }}>
                    {tx?.kanoReasoning || task.kanoReasoning}
                  </p>
                </div>
              )}
              {task.moscowReasoning && (
                <div>
                  <SectionTitle>MoSCoW Reasoning</SectionTitle>
                  <p style={{ fontSize: '0.825rem', color: '#6B7280', lineHeight: 1.7 }}>
                    {tx?.moscowReasoning || task.moscowReasoning}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Workplace */}
          <div style={{
            backgroundColor: 'white', borderRadius: '0.85rem',
            border: '1px solid #F0F0F0', padding: '1.5rem',
          }}>
            <SectionTitle>Workplace</SectionTitle>
            {wpLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#9CA3AF', fontSize: '0.825rem' }}>
                <Loader2 size={14} />
                Checking…
              </div>
            ) : workplace ? (
              <Link
                to={`/workplace/${workplace.id}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.6rem 1.1rem',
                  backgroundColor: '#ECFDF5', border: '1.5px solid #BBF7D0',
                  borderRadius: '0.5rem', textDecoration: 'none',
                  color: '#16A34A', fontSize: '0.825rem', fontWeight: '600',
                }}
              >
                <BriefcaseBusiness size={15} />
                Open Workplace
                <ExternalLink size={13} />
              </Link>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  backgroundColor: '#E5E7EB',
                }} />
                <span style={{ fontSize: '0.825rem', color: '#9CA3AF' }}>
                  No workplace generated yet
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Right column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Meta info */}
          <div style={{
            backgroundColor: 'white', borderRadius: '0.85rem',
            border: '1px solid #F0F0F0', padding: '1.25rem',
            display: 'flex', flexDirection: 'column', gap: '0.75rem',
          }}>
            <SectionTitle>Task Info</SectionTitle>
            <InfoCard icon={User}     label="Created by"   value={task.submittedBy || '—'} />
            <InfoCard icon={Calendar} label="Created at"   value={formatDate(task.createdAt)} />
            <InfoCard icon={Tag}      label="Task type"    value={task.taskType || '—'} />
            <InfoCard icon={CheckCircle2} label="Status"   value={status.label} accent={status.bg + '66'} />
          </div>

          {/* RICE breakdown */}
          {task.finalScore != null && (
            <div style={{
              backgroundColor: 'white', borderRadius: '0.85rem',
              border: '1px solid #F0F0F0', padding: '1.25rem',
            }}>
              <SectionTitle>RICE Breakdown</SectionTitle>
              {task.reach      != null && <ScoreBar label="Reach"      value={task.reach} />}
              {task.impact     != null && <ScoreBar label="Impact"     value={task.impact} />}
              {task.confidence != null && <ScoreBar label="Confidence" value={task.confidence * 10} />}
              {task.effort     != null && <ScoreBar label="Effort"     value={task.effort} />}

              <div style={{
                marginTop: '1rem', padding: '0.875rem',
                backgroundColor: '#F9FAFB', borderRadius: '0.5rem',
                border: '1px solid #F0F0F0',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '0.65rem', color: '#9CA3AF' }}>RICE</p>
                  <p style={{ fontSize: '1rem', fontWeight: '700', color: '#111827' }}>{task.riceScore?.toFixed(2)}</p>
                </div>
                <span style={{ color: '#D1D5DB' }}>×</span>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '0.65rem', color: '#9CA3AF' }}>Multiplier</p>
                  <p style={{ fontSize: '1rem', fontWeight: '700', color: '#111827' }}>{multiplier.toFixed(2)}</p>
                </div>
                <span style={{ color: '#D1D5DB' }}>═</span>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '0.65rem', color: '#9CA3AF' }}>Final</p>
                  <p style={{ fontSize: '1.25rem', fontWeight: '700', color: '#CC2027' }}>{task.finalScore?.toFixed(1)}</p>
                </div>
              </div>

              {task.confidenceLevel && (
                <p style={{ fontSize: '0.72rem', color: '#9CA3AF', marginTop: '0.5rem', textAlign: 'center' }}>
                  AI Confidence: <strong style={{ color: '#374151' }}>{task.confidenceLevel}</strong>
                </p>
              )}
            </div>
          )}

          {/* Jira link */}
          {task.jiraIssueKey && (
            <div style={{
              backgroundColor: 'white', borderRadius: '0.85rem',
              border: '1px solid #BAE6FD', padding: '1.25rem',
            }}>
              <SectionTitle>Jira</SectionTitle>
              <a
                href={task.jiraIssueUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#EBF4FF', border: '1.5px solid #BAE6FD',
                  borderRadius: '0.5rem', textDecoration: 'none',
                  color: '#0052CC', fontSize: '0.825rem', fontWeight: '700',
                }}
              >
                <Link2 size={14} />
                {task.jiraIssueKey}
                <ExternalLink size={12} />
              </a>
              {task.jiraIssueStatus && (
                <p style={{ fontSize: '0.72rem', color: '#9CA3AF', marginTop: '0.5rem' }}>
                  Status: {task.jiraIssueStatus}
                </p>
              )}
            </div>
          )}

          {/* Git repo */}
          {task.gitRepoUrl && (
            <div style={{
              backgroundColor: 'white', borderRadius: '0.85rem',
              border: '1px solid #F0F0F0', padding: '1.25rem',
            }}>
              <SectionTitle>Git Repository</SectionTitle>
              <a
                href={task.gitRepoUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  textDecoration: 'none', color: '#374151',
                  fontSize: '0.825rem', fontWeight: '600',
                }}
              >
                <GitBranch size={14} color="#6B7280" />
                {task.gitRepoName || task.gitRepoUrl}
                <ExternalLink size={12} color="#9CA3AF" />
              </a>
              {task.gitRepoBranch && (
                <p style={{ fontSize: '0.72rem', color: '#9CA3AF', marginTop: '0.25rem' }}>
                  Branch: {task.gitRepoBranch}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
