import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNotification } from '../../context/NotificationContext';
import axios from '../../api/axios';
import {
  EmptyState,
  ErrorBanner,
  Panel,
  RowMenu,
  RowSkeleton,
  SearchField,
  SectionHeader,
  timeAgo,
} from '../../components/admin/AdminUI';
import { Button, Modal, Reveal } from '../../components/ui/motion';
import { LayersIcon, MegaphoneIcon, PlusIcon, SearchIcon, TrashIcon, UsersIcon } from '../../components/ui/Icons';
import { distinctGroupTones, groupInitials } from '../../utils/groups';

const fieldCls = (hasError) =>
  `w-full rounded-xl border bg-gray-100 px-3.5 py-2.5 text-[15px] text-gray-900 placeholder:text-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-4 ${
    hasError ? 'border-red-400 focus:ring-red-500/15' : 'border-transparent focus:border-blue-500 focus:ring-blue-500/15'
  }`;

const Field = ({ id, label, error, hint, children }) => (
  <div>
    <label htmlFor={id} className="mb-1.5 block text-[13px] font-semibold text-gray-700">
      {label}
    </label>
    {children}
    {error ? (
      <p role="alert" className="mt-1.5 text-[13px] text-red-600">{error}</p>
    ) : (
      hint && <p className="mt-1.5 text-[13px] text-gray-400">{hint}</p>
    )}
  </div>
);

const emptyGroup = { name: '', subject: '', description: '' };
const emptyAnnouncement = { groupId: '', title: '', content: '' };

