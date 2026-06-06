import { useState, useRef, useCallback, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024;

export default function MessageInput({ conversationId, onSend, disabled }) {
  const [text, setText] = useState('');
  const [fileItems, setFileItems] = useState([]); // [{file, url}]
  const [sending, setSending] = useState(false);
  const fileRef = useRef(null);
  const typingRef = useRef(false);
  const typingTimeout = useRef(null);
  const fileItemsRef = useRef(fileItems);
  const { sendTypingStart, sendTypingStop } = useSocket();

  // Keep ref in sync for cleanup on unmount
  useEffect(() => { fileItemsRef.current = fileItems; }, [fileItems]);
  useEffect(() => () => fileItemsRef.current.forEach(item => URL.revokeObjectURL(item.url)), []);

  const handleTyping = useCallback((value) => {
    setText(value);
    if (!typingRef.current) {
      typingRef.current = true;
      sendTypingStart(conversationId);
    }
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      typingRef.current = false;
      sendTypingStop(conversationId);
    }, 1500);
  }, [conversationId, sendTypingStart, sendTypingStop]);

  const handleSend = async () => {
    if (!text.trim() && fileItems.length === 0) return;
    setSending(true);
    clearTimeout(typingTimeout.current);
    typingRef.current = false;
    sendTypingStop(conversationId);

    try {
      const formData = new FormData();
      if (text.trim()) formData.append('content', text.trim());
      fileItems.forEach(item => formData.append('files', item.file));
      await onSend(formData);
      setText('');
      setFileItems(prev => { prev.forEach(item => URL.revokeObjectURL(item.url)); return []; });
    } catch {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files || []);
    const valid = [];
    for (const f of selected) {
      if (!ALLOWED_TYPES.includes(f.type)) { toast.error(`${f.name}: Only JPG, PNG, WebP allowed`); continue; }
      if (f.size > MAX_SIZE) { toast.error(`${f.name}: Max 10 MB`); continue; }
      valid.push(f);
    }
    if (!valid.length) { e.target.value = ''; return; }
    if (fileItems.length + valid.length > 5) { toast.error('Max 5 images'); e.target.value = ''; return; }
    const newItems = valid.map(f => ({ file: f, url: URL.createObjectURL(f) }));
    setFileItems(prev => [...prev, ...newItems]);
    e.target.value = '';
  };

  const removeFile = (i) => {
    setFileItems(prev => {
      URL.revokeObjectURL(prev[i].url);
      return prev.filter((_, j) => j !== i);
    });
  };

  const hasContent = text.trim() || fileItems.length > 0;

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
      <div className="flex items-end gap-2">
        {/* Compose box */}
        <div className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500 transition-all bg-white dark:bg-gray-900">
          {/* Image previews inside compose box */}
          {fileItems.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 pb-1">
              {fileItems.map((item, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-700">
                  <img src={item.url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 text-white flex items-center justify-content text-xs leading-none hover:bg-black/80 transition-colors"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Textarea */}
          <textarea
            value={text}
            onChange={e => handleTyping(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? 'Chat is closed' : 'Type a message… (Enter to send, Shift+Enter for newline)'}
            disabled={disabled || sending}
            rows={1}
            className="w-full bg-transparent px-4 py-3 text-sm resize-none focus:outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 max-h-32 overflow-auto"
            style={{ minHeight: '44px' }}
          />
        </div>

        {/* Attach image button */}
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={handleFiles}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={disabled || sending}
          title="Attach images (JPG, PNG, WebP · max 10 MB)"
          className="p-2.5 rounded-xl text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors disabled:opacity-50 flex-shrink-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="8.5" cy="8.5" r="1.5" strokeWidth={2} />
            <polyline points="21 15 16 10 5 21" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || sending || !hasContent}
          className="p-2.5 rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
        >
          {sending ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
