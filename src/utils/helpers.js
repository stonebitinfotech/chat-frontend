import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

export const formatTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isToday(d)) return format(d, 'h:mm a');
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d');
};

export const formatFullTime = (date) => {
  if (!date) return '';
  return format(new Date(date), 'MMM d, yyyy h:mm a');
};

export const formatRelative = (date) => {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const formatDuration = (seconds) => {
  if (!seconds) return '—';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
};

export const getInitials = (name = '') => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const getStatusColor = (status) => {
  const colors = {
    new: 'badge-blue',
    assigned: 'badge-purple',
    active: 'badge-green',
    closed: 'badge-gray',
    open: 'badge-blue',
    pending: 'badge-yellow',
    in_progress: 'badge-purple',
    resolved: 'badge-green',
  };
  return colors[status] || 'badge-gray';
};

export const getPriorityColor = (priority) => {
  const colors = {
    low: 'badge-gray',
    medium: 'badge-blue',
    high: 'badge-yellow',
    urgent: 'badge-red',
  };
  return colors[priority] || 'badge-gray';
};

export const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

export const truncate = (str, n = 50) => {
  if (!str) return '';
  return str.length > n ? `${str.slice(0, n)}...` : str;
};

export const capitalize = (str = '') => str.charAt(0).toUpperCase() + str.slice(1);

export const isImageFile = (mimeType) => mimeType?.startsWith('image/');

export const generateVisitorId = () =>
  `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
