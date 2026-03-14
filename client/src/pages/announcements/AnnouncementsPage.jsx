import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useSocket } from '../../context/SocketContext';
import axios from '../../api/axios';
import { Link } from 'react-router-dom';

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
        setAnnouncements(response.data.announcements);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch announcements');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchGroups = useCallback(async () => {
    try {
      const response = await axios.get('/groups');
      if (response.data.success) {
        const allGroups = response.data.groups;
        setGroups(allGroups);

        // Determine which groups current user can post to (admin/owner of that group)
        const userId = user?._id || user?.id;
        const myAdminGroups = allGroups.filter(g => {
          const isCreator = (g.createdBy?._id || g.createdBy) === userId;
          const isGAdmin = g.admins?.some(a => (a._id || a) === userId);
          return isCreator || isGAdmin;
        });
        setAdminGroups(myAdminGroups);
      }
    } catch (err) {
      console.error('Failed to fetch groups:', err);
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Announcements
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Stay updated with announcements from your groups
            </p>
          </div>
          {(isAdminOrOwner || isGroupAdmin) && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 transition duration-200 shadow-lg flex items-center space-x-2"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Announcement</span>
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">Total</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{announcements.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">Unread</p>
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{unreadCount}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">Read</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{readCount}</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              All ({announcements.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
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
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
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
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 ${
                    !announcement.isRead ? 'border-l-4 border-l-orange-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {announcement.title}
                        </h3>
                        {!announcement.isRead && (
                          <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs font-bold rounded-full">
                            NEW
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mb-4">
                        {announcement.content}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span className="font-medium text-purple-600 dark:text-purple-400">
                            {announcement.group?.name}
                          </span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center">
                          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {announcement.createdBy?.name}
                        </div>
                        <span>•</span>
                        <div className="flex items-center">
                          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {getRelativeTime(announcement.createdAt)}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2 ml-4">
                      {!announcement.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(announcement._id)}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 text-sm font-medium flex items-center"
                          title="Mark as read"
                        >
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                      {isAdminOrOwner && (
                        <button
                          onClick={() => handleDelete(announcement._id)}
                          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200 text-sm font-medium flex items-center"
                          title="Delete"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-2xl w-full mx-4">
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
              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
