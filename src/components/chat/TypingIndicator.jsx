export default function TypingIndicator({ name }) {
  return (
    <div className="flex items-end gap-2 chat-message-enter">
      <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
        <div className="flex items-center gap-1.5 h-4">
          <div className="typing-dot bg-gray-400" />
          <div className="typing-dot bg-gray-400" />
          <div className="typing-dot bg-gray-400" />
        </div>
        {name && <p className="text-xs text-gray-400 mt-1">{name} is typing...</p>}
      </div>
    </div>
  );
}
