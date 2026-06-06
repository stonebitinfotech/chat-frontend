import { useState } from 'react';
import { formatTime, truncate, getStatusColor } from '../../utils/helpers';

export default function ChatInbox({ conversations = [], selected, onSelect, loading }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = conversations.filter(c => {
    const matchFilter = filter === 'all' || c.status === filter;
    const matchSearch = !search || (c.visitor?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.visitor?.email || '').toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search conversations..."
          className="input text-sm py-2"
        />
        <div className="flex gap-1 mt-3 overflow-x-auto pb-1">
          {['all', 'new', 'active', 'assigned', 'closed'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filter === s
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            {search ? 'No results found' : 'No conversations'}
          </div>
        ) : (
          filtered.map(conv => (
            <ConversationItem
              key={conv._id}
              conversation={conv}
              isSelected={selected?._id === conv._id}
              onClick={() => onSelect(conv)}
            />
          ))
        )}
      </div>
    </div>
  );
}

const ConversationItem = ({ conversation, isSelected, onClick }) => {
  const visitor = conversation.visitor || {};
  const hasUnread = conversation.unreadCount?.agent > 0;

  return (
    <div
      onClick={onClick}
      className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-700/50 ${
        isSelected
          ? 'bg-primary-50 dark:bg-primary-900/20 border-l-2 border-l-primary-600'
          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
      }`}
    >
      <div className="relative flex-shrink-0 mt-0.5">
        <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-200">
          {(visitor.name || 'A')[0].toUpperCase()}
        </div>
        <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-800 ${visitor.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm truncate ${hasUnread ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-200'}`}>
            {visitor.name || 'Anonymous'}
          </p>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {hasUnread && (
              <span className="w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {conversation.unreadCount.agent}
              </span>
            )}
            <span className="text-xs text-gray-400">{formatTime(conversation.lastMessage?.sentAt || conversation.updatedAt)}</span>
          </div>
        </div>
        <p className={`text-xs mt-0.5 truncate ${hasUnread ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
          {truncate(conversation.lastMessage?.content || 'No messages yet', 45)}
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className={getStatusColor(conversation.status) + ' text-xs'}>
            {conversation.status}
          </span>
          {conversation.assignedTo && (
            <span className="text-xs text-gray-400">· {conversation.assignedTo.name}</span>
          )}
        </div>
      </div>
    </div>
  );
};
