import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../../services/api';
import { formatDuration, formatRelative } from '../../utils/helpers';
import { Link } from 'react-router-dom';

const StatCard = ({ label, value, sub, icon, color }) => (
  <div className="card p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value ?? '—'}</p>
        {sub && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{sub}</p>}
      </div>
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center text-white flex-shrink-0`}>
        {icon}
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: () => analyticsAPI.getOverview({ period: 'month' }),
  });

  const stats = data?.data;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Overview</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">This month's performance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Chats" value={isLoading ? '...' : stats?.chats?.total}
          sub={`${stats?.chats?.active || 0} active now`}
          color="bg-primary-500"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>}
        />
        <StatCard label="New Chats" value={isLoading ? '...' : stats?.chats?.new}
          sub="Waiting for agent"
          color="bg-primary-500"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>}
        />
        <StatCard label="Open Tickets" value={isLoading ? '...' : stats?.tickets?.open}
          sub={`${stats?.tickets?.total || 0} total`}
          color="bg-yellow-500"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>}
        />
        <StatCard label="Online Visitors" value={isLoading ? '...' : stats?.visitors?.online}
          sub={`${stats?.visitors?.total || 0} total`}
          color="bg-green-500"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Avg. Response Time</h3>
          <p className="text-3xl font-bold text-primary-600">{formatDuration(stats?.avgResponseTime)}</p>
          <p className="text-xs text-gray-500 mt-1">First response this month</p>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Chat Resolution</h3>
          <p className="text-3xl font-bold text-green-600">
            {stats?.chats?.total ? Math.round((stats.chats.closed / stats.chats.total) * 100) : 0}%
          </p>
          <p className="text-xs text-gray-500 mt-1">{stats?.chats?.closed || 0} chats resolved</p>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Ticket Resolution</h3>
          <p className="text-3xl font-bold text-primary-600">
            {stats?.tickets?.total ? Math.round((stats.tickets.closed / stats.tickets.total) * 100) : 0}%
          </p>
          <p className="text-xs text-gray-500 mt-1">{stats?.tickets?.closed || 0} tickets resolved</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'View Live Chats', to: '/dashboard/chats', color: 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' },
              { label: 'Open Tickets', to: '/dashboard/tickets', color: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400' },
              { label: 'Manage Agents', to: '/dashboard/agents', color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400' },
              { label: 'View Analytics', to: '/dashboard/analytics', color: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' },
              { label: 'Widget Settings', to: '/dashboard/settings', color: 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' },
            ].map(({ label, to, color }) => (
              <Link key={to} to={to} className={`${color} rounded-lg px-4 py-3 text-sm font-medium text-center hover:opacity-80 transition-opacity`}>
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Chat Status Breakdown</h3>
          <div className="space-y-3">
            {[
              { label: 'New', count: stats?.chats?.new || 0, color: 'bg-primary-500', max: stats?.chats?.total || 1 },
              { label: 'Active', count: stats?.chats?.active || 0, color: 'bg-green-500', max: stats?.chats?.total || 1 },
              { label: 'Closed', count: stats?.chats?.closed || 0, color: 'bg-gray-400', max: stats?.chats?.total || 1 },
            ].map(({ label, count, color, max }) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">{label}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{count}</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${max > 0 ? (count / max) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
