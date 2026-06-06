import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketAPI, agentAPI } from '../../services/api';
import { formatRelative, formatTime, getPriorityColor, getStatusColor, capitalize } from '../../utils/helpers';
import toast from 'react-hot-toast';

const STATUS_OPTS = ['open', 'pending', 'in_progress', 'closed'];
const PRIORITY_OPTS = ['low', 'medium', 'high', 'urgent'];

export default function Tickets() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ status: '', priority: '' });
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', subject: '', description: '', priority: 'medium' });
  const [reply, setReply] = useState('');
  const [internalNote, setInternalNote] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['tickets', filters],
    queryFn: () => ticketAPI.getAll({ ...filters, limit: 100 }),
  });

  const { data: agentsData } = useQuery({ queryKey: ['agents'], queryFn: agentAPI.getAll });

  const tickets = data?.data || [];
  const agents = agentsData?.data || [];
  const selectedTicket = id ? tickets.find(t => t._id === id) : null;

  const { data: ticketDetail } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => ticketAPI.getOne(id),
    enabled: !!id,
  });
  const ticket = ticketDetail?.data || selectedTicket;

  const createMutation = useMutation({
    mutationFn: ticketAPI.create,
    onSuccess: () => { toast.success('Ticket created'); setShowCreate(false); setCreateForm({ name: '', email: '', subject: '', description: '', priority: 'medium' }); qc.invalidateQueries(['tickets']); },
    onError: err => toast.error(err.message || 'Failed to create ticket'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => ticketAPI.update(id, data),
    onSuccess: () => { toast.success('Ticket updated'); qc.invalidateQueries(['tickets']); qc.invalidateQueries(['ticket', id]); },
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, data }) => ticketAPI.reply(id, data),
    onSuccess: () => { toast.success('Reply sent'); setReply(''); qc.invalidateQueries(['ticket', id]); },
    onError: err => toast.error(err.message || 'Failed to send reply'),
  });

  return (
    <div className="flex h-full">
      <div className={`${id ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-80 xl:w-96 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">Tickets</h3>
            <button onClick={() => setShowCreate(v => !v)} className="btn-primary text-xs py-1.5">+ New</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))} className="input text-xs py-1.5">
              <option value="">All Status</option>
              {STATUS_OPTS.map(s => <option key={s} value={s}>{capitalize(s.replace('_', ' '))}</option>)}
            </select>
            <select value={filters.priority} onChange={e => setFilters(p => ({ ...p, priority: e.target.value }))} className="input text-xs py-1.5">
              <option value="">All Priority</option>
              {PRIORITY_OPTS.map(p => <option key={p} value={p}>{capitalize(p)}</option>)}
            </select>
          </div>
        </div>

        {showCreate && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/10">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3 text-sm">Create Ticket</h4>
            <form onSubmit={e => { e.preventDefault(); createMutation.mutate(createForm); }} className="space-y-2">
              {['name', 'email', 'subject'].map(f => (
                <input key={f} type={f === 'email' ? 'email' : 'text'} className="input text-xs py-1.5" placeholder={capitalize(f)} required
                  value={createForm[f]} onChange={e => setCreateForm(p => ({ ...p, [f]: e.target.value }))} />
              ))}
              <textarea className="input text-xs py-1.5 resize-none" rows={3} placeholder="Description" required
                value={createForm.description} onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))} />
              <select className="input text-xs py-1.5" value={createForm.priority} onChange={e => setCreateForm(p => ({ ...p, priority: e.target.value }))}>
                {PRIORITY_OPTS.map(p => <option key={p} value={p}>{capitalize(p)}</option>)}
              </select>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary text-xs py-1.5 flex-1" disabled={createMutation.isPending}>Create</button>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary text-xs py-1.5">Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">No tickets found</div>
          ) : tickets.map(t => (
            <div key={t._id} onClick={() => navigate(`/dashboard/tickets/${t._id}`)}
              className={`p-4 cursor-pointer border-b border-gray-100 dark:border-gray-700 transition-colors ${id === t._id ? 'bg-primary-50 dark:bg-primary-900/10 border-l-2 border-l-primary-600' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1">{t.subject}</p>
                <span className="text-xs text-gray-400 flex-shrink-0">{formatTime(t.createdAt)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{t.ticketNumber} · {t.name}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className={getStatusColor(t.status) + ' text-xs'}>{t.status.replace('_', ' ')}</span>
                <span className={getPriorityColor(t.priority) + ' text-xs'}>{t.priority}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`flex-1 flex flex-col min-w-0 ${!id ? 'hidden lg:flex' : 'flex'}`}>
        {ticket ? (
          <>
            <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <button onClick={() => navigate('/dashboard/tickets')} className="lg:hidden text-gray-400 hover:text-gray-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <span className="text-xs text-gray-500">{ticket.ticketNumber}</span>
                    <span className={getStatusColor(ticket.status) + ' text-xs'}>{ticket.status?.replace('_', ' ')}</span>
                    <span className={getPriorityColor(ticket.priority) + ' text-xs'}>{ticket.priority}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{ticket.subject}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{ticket.name} · {ticket.email} · {formatRelative(ticket.createdAt)}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0 flex-wrap">
                  <select value={ticket.status} onChange={e => updateMutation.mutate({ id: ticket._id, data: { status: e.target.value } })} className="input text-xs py-1.5 w-auto">
                    {STATUS_OPTS.map(s => <option key={s} value={s}>{capitalize(s.replace('_', ' '))}</option>)}
                  </select>
                  <select value={ticket.assignedTo?._id || ''} onChange={e => updateMutation.mutate({ id: ticket._id, data: { assignedTo: e.target.value || null } })} className="input text-xs py-1.5 w-auto">
                    <option value="">Unassigned</option>
                    {agents.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="card p-4">
                <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{ticket.description}</p>
              </div>

              {ticket.replies?.map((r, i) => (
                <div key={i} className={`card p-4 ${r.isInternal ? 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/10' : ''}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{r.authorName || r.author?.name || 'Agent'}</span>
                    {r.isInternal && <span className="badge badge-yellow text-xs">Internal Note</span>}
                    <span className="text-xs text-gray-400 ml-auto">{formatRelative(r.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{r.content}</p>
                </div>
              ))}
            </div>

            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
                  <input type="checkbox" checked={internalNote} onChange={e => setInternalNote(e.target.checked)} className="rounded" />
                  Internal note (not visible to customer)
                </label>
              </div>
              <textarea value={reply} onChange={e => setReply(e.target.value)} rows={3} placeholder="Write a reply..."
                className={`input text-sm resize-none mb-2 ${internalNote ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/10' : ''}`} />
              <button onClick={() => replyMutation.mutate({ id: ticket._id, data: { content: reply, isInternal: internalNote } })}
                disabled={!reply.trim() || replyMutation.isPending}
                className="btn-primary text-sm">
                {replyMutation.isPending ? 'Sending...' : internalNote ? 'Add Note' : 'Send Reply'}
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400">Select a ticket to view</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
