import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, GitFork, GitBranch, Plus, Loader2, ExternalLink } from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import taskService from '../services/taskService';
import gitService from '../services/gitService';
import { useAutoT } from '../i18n/LanguageContext';

const STRINGS = {
  page_title:       'Submit New Task',
  page_subtitle:    'Describe your task — the AI will handle the Kano, MoSCoW, and RICE scoring',
  task_details:     'Task Details',
  task_details_sub: 'Basic information about the task or feature',
  task_type:        'Task Type *',
  loading_types:    'Loading task types...',
  task_title:       'Task Title *',
  description:      'Description *',
  desc_hint:        'The more detail you provide, the more accurate the AI scoring will be.',
  repo_title:       'Repository',
  repo_optional:    '(optional)',
  repo_subtitle:    'Link this task to a Git repository — enables code commits from subtasks',
  clear:            'Clear',
  git_provider:     'Git provider',
  not_connected:    'account is not connected yet.',
  connect_settings: 'Connect in Settings',
  signed_in_as:     'Signed in as',
  select_repo:      'Select repository',
  loading_repos:    'Loading repositories…',
  no_repo:          '— No repository —',
  create_repo:      'Create new repository',
  new_repo:         'New repository',
  name:             'Name',
  creating:         'Creating…',
  cancel:           'Cancel',
  branch:           'Branch',
  select_provider:  'Select a provider above to link a repository.',
  ai_title:         'AI Scoring Engine',
  ai_body:          'After submission, the AI will analyze your task description and automatically assign a Kano category, MoSCoW label, and RICE score — drawing on global fintech and banking industry knowledge.',
  clear_form:       'Clear form',
  submit:           '🤖 Submit for AI Scoring',
  submitting:       'Submitting...',
  success:          'Task submitted successfully! The AI will score it shortly.',
};

const inputStyle = {
  width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #E5E7EB',
  borderRadius: '0.5rem', fontSize: '0.875rem', outline: 'none',
  boxSizing: 'border-box', backgroundColor: '#FAFAFA', color: '#111827', fontFamily: 'Inter, sans-serif',
};
const labelStyle = {
  display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#374151',
  marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em',
};

