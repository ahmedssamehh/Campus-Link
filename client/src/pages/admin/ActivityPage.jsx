import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from '../../api/axios';

const timeAgo = (dateStr) => {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const ActivityPage = () => {
  const [activities, setActivities] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get('/admin/activity');
      if (res.data.success) {
        setActivities(res.data.activities);
        setSelected([]);
      }
    } catch (err) {
      setError((err.response && err.response.data && err.response.data.message) || 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  const toggleSelectAll = () => {
    if (selected.length === activities.length) {
      setSelected([]);
    } else {
      setSelected(activities.map((a) => a._id));
    }
  };

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = async () => {
    if (selected.length === 0) return;
    try {
      setDeleting(true);
      await axios.delete('/admin/activity', { data: { ids: selected } });
      await fetchActivities();
    } catch (err) {
      setError((err.response && err.response.data && err.response.data.message) || 'Failed to delete selected activities');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    try {
      setDeleting(true);
      setConfirmDeleteAll(false);
      await axios.delete('/admin/activity/all');
      await fetchActivities();
    } catch (err) {
      setError((err.response && err.response.data && err.response.data.message) || 'Failed to delete all activities');
    } finally {
      setDeleting(false);
    }
  };

  const allSelected = activities.length > 0 && selected.length === activities.length;
  const someSelected = selected.length > 0 && selected.length < activities.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 md:py-8 transition-colors duration-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                to="/admin"
                className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
              >
                ← Dashboard
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">All Activity</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {activities.length} total {activities.length === 1 ? 'entry' : 'entries'}
            </p>
          </div>
          <button
            onClick={fetchActivities}
            disabled={loading}
            className="text-sm px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Auto-deletion notice */}
        <div className="mb-4 flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
          <svg className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-amber-800 dark:text-amber-300">
            <span className="font-semibold">Auto-cleanup enabled —</span> Activity records are automatically deleted after <span className="font-semibold">15 days</span>. You can also delete them manually at any time.
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-t-xl border border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Select All checkbox */}
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => { if (el) el.indeterminate = someSelected; }}
              onChange={toggleSelectAll}
              disabled={loading || activities.length === 0}
              className="w-4 h-4 rounded accent-purple-600 cursor-pointer"
            />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {selected.length > 0 ? `${selected.length} selected` : 'Select all'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDeleteSelected}
              disabled={selected.length === 0 || deleting}
              className="text-sm px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Delete Selected ({selected.length})
            </button>
            <button
              onClick={() => setConfirmDeleteAll(true)}
              disabled={activities.length === 0 || deleting}
              className="text-sm px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Delete All
            </button>
          </div>
        </div>

        {/* Activity List */}
        <div className="bg-white dark:bg-gray-800 rounded-b-xl border-x border-b border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-4">
                <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/3" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/4" />
                </div>
              </div>
            ))
          ) : activities.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-gray-400 dark:text-gray-500 text-lg mb-1">No activity records</p>
              <p className="text-gray-400 dark:text-gray-600 text-sm">Activity will appear here as users and groups are created.</p>
            </div>
          ) : (
            activities.map((item) => {
              const isChecked = selected.includes(item._id);
              return (
                <div
                  key={item._id}
                  onClick={() => toggleSelect(item._id)}
                  className={`flex items-center gap-4 px-4 py-4 cursor-pointer transition-colors ${
                    isChecked
                      ? 'bg-purple-50 dark:bg-purple-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleSelect(item._id)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 rounded accent-purple-600 cursor-pointer flex-shrink-0"
                  />

                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold text-sm ${
                    item.type === 'group'
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                      : 'bg-gradient-to-br from-purple-500 to-indigo-600'
                  }`}>
                    {item.name ? item.name.charAt(0).toUpperCase() : '?'}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">
                      <span className="font-semibold">{item.name}</span>{' '}
                      <span className="text-gray-600 dark:text-gray-400">{item.action}</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {timeAgo(item.date)}
                    </p>
                  </div>

                  {/* Type badge */}
                  <span className={`flex-shrink-0 text-xs px-2 py-1 rounded-full font-medium ${
                    item.type === 'group'
                      ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                      : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400'
                  }`}>
                    {item.type === 'group' ? 'Group' : 'User'}
                  </span>

                  {/* Dot indicator */}
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    item.type === 'group' ? 'bg-green-500' : 'bg-blue-500'
                  }`} />
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* Confirm Delete All Modal */}
      {confirmDeleteAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete All Activities?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              This will permanently delete all {activities.length} activity records. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteAll(false)}
                className="flex-1 py-2 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAll}
                className="flex-1 py-2 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors text-sm font-medium"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityPage;
