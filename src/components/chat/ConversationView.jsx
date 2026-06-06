import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messageAPI, ticketAPI, chatAPI, agentAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import { formatRelative } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function ConversationView({ conversation }) {
  const bottomRef = useRef(null);
  const qc = useQueryClient();
  const { user } = useAuth();
  const { on, off, joinConversation, leaveConversation } = useSocket();
  const isAgent = user?.role === 'agent';
  const isAssignedToMe = conversation?.assignedTo?._id === user?._id || conversation?.assignedTo === user?._id;
  const [visitorTyping, setVisitorTyping] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketForm, setTicketForm] = useState({ name: '', email: '', subject: '', description: '', priority: 'medium' });
  const [ticketLoading, setTicketLoading] = useState(false);
  const [showAssignMenu, setShowAssignMenu] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const assignMenuRef = useRef(null);

  const { data, isLoading } = useQuery({
    queryKey: ['messages', conversation?._id],
    queryFn: () => messageAPI.getAll(conversation._id),
    enabled: !!conversation?._id,
  });

  const messages = data?.data || [];

  const { data: agentsData } = useQuery({
    queryKey: ['agents'],
    queryFn: agentAPI.getAll,
    staleTime: 60000,
  });
  const agents = (agentsData?.data || []).filter(a => !a.isSuspended);

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

  useEffect(() => {
    if (!showAssignMenu) return;
    const handle = (e) => { if (assignMenuRef.current && !assignMenuRef.current.contains(e.target)) setShowAssignMenu(false); };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [showAssignMenu]);

  const handleAssign = async (agentId) => {
    setAssignLoading(true);
    setShowAssignMenu(false);
    try {
      await chatAPI.assign(conversation._id, agentId);
      qc.invalidateQueries(['conversations']);
      qc.invalidateQueries(['messages', conversation._id]);
      toast.success('Conversation assigned');
    } catch {
      toast.error('Failed to assign');
    } finally {
      setAssignLoading(false);
    }
  };

  const openTicketModal = () => {
    setTicketForm({
      name: conversation.visitor?.name || '',
      email: conversation.visitor?.email || '',
      subject: '',
      description: '',
      priority: 'medium',
    });
    setShowTicketModal(true);
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!ticketForm.subject.trim()) return;
    setTicketLoading(true);
    try {
      await ticketAPI.create({
        ...ticketForm,
        source: 'manual',
        conversationId: conversation._id,
        visitorId: conversation.visitor?._id,
      });
      toast.success('Ticket created — transcript emailed to visitor');
      setShowTicketModal(false);
    } catch {
      toast.error('Failed to create ticket');
    } finally {
      setTicketLoading(false);
    }
  };

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
        <div className="flex items-center gap-2">
          {isClosed && <span className="badge badge-gray text-xs">Closed</span>}

          {/* Assign agent dropdown — admin/manager only */}
          {!isAgent && (
            <div className="relative" ref={assignMenuRef}>
              <button
                onClick={() => setShowAssignMenu(v => !v)}
                disabled={assignLoading || isClosed}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {assignLoading ? 'Assigning…' : conversation.assignedTo ? conversation.assignedTo.name : 'Assign'}
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showAssignMenu && (
                <div className="absolute right-0 top-full mt-1 z-30 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
                  {agents.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-gray-400">No agents available</p>
                  ) : agents.map(agent => (
                    <button
                      key={agent._id}
                      onClick={() => handleAssign(agent._id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${conversation.assignedTo?._id === agent._id ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-200'}`}
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-medium overflow-hidden">
                          {agent.avatar ? <img src={agent.avatar} alt={agent.name} className="w-full h-full object-cover" /> : agent.name[0].toUpperCase()}
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white dark:border-gray-800 ${agent.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-xs">{agent.name}</p>
                        <p className="text-xs text-gray-400 capitalize">{agent.role}</p>
                      </div>
                      {conversation.assignedTo?._id === agent._id && (
                        <svg className="w-3.5 h-3.5 ml-auto flex-shrink-0 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            onClick={openTicketModal}
            title="Create ticket from this conversation"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            Create Ticket
          </button>
        </div>
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

      {isAgent && !isAssignedToMe ? (
        <div className="px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-center text-xs text-gray-400 dark:text-gray-500">
          This conversation is not assigned to you — you cannot send messages here.
        </div>
      ) : (
        <MessageInput
          conversationId={conversation._id}
          onSend={(data) => sendMutation.mutateAsync(data)}
          disabled={isClosed}
        />
      )}

      {showTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">Create Support Ticket</h3>
              <button onClick={() => setShowTicketModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1">
                A transcript of this chat will be emailed to the visitor automatically.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                  <input
                    type="text"
                    value={ticketForm.name}
                    onChange={e => setTicketForm(f => ({ ...f, name: e.target.value }))}
                    className="input text-sm w-full"
                    placeholder="Visitor name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={ticketForm.email}
                    onChange={e => setTicketForm(f => ({ ...f, email: e.target.value }))}
                    className="input text-sm w-full"
                    placeholder="visitor@email.com"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                <input
                  type="text"
                  value={ticketForm.subject}
                  onChange={e => setTicketForm(f => ({ ...f, subject: e.target.value }))}
                  className="input text-sm w-full"
                  placeholder="Brief summary of the issue"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={ticketForm.description}
                  onChange={e => setTicketForm(f => ({ ...f, description: e.target.value }))}
                  className="input text-sm w-full resize-none"
                  rows={3}
                  placeholder="Additional context or notes"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                <select
                  value={ticketForm.priority}
                  onChange={e => setTicketForm(f => ({ ...f, priority: e.target.value }))}
                  className="input text-sm w-full"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowTicketModal(false)} className="btn-secondary flex-1 text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={ticketLoading} className="btn-primary flex-1 text-sm">
                  {ticketLoading ? 'Creating…' : 'Create Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
