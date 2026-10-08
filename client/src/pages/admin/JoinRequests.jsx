import React, { useState, useEffect, useMemo } from 'react';
import { useNotification } from '../../context/NotificationContext';
import axios from '../../api/axios';
import UserAvatar from '../../components/common/UserAvatar';
import { EmptyState, ErrorBanner, Panel, RowSkeleton, SectionHeader, timeAgo } from '../../components/admin/AdminUI';
import { Button, Reveal, SegmentedControl } from '../../components/ui/motion';
import { CheckIcon, ClockIcon, XIcon } from '../../components/ui/Icons';

const statusMeta = {
  pending: { label: 'Pending', cls: 'bg-orange-500/10 text-orange-600', Icon: ClockIcon },
  approved: { label: 'Approved', cls: 'bg-green-600/10 text-green-700', Icon: CheckIcon },
  rejected: { label: 'Declined', cls: 'bg-gray-100 text-gray-600', Icon: XIcon },
};

const JoinRequests = () => {
  const { showSuccess, showError } = useNotification();
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [leavingId, setLeavingId] = useState(null);

  const fetchJoinRequests = async ({ quiet = false } = {}) => {
    try {
      if (!quiet) setLoading(true);
      setError('');
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

  useEffect(() => {
    fetchJoinRequests();
  }, []);

  const decide = async (request, decision) => {
    const id = request._id || request.id;
    try {
      setBusyId(id);
      const response = await axios.patch(`/groups/requests/${id}/${decision === 'approved' ? 'approve' : 'reject'}`);
      if (response.data.success) {
        showSuccess(
          decision === 'approved'
            ? `${request.user?.name || 'Student'} added to ${request.group?.name || 'the group'}`
            : 'Request declined'
        );
        // Slide the row out of the pending list, then reconcile with the server.
        setLeavingId(id);
        setTimeout(() => {
          setRequests((prev) => prev.map((r) => ((r._id || r.id) === id ? { ...r, status: decision } : r)));
          setLeavingId(null);
          fetchJoinRequests({ quiet: true });
        }, 220);
      }
    } catch (err) {
      showError(err.response?.data?.message || `Failed to ${decision === 'approved' ? 'approve' : 'decline'} request`);
    } finally {
      setBusyId(null);
    }
  };

  const counts = useMemo(
    () => ({
      all: requests.length,
      pending: requests.filter((r) => r.status === 'pending').length,
      approved: requests.filter((r) => r.status === 'approved').length,
      rejected: requests.filter((r) => r.status === 'rejected').length,
    }),
    [requests]
  );

  const filtered = requests.filter((r) => filter === 'all' || r.status === filter);

  return (
    <div>
      <SectionHeader
        title="Join requests"
        description={
          counts.pending > 0
            ? `${counts.pending} student${counts.pending === 1 ? ' is' : 's are'} waiting to join a group.`
            : 'Approve students who want to join a study group.'
        }
      />

      {error && <ErrorBanner message={error} onRetry={() => fetchJoinRequests()} />}

      <Reveal index={0}>
        <Panel>
          <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
            <SegmentedControl
              ariaLabel="Filter requests"
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'pending', label: 'Pending', count: counts.pending },
                { value: 'approved', label: 'Approved', count: counts.approved },
                { value: 'rejected', label: 'Declined', count: counts.rejected },
                { value: 'all', label: 'All', count: counts.all },
              ]}
            />
          </div>

          {loading ? (
            <RowSkeleton rows={4} />
          ) : filtered.length === 0 ? (
            <EmptyState Icon={filter === 'pending' ? CheckIcon : ClockIcon} title={filter === 'pending' ? 'No one is waiting' : 'Nothing here'}>
              {filter === 'pending' ? 'New join requests will appear here.' : 'No requests match this filter.'}
            </EmptyState>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filtered.map((r, i) => {
                const id = r._id || r.id;
                const meta = statusMeta[r.status] || statusMeta.pending;
                const busy = busyId === id;
                return (
                  <Reveal
                    as="li"
                    index={i}
                    key={id}
                    className={`flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:px-6 ${leavingId === id ? 'row-leaving' : ''}`}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <UserAvatar name={r.user?.name} profilePhoto={r.user?.profilePhoto} size="md" border={false} />
                      <div className="min-w-0">
                        <p className="text-[15px] text-gray-900">
                          <span className="font-semibold">{r.user?.name || 'Unknown student'}</span>
                          <span className="text-gray-500"> wants to join </span>
                          <span className="font-semibold">{r.group?.name || 'a group'}</span>
                        </p>
                        <p className="mt-0.5 truncate text-[13px] text-gray-500">
                          {r.user?.email}
                          {r.group?.subject && <> · {r.group.subject}</>} · {timeAgo(r.createdAt)}
                        </p>
                      </div>
                    </div>

                    {r.status === 'pending' ? (
                      <div className="flex flex-shrink-0 gap-2 pl-[52px] sm:pl-0">
                        <Button variant="secondary" disabled={busy} onClick={() => decide(r, 'rejected')}>
                          <XIcon className="h-4 w-4" />
                          Decline
                        </Button>
                        <Button variant="primary" disabled={busy} onClick={() => decide(r, 'approved')}>
                          <CheckIcon className="h-4 w-4" />
                          Approve
                        </Button>
                      </div>
                    ) : (
                      <span className={`ml-[52px] inline-flex flex-shrink-0 items-center gap-1 self-start rounded-full px-2.5 py-1 text-[12px] font-semibold sm:ml-0 sm:self-auto ${meta.cls}`}>
                        <meta.Icon className="h-3.5 w-3.5" strokeWidth={2.4} />
                        {meta.label}
                      </span>
                    )}
                  </Reveal>
                );
              })}
            </ul>
          )}
        </Panel>
      </Reveal>

      <p className="mt-3 px-1 text-[13px] text-gray-400">
        Approved and declined requests are cleared automatically after 15 days.
      </p>
    </div>
  );
};

export default JoinRequests;
