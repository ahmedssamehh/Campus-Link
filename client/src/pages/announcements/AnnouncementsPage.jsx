import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useSocket } from '../../context/SocketContext';
import axios from '../../api/axios';

const AnnouncementsPage = () => {
  const { user } = useAuth();
  const { showSuccess, showError, showWarning, showConfirm } = useNotification();
  const { onNewAnnouncement, setUnreadAnnouncements } = useSocket();
  const isAdminOrOwner = user?.role === 'admin' || user?.role === 'owner';

  const [announcements, setAnnouncements] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groups, setGroups] = useState([]);         // all groups (for system admin)
  const [adminGroups, setAdminGroups] = useState([]); // groups where current user is admin/owner
  const [formData, setFormData] = useState({ groupId: '', title: '', content: '' });
  const [submitting, setSubmitting] = useState(false);

  // Is the user a group admin in at least one group?
  const isGroupAdmin = adminGroups.length > 0;

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get('/announcements/my');
      if (response.data.success) {
        const fetched = response.data.announcements;
        setAnnouncements(fetched);
        const actualUnread = fetched.filter(a => !a.isRead).length;
        setUnreadAnnouncements(actualUnread);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch announcements');
    } finally {
      setLoading(false);
    }
  }, [setUnreadAnnouncements]);

  const fetchGroups = useCallback(async () => {
    try {
      const response = await axios.get('/groups');
      if (response.data.success) {
        const allGroups = response.data.groups;
        setGroups(allGroups);

        // Determine which groups current user can post to (admin/owner of that group)
        const userId = (user?._id || user?.id || '').toString();
        const myAdminGroups = allGroups.filter(g => {
          const creatorId = (g.createdBy?._id || g.createdBy || '').toString();
          const isCreator = creatorId === userId;
          const isGAdmin = (g.admins || []).some(a => (a._id || a || '').toString() === userId);
          return isCreator || isGAdmin;
        });
        setAdminGroups(myAdminGroups);
      }
    } catch (err) {
    }
  }, [user]);

  useEffect(() => {
    fetchAnnouncements();
    fetchGroups();
  }, [fetchAnnouncements, fetchGroups]);

  const handleMarkAsRead = async (announcementId) => {
    try {
      await axios.patch(`/announcements/${announcementId}/read`);
      setAnnouncements(prev => prev.map(ann =>
        ann._id === announcementId ? { ...ann, isRead: true } : ann
      ));
      // Decrement global unread badge
      setUnreadAnnouncements(prev => Math.max(0, prev - 1));
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to mark as read');
    }
  };

  const handleDelete = async (announcementId) => {
    const confirmed = await showConfirm('Are you sure you want to delete this announcement?');
    if (!confirmed) {
      return;
    }

    try {
      await axios.delete(`/announcements/${announcementId}`);
      setAnnouncements(prev => prev.filter(ann => ann._id !== announcementId));
      showSuccess('Announcement deleted successfully');
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to delete announcement');
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();

    if (!formData.groupId || !formData.title || !formData.content) {
      showWarning('Please fill in all fields');
      return;
    }

    try {
      setSubmitting(true);
      let response;
      if (isAdminOrOwner) {
        // System admin: use the generic endpoint (any group)
        response = await axios.post('/announcements', formData);
      } else {
        // Group admin: use the group-scoped endpoint
        response = await axios.post(`/announcements/group/${formData.groupId}`, {
          title: formData.title,
          content: formData.content
        });
      }
      if (response.data.success) {
        showSuccess('Announcement created successfully!');
        setShowCreateModal(false);
        setFormData({ groupId: '', title: '', content: '' });
        fetchAnnouncements();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to create announcement');
    } finally {
      setSubmitting(false);
    }
  };

  // Realtime: prepend new announcements received via socket
  useEffect(() => {
    const unsub = onNewAnnouncement((newAnn) => {
      setAnnouncements(prev => {
        // Avoid duplicates
        if (prev.some(a => a._id === newAnn._id)) return prev;
        return [{ ...newAnn, isRead: false }, ...prev];
      });
    });
    return unsub;
  }, [onNewAnnouncement]);

  const filteredAnnouncements = announcements.filter(ann => {
    if (filter === 'unread') return !ann.isRead;
    if (filter === 'read') return ann.isRead;
    return true;
  });

  const unreadCount = announcements.filter(a => !a.isRead).length;
  const readCount = announcements.filter(a => a.isRead).length;

  const getRelativeTime = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-gray-50 dark:bg-gray-900 py-4 pb-20 sm:py-6 md:py-8 md:pb-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 min-w-0">
        {/* Header — stack on narrow screens so the CTA never forces horizontal overflow */}
        <div className="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between min-w-0">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
              Announcements
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 break-words">
              Stay updated with announcements from your groups
            </p>
          </div>
          {(isAdminOrOwner || isGroupAdmin) && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-sm sm:text-base font-medium hover:from-purple-700 hover:to-indigo-700 transition duration-200 shadow-lg"
            >
              <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-center">Create Announcement</span>
            </button>
          )}
        </div>

        {/* Stats — compact 3-up on mobile, roomier from sm+ */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 mb-4 sm:mb-6 min-w-0">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-6 min-w-0">
            <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 truncate">Total</p>
            <p className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white tabular-nums">{announcements.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-6 min-w-0">
            <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 truncate">Unread</p>
            <p className="text-xl sm:text-3xl font-bold text-orange-600 dark:text-orange-400 tabular-nums">{unreadCount}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-6 min-w-0">
            <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 truncate">Read</p>
            <p className="text-xl sm:text-3xl font-bold text-green-600 dark:text-green-400 tabular-nums">{readCount}</p>
          </div>
        </div>

        {/* Filter tabs — wrap + scroll safety on very small screens */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-4 mb-4 sm:mb-6 min-w-0 overflow-hidden">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter announcements">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors min-w-0 ${
                filter === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              All ({announcements.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors min-w-0 ${
                filter === 'unread'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('read')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors min-w-0 ${
                filter === 'read'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Read ({readCount})
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Announcements List */}
        {!loading && !error && (
          <div className="space-y-4">
            {filteredAnnouncements.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 sm:p-12 text-center min-w-0">
                <svg className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9 " />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No announcements found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {filter === 'unread' ? 'All caught up!' : 'Check back later for updates'}
                </p>
              </div>
            ) : (
              filteredAnnouncements.map((announcement) => (
                <div
                  key={announcement._id}
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-all duration-200 min-w-0 max-w-full ${
                    !announcement.isRead ? 'border-l-4 border-l-orange-500' : ''
                  }`}
                >
                  <div className="flex flex-col gap-4 min-w-0">
                    <div className="min-w-0 flex-1 space-y-2 sm:space-y-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white break-words [overflow-wrap:anywhere]">
                            {announcement.title}
                          </h3>
                          {!announcement.isRead && (
                            <span className="shrink-0 px-2 py-0.5 sm:py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs font-bold rounded-full">
                              NEW
                            </span>
                          )}
                        </div>
                        {/* Actions: row on mobile under title, aligned end on larger screens */}
                        <div className="flex items-center justify-end gap-2 sm:justify-start shrink-0 sm:ml-auto">
                          {!announcement.isRead && (
                            <button
                              type="button"
                              onClick={() => handleMarkAsRead(announcement._id)}
                              className="p-2.5 sm:px-3 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 text-sm font-medium inline-flex items-center justify-center"
                              title="Mark as read"
                              aria-label="Mark as read"
                            >
                              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </button>
                          )}
                          {isAdminOrOwner && (
                            <button
                              type="button"
                              onClick={() => handleDelete(announcement._id)}
                              className="p-2.5 sm:px-3 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200 text-sm font-medium inline-flex items-center justify-center"
                              title="Delete"
                              aria-label="Delete announcement"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 break-words whitespace-pre-wrap [overflow-wrap:anywhere] [word-break:break-word]">
                        {announcement.content}
                      </p>
                      <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-start gap-1 min-w-0">
                          <svg className="h-4 w-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span className="font-medium text-purple-600 dark:text-purple-400 break-words min-w-0">
                            {announcement.group?.name}
                          </span>
                        </div>
                        <span className="hidden sm:inline text-gray-400">·</span>
                        <div className="flex items-center gap-1 min-w-0">
                          <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="truncate">{announcement.createdBy?.name}</span>
                        </div>
                        <span className="hidden sm:inline text-gray-400">·</span>
                        <div className="flex items-center gap-1">
                          <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {getRelativeTime(announcement.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Create Announcement Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto overscroll-contain">
          <div className="bg-white dark:bg-gray-800 rounded-t-xl sm:rounded-xl shadow-2xl p-4 sm:p-6 max-w-2xl w-full max-h-[min(100dvh,100%)] sm:max-h-[90vh] overflow-y-auto my-0 sm:mx-4 min-w-0">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Announcement</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Group *
                </label>
                <select
                  value={formData.groupId}
                  onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="">Choose a group...</option>
                  {(isAdminOrOwner ? groups : adminGroups).map((group) => (
                    <option key={group._id} value={group._id}>
                      {group.name} - {group.subject}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter announcement title..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Content *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows="5"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Write your announcement here..."
                  required
                ></textarea>
              </div>
              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="w-full sm:w-auto px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-6 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Creating...' : 'Create Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementsPage;
