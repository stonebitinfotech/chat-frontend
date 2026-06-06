import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { portalAPI } from '../../services/api';

const STATUS_BADGE = {
  open: 'bg-orange-100 text-orange-700',
  pending: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  closed: 'bg-gray-100 text-gray-500',
};
const PRIORITY_BADGE = {
  low: 'bg-gray-100 text-gray-500',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

export default function PortalDashboard() {
  const { companyId } = useParams();
  const navigate = useNavigate();

  const [company, setCompany] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [ticketForm, setTicketForm] = useState({ subject: '', description: '', priority: 'medium' });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const color = company?.color || '#ea4e00';
  const MAX_OPEN_TICKETS = 3;
  const openTicketCount = tickets.filter(t => ['open', 'pending', 'in_progress'].includes(t.status)).length;
  const reachedLimit = openTicketCount >= MAX_OPEN_TICKETS;

  useEffect(() => {
    const token = localStorage.getItem('portal_token');
    const storedCompany = localStorage.getItem('portal_company');
    const storedCustomer = localStorage.getItem('portal_customer');

    if (!token || storedCompany !== companyId) {
      navigate(`/portal/${companyId}`, { replace: true });
      return;
    }
    setCustomer(JSON.parse(storedCustomer || '{}'));

    Promise.all([
      portalAPI.getInfo(companyId),
      portalAPI.getTickets(companyId),
    ]).then(([infoRes, ticketsRes]) => {
      setCompany(infoRes.data);
      setTickets(ticketsRes.data || []);
    }).catch(() => {
      navigate(`/portal/${companyId}`, { replace: true });
    }).finally(() => setLoading(false));
  }, [companyId]);

  const handleLogout = () => {
    localStorage.removeItem('portal_token');
    localStorage.removeItem('portal_customer');
    localStorage.removeItem('portal_company');
    navigate(`/portal/${companyId}`);
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!ticketForm.subject.trim()) return setFormError('Subject is required.');
    if (!ticketForm.description.trim()) return setFormError('Description is required.');
    setFormError(''); setSubmitting(true);
    try {
      const res = await portalAPI.createTicket(companyId, ticketForm);
      setTickets(prev => [res.data, ...prev]);
      setShowNewTicket(false);
      setTicketForm({ subject: '', description: '', priority: 'medium' });
    } catch (err) {
      setFormError(err.message || 'Failed to create ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#ea4e00', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
              style={{ background: color }}>
              {company?.name?.[0] || 'S'}
            </div>
            <span className="font-semibold text-gray-900 text-sm">{company?.name}</span>
            <span className="text-gray-300 mx-1">·</span>
            <span className="text-sm text-gray-500">Support Portal</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 hidden sm:block">{customer?.email}</span>
            <button onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Tickets</h1>
            <p className="text-sm text-gray-500 mt-0.5">Hi {customer?.name}, track your support requests here.</p>
          </div>
          <div className="relative group">
            <button
              onClick={() => !reachedLimit && setShowNewTicket(true)}
              disabled={reachedLimit}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: color }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Ticket
            </button>
            {reachedLimit && (
              <div className="absolute right-0 top-10 w-64 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                You have {openTicketCount} open tickets (max {MAX_OPEN_TICKETS}). Please wait for one to be resolved before creating a new one.
              </div>
            )}
          </div>
        </div>

        {/* Tickets list */}
        {tickets.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 bg-gray-100">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <p className="font-medium text-gray-900 mb-1">No tickets yet</p>
            <p className="text-sm text-gray-500">Create a ticket and our team will get back to you.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map(ticket => (
              <Link key={ticket._id} to={`/portal/${companyId}/tickets/${ticket._id}`}
                className="block bg-white rounded-xl border border-gray-200 px-5 py-4 hover:border-gray-300 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-gray-400">#{ticket.ticketNumber}</span>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[ticket.status] || 'bg-gray-100 text-gray-500'}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_BADGE[ticket.priority] || ''}`}>
                        {ticket.priority}
                      </span>
                    </div>
                    <p className="font-medium text-gray-900 truncate">{ticket.subject}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {ticket.replies?.length || 0} {ticket.replies?.length === 1 ? 'reply' : 'replies'} ·
                      Updated {new Date(ticket.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* New Ticket Modal */}
      {showNewTicket && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">New Support Ticket</h2>
              <button onClick={() => { setShowNewTicket(false); setFormError(''); }}
                className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
              {formError && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{formError}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject <span className="text-red-500">*</span></label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                  placeholder="Brief description of your issue"
                  value={ticketForm.subject} onChange={e => setTicketForm(p => ({ ...p, subject: e.target.value }))} autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
                <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent resize-none"
                  rows={4} placeholder="Describe your issue in detail..."
                  value={ticketForm.description} onChange={e => setTicketForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  value={ticketForm.priority} onChange={e => setTicketForm(p => ({ ...p, priority: e.target.value }))}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowNewTicket(false); setFormError(''); }}
                  className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-60"
                  style={{ background: color }}>
                  {submitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
