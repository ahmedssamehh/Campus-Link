import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from '../../api/axios';

const roleMeta = {
  owner: { label: 'Owner', cls: 'bg-purple-100 text-purple-700' },
  admin: { label: 'Admin', cls: 'bg-blue-100 text-blue-700' },
  user:  { label: 'Member', cls: 'bg-gray-100 text-gray-600' },
};

const RoleBadge = ({ role }) => {
  const m = roleMeta[role] || roleMeta.user;
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${m.cls}`}>{m.label}</span>
  );
};

const colorClasses = {
  blue: 'from-blue-500 to-blue-600',
  green: 'from-green-500 to-green-600',
  purple: 'from-purple-500 to-purple-600',
  indigo: 'from-indigo-500 to-indigo-600',
  pink: 'from-pink-500 to-pink-600',
  yellow: 'from-yellow-500 to-yellow-600',
  red: 'from-red-500 to-red-600',
  teal: 'from-teal-500 to-teal-600',
};

const Groups = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'joined', 'available'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', subject: '', description: '' });
  const [membersModal, setMembersModal] = useState(null);   // { name, members } or null
  const [membersLoading, setMembersLoading] = useState(false);

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/groups');
      if (response.data.success) {
        // Add UI properties to groups
        const groupsWithUI = response.data.groups.map((group, index) => ({
          ...group,
          color: Object.keys(colorClasses)[index % Object.keys(colorClasses).length],
          isJoined: group.members?.some(m => m._id === user?.id || m._id === user?._id) || false
        }));
        setGroups(groupsWithUI);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch groups');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/groups', newGroup);
      if (response.data.success) {
        alert('Group created successfully!');
        setShowCreateModal(false);
        setNewGroup({ name: '', subject: '', description: '' });
        fetchGroups();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create group');
    }
  };

  const handleJoinGroup = async (groupId) => {
    const group = groups.find(g => (g._id || g.id) === groupId);
    if (group.isJoined) {
      alert('You are already a member of this group');
      return;
    }

    try {
      const response = await axios.post(`/groups/${groupId}/join`);
      if (response.data.success) {
        alert('Join request submitted successfully!');
        // Don't update UI immediately - wait for admin approval
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit join request');
    }
  };

  const handleViewGroup = (groupId) => {
    navigate(`/groups/${groupId}`);
  };

  const handleViewMembers = async (group) => {
    setMembersLoading(true);
    setMembersModal({ name: group.name, members: [] });
    try {
      const res = await axios.get(`/groups/${group._id || group.id}`);
      if (res.data.success) {
        setMembersModal({ name: res.data.group.name, members: res.data.group.members || [] });
      }
    } catch (err) {
      setMembersModal({ name: group.name, members: group.members || [], error: true });
    } finally {
      setMembersLoading(false);
    }
  };

  const filteredGroups = groups.filter(group => {
    if (filter === 'joined') return group.isJoined;
    if (filter === 'available') return !group.isJoined;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Study Groups</h1>
              <p className="text-gray-600 mt-1">Join groups and collaborate with your peers</p>
            </div>
            {/* Create Group Button (Admin/Owner Only) */}
            {(user?.role === 'admin' || user?.role === 'owner') && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200 font-medium"
              >
                + Create Group
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-4 mt-6">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition duration-200 ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All Groups
            </button>
            <button
              onClick={() => setFilter('joined')}
              className={`px-4 py-2 rounded-lg font-medium transition duration-200 ${
                filter === 'joined'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              My Groups
            </button>
            <button
              onClick={() => setFilter('available')}
              className={`px-4 py-2 rounded-lg font-medium transition duration-200 ${
                filter === 'available'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Available
            </button>
          </div>
        </div>
      </div>

      {/* Groups Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Groups Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map((group) => (
              <div
                key={group._id || group.id}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition duration-300 overflow-hidden"
              >
                {/* Group Header */}
                <div className={`h-32 bg-gradient-to-r ${colorClasses[group.color]} p-6 flex items-center justify-between`}>
                  <div>
                    <h3 className="text-white text-xl font-bold mb-2">{group.name}</h3>
                    <span className="bg-white bg-opacity-30 text-white text-xs px-3 py-1 rounded-full font-medium">
                      {group.subject}
                    </span>
                  </div>
                </div>

                {/* Group Body */}
                <div className="p-6">
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {group.description}
                  </p>

                  {/* Members Info */}
                  <div className="mb-4">
                    <div className="flex items-center text-gray-700 mb-2">
                      <svg
                        className="h-5 w-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      <span className="text-sm font-medium">{group.members?.length || 0} members</span>
                    </div>
                    {/* Member names list */}
                    {group.members && group.members.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {group.members.slice(0, 4).map((member) => (
                          <span
                            key={member._id}
                            className="inline-flex items-center bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full"
                          >
                            {member.name}
                          </span>
                        ))}
                        {group.members.length > 4 && (
                          <span className="inline-flex items-center bg-gray-200 text-gray-500 text-xs px-2 py-0.5 rounded-full">
                            +{group.members.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewMembers(group)}
                      className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition duration-200 font-medium"
                    >
                      Members
                    </button>
                    {group.isJoined ? (
                      <button
                        onClick={() => handleViewGroup(group._id || group.id)}
                        className="flex-1 bg-indigo-50 text-indigo-700 py-2 px-4 rounded-lg hover:bg-indigo-100 transition duration-200 font-medium"
                      >
                        Open
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoinGroup(group._id || group.id)}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200 font-medium"
                      >
                        Join
                      </button>
                    )}
                    {group.isJoined && (
                      <button
                        disabled
                        className="flex-1 bg-green-100 text-green-700 py-2 px-4 rounded-lg font-medium cursor-default"
                      >
                        Joined
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredGroups.length === 0 && (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-16 w-16 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No groups found</h3>
            <p className="mt-2 text-sm text-gray-500">
              Try adjusting your filter or create a new group
            </p>
          </div>
        )}
      </div>

      {/* View Members Modal */}
      {membersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{membersModal.name}</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {membersLoading ? 'Loading…' : `${membersModal.members.length} member${membersModal.members.length !== 1 ? 's' : ''}`}
                </p>
              </div>
              <button
                onClick={() => setMembersModal(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto flex-1 px-6 py-4">
              {membersLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : membersModal.members.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No members found</p>
              ) : (
                <ul className="space-y-3">
                  {membersModal.members.map((member) => (
                    <li key={member._id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-semibold text-sm">
                          {member.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{member.name}</p>
                        <p className="text-xs text-gray-400 truncate">{member.email}</p>
                      </div>
                      <RoleBadge role={member.role} />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t">
              <button
                onClick={() => setMembersModal(null)}
                className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Create New Group</h2>
            <form onSubmit={handleCreateGroup}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Group Name
                </label>
                <input
                  type="text"
                  required
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="e.g., Computer Science Study Group"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  value={newGroup.subject}
                  onChange={(e) => setNewGroup({ ...newGroup, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="e.g., Computer Science"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Description
                </label>
                <textarea
                  required
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="Describe the group purpose..."
                  rows="3"
                ></textarea>
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;
