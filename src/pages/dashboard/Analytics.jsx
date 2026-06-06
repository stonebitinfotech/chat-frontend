import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../../services/api';
import { formatDuration } from '../../utils/helpers';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const COLORS = ['#ea4e00', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
const PERIODS = ['today', 'week', 'month', 'year'];

export default function Analytics() {
  const [period, setPeriod] = useState('month');

  const { data: overview } = useQuery({ queryKey: ['analytics-overview', period], queryFn: () => analyticsAPI.getOverview({ period }) });
  const { data: chatStats } = useQuery({ queryKey: ['analytics-chats', period], queryFn: () => analyticsAPI.getChatStats({ period }) });
  const { data: agentPerf } = useQuery({ queryKey: ['analytics-agents', period], queryFn: () => analyticsAPI.getAgentPerformance({ period }) });
  const { data: visitorStats } = useQuery({ queryKey: ['analytics-visitors', period], queryFn: () => analyticsAPI.getVisitorStats({ period }) });

  const stats = overview?.data;
  const dailyChats = chatStats?.data?.dailyChats || [];
  const chatsByStatus = chatStats?.data?.chatsByStatus || [];
  const agentData = agentPerf?.data || [];
  const byDevice = visitorStats?.data?.byDevice || [];
  const byCountry = visitorStats?.data?.byCountry || [];

  const StatCard = ({ label, value, sub, color }) => (
    <div className="card p-5">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color || 'text-gray-900 dark:text-white'}`}>{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Analytics</h2>
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-1">
          {PERIODS.map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                period === p ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >{p}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Chats" value={stats?.chats?.total} color="text-primary-600" />
        <StatCard label="Active Chats" value={stats?.chats?.active} color="text-green-600" />
        <StatCard label="Open Tickets" value={stats?.tickets?.open} color="text-yellow-600" />
        <StatCard label="Avg Response" value={formatDuration(stats?.avgResponseTime)} color="text-primary-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Daily Chats</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={dailyChats}>
              <defs>
                <linearGradient id="chatGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ea4e00" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ea4e00" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="_id" tick={{ fontSize: 11 }} tickFormatter={v => v?.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="#ea4e00" strokeWidth={2} fill="url(#chatGrad)" name="Chats" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Chat Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={chatsByStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="count" nameKey="_id" label={({ _id, percent }) => `${_id} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {chatsByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [v, n]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Agent Performance</h3>
          {agentData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No agent data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={agentData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="agent.name" type="category" tick={{ fontSize: 11 }} width={80} />
                <Tooltip />
                <Bar dataKey="totalChats" fill="#ea4e00" name="Total Chats" radius={[0, 4, 4, 0]} />
                <Bar dataKey="closedChats" fill="#22c55e" name="Closed" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Visitors by Device</h3>
          {byDevice.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No visitor data yet</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={byDevice} cx="50%" cy="50%" outerRadius={70} dataKey="count" nameKey="_id" label>
                    {byDevice.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1">
                {byCountry.slice(0, 5).map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">{c._id || 'Unknown'}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{c.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
