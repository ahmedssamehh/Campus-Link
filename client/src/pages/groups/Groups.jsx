import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useSocket } from '../../context/SocketContext';
import axios from '../../api/axios';
import { getMediaUrl } from '../../utils/media';
import PageHeader from '../../components/layout/PageHeader';
import UserAvatar from '../../components/common/UserAvatar';
import { distinctGroupTones, groupInitials } from '../../utils/groups';
import { ArrowRightIcon, ClockIcon, PlusIcon, UsersIcon } from '../../components/ui/Icons';
import { SegmentedControl } from '../../components/ui/motion';

const roleMeta = {
  owner: { label: 'Owner', cls: 'bg-indigo-100 text-indigo-700' },
  admin: { label: 'Admin', cls: 'bg-blue-100 text-blue-700' },
  user:  { label: 'Member', cls: 'bg-gray-100 text-gray-600' },
};

const RoleBadge = ({ role }) => {
  const m = roleMeta[role] || roleMeta.user;
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${m.cls}`}>{m.label}</span>
  );
};

const Groups = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError, showInfo, showConfirm } = useNotification();
  const { unreadMessages } = useSocket();
  const [groups, setGroups] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'joined', 'available'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', subject: '', description: '' });
  const [membersModal, setMembersModal] = useState(null);   // { groupId, name, members } or null
  const [membersLoading, setMembersLoading] = useState(false);
  const [removingMember, setRemovingMember] = useState(null);
  const [pendingGroups, setPendingGroups] = useState([]); // Array of group IDs with pending join requests

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/groups');
      if (response.data.success) {
        // Add UI properties to groups
        const groupsWithUI = response.data.groups.map((group) => ({
          ...group,
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
        showSuccess('Group created successfully!');
        setShowCreateModal(false);
        setNewGroup({ name: '', subject: '', description: '' });
        fetchGroups();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to create group');
    }
  };

  const handleJoinGroup = async (groupId) => {
    const group = groups.find(g => (g._id || g.id) === groupId);
    if (group.isJoined) {
      showInfo('You are already a member of this group');
      return;
    }

    try {
      const response = await axios.post(`/groups/${groupId}/join`);
      if (response.data.success) {
        showSuccess('Join request submitted successfully!');
        // Add to pending groups
        setPendingGroups(prev => [...prev, groupId]);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to submit join request');
    }
  };

  const handleViewGroup = (groupId) => {
    navigate(`/groups/${groupId}`);
  };

  const handleViewMembers = async (group) => {
    setMembersLoading(true);
    setMembersModal({ groupId: group._id || group.id, name: group.name, members: [] });
    try {
      const res = await axios.get(`/groups/${group._id || group.id}`);
      if (res.data.success) {
        setMembersModal({ 
          groupId: group._id || group.id, 
          name: res.data.group.name, 
          members: res.data.group.members || [] 
        });
      }
    } catch (err) {
      setMembersModal({ 
        groupId: group._id || group.id, 
        name: group.name, 
        members: group.members || [], 
        error: true 
      });
    } finally {
      setMembersLoading(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!membersModal || !membersModal.groupId) return;
    
    const confirmed = await showConfirm('Are you sure you want to remove this member from the group?');
    if (!confirmed) {
      return;
    }

    try {
      setRemovingMember(memberId);
      await axios.delete(`/groups/${membersModal.groupId}/members/${memberId}`);
      
      // Update the members list in the modal
      setMembersModal(prev => ({
        ...prev,
        members: prev.members.filter(m => m._id !== memberId)
      }));
      
      // Refresh groups list to update member counts
      fetchGroups();
      
      showSuccess('Member removed successfully');
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to remove member');
    } finally {
      setRemovingMember(null);
    }
  };

  const tones = distinctGroupTones(groups);

  const filteredGroups = groups.filter(group => {
    if (filter === 'joined') return group.isJoined;
    if (filter === 'available') return !group.isJoined;
    return true;
  });

  const tabs = [
    { value: 'all', label: 'All groups', count: groups.length },
    { value: 'joined', label: 'My groups', count: groups.filter((g) => g.isJoined).length },
    { value: 'available', label: 'Available', count: groups.filter((g) => !g.isJoined).length },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24 pt-6 md:pb-10 md:pt-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="Study groups"
          subtitle="Join groups and collaborate with your peers"
          actions={
            (user?.role === 'admin' || user?.role === 'owner') && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="press inline-flex h-9 items-center gap-1.5 rounded-full px-4 bg-blue-600 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4" />
                New group
              </button>
            )
          }
        />

        <SegmentedControl className="mb-6" ariaLabel="Filter groups" options={tabs} value={filter} onChange={setFilter} />

        {loading && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-60 animate-pulse rounded-2xl bg-white" />
            ))}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredGroups.map((group, idx) => {
              const gid = group._id || group.id;
              const unread = unreadMessages.groups[gid] || 0;
              return (
                <div
                  key={gid}
                  className="reveal lift group flex flex-col rounded-2xl bg-white p-5"
                  style={{ '--reveal-delay': `${Math.min(idx, 10) * 45}ms` }}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${tones.get(String(gid))} text-sm font-semibold text-white shadow-sm`}
                    >
                      {groupInitials(group.subject || group.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-base font-semibold text-gray-900">{group.name}</h3>
                      <span className="mt-0.5 block text-[13px] text-gray-500">
                        {group.subject}
                      </span>
                    </div>
                    {unread > 0 && (
                      <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-blue-600 px-1.5 text-xs font-semibold text-white">
                        {unread > 99 ? '99+' : unread}
                      </span>
                    )}
                  </div>

                  <p className="mt-4 line-clamp-2 min-h-[40px] text-sm text-gray-500">{group.description}</p>

                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {(group.members || []).slice(0, 4).map((member) => (
                        <UserAvatar key={member._id} name={member.name} profilePhoto={member.profilePhoto} size="sm" />
                      ))}
                    </div>
                    <span className="text-xs font-medium text-gray-500">
                      {group.members?.length || 0} member{group.members?.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div className="mt-5 flex gap-2">
                    <button
                      onClick={() => handleViewMembers(group)}
                      className="press flex-1 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-200"
                    >
                      Members
                    </button>
                    {group.isJoined ? (
                      <button
                        onClick={() => handleViewGroup(gid)}
                        className="press flex flex-1 items-center justify-center gap-1 rounded-lg bg-blue-600/10 px-4 py-2 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-600/15"
                      >
                        Open
                        <ArrowRightIcon className="h-4 w-4" />
                      </button>
                    ) : pendingGroups.includes(gid) ? (
                      <button
                        disabled
                        className="flex flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700"
                      >
                        <ClockIcon className="h-4 w-4" />
                        Pending
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoinGroup(gid)}
                        className="press flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                      >
                        Request to join
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && !error && filteredGroups.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white/60 py-16 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <UsersIcon className="h-7 w-7" />
            </span>
            <h3 className="mt-4 text-base font-semibold text-gray-900">No groups found</h3>
            <p className="mt-1 text-sm text-gray-500">Try a different filter, or ask an admin to create a new group.</p>
          </div>
        )}
      </div>

      {/* View Members Modal */}
      {membersModal && (
        <div className="modal-scrim-in fixed inset-0 bg-gray-950/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="modal-panel-in bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{membersModal.name}</h2>
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
                  {membersModal.members.map((member) => {
                    const isOwner = member.role === 'owner';
                    const canRemove = (user?.role === 'admin' || user?.role === 'owner') && !isOwner;
                    
                    return (
                      <li key={member._id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50">
                        {member.profilePhoto ? (
                          <img src={getMediaUrl(member.profilePhoto)} alt={member.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-gray-300" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-semibold text-sm">
                              {member.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{member.name}</p>
                          <p className="text-xs text-gray-400 truncate">{member.email}</p>
                        </div>
                        <RoleBadge role={member.role} />
                        {canRemove && (
                          <button
                            onClick={() => handleRemoveMember(member._id)}
                            disabled={removingMember === member._id}
                            className="ml-2 p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                            title="Remove member"
                          >
                            {removingMember === member._id ? (
                              <div className="animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full"></div>
                            ) : (
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        )}
                      </li>
                    );
                  })}
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
        <div className="modal-scrim-in fixed inset-0 bg-gray-950/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="modal-panel-in bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-5 text-gray-900">Create new group</h2>
            <form onSubmit={handleCreateGroup}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Group Name
                </label>
                <input
                  type="text"
                  required
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 bg-white transition"
                  placeholder="e.g., Computer Science Study Group"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  value={newGroup.subject}
                  onChange={(e) => setNewGroup({ ...newGroup, subject: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 bg-white transition"
                  placeholder="e.g., Computer Science"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Description
                </label>
                <textarea
                  required
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 bg-white transition"
                  placeholder="Describe the group purpose..."
                  rows="3"
                ></textarea>
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-xl shadow-glow hover:bg-blue-700 transition duration-200"
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
