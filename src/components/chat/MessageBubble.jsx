import { formatFullTime, formatBytes, isImageFile, getInitials } from '../../utils/helpers';

export default function MessageBubble({ message, isAgent }) {
  const isFromAgent = message.sender?.type === 'agent';
  const isSystem = message.sender?.type === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-end gap-2 chat-message-enter ${isFromAgent ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-medium overflow-hidden">
        {message.sender?.avatar ? (
          <img src={message.sender.avatar} alt={message.sender.name} className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${isFromAgent ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
            {getInitials(message.sender?.name || (isFromAgent ? 'Agent' : 'Visitor'))}
          </div>
        )}
      </div>

      <div className={`max-w-xs lg:max-w-md xl:max-w-lg group`}>
        {message.attachments?.length > 0 && (
          <div className="space-y-2 mb-1">
            {message.attachments.map((att, i) => (
              <div key={i}>
                {isImageFile(att.mimeType) ? (
                  <img src={att.url} alt={att.name} className="rounded-xl max-w-full max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(att.url, '_blank')} />
                ) : (
                  <a href={att.url} target="_blank" rel="noreferrer"
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${isFromAgent ? 'rounded-br-sm bg-primary-600 text-white' : 'rounded-bl-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200'}`}>
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{att.name}</p>
                      <p className="text-xs opacity-70">{formatBytes(att.size)}</p>
                    </div>
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {message.content && (
          <div className={`px-4 py-2.5 rounded-2xl shadow-sm ${isFromAgent
            ? 'rounded-br-sm bg-primary-600 text-white'
            : 'rounded-bl-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100'}`}>
            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
          </div>
        )}

        <div className={`flex items-center gap-1 mt-1 ${isFromAgent ? 'justify-end' : 'justify-start'}`}>
          <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
            {formatFullTime(message.createdAt)}
          </span>
          {isFromAgent && message.isRead && (
            <svg className="w-3.5 h-3.5 text-primary-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
