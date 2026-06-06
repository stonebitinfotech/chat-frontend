import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agentAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatRelative, getInitials } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function Agents() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [showInvite, setShowInvite] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'agent' });

  const { data, isLoading } = useQuery({ queryKey: ['agents'], queryFn: agentAPI.getAll });
  const agents = data?.data || [];

  const inviteMutation = useMutation({
    mutationFn: agentAPI.invite,
    onSuccess: () => {
      toast.success('Agent invited! They will receive an email.');
      setForm({ name: '', email: '', role: 'agent' });
      setShowInvite(false);
      qc.invalidateQueries(['agents']);
    },
    onError: err => toast.error(err.message || 'Failed to invite agent'),
  });

  const suspendMutation = useMutation({
    mutationFn: agentAPI.suspend,
    onSuccess: () => { toast.success('Agent suspended'); qc.invalidateQueries(['agents']); },
  });

  const activateMutation = useMutation({
    mutationFn: agentAPI.activate,
    onSuccess: () => { toast.success('Agent activated'); qc.invalidateQueries(['agents']); },
  });

  const removeMutation = useMutation({
    mutationFn: agentAPI.remove,
    onSuccess: () => { toast.success('Agent removed'); qc.invalidateQueries(['agents']); },
    onError: err => toast.error(err.message || 'Failed to remove agent'),
  });

  const handleInvite = (e) => {
    e.preventDefault();
    inviteMutation.mutate(form);
  };

  const roleColors = { admin: 'badge-purple', manager: 'badge-blue', agent: 'badge-gray' };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Agents</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{agents.length} members on your team</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <button onClick={() => setShowInvite(v => !v)} className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Invite Agent
          </button>
        )}
      </div>

      {showInvite && (
        <div className="card p-5 mb-6 animate-slide-up">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Invite New Agent</h3>
          <form onSubmit={handleInvite} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Name</label>
              <input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="Agent name" />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required placeholder="agent@company.com" />
            </div>
            <div>
              <label className="label">Role</label>
              <select className="input" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                <option value="agent">Agent</option>
                <option value="manager">Manager</option>
                {user?.role === 'admin' && <option value="admin">Admin</option>}
              </select>
            </div>
            <div className="sm:col-span-3 flex gap-3">
              <button type="submit" className="btn-primary" disabled={inviteMutation.isPending}>
                {inviteMutation.isPending ? 'Inviting...' : 'Send Invite'}
              </button>
              <button type="button" onClick={() => setShowInvite(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Agent</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden sm:table-cell">Role</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">Last Seen</th>
                {user?.role === 'admin' && <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {agents.map(agent => (
                <tr key={agent._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="relative flex-shrink-0">
                        <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-sm font-semibold text-primary-700 dark:text-primary-400">
                          {agent.avatar ? <img src={agent.avatar} className="w-full h-full rounded-full object-cover" /> : getInitials(agent.name)}
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-800 ${agent.isOnline ? 'bg-green-500' : 'bg-gray-300'}`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                          {agent.name}
                          {agent._id === user?._id && <span className="text-xs text-gray-400">(you)</span>}
                        </p>
                        <p className="text-xs text-gray-500">{agent.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`badge ${roleColors[agent.role] || 'badge-gray'}`}>{agent.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${agent.isSuspended ? 'badge-red' : agent.isOnline ? 'badge-green' : 'badge-gray'}`}>
                      {agent.isSuspended ? 'Suspended' : agent.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-400">{formatRelative(agent.lastSeen)}</td>
                  {user?.role === 'admin' && (
                    <td className="px-4 py-3 text-right">
                      {agent._id !== user._id && (
                        <div className="flex items-center justify-end gap-2">
                          {agent.isSuspended ? (
                            <button onClick={() => activateMutation.mutate(agent._id)} className="text-xs text-green-600 hover:text-green-700 font-medium">Activate</button>
                          ) : (
                            <button onClick={() => suspendMutation.mutate(agent._id)} className="text-xs text-yellow-600 hover:text-yellow-700 font-medium">Suspend</button>
                          )}
                          <button onClick={() => { if (confirm('Remove this agent?')) removeMutation.mutate(agent._id); }}
                            className="text-xs text-red-500 hover:text-red-600 font-medium">Remove</button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