const GroupsManagement = () => {
  const { showSuccess, showError } = useNotification();

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [formData, setFormData] = useState(emptyGroup);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [leavingId, setLeavingId] = useState(null);

  const [announceOpen, setAnnounceOpen] = useState(false);
  const [announcement, setAnnouncement] = useState(emptyAnnouncement);
  const [announceErrors, setAnnounceErrors] = useState({});
  const [announcing, setAnnouncing] = useState(false);

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get('/groups');
      if (response.data.success) setGroups(response.data.groups);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch groups');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const tones = useMemo(() => distinctGroupTones(groups), [groups]);

  const filtered = groups.filter((g) => {
    const q = query.trim().toLowerCase();
    return !q || [g.name, g.subject, g.description].some((v) => (v || '').toLowerCase().includes(q));
  });

  // ---- create group ----
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateGroup = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Give the group a name.';
    if (!formData.subject.trim()) errs.subject = 'Add a subject so students can find it.';
    if (!formData.description.trim()) errs.description = 'Describe what the group is for.';
    else if (formData.description.trim().length < 10) errs.description = 'Use at least 10 characters.';
    return errs;
  };

  const closeCreate = () => {
    setCreateOpen(false);
    setFormData(emptyGroup);
    setFormErrors({});
  };

  const handleCreate = async (e) => {
    e?.preventDefault();
    const errs = validateGroup();
    if (Object.keys(errs).length) {
      setFormErrors(errs);
      document.getElementById(`group-${Object.keys(errs)[0]}`)?.focus();
      return;
    }
    try {
      setSubmitting(true);
      const response = await axios.post('/groups', {
        name: formData.name.trim(),
        subject: formData.subject.trim(),
        description: formData.description.trim(),
      });
      if (response.data.success) {
        setGroups((prev) => [response.data.data, ...prev]);
        closeCreate();
        showSuccess(`“${response.data.data?.name || 'Group'}” created`);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to create group');
    } finally {
      setSubmitting(false);
    }
  };

  // ---- delete group ----
  const handleDelete = async () => {
    if (!confirmDelete) return;
    const id = confirmDelete._id;
    try {
      setDeleting(true);
      await axios.delete(`/groups/${id}`);
      setConfirmDelete(null);
      setLeavingId(id);
      setTimeout(() => {
        setGroups((prev) => prev.filter((g) => g._id !== id));
        setLeavingId(null);
      }, 220);
      showSuccess('Group deleted');
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to delete group');
    } finally {
      setDeleting(false);
    }
  };

  // ---- announcement ----
  const openAnnouncement = (groupId = '') => {
    setAnnouncement({ ...emptyAnnouncement, groupId });
    setAnnounceErrors({});
    setAnnounceOpen(true);
  };

  const handleAnnounce = async (e) => {
    e?.preventDefault();
    const errs = {};
    if (!announcement.groupId) errs.groupId = 'Choose who should receive it.';
    if (!announcement.title.trim()) errs.title = 'Add a short title.';
    if (!announcement.content.trim()) errs.content = 'Write the announcement.';
    if (Object.keys(errs).length) {
      setAnnounceErrors(errs);
      return;
    }
    try {
      setAnnouncing(true);
      await axios.post('/announcements', {
        groupId: announcement.groupId,
        title: announcement.title.trim(),
        content: announcement.content.trim(),
      });
      setAnnounceOpen(false);
      showSuccess('Announcement sent');
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to send announcement');
    } finally {
      setAnnouncing(false);
    }
  };

  const setAnn = (key) => (e) => {
    setAnnouncement((prev) => ({ ...prev, [key]: e.target.value }));
    if (announceErrors[key]) setAnnounceErrors((prev) => ({ ...prev, [key]: '' }));
  };

  return (
    <div>
      <SectionHeader
        title="Study groups"
        description={`${groups.length} group${groups.length === 1 ? '' : 's'} on campus.`}
        actions={
          <>
            <Button variant="secondary" onClick={() => openAnnouncement()} disabled={groups.length === 0}>
              <MegaphoneIcon className="h-4 w-4" />
              Announce
            </Button>
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              <PlusIcon className="h-4 w-4" />
              New group
            </Button>
          </>
        }
      />

      {error && <ErrorBanner message={error} onRetry={fetchGroups} />}

      <Reveal index={0}>
        <Panel>
          <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
            <SearchField value={query} onChange={setQuery} placeholder="Search groups" className="sm:w-72" />
          </div>

          {loading ? (
            <RowSkeleton rows={5} />
          ) : groups.length === 0 ? (
            <EmptyState
              Icon={LayersIcon}
              title="No study groups yet"
              action={
                <Button variant="primary" onClick={() => setCreateOpen(true)}>
                  <PlusIcon className="h-4 w-4" />
                  Create the first group
                </Button>
              }
            >
              Groups are where students chat, share files and get announcements.
            </EmptyState>
          ) : filtered.length === 0 ? (
            <EmptyState Icon={SearchIcon} title="No matching groups">Try a different name or subject.</EmptyState>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filtered.map((g, i) => (
                <Reveal
                  as="li"
                  index={i}
                  key={g._id}
                  className={`flex items-center gap-4 px-5 py-4 transition-colors hover:bg-gray-50/70 sm:px-6 ${leavingId === g._id ? 'row-leaving' : ''}`}
                >
                  <span
                    className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-[13px] font-semibold text-white ${
                      tones.get(String(g._id)) || 'bg-blue-600'
                    }`}
                  >
                    {groupInitials(g.subject || g.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-gray-900">{g.name}</p>
                    <p className="truncate text-[13px] text-gray-500">
                      {g.subject}
                      {g.description && <> · {g.description}</>}
                    </p>
                  </div>
                  <div className="hidden flex-shrink-0 text-right md:block">
                    <p className="flex items-center justify-end gap-1 text-[13px] font-medium text-gray-900 tabular-nums">
                      <UsersIcon className="h-3.5 w-3.5 text-gray-400" />
                      {g.members?.length ?? 0}
                    </p>
                    <p className="text-[12px] text-gray-400">
                      {g.createdBy?.name ? `by ${g.createdBy.name}` : ''}
                      {g.createdAt ? ` · ${timeAgo(g.createdAt)}` : ''}
                    </p>
                  </div>
                  <div className="w-9 flex-shrink-0">
                    <RowMenu
                      label={`Actions for ${g.name}`}
                      items={[
                        { label: 'Send announcement', Icon: MegaphoneIcon, onClick: () => openAnnouncement(g._id) },
                        { label: 'Delete group', Icon: TrashIcon, danger: true, onClick: () => setConfirmDelete(g) },
                      ]}
                    />
                  </div>
                </Reveal>
              ))}
            </ul>
          )}
        </Panel>
      </Reveal>

      {/* Create group */}
      <Modal
        open={createOpen}
        onClose={closeCreate}
        busy={submitting}
        title="New study group"
        description="You'll be added as the group's manager."
        footer={
          <>
            <Button onClick={closeCreate} disabled={submitting}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate} disabled={submitting}>
              {submitting ? 'Creating…' : 'Create group'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4" noValidate>
          <Field id="group-name" label="Name" error={formErrors.name}>
            <input id="group-name" name="name" value={formData.name} onChange={handleChange} className={fieldCls(formErrors.name)} placeholder="Advanced Algorithms" autoFocus />
          </Field>
          <Field id="group-subject" label="Subject" error={formErrors.subject} hint="Shown on the group's tile, e.g. CS301.">
            <input id="group-subject" name="subject" value={formData.subject} onChange={handleChange} className={fieldCls(formErrors.subject)} placeholder="Computer Science" />
          </Field>
          <Field id="group-description" label="Description" error={formErrors.description}>
            <textarea id="group-description" name="description" rows={3} value={formData.description} onChange={handleChange} className={`${fieldCls(formErrors.description)} resize-none`} placeholder="What will members work on together?" />
          </Field>
          <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
        </form>
      </Modal>

      {/* Announcement */}
      <Modal
        open={announceOpen}
        onClose={() => setAnnounceOpen(false)}
        busy={announcing}
        size="lg"
        title="Send an announcement"
        description="Members of the group are notified right away."
        footer={
          <>
            <Button onClick={() => setAnnounceOpen(false)} disabled={announcing}>Cancel</Button>
            <Button variant="primary" onClick={handleAnnounce} disabled={announcing}>
              {announcing ? 'Sending…' : 'Send'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleAnnounce} className="space-y-4" noValidate>
          <Field id="ann-group" label="Group" error={announceErrors.groupId}>
            <select id="ann-group" value={announcement.groupId} onChange={setAnn('groupId')} className={fieldCls(announceErrors.groupId)}>
              <option value="">Choose a group…</option>
              {groups.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.name} — {g.subject}
                </option>
              ))}
            </select>
          </Field>
          <Field id="ann-title" label="Title" error={announceErrors.title}>
            <input id="ann-title" value={announcement.title} onChange={setAnn('title')} className={fieldCls(announceErrors.title)} placeholder="Midterm schedule posted" />
          </Field>
          <Field id="ann-content" label="Message" error={announceErrors.content}>
            <textarea id="ann-content" rows={5} value={announcement.content} onChange={setAnn('content')} className={`${fieldCls(announceErrors.content)} resize-none`} placeholder="Write your announcement…" />
          </Field>
          <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
        </form>
      </Modal>

      {/* Delete */}
      <Modal
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        busy={deleting}
        size="sm"
        title={`Delete “${confirmDelete?.name || 'group'}”?`}
        description="The group and all of its join requests are permanently removed. This can't be undone."
        footer={
          <>
            <Button onClick={() => setConfirmDelete(null)} disabled={deleting}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete group'}
            </Button>
          </>
        }
      />
    </div>
  );
};

export default GroupsManagement;
