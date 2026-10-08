import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import axios from '../../api/axios';
import UserAvatar from '../../components/common/UserAvatar';
import {
  EmptyState,
  ErrorBanner,
  Panel,
  RowMenu,
  RowSkeleton,
  SearchField,
  SectionHeader,
  StatTile,
} from '../../components/admin/AdminUI';
import { Button, Modal, Reveal, SegmentedControl } from '../../components/ui/motion';
import { SearchIcon, ShieldIcon, TrashIcon, UserIcon, UsersIcon } from '../../components/ui/Icons';

const roleMeta = {
  owner: { label: 'Owner', cls: 'bg-indigo-500/10 text-indigo-600' },
  admin: { label: 'Admin', cls: 'bg-blue-600/10 text-blue-600' },
  user: { label: 'Student', cls: 'bg-gray-100 text-gray-600' },
};

const UsersManagement = () => {
  const { user: currentUser } = useAuth();
  const { showSuccess, showError } = useNotification();
  const isOwner = currentUser?.role === 'owner';

  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [leavingId, setLeavingId] = useState(null);
  const [flashId, setFlashId] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get('/admin/users');
      if (response.data.success) {
        setUsers(response.data.users);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const idOf = (u) => u.id || u._id;

  const flash = (id) => {
    setFlashId(id);
    setTimeout(() => setFlashId((f) => (f === id ? null : f)), 900);
  };

  const setRole = async (userId, role) => {
    const endpoint = role === 'admin' ? 'promote' : 'demote';
    try {
      const response = await axios.patch(`/admin/${endpoint}/${userId}`);
      if (response.data.success) {
        setUsers((prev) => prev.map((u) => (idOf(u) === userId ? { ...u, role } : u)));
        flash(userId);
        showSuccess(role === 'admin' ? 'User promoted to admin' : 'Admin access removed');
      }
    } catch (err) {
      showError(err.response?.data?.message || `Failed to ${endpoint} user`);
    }
  };

  // Owner can't change themselves; admins can only promote students.
  const canModifyUser = (target) => {
    if (target.email === currentUser?.email && target.role === 'owner') return false;
    if (!isOwner && (target.role === 'admin' || target.role === 'owner')) return false;
    return true;
  };

  const canDeleteUser = (target) => target.role !== 'owner' && target.email !== currentUser?.email;

  const handleDeleteUser = async () => {
    if (!confirmDelete) return;
    const id = idOf(confirmDelete);
    try {
      setDeleting(true);
      await axios.delete(`/admin/users/${id}`);
      setConfirmDelete(null);
      setLeavingId(id);
      setTimeout(() => {
        setUsers((prev) => prev.filter((u) => idOf(u) !== id));
        setLeavingId(null);
      }, 220);
      showSuccess('User deleted');
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  const counts = useMemo(
    () => ({
      all: users.length,
      user: users.filter((u) => u.role === 'user').length,
      admin: users.filter((u) => u.role === 'admin').length,
      owner: users.filter((u) => u.role === 'owner').length,
    }),
    [users]
  );

  const filteredUsers = users.filter((u) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    return matchesSearch && (filterRole === 'all' || u.role === filterRole);
  });

  const actionsFor = (u) => {
    const id = idOf(u);
    const items = [];
    if (canModifyUser(u) && u.role === 'user') items.push({ label: 'Make admin', Icon: ShieldIcon, onClick: () => setRole(id, 'admin') });
    if (canModifyUser(u) && u.role === 'admin' && isOwner) items.push({ label: 'Remove admin access', Icon: UserIcon, onClick: () => setRole(id, 'user') });
    if (canDeleteUser(u)) items.push({ label: 'Delete user', Icon: TrashIcon, danger: true, onClick: () => setConfirmDelete(u) });
    return items;
  };

  return (
    <div>
      <SectionHeader title="People" description="Everyone on Campus Link and what they can manage." />

      {error && <ErrorBanner message={error} onRetry={fetchUsers} />}

      <div className="mb-4 grid grid-cols-2 gap-4 lg:mb-5 lg:grid-cols-4 lg:gap-5">
        <StatTile index={0} label="All members" value={counts.all} Icon={UsersIcon} tone="blue" loading={loading} onClick={() => setFilterRole('all')} />
        <StatTile index={1} label="Students" value={counts.user} Icon={UserIcon} tone="gray" loading={loading} onClick={() => setFilterRole('user')} />
        <StatTile index={2} label="Admins" value={counts.admin} Icon={ShieldIcon} tone="blue" loading={loading} onClick={() => setFilterRole('admin')} />
        <StatTile index={3} label="Owners" value={counts.owner} Icon={ShieldIcon} tone="indigo" loading={loading} onClick={() => setFilterRole('owner')} />
      </div>

      <Reveal index={4}>
        <Panel>
          <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <SearchField value={searchTerm} onChange={setSearchTerm} placeholder="Search by name or email" className="sm:w-72" />
            <SegmentedControl
              ariaLabel="Filter by role"
              value={filterRole}
              onChange={setFilterRole}
              options={[
                { value: 'all', label: 'All', count: counts.all },
                { value: 'user', label: 'Students', count: counts.user },
                { value: 'admin', label: 'Admins', count: counts.admin },
                { value: 'owner', label: 'Owners', count: counts.owner },
              ]}
            />
          </div>

          {loading ? (
            <RowSkeleton rows={6} />
          ) : filteredUsers.length === 0 ? (
            <EmptyState Icon={SearchIcon} title="No people found">
              Try a different name, email or role.
            </EmptyState>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filteredUsers.map((u, i) => {
                const id = idOf(u);
                const meta = roleMeta[u.role] || roleMeta.user;
                const isYou = u.email === currentUser?.email;
                return (
                  <Reveal
                    as="li"
                    index={i}
                    key={id}
                    className={`flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-gray-50/70 sm:px-6 ${
                      leavingId === id ? 'row-leaving' : ''
                    } ${flashId === id ? 'row-flash' : ''}`}
                  >
                    <UserAvatar name={u.name} profilePhoto={u.profilePhoto} size="md" border={false} />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 truncate text-[15px] font-semibold text-gray-900">
                        <span className="truncate">{u.name}</span>
                        {isYou && <span className="flex-shrink-0 text-[13px] font-medium text-gray-400">You</span>}
                      </p>
                      <p className="truncate text-[13px] text-gray-500">{u.email}</p>
                    </div>
                    <span className={`hidden flex-shrink-0 rounded-full px-2.5 py-1 text-[12px] font-semibold sm:inline-flex ${meta.cls}`}>
                      {meta.label}
                    </span>
                    <div className="w-9 flex-shrink-0">
                      <RowMenu items={actionsFor(u)} label={`Actions for ${u.name}`} />
                    </div>
                  </Reveal>
                );
              })}
            </ul>
          )}
        </Panel>
      </Reveal>

      <Modal
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        busy={deleting}
        size="sm"
        title={`Delete ${confirmDelete?.name || 'user'}?`}
        description="This can't be undone."
        footer={
          <>
            <Button onClick={() => setConfirmDelete(null)} disabled={deleting}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteUser} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete user'}
            </Button>
          </>
        }
      >
        <ul className="space-y-1.5 text-[15px] text-gray-600">
          <li>• Removes them from every group</li>
          <li>• Deletes groups they created</li>
          <li>• Cancels their pending join requests</li>
        </ul>
      </Modal>
    </div>
  );
};

export default UsersManagement;