function Tasks() {
  const tx = useAutoT(STRINGS);

  const [taskTypes, setTaskTypes] = useState([]);
  const [formData, setFormData] = useState({ title: '', description: '', taskTypeId: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [gitStatus, setGitStatus] = useState(null);
  const [gitProvider, setGitProvider] = useState('');
  const [gitRepos, setGitRepos] = useState([]);
  const [gitReposLoading, setGitReposLoading] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [repoBranch, setRepoBranch] = useState('main');
  const [showNewRepo, setShowNewRepo] = useState(false);
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoPrivate, setNewRepoPrivate] = useState(false);
  const [newRepoCreating, setNewRepoCreating] = useState(false);

  useEffect(() => {
    taskService.getTaskTypes().then(setTaskTypes).catch(() => setError('Failed to load task types.')).finally(() => setIsLoadingTypes(false));
    gitService.getStatus().then(s => setGitStatus(s)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!gitProvider) return;
    setGitRepos([]); setSelectedRepo(''); setShowNewRepo(false); setGitReposLoading(true);
    gitService.getRepos(gitProvider).then(setGitRepos).catch(() => {}).finally(() => setGitReposLoading(false));
  }, [gitProvider]);

  const handleChange = (e) => { setError(''); setSuccess(''); setFormData({ ...formData, [e.target.name]: e.target.value }); };

  const handleCreateRepo = async () => {
    if (!newRepoName.trim()) return;
    setNewRepoCreating(true);
    try {
      const repo = await gitService.createRepo({ name: newRepoName.trim(), description: formData.title ? `Repository for: ${formData.title}` : 'Created via PriorIT', isPrivate: newRepoPrivate, provider: gitProvider });
      setGitRepos(prev => [repo, ...prev]);
      setSelectedRepo(repo.fullName);
      setShowNewRepo(false);
      setNewRepoName('');
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to create repository.');
    } finally {
      setNewRepoCreating(false);
    }
  };

  const clearGit = () => { setGitProvider(''); setGitRepos([]); setSelectedRepo(''); setRepoBranch('main'); setShowNewRepo(false); setNewRepoName(''); setNewRepoPrivate(false); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!formData.taskTypeId) { setError('Please select a task type'); return; }
    const repoData = selectedRepo ? gitRepos.find(r => r.fullName === selectedRepo) : null;
    setIsLoading(true);
    try {
      await taskService.submitTask({
        title: formData.title, description: formData.description, taskTypeId: parseInt(formData.taskTypeId),
        ...(gitProvider && repoData ? { gitProvider: gitProvider.toUpperCase(), gitRepoUrl: repoData.url, gitRepoName: repoData.fullName, gitRepoBranch: repoBranch || 'main' } : {}),
      });
      setSuccess(tx.success);
      setFormData({ title: '', description: '', taskTypeId: '' });
      clearGit();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit task.');
    } finally {
      setIsLoading(false);
    }
  };

  const providerConnected = gitProvider ? gitStatus?.[`${gitProvider}Connected`] : false;
  const providerUsername  = gitProvider ? gitStatus?.[`${gitProvider}Username`]  : null;

  return (
    <PageWrapper title={tx.page_title} subtitle={tx.page_subtitle}>
      <div style={{ maxWidth: '760px' }}>

        {success && (
          <div style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '0.75rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <CheckCircle size={18} color="#16A34A" style={{ flexShrink: 0, marginTop: '1px' }} />
            <p style={{ color: '#16A34A', fontSize: '0.875rem', fontWeight: '500' }}>{success}</p>
          </div>
        )}

        {error && (
          <div style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '0.75rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <AlertCircle size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: '1px' }} />
            <p style={{ color: '#DC2626', fontSize: '0.875rem', fontWeight: '500' }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Task Details */}
            <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1.5rem', border: '1px solid #F0F0F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid #F9FAFB' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#111827' }}>{tx.task_details}</h3>
                <p style={{ fontSize: '0.78rem', color: '#9CA3AF', marginTop: '0.2rem' }}>{tx.task_details_sub}</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
                <div>
                  <label style={labelStyle}>{tx.task_type}</label>
                  {isLoadingTypes ? (
                    <p style={{ fontSize: '0.875rem', color: '#9CA3AF' }}>{tx.loading_types}</p>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {taskTypes.map((type) => {
                        const isSelected = parseInt(formData.taskTypeId) === type.id;
                        return (
                          <button key={type.id} type="button" disabled={isLoading} onClick={() => { setError(''); setFormData({ ...formData, taskTypeId: type.id.toString() }); }}
                            style={{ padding: '0.5rem 1rem', borderRadius: '9999px', border: `1.5px solid ${isSelected ? type.colorCode : '#E5E7EB'}`, backgroundColor: isSelected ? `${type.colorCode}15` : 'white', color: isSelected ? type.colorCode : '#6B7280', fontSize: '0.8rem', fontWeight: isSelected ? '600' : '400', cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '0.35rem', transition: 'all 0.15s' }}>
                            <span>{type.icon}</span><span>{type.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <label style={labelStyle}>{tx.task_title}</label>
                  <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Login screen crashes on Android 13" required style={inputStyle} onFocus={(e) => e.target.style.borderColor = '#CC2027'} onBlur={(e) => e.target.style.borderColor = '#E5E7EB'} />
                </div>

                <div>
                  <label style={labelStyle}>{tx.description}</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Describe the task in detail. Include context, impact, affected users, and any relevant technical details. The AI will use this to score the task." required rows={5} style={{ ...inputStyle, resize: 'vertical', minHeight: '120px', lineHeight: '1.6' }} onFocus={(e) => e.target.style.borderColor = '#CC2027'} onBlur={(e) => e.target.style.borderColor = '#E5E7EB'} />
                  <p style={{ fontSize: '0.72rem', color: '#9CA3AF', marginTop: '0.3rem' }}>{tx.desc_hint}</p>
                </div>
              </div>
            </div>

            {/* Repository */}
            <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1.5rem', border: '1px solid #F0F0F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid #F9FAFB' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#111827' }}>
                      {tx.repo_title} <span style={{ fontSize: '0.75rem', fontWeight: '400', color: '#9CA3AF' }}>{tx.repo_optional}</span>
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: '#9CA3AF', marginTop: '0.2rem' }}>{tx.repo_subtitle}</p>
                  </div>
                  {gitProvider && (
                    <button type="button" onClick={clearGit} style={{ fontSize: '0.72rem', color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>{tx.clear}</button>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>{tx.git_provider}</label>
                <div style={{ display: 'flex', gap: '0.625rem' }}>
                  {[
                    { id: 'github', label: 'GitHub', Icon: GitFork, color: '#1A1A2E' },
                    { id: 'gitlab', label: 'GitLab', Icon: GitBranch, color: '#FC6D26' },
                  ].map(({ id, label, Icon, color }) => {
                    const selected = gitProvider === id;
                    return (
                      <button key={id} type="button" onClick={() => setGitProvider(selected ? '' : id)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.1rem', borderRadius: '0.5rem', border: `1.5px solid ${selected ? color : '#E5E7EB'}`, backgroundColor: selected ? `${color}12` : 'white', color: selected ? color : '#6B7280', fontSize: '0.82rem', fontWeight: selected ? '600' : '400', cursor: 'pointer', transition: 'all 0.15s' }}>
                        <Icon size={15} />{label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {gitProvider && (
                <>
                  {!providerConnected && (
                    <div style={{ padding: '0.875rem 1rem', borderRadius: '0.5rem', backgroundColor: '#FFF7ED', border: '1px solid #FDE68A', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <AlertCircle size={15} color="#D97706" style={{ flexShrink: 0 }} />
                      <p style={{ fontSize: '0.78rem', color: '#92400E', flex: 1 }}>
                        Your {gitProvider === 'github' ? 'GitHub' : 'GitLab'} {tx.not_connected}
                      </p>
                      <a href="/settings" style={{ fontSize: '0.75rem', fontWeight: '600', color: '#D97706', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                        <ExternalLink size={12} /> {tx.connect_settings}
                      </a>
                    </div>
                  )}

                  {providerConnected && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#16A34A' }}>
                        <CheckCircle size={13} />
                        <span>{tx.signed_in_as} <strong>@{providerUsername}</strong></span>
                      </div>

                      <div>
                        <label style={labelStyle}>{tx.select_repo}</label>
                        {gitReposLoading ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#9CA3AF', fontSize: '0.82rem' }}>
                            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                            {tx.loading_repos}
                          </div>
                        ) : (
                          <select value={selectedRepo} onChange={e => { setSelectedRepo(e.target.value); setShowNewRepo(false); }}
                            style={{ ...inputStyle, cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.875rem center', paddingRight: '2.5rem' }}>
                            <option value="">{tx.no_repo}</option>
                            {gitRepos.map(r => <option key={r.fullName} value={r.fullName}>{r.fullName}{r.isPrivate ? ' 🔒' : ''}</option>)}
                          </select>
                        )}
                      </div>

                      {!showNewRepo ? (
                        <button type="button" onClick={() => { setShowNewRepo(true); setSelectedRepo(''); }} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.875rem', borderRadius: '0.4rem', border: '1px dashed #D1D5DB', backgroundColor: 'white', color: '#6B7280', fontSize: '0.78rem', fontWeight: '500', cursor: 'pointer', alignSelf: 'flex-start' }}>
                          <Plus size={13} /> {tx.create_repo}
                        </button>
                      ) : (
                        <div style={{ padding: '1rem', borderRadius: '0.625rem', border: '1px solid #E5E7EB', backgroundColor: '#F8F9FB' }}>
                          <p style={{ fontSize: '0.8rem', fontWeight: '600', color: '#374151', marginBottom: '0.75rem' }}>{tx.new_repo}</p>
                          <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-end' }}>
                            <div style={{ flex: 1 }}>
                              <label style={{ ...labelStyle, marginBottom: '0.35rem' }}>{tx.name}</label>
                              <input type="text" value={newRepoName} onChange={e => setNewRepoName(e.target.value)} placeholder="my-project" style={{ ...inputStyle, padding: '0.55rem 0.875rem' }} onFocus={e => e.target.style.borderColor = '#CC2027'} onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
                            </div>
                            <button type="button" onClick={() => setNewRepoPrivate(p => !p)} style={{ padding: '0.55rem 0.875rem', borderRadius: '0.5rem', border: `1.5px solid ${newRepoPrivate ? '#1A1A2E' : '#E5E7EB'}`, backgroundColor: newRepoPrivate ? '#1A1A2E' : 'white', color: newRepoPrivate ? 'white' : '#6B7280', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', flexShrink: 0 }}>
                              {newRepoPrivate ? '🔒 Private' : '🌐 Public'}
                            </button>
                            <button type="button" onClick={handleCreateRepo} disabled={!newRepoName.trim() || newRepoCreating} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.55rem 1rem', borderRadius: '0.5rem', border: 'none', backgroundColor: !newRepoName.trim() || newRepoCreating ? '#9CA3AF' : '#CC2027', color: 'white', fontSize: '0.78rem', fontWeight: '600', cursor: !newRepoName.trim() || newRepoCreating ? 'not-allowed' : 'pointer', flexShrink: 0 }}>
                              {newRepoCreating ? <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> {tx.creating}</> : <><Plus size={12} /> Create</>}
                            </button>
                            <button type="button" onClick={() => { setShowNewRepo(false); setNewRepoName(''); }} style={{ padding: '0.55rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #E5E7EB', backgroundColor: 'white', color: '#9CA3AF', fontSize: '0.75rem', cursor: 'pointer', flexShrink: 0 }}>
                              {tx.cancel}
                            </button>
                          </div>
                        </div>
                      )}

                      {selectedRepo && (
                        <div>
                          <label style={labelStyle}>{tx.branch}</label>
                          <input type="text" value={repoBranch} onChange={e => setRepoBranch(e.target.value)} placeholder="main" style={{ ...inputStyle, maxWidth: '240px' }} onFocus={e => e.target.style.borderColor = '#CC2027'} onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {!gitProvider && (
                <p style={{ fontSize: '0.78rem', color: '#C4C9D4', fontStyle: 'italic' }}>{tx.select_provider}</p>
              )}
            </div>

            {/* AI note */}
            <div style={{ backgroundColor: '#1A1A2E', borderRadius: '0.75rem', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(204,32,39,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '1rem' }}>🤖</span>
              </div>
              <div>
                <p style={{ color: 'white', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.25rem' }}>{tx.ai_title}</p>
                <p style={{ color: '#6B7280', fontSize: '0.78rem', lineHeight: '1.6' }}>{tx.ai_body}</p>
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" disabled={isLoading} onClick={() => { setFormData({ title: '', description: '', taskTypeId: '' }); clearGit(); setError(''); setSuccess(''); }}
                style={{ padding: '0.7rem 1.5rem', backgroundColor: 'white', border: '1.5px solid #E5E7EB', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: '#6B7280', cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.5 : 1 }}>
                {tx.clear_form}
              </button>
              <button type="submit" disabled={isLoading} style={{ padding: '0.7rem 2rem', backgroundColor: isLoading ? '#9CA3AF' : '#CC2027', color: 'white', fontWeight: '600', borderRadius: '0.5rem', border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {isLoading ? tx.submitting : tx.submit}
              </button>
            </div>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
}

export default Tasks;
