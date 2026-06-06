import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatAPI, agentAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import ChatInbox from '../../components/chat/ChatInbox';
import ConversationView from '../../components/chat/ConversationView';
import VisitorPanel from '../../components/chat/VisitorPanel';
import toast from 'react-hot-toast';

export default function LiveChats() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { on, off } = useSocket();
  const [showVisitorPanel, setShowVisitorPanel] = useState(true);

  const { data: chatsData, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatAPI.getAll({ limit: 100 }),
    refetchInterval: 30000,
  });

  const { data: agentsData } = useQuery({
    queryKey: ['agents'],
    queryFn: agentAPI.getAll,
  });

  const conversations = chatsData?.data || [];
  const agents = agentsData?.data || [];
  const selected = id ? conversations.find(c => c._id === id) : conversations[0];

  useEffect(() => {
    const handleNewConversation = ({ conversation }) => {
      qc.invalidateQueries(['conversations']);
      toast('New chat started!', { icon: '💬' });
    };
    const handleMessage = () => qc.invalidateQueries(['conversations']);

    on('conversation:new', handleNewConversation);
    on('message:new', handleMessage);

    return () => {
      off('conversation:new', handleNewConversation);
      off('message:new', handleMessage);
    };
  }, []);

  const closeMutation = useMutation({
    mutationFn: () => chatAPI.close(selected._id),
    onSuccess: () => { toast.success('Chat closed'); qc.invalidateQueries(['conversations']); },
  });

  const reopenMutation = useMutation({
    mutationFn: () => chatAPI.reopen(selected._id),
    onSuccess: () => { toast.success('Chat reopened'); qc.invalidateQueries(['conversations']); },
  });

  const assignMutation = useMutation({
    mutationFn: (agentId) => chatAPI.assign(selected._id, agentId),
    onSuccess: () => { toast.success('Chat assigned'); qc.invalidateQueries(['conversations']); },
  });

  return (
    <div className="flex h-full">
      <div className="w-72 xl:w-80 flex-shrink-0 flex flex-col">
        <ChatInbox
          conversations={conversations}
          selected={selected}
          onSelect={c => navigate(`/dashboard/chats/${c._id}`)}
          loading={isLoading}
        />
      </div>

      <div className="flex-1 flex min-w-0">
        <ConversationView conversation={selected} />

        {selected && (
          <div className={`border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-all ${showVisitorPanel ? 'w-72' : 'w-0 overflow-hidden'}`}>
            {showVisitorPanel && (
              <VisitorPanel
                visitor={selected?.visitor}
                conversation={selected}
                agents={agents}
                onAssign={agentId => assignMutation.mutate(agentId)}
                onClose={() => closeMutation.mutate()}
                onReopen={() => reopenMutation.mutate()}
              />
            )}
          </div>
        )}
      </div>

      {selected && (
        <button
          onClick={() => setShowVisitorPanel(v => !v)}
          className="absolute right-0 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-l-lg p-1.5 shadow text-gray-400 hover:text-primary-600 z-10"
          style={{ right: showVisitorPanel ? '288px' : '0' }}
          title={showVisitorPanel ? 'Hide panel' : 'Show panel'}
        >
          <svg className={`w-4 h-4 transition-transform ${showVisitorPanel ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
}
