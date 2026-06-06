import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { visitorAPI } from '../../services/api';
import { formatRelative, formatFullTime, getInitials, getStatusColor } from '../../utils/helpers';

function PageJourney({ history = [] }) {
  if (!history.length) return (
    <p className="text-xs text-gray-400 italic">No page history yet.</p>
  );
  return (
    <ol className="relative border-l border-gray-200 dark:border-gray-700 space-y-0">
      {history.map((h, i) => (
        <li key={i} className="ml-4 pb-4">
          <div className="absolute -left-1.5 mt-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 bg-primary-500" />
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">{formatFullTime(h.visitedAt)}</p>
          {h.title && <p className="text-xs font-medium text-gray-700 dark:text-gray-200 leading-snug truncate" title={h.title}>{h.title}</p>}
          <a href={h.url} target="_blank" rel="noopener noreferrer"
            className="text-xs text-primary-600 dark:text-primary-400 hover:underline break-all leading-snug"
            onClick={e => e.stopPropagation()}
          >{h.url}</a>
        </li>
      ))}
    </ol>
  );
}

function VisitorDetail({ visitorId, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ['visitor', visitorId],
    queryFn: () => visitorAPI.getOne(visitorId),
    enabled: !!visitorId,
    refetchInterval: 5000,
  });

  const visitor = data?.data?.visitor;
  const conversations = data?.data?.conversations || [];
  const pageHistory = visitor?.pageHistory ? [...visitor.pageHistory].reverse() : [];

  return (
    <div className="w-96 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col h-full overflow-hidden flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Visitor Detail</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !visitor ? (
          <p className="text-center text-gray-400 py-8 text-sm">Visitor not found</p>
        ) : (
          <>
            {/* Profile */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-sm font-bold text-primary-700 dark:text-primary-300">
                    {getInitials(visitor.name || 'A')}
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${visitor.isOnline ? 'bg-green-500' : 'bg-gray-300'}`} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{visitor.name || 'Anonymous'}</p>
                  <p className="text-xs text-gray-500 truncate">{visitor.email || 'No email'}</p>
                  <span className={`badge text-xs mt-0.5 inline-block ${visitor.isOnline ? 'badge-green' : 'badge-gray'}`}>
                    {visitor.isOnline ? 'Online now' : `Last seen ${formatRelative(visitor.lastSeen)}`}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
                  <p className="text-gray-400 mb-0.5">Device</p>
                  <p className="font-medium text-gray-700 dark:text-gray-200">{visitor.device?.browser || '—'} / {visitor.device?.device || '—'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
                  <p className="text-gray-400 mb-0.5">OS</p>
                  <p className="font-medium text-gray-700 dark:text-gray-200">{visitor.device?.os || '—'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
                  <p className="text-gray-400 mb-0.5">Location</p>
                  <p className="font-medium text-gray-700 dark:text-gray-200">{[visitor.location?.city, visitor.location?.country].filter(Boolean).join(', ') || '—'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
                  <p className="text-gray-400 mb-0.5">Total Visits</p>
                  <p className="font-medium text-gray-700 dark:text-gray-200">{visitor.totalVisits || 0}</p>
                </div>
              </div>
              {visitor.currentPage && (
                <div className="mt-2 bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-0.5">Currently on</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300 break-all">{visitor.currentPage}</p>
                </div>
              )}
            </div>

            {/* Page Journey */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Page Journey
                </h4>
                <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                  {pageHistory.length} pages
                </span>
              </div>
              <PageJourney history={pageHistory} />
            </div>

            {/* Conversations */}
            {conversations.length > 0 && (
              <div className="p-4">
                <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">
                  Conversations ({conversations.length})
                </h4>
                <div className="space-y-2">
                  {conversations.map(conv => (
                    <div key={conv._id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`badge text-xs ${getStatusColor(conv.status)}`}>{conv.status}</span>
                        <span className="text-xs text-gray-400">{formatRelative(conv.updatedAt)}</span>
                      </div>
                      {conv.lastMessage?.content && (
                        <p className="text-xs text-gray-500 truncate">{conv.lastMessage.content}</p>
                      )}
                      {conv.assignedTo && (
                        <p className="text-xs text-gray-400 mt-1">Agent: {conv.assignedTo.name}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function Visitors() {
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['visitors', onlineOnly, search],
    queryFn: () => visitorAPI.getAll({ online: onlineOnly || undefined, search, limit: 50 }),
    refetchInterval: 10000,
  });

  const visitors = data?.data || [];

  return (
    <div className="flex h-full overflow-hidden">
      {/* List */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse flex-shrink-0" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {visitors.filter(v => v.isOnline).length} online
                </span>
              </div>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">{data?.pagination?.total || 0} total visitors</span>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                <input type="checkbox" checked={onlineOnly} onChange={e => setOnlineOnly(e.target.checked)} className="rounded" />
                Online only
              </label>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search visitors..."
                className="input py-2 text-sm w-52" />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : visitors.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p>No visitors found</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Visitor</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">Current Page</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden lg:table-cell">Location</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden lg:table-cell">Device</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Last Seen</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden xl:table-cell">Pages</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {visitors.map(v => (
                    <tr key={v._id} onClick={() => setSelected(selected === v._id ? null : v._id)}
                      className={`cursor-pointer transition-colors ${selected === v._id ? 'bg-primary-50 dark:bg-primary-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="relative flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-200">
                              {getInitials(v.name || 'Anonymous')}
                            </div>
                            <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-800 ${v.isOnline ? 'bg-green-500' : 'bg-gray-300'}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate">{v.name || 'Anonymous'}</p>
                            <p className="text-xs text-gray-500 truncate">{v.email || 'No email'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${v.isOnline ? 'badge-green' : 'badge-gray'}`}>
                          {v.isOnline ? 'Online' : 'Offline'}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-xs text-gray-500 truncate max-w-48" title={v.currentPage}>{v.currentPage || '—'}</p>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-500">
                        {[v.location?.city, v.location?.country].filter(Boolean).join(', ') || '—'}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-500">
                        {v.device?.browser} / {v.device?.device}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{formatRelative(v.lastSeen)}</td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                          </svg>
                          {v.pageHistory?.length || 0} pages
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <VisitorDetail visitorId={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
