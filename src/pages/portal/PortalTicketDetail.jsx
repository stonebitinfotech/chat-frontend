import { useState, useEffect, useRef } from 'react';
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

export default function PortalTicketDetail() {
  const { companyId, ticketId } = useParams();
  const navigate = useNavigate();
  const bottomRef = useRef(null);

  const [company, setCompany] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const color = company?.color || '#ea4e00';
  const isClosed = ticket?.status === 'closed';

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
      portalAPI.getTicket(companyId, ticketId),
    ]).then(([infoRes, ticketRes]) => {
      setCompany(infoRes.data);
      setTicket(ticketRes.data);
    }).catch(() => navigate(`/portal/${companyId}/dashboard`, { replace: true }))
      .finally(() => setLoading(false));
  }, [companyId, ticketId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.replies]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setError(''); setSending(true);
    try {
      const res = await portalAPI.reply(companyId, ticketId, reply.trim());
      setTicket(res.data);
      setReply('');
    } catch (err) {
      setError(err.message || 'Failed to send reply.');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (d) => new Date(d).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#ea4e00', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Topbar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link to={`/portal/${companyId}/dashboard`}
            className="text-gray-400 hover:text-gray-600 flex items-center gap-1 text-sm transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            My Tickets
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-700 font-medium truncate">{ticket?.subject}</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 w-full flex-1 flex flex-col">
        {/* Ticket header */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-xs font-mono text-gray-400">#{ticket?.ticketNumber}</span>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[ticket?.status] || ''}`}>
                  {ticket?.status?.replace('_', ' ')}
                </span>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_BADGE[ticket?.priority] || ''}`}>
                  {ticket?.priority}
                </span>
              </div>
              <h1 className="text-lg font-semibold text-gray-900">{ticket?.subject}</h1>
              <p className="text-xs text-gray-400 mt-1">Opened {formatTime(ticket?.createdAt)}</p>
            </div>
          </div>
          {ticket?.description && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{ticket.description}</p>
            </div>
          )}
        </div>

        {/* Replies thread */}
        <div className="space-y-3 flex-1 mb-4">
          {(!ticket?.replies || ticket.replies.length === 0) && (
            <div className="text-center py-8 text-sm text-gray-400">No replies yet. Our team will respond shortly.</div>
          )}
          {ticket?.replies?.filter(r => !r.isInternal).map((r, i) => {
            const isCustomer = r.authorType === 'customer';
            return (
              <div key={i} className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${isCustomer ? 'text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'}`}
                  style={isCustomer ? { background: color } : {}}>
                  <p className={`text-xs font-medium mb-1 ${isCustomer ? 'text-white/70' : 'text-gray-400'}`}>
                    {isCustomer ? 'You' : r.authorName || 'Support Team'}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{r.content}</p>
                  <p className={`text-xs mt-1.5 ${isCustomer ? 'text-white/60' : 'text-gray-400'}`}>
                    {formatTime(r.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Reply input */}
        {isClosed ? (
          <div className="bg-gray-100 rounded-xl px-5 py-4 text-center text-sm text-gray-500">
            This ticket is closed. <Link to={`/portal/${companyId}/dashboard`} className="font-medium hover:underline" style={{ color }}>Create a new ticket</Link> if you need further help.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-4 sticky bottom-4">
            {error && <div className="mb-3 p-2 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}
            <form onSubmit={handleReply} className="flex gap-3">
              <textarea
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': color }}
                rows={2}
                placeholder="Write a reply..."
                value={reply}
                onChange={e => setReply(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(e); } }}
              />
              <button type="submit" disabled={sending || !reply.trim()}
                className="px-4 py-2 rounded-lg text-white text-sm font-semibold self-end transition-opacity disabled:opacity-50"
                style={{ background: color }}>
                {sending ? '...' : 'Send'}
              </button>
            </form>
            <p className="text-xs text-gray-400 mt-2">Press Enter to send, Shift+Enter for new line.</p>
          </div>
        )}
      </div>
    </div>
  );
}
