import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function Settings() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('company');

  const { data } = useQuery({ queryKey: ['settings'], queryFn: settingsAPI.get });
  const { data: scriptData } = useQuery({ queryKey: ['widget-script'], queryFn: settingsAPI.getWidgetScript });

  const company = data?.data;
  const [companyForm, setCompanyForm] = useState({ name: '', website: '', industry: '' });
  const [widgetForm, setWidgetForm] = useState({
    position: 'bottom-right', color: '#4F46E5', welcomeMessage: '', offlineMessage: '', showAgentPhotos: true, soundEnabled: true,
  });

  useState(() => {
    if (company) {
      setCompanyForm({ name: company.name || '', website: company.website || '', industry: company.industry || '' });
      if (company.widget) setWidgetForm({ ...company.widget });
    }
  }, [company]);

  const companyMutation = useMutation({
    mutationFn: (data) => settingsAPI.updateCompany(data),
    onSuccess: () => { toast.success('Settings saved'); qc.invalidateQueries(['settings']); },
    onError: err => toast.error(err.message || 'Failed to save'),
  });

  const widgetMutation = useMutation({
    mutationFn: settingsAPI.updateWidget,
    onSuccess: () => { toast.success('Widget settings saved'); qc.invalidateQueries(['settings']); },
    onError: err => toast.error(err.message || 'Failed to save'),
  });

  const tabs = [
    { id: 'company', label: 'Company' },
    { id: 'widget', label: 'Chat Widget' },
    { id: 'installation', label: 'Installation' },
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Settings</h2>

      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-6">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${tab === t.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'company' && (
        <div className="card p-6 space-y-5">
          <h3 className="font-semibold text-gray-900 dark:text-white">Company Information</h3>
          <div>
            <label className="label">Company Name</label>
            <input className="input" value={companyForm.name} onChange={e => setCompanyForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <label className="label">Website</label>
            <input className="input" value={companyForm.website} placeholder="https://example.com" onChange={e => setCompanyForm(p => ({ ...p, website: e.target.value }))} />
          </div>
          <div>
            <label className="label">Industry</label>
            <select className="input" value={companyForm.industry} onChange={e => setCompanyForm(p => ({ ...p, industry: e.target.value }))}>
              <option value="">Select industry</option>
              {['Technology', 'E-commerce', 'Healthcare', 'Finance', 'Education', 'Marketing', 'Other'].map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <button onClick={() => companyMutation.mutate(companyForm)} className="btn-primary" disabled={companyMutation.isPending}>
            {companyMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}

      {tab === 'widget' && (
        <div className="card p-6 space-y-5">
          <h3 className="font-semibold text-gray-900 dark:text-white">Widget Configuration</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Position</label>
              <select className="input" value={widgetForm.position} onChange={e => setWidgetForm(p => ({ ...p, position: e.target.value }))}>
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-left">Bottom Left</option>
              </select>
            </div>
            <div>
              <label className="label">Brand Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={widgetForm.color} onChange={e => setWidgetForm(p => ({ ...p, color: e.target.value }))}
                  className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5" />
                <input className="input" value={widgetForm.color} onChange={e => setWidgetForm(p => ({ ...p, color: e.target.value }))} />
              </div>
            </div>
          </div>
          <div>
            <label className="label">Welcome Message</label>
            <textarea className="input resize-none" rows={2} value={widgetForm.welcomeMessage}
              onChange={e => setWidgetForm(p => ({ ...p, welcomeMessage: e.target.value }))} placeholder="Hi! How can we help you today?" />
          </div>
          <div>
            <label className="label">Offline Message</label>
            <textarea className="input resize-none" rows={2} value={widgetForm.offlineMessage}
              onChange={e => setWidgetForm(p => ({ ...p, offlineMessage: e.target.value }))} placeholder="We're currently offline. Leave us a message!" />
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={widgetForm.showAgentPhotos} onChange={e => setWidgetForm(p => ({ ...p, showAgentPhotos: e.target.checked }))} className="rounded" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Show agent photos</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={widgetForm.soundEnabled} onChange={e => setWidgetForm(p => ({ ...p, soundEnabled: e.target.checked }))} className="rounded" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Sound notifications</span>
            </label>
          </div>

          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 mb-3">Widget Preview</p>
            <div className="relative h-32 flex items-end justify-end">
              <button className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white"
                style={{ backgroundColor: widgetForm.color }}>
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>
            </div>
          </div>

          <button onClick={() => widgetMutation.mutate(widgetForm)} className="btn-primary" disabled={widgetMutation.isPending}>
            {widgetMutation.isPending ? 'Saving...' : 'Save Widget Settings'}
          </button>
        </div>
      )}

      {tab === 'installation' && (
        <div className="card p-6 space-y-5">
          <h3 className="font-semibold text-gray-900 dark:text-white">Install the Chat Widget</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Paste this code snippet just before the closing <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">&lt;/body&gt;</code> tag on your website.
          </p>
          <div className="bg-gray-900 rounded-xl p-4 relative">
            <pre className="text-green-400 text-xs overflow-x-auto whitespace-pre-wrap">
              {scriptData?.data?.snippet || `<script src="https://yourdomain.com/widget.js" data-company-id="YOUR_COMPANY_ID" async></script>`}
            </pre>
            <button
              onClick={() => { navigator.clipboard.writeText(scriptData?.data?.snippet || ''); toast.success('Copied!'); }}
              className="absolute top-3 right-3 bg-gray-700 hover:bg-gray-600 text-white text-xs px-2 py-1 rounded transition-colors"
            >Copy</button>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-400 mb-1">Your Company ID</p>
            <code className="text-sm text-blue-700 dark:text-blue-300 font-mono">{company?.companyId || '—'}</code>
          </div>
          <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
            <p className="font-medium text-gray-700 dark:text-gray-300">Installation guides:</p>
            {['WordPress: Install via theme editor or plugin', 'Shopify: Add to theme.liquid', 'React/Vue: Add to index.html', 'Any site: Paste before </body>'].map((g, i) => (
              <p key={i} className="flex items-center gap-2"><span className="text-primary-600">›</span>{g}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
