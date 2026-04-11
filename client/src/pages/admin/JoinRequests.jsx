import React, { useState, useEffect } from 'react';
import { useNotification } from '../../context/NotificationContext';
import axios from '../../api/axios';
import { getMediaUrl } from '../../utils/media';

const JoinRequests = () => {
  const { showSuccess, showError } = useNotification();
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchJoinRequests();
  }, []);

  const fetchJoinRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/groups/requests/all');
      if (response.data.success) {
        setRequests(response.data.requests);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch join requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      const response = await axios.patch(`/groups/requests/${requestId}/approve`);
      if (response.data.success) {
        showSuccess('Request approved successfully!');
        fetchJoinRequests(); // Refresh the list
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to approve request');
    }
  };

  const handleReject = async (requestId) => {
    try {
      const response = await axios.patch(`/groups/requests/${requestId}/reject`);
      if (response.data.success) {
        showSuccess('Request rejected successfully!');
        fetchJoinRequests(); // Refresh the list
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to reject request');
    }
  };

  // Filter requests
  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-semibold rounded-full flex items-center">
            <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-xs font-semibold rounded-full flex items-center">
            <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            Rejected
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 text-xs font-semibold rounded-full flex items-center">
            <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            Pending
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 md:py-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-4 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1 md:mb-2">
            Join Requests
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
            Review and manage group join requests
          </p>
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

        {/* Main Content */}
        {!loading && !error && (
          <>
            {/* Auto-deletion Notice */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <svg className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Auto-cleanup enabled:</strong> Approved and rejected requests are automatically deleted after 15 days to keep the system clean.
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 md:gap-6 mb-4 md:mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 md:p-6">
            <div className="flex flex-col items-center md:flex-row md:items-center md:justify-between">
              <div className="text-center md:text-left">
                <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm font-medium mb-1">
                  Pending
                </p>
                <p className="text-2xl md:text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {pendingCount}
                </p>
              </div>
              <div className="hidden md:flex w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg items-center justify-center">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 md:p-6">
            <div className="flex flex-col items-center md:flex-row md:items-center md:justify-between">
              <div className="text-center md:text-left">
                <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm font-medium mb-1">
                  Approved
                </p>
                <p className="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400">
                  {approvedCount}
                </p>
              </div>
              <div className="hidden md:flex w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg items-center justify-center">
                <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 md:p-6">
            <div className="flex flex-col items-center md:flex-row md:items-center md:justify-between">
              <div className="text-center md:text-left">
                <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm font-medium mb-1">
                  Rejected
                </p>
                <p className="text-2xl md:text-3xl font-bold text-red-600 dark:text-red-400">
                  {rejectedCount}
                </p>
              </div>
              <div className="hidden md:flex w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg items-center justify-center">
                <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2 md:p-4 mb-4 md:mb-6">
          <div className="flex overflow-x-auto space-x-1 md:space-x-2 no-scrollbar">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-sm md:text-base font-medium transition-colors whitespace-nowrap ${
                filter === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              All ({requests.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-sm md:text-base font-medium transition-colors whitespace-nowrap ${
                filter === 'pending'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-sm md:text-base font-medium transition-colors whitespace-nowrap ${
                filter === 'approved'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Approved ({approvedCount})
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-sm md:text-base font-medium transition-colors whitespace-nowrap ${
                filter === 'rejected'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Rejected ({rejectedCount})
            </button>
          </div>
        </div>

        {/* Requests List */}
        <div className="space-y-3 md:space-y-4">
          {filteredRequests.map((request) => (
            <div
              key={request._id || request.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6 hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex items-start space-x-3 md:space-x-4">
                {/* User Avatar */}
                {request.user?.profilePhoto ? (
                  <img src={getMediaUrl(request.user.profilePhoto)} alt={request.user.name} className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover flex-shrink-0 border border-gray-300 dark:border-gray-600" />
                ) : (
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-base md:text-lg">
                      {request.user?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                )}

                {/* Request Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white truncate">
                      {request.user?.name || 'Unknown User'}
                    </h3>
                    {getStatusBadge(request.status)}
                  </div>
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-1 truncate">
                    {request.user?.email || 'No email'}
                  </p>
                  <div className="flex flex-wrap items-center text-xs md:text-sm text-gray-600 dark:text-gray-400 gap-x-2 gap-y-1 mt-2">
                    <div className="flex items-center">
                      <svg className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <span className="font-medium text-purple-600 dark:text-purple-400 truncate">
                        {request.group?.name || 'Unknown Group'}
                      </span>
                    </div>
                    <span className="text-gray-400 hidden md:inline">•</span>
                    <span>{request.group?.subject || 'N/A'}</span>
                    <span className="text-gray-400 hidden md:inline">•</span>
                    <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                  </div>

                  {/* Action Buttons — below info on mobile */}
                  {request.status === 'pending' && (
                    <div className="flex items-center space-x-2 mt-3">
                      <button
                        onClick={() => handleApprove(request._id || request.id)}
                        className="px-3 md:px-4 py-1.5 md:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 text-xs md:text-sm font-medium flex items-center"
                      >
                        <svg className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(request._id || request.id)}
                        className="px-3 md:px-4 py-1.5 md:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200 text-xs md:text-sm font-medium flex items-center"
                      >
                        <svg className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredRequests.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <svg
              className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No requests found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              There are no {filter !== 'all' ? filter : ''} join requests at the moment.
            </p>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
};

export default JoinRequests;
