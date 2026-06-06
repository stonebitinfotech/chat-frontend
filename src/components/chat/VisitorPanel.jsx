import { useState } from 'react';
import { formatRelative, formatTime } from '../../utils/helpers';
import { visitorAPI } from '../../services/api';
import toast from 'react-hot-toast';

const InfoRow = ({ label, value }) => (
  <div className="flex items-start justify-between gap-2 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
    <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5">{label}</span>
    <span className="text-xs text-gray-900 dark:text-gray-200 text-right break-all">{value || '—'}</span>
  </div>
);

export default function VisitorPanel({ visitor, conversation, agents, onAssign, onClose, onReopen }) {
  const [note, setNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [noteText, setNoteText] = useState('');

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    try {
      await visitorAPI.addNote(visitor._id, noteText);
      setNoteText('');
      setAddingNote(false);
      toast.success('Note added');
    } catch { toast.error('Failed to add note'); }
  };

  if (!visitor) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        Select a conversation
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 text-lg font-semibold">
              {(visitor.name || 'V')[0].toUpperCase()}
            </div>
            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${visitor.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white truncate">{visitor.name || 'Anonymous'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{visitor.email || 'No email'}</p>
            <p className="text-xs text-gray-400">{visitor.isOnline ? 'Online now' : `Last seen ${formatRelative(visitor.lastSeen)}`}</p>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          {conversation?.status !== 'closed' ? (
            <button onClick={onClose} className="flex-1 btn-danger text-xs py-1.5">Close Chat</button>
          ) : (
            <button onClick={onReopen} className="flex-1 btn-secondary text-xs py-1.5">Reopen</button>
          )}
        </div>

        {conversation?.status !== 'closed' && agents?.length > 0 && (
          <div className="mt-3">
            <label className="label text-xs">Assign to</label>
            <select
              onChange={e => e.target.value && onAssign(e.target.value)}
              className="input text-xs py-1.5"
              value={conversation?.assignedTo?._id || ''}
            >
              <option value="">— Unassigned —</option>
              {agents.map(a => (
                <option key={a._id} value={a._id}>{a.name} {a.isOnline ? '●' : '○'}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Location</h4>
        <InfoRow label="Country" value={visitor.location?.country} />
        <InfoRow label="City" value={visitor.location?.city} />
        <InfoRow label="IP" value={visitor.location?.ip} />
      </div>

      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Device</h4>
        <InfoRow label="Browser" value={`${visitor.device?.browser || '—'} ${visitor.device?.browserVersion || ''}`} />
        <InfoRow label="OS" value={`${visitor.device?.os || '—'} ${visitor.device?.osVersion || ''}`} />
        <InfoRow label="Device" value={visitor.device?.device} />
        <InfoRow label="Language" value={visitor.device?.language} />
      </div>

      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Current Page</h4>
        <p className="text-xs text-primary-600 dark:text-primary-400 break-all">{visitor.currentPage || '—'}</p>
        {visitor.referrer && <p className="text-xs text-gray-400 mt-1 break-all">From: {visitor.referrer}</p>}
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Notes</h4>
          <button onClick={() => setAddingNote(v => !v)} className="text-xs text-primary-600 hover:text-primary-700 font-medium">+ Add</button>
        </div>
        {addingNote && (
          <div className="mb-3">
            <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={2}
              placeholder="Add a note about this visitor..."
              className="input text-xs resize-none mb-2" />
            <div className="flex gap-2">
              <button onClick={handleAddNote} className="btn-primary text-xs py-1 px-3">Save</button>
              <button onClick={() => { setAddingNote(false); setNoteText(''); }} className="btn-secondary text-xs py-1 px-3">Cancel</button>
            </div>
          </div>
        )}
        <div className="space-y-2">
          {visitor.notes?.map((n, i) => (
            <div key={i} className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 rounded-lg p-2">
              <p className="text-xs text-gray-700 dark:text-gray-300">{n.content}</p>
              <p className="text-xs text-gray-400 mt-1">{formatRelative(n.addedAt)}</p>
            </div>
          ))}
          {!visitor.notes?.length && !addingNote && (
            <p className="text-xs text-gray-400">No notes yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
