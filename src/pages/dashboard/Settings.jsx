import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsAPI } from '../../services/api';
import toast from 'react-hot-toast';

const FONTS = [
  { value: 'system', label: 'System Default' },
  { value: 'Inter, sans-serif', label: 'Inter' },
  { value: 'Roboto, sans-serif', label: 'Roboto' },
  { value: 'Open Sans, sans-serif', label: 'Open Sans' },
  { value: 'Lato, sans-serif', label: 'Lato' },
  { value: 'Poppins, sans-serif', label: 'Poppins' },
  { value: 'Nunito, sans-serif', label: 'Nunito' },
  { value: 'DM Sans, sans-serif', label: 'DM Sans' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Courier New, monospace', label: 'Courier New' },
];

export default function Settings() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('company');
  const chatImageRef = useRef();
  const [chatImagePreview, setChatImagePreview] = useState(null);
  const [chatImageFile, setChatImageFile] = useState(null);

  const { data } = useQuery({ queryKey: ['settings'], queryFn: settingsAPI.get });
  const { data: scriptData } = useQuery({ queryKey: ['widget-script'], queryFn: settingsAPI.getWidgetScript });

  const company = data?.data;
  const [companyForm, setCompanyForm] = useState({ name: '', website: '', industry: '', notificationEmail: '', portalSlug: '' });
  const [widgetForm, setWidgetForm] = useState({
    position: 'bottom-right',
    color: '#ea4e00',
    welcomeMessage: '',
    offlineMessage: '',
    showAgentPhotos: true,
    soundEnabled: true,
    font: 'Poppins, sans-serif',
    paddingBottom: 20,
    paddingSide: 20,
  });

  useEffect(() => {
    if (company) {
      setCompanyForm({ name: company.name || '', website: company.website || '', industry: company.industry || '', notificationEmail: company.notificationEmail || '', portalSlug: company.portalSlug || '' });
      if (company.widget) setWidgetForm({
        position: company.widget.position || 'bottom-right',
        color: company.widget.color || '#ea4e00',
        welcomeMessage: company.widget.welcomeMessage || '',
        offlineMessage: company.widget.offlineMessage || '',
        showAgentPhotos: company.widget.showAgentPhotos !== false,
        soundEnabled: company.widget.soundEnabled !== false,
        font: company.widget.font || 'system',
        paddingBottom: company.widget.paddingBottom ?? 20,
        paddingSide: company.widget.paddingSide ?? 20,
      });
      if (company.widget?.chatImage) setChatImagePreview(company.widget.chatImage);
    }
  }, [company]);

  const companyMutation = useMutation({
    mutationFn: (data) => settingsAPI.updateCompany(data),
    onSuccess: () => { toast.success('Settings saved'); qc.invalidateQueries(['settings']); },
    onError: err => toast.error(err.message || 'Failed to save'),
  });

  const widgetMutation = useMutation({
    mutationFn: (formData) => settingsAPI.updateWidget(formData),
    onSuccess: () => { toast.success('Widget settings saved'); qc.invalidateQueries(['settings']); },
    onError: err => toast.error(err.message || 'Failed to save'),
  });

  const handleWidgetSave = () => {
    const fd = new FormData();
    Object.entries(widgetForm).forEach(([k, v]) => fd.append(k, v));
    if (chatImageFile) fd.append('chatImage', chatImageFile);
    widgetMutation.mutate(fd);
  };

  const handleChatImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setChatImageFile(file);
    setChatImagePreview(URL.createObjectURL(file));
  };

  const tabs = [
    { id: 'company', label: 'Company' },
    { id: 'widget', label: 'Chat Widget' },
    { id: 'installation', label: 'Installation' },
  ];

  const previewFont = widgetForm.font === 'system'
    ? '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    : widgetForm.font;

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
          <div>
            <label className="label">Portal URL</label>
            <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden text-sm">
              <span className="px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-400 border-r border-gray-300 dark:border-gray-600 whitespace-nowrap">{window.location.origin}/portal/</span>
              <input className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 outline-none text-gray-700 dark:text-gray-200"
                placeholder="your-company-name"
                value={companyForm.portalSlug}
                onChange={e => setCompanyForm(p => ({ ...p, portalSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-') }))} />
            </div>
            <p className="text-xs text-gray-400 mt-1">This is the link customers use to access your support portal. Only lowercase letters, numbers, and hyphens.</p>
          </div>
          <div>
            <label className="label">New Chat Notification Email</label>
            <input className="input" type="email" value={companyForm.notificationEmail}
              placeholder="admin@example.com"
              onChange={e => setCompanyForm(p => ({ ...p, notificationEmail: e.target.value }))} />
            <p className="text-xs text-gray-400 mt-1">When a visitor starts a new chat, a notification is sent to this email. Leave blank to use the admin account email.</p>
          </div>
          <button onClick={() => companyMutation.mutate(companyForm)} className="btn-primary" disabled={companyMutation.isPending}>
            {companyMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}

      {tab === 'widget' && (
        <div className="card p-6 space-y-6">
          <h3 className="font-semibold text-gray-900 dark:text-white">Widget Configuration</h3>

          {/* Chat Image */}
          <div>
            <label className="label">Chat Image / Logo</label>
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary-500 transition-colors flex-shrink-0"
                onClick={() => chatImageRef.current?.click()}
                style={{ backgroundColor: widgetForm.color + '22' }}
              >
                {chatImagePreview ? (
                  <img src={chatImagePreview.startsWith('blob:') || chatImagePreview.startsWith('http') ? chatImagePreview : `http://localhost:5000${chatImagePreview}`}
                    alt="Chat" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
              <div>
                <button type="button" onClick={() => chatImageRef.current?.click()}
                  className="btn-secondary text-sm px-3 py-1.5">
                  {chatImagePreview ? 'Change Image' : 'Upload Image'}
                </button>
                {chatImagePreview && (
                  <button type="button" onClick={() => { setChatImagePreview(null); setChatImageFile(null); }}
                    className="ml-2 text-xs text-red-500 hover:text-red-700">Remove</button>
                )}
                <p className="text-xs text-gray-400 mt-1">JPG, PNG or GIF · Max 2 MB</p>
              </div>
              <input ref={chatImageRef} type="file" accept="image/*" className="hidden" onChange={handleChatImageChange} />
            </div>
          </div>

          {/* Position + Color */}
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
                  className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5 flex-shrink-0" />
                <input className="input" value={widgetForm.color} onChange={e => setWidgetForm(p => ({ ...p, color: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* Font */}
          <div>
            <label className="label">Widget Font</label>
            <select className="input" value={widgetForm.font} onChange={e => setWidgetForm(p => ({ ...p, font: e.target.value }))}>
              {FONTS.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1" style={{ fontFamily: previewFont }}>
              Preview: The quick brown fox jumps over the lazy dog
            </p>
          </div>

          {/* Padding */}
          <div>
            <label className="label">Widget Spacing</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Bottom Padding (px)</label>
                <div className="flex items-center gap-2">
                  <input type="range" min="0" max="100" value={widgetForm.paddingBottom}
                    onChange={e => setWidgetForm(p => ({ ...p, paddingBottom: parseInt(e.target.value) }))}
                    className="flex-1 accent-primary-600" />
                  <input type="number" min="0" max="200" value={widgetForm.paddingBottom}
                    onChange={e => setWidgetForm(p => ({ ...p, paddingBottom: parseInt(e.target.value) || 0 }))}
                    className="input w-16 text-center text-sm py-1" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Side Padding (px)</label>
                <div className="flex items-center gap-2">
                  <input type="range" min="0" max="100" value={widgetForm.paddingSide}
                    onChange={e => setWidgetForm(p => ({ ...p, paddingSide: parseInt(e.target.value) }))}
                    className="flex-1 accent-primary-600" />
                  <input type="number" min="0" max="200" value={widgetForm.paddingSide}
                    onChange={e => setWidgetForm(p => ({ ...p, paddingSide: parseInt(e.target.value) || 0 }))}
                    className="input w-16 text-center text-sm py-1" />
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
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

          {/* Live Preview */}
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 mb-3">Widget Preview</p>
            <div
              className="relative h-36 overflow-hidden rounded-lg bg-white dark:bg-gray-800"
              style={{ fontFamily: previewFont }}
            >
              {/* Launcher preview */}
              <div
                className="absolute flex items-end"
                style={{
                  bottom: `${Math.min(widgetForm.paddingBottom, 60)}px`,
                  [widgetForm.position === 'bottom-left' ? 'left' : 'right']: `${Math.min(widgetForm.paddingSide, 60)}px`,
                }}
              >
                <button
                  className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white overflow-hidden"
                  style={{ backgroundColor: widgetForm.color }}
                >
                  {chatImagePreview ? (
                    <img src={chatImagePreview.startsWith('blob:') || chatImagePreview.startsWith('http') ? chatImagePreview : `http://localhost:5000${chatImagePreview}`}
                      alt="" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  )}
                </button>
              </div>
              {/* Font + padding labels */}
              <div className="absolute top-2 left-3">
                <p className="text-xs text-gray-400" style={{ fontFamily: previewFont }}>
                  Font: {FONTS.find(f => f.value === widgetForm.font)?.label}
                </p>
                <p className="text-xs text-gray-400">
                  Bottom: {widgetForm.paddingBottom}px · Side: {widgetForm.paddingSide}px
                </p>
              </div>
            </div>
          </div>

          <button onClick={handleWidgetSave} className="btn-primary" disabled={widgetMutation.isPending}>
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
          <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-4">
            <p className="text-sm font-medium text-primary-800 dark:text-primary-400 mb-1">Your Company ID</p>
            <code className="text-sm text-primary-700 dark:text-primary-300 font-mono">{company?.companyId || '—'}</code>
          </div>
          <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
            <p className="font-medium text-gray-700 dark:text-gray-300">Installation guides:</p>
            {['WordPress: Install via theme editor or plugin', 'Shopify: Add to theme.liquid', 'React/Vue: Add to index.html', 'Any site: Paste before </body>'].map((g, i) => (
              <p key={i} className="flex items-center gap-2"><span className="text-primary-600">›</span>{g}</p>
            ))}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Customer Support Portal</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Share this link with your customers so they can submit and track their support tickets.
            </p>
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3">
              <code className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate font-mono">
                {`${window.location.origin}/portal/${company?.portalSlug || '...'}`}
              </code>
              <button
                onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/portal/${company?.portalSlug}`); toast.success('Portal link copied!'); }}
                className="btn-secondary text-xs px-3 py-1.5 flex-shrink-0">
                Copy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
