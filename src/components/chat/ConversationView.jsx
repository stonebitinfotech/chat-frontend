import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messageAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import { formatRelative } from '../../utils/helpers';

export default function ConversationView({ conversation }) {
  const bottomRef = useRef(null);
  const qc = useQueryClient();
  const { on, off, joinConversation, leaveConversation } = useSocket();
  const [visitorTyping, setVisitorTyping] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['messages', conversation?._id],
    queryFn: () => messageAPI.getAll(conversation._id),
    enabled: !!conversation?._id,
  });

  const messages = data?.data || [];

  const sendMutation = useMutation({
    mutationFn: (formData) => messageAPI.send(conversation._id, formData),
    onSuccess: (res) => {
      qc.setQueryData(['messages', conversation._id], (old) => ({
        ...old,
        data: [...(old?.data || []), res.data],
      }));
      qc.invalidateQueries(['conversations']);
    },
  });

  useEffect(() => {
    if (!conversation?._id) return;
    joinConversation(conversation._id);
    messageAPI.markRead(conversation._id).catch(() => {});

    const handleNewMessage = (msg) => {
      if (msg.conversation === conversation._id || msg._id) {
        qc.setQueryData(['messages', conversation._id], (old) => ({
          ...old,
          data: [...(old?.data || []).filter(m => m._id !== msg._id), msg],
        }));
        qc.invalidateQueries(['conversations']);
      }
    };

    const handleTyping = ({ typing }) => {
      setVisitorTyping(typing);
    };

    on('message:new', handleNewMessage);
    on('typing:visitor', handleTyping);

    return () => {
      leaveConversation(conversation._id);
      off('message:new', handleNewMessage);
      off('typing:visitor', handleTyping);
    };
  }, [conversation?._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, visitorTyping]);

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-center p-8">
        <div>
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Select a conversation</p>
          <p className="text-gray-400 text-sm mt-1">Choose a chat from the left panel</p>
        </div>
      </div>
    );
  }

  const isClosed = conversation.status === 'closed';

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
              {(conversation.visitor?.name || 'V')[0].toUpperCase()}
            </div>
            <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-800 ${conversation.visitor?.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-900 dark:text-white">{conversation.visitor?.name || 'Anonymous'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {conversation.visitor?.isOnline ? 'Online' : `Last seen ${formatRelative(conversation.visitor?.lastSeen)}`}
              {conversation.assignedTo && ` · Assigned to ${conversation.assignedTo.name}`}
            </p>
          </div>
        </div>
        {isClosed && (
          <span className="badge badge-gray text-xs">Closed</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">No messages yet</div>
        ) : (
          messages.map(msg => <MessageBubble key={msg._id} message={msg} />)
        )}
        {visitorTyping && <TypingIndicator name={conversation.visitor?.name} />}
        <div ref={bottomRef} />
      </div>

      <MessageInput
        conversationId={conversation._id}
        onSend={(data) => sendMutation.mutateAsync(data)}
        disabled={isClosed}
      />
    </div>
  );
}
