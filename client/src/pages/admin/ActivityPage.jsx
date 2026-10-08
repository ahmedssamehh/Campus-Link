import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from '../../api/axios';
import { useNotification } from '../../context/NotificationContext';
import { EmptyState, ErrorBanner, Panel, RowSkeleton, SectionHeader } from '../../components/admin/AdminUI';
import { Button, Modal, Reveal, SegmentedControl } from '../../components/ui/motion';
import { ActivityIcon, CheckIcon, LayersIcon, RefreshIcon, TrashIcon, UsersIcon } from '../../components/ui/Icons';

const dayLabel = (date) => {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
};

const timeOf = (date) => new Date(date).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

const ActivityPage = () => {
  const { showSuccess, showError } = useNotification();
  const [activities, setActivities] = useState([]);
  const [selected, setSelected] = useState([]);
  const [selecting, setSelecting] = useState(false);
  const [type, setType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(null); // 'selected' | 'all' | null
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
      setError(err.response?.data?.message || 'Failed to load activity');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const visible = useMemo(() => activities.filter((a) => type === 'all' || a.type === type), [activities, type]);

  const grouped = useMemo(() => {
    const map = new Map();
    visible.forEach((a) => {
      const key = dayLabel(a.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(a);
    });
    return [...map.entries()];
  }, [visible]);

  const toggle = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const allVisibleSelected = visible.length > 0 && visible.every((a) => selected.includes(a._id));

  const stopSelecting = () => {
    setSelecting(false);
    setSelected([]);
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      if (confirm === 'all') {
        await axios.delete('/admin/activity/all');
        showSuccess('All activity cleared');
      } else {
        await axios.delete('/admin/activity', { data: { ids: selected } });
        showSuccess(`${selected.length} entr${selected.length === 1 ? 'y' : 'ies'} deleted`);
      }
      setConfirm(null);
      setSelecting(false);
      await fetchActivities();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to delete activity');
    } finally {
      setDeleting(false);
    }
  };

  let rowIndex = 0;

  return (
    <div>
      <SectionHeader
        title="Activity"
        description={`${activities.length} event${activities.length === 1 ? '' : 's'} from the last 15 days.`}
        actions={
          selecting ? (
            <>
              <Button variant="ghost" onClick={stopSelecting}>Done</Button>
              <Button variant="danger-tinted" disabled={selected.length === 0} onClick={() => setConfirm('selected')}>
                <TrashIcon className="h-4 w-4" />
                Delete {selected.length > 0 ? selected.length : ''}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={fetchActivities} disabled={loading} aria-label="Refresh">
                <RefreshIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="secondary" onClick={() => setSelecting(true)} disabled={activities.length === 0}>Select</Button>
              <Button variant="danger-tinted" onClick={() => setConfirm('all')} disabled={activities.length === 0}>
                Clear all
              </Button>
            </>
          )
        }
      />

      {error && <ErrorBanner message={error} onRetry={fetchActivities} />}

      <Reveal index={0}>
        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 sm:px-6">
            <SegmentedControl
              ariaLabel="Filter by type"
              value={type}
              onChange={setType}
              options={[
                { value: 'all', label: 'Everything', count: activities.length },
                { value: 'user', label: 'Members', count: activities.filter((a) => a.type === 'user').length },
                { value: 'group', label: 'Groups', count: activities.filter((a) => a.type === 'group').length },
              ]}
            />
            {selecting && visible.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  setSelected(allVisibleSelected ? selected.filter((id) => !visible.some((a) => a._id === id)) : [...new Set([...selected, ...visible.map((a) => a._id)])])
                }
                className="text-[13px] font-medium text-blue-600 hover:text-blue-700"
              >
                {allVisibleSelected ? 'Deselect all' : 'Select all'}
              </button>
            )}
          </div>

          {loading ? (
            <RowSkeleton rows={6} />
          ) : visible.length === 0 ? (
            <EmptyState Icon={ActivityIcon} title="No activity yet">
              New members and new groups will show up here.
            </EmptyState>
          ) : (
            <div className="pb-2">
              {grouped.map(([day, items]) => (
                <section key={day} aria-label={day}>
                  <h3 className="sticky top-0 z-[1] bg-white/90 px-5 pb-1 pt-4 text-[13px] font-semibold text-gray-500 backdrop-blur sm:px-6">
                    {day}
                  </h3>
                  <ul>
                    {items.map((item) => {
                      const isChecked = selected.includes(item._id);
                      const idx = rowIndex++;
                      return (
                        <Reveal as="li" index={idx} key={item._id}>
                          <div
                            role={selecting ? 'checkbox' : undefined}
                            aria-checked={selecting ? isChecked : undefined}
                            tabIndex={selecting ? 0 : undefined}
                            onClick={selecting ? () => toggle(item._id) : undefined}
                            onKeyDown={selecting ? (e) => (e.key === ' ' || e.key === 'Enter') && (e.preventDefault(), toggle(item._id)) : undefined}
                            className={`flex items-center gap-3 px-5 py-2.5 transition-colors sm:px-6 ${
                              selecting ? 'cursor-pointer hover:bg-gray-50' : ''
                            } ${isChecked ? 'bg-blue-50/70' : ''}`}
                          >
                            {selecting && (
                              <span
                                className={`flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                                  isChecked ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'
                                }`}
                              >
                                {isChecked && <CheckIcon className="h-3 w-3" strokeWidth={3.5} />}
                              </span>
                            )}
                            <span
                              className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-white ${
                                item.type === 'group' ? 'bg-indigo-400' : 'bg-blue-600'
                              }`}
                            >
                              {item.type === 'group' ? <LayersIcon className="h-4 w-4" /> : <UsersIcon className="h-4 w-4" />}
                            </span>
                            <p className="min-w-0 flex-1 text-[15px] text-gray-900">
                              <span className="font-semibold">{item.name}</span> <span className="text-gray-600">{item.action}</span>
                            </p>
                            <span className="flex-shrink-0 text-[13px] text-gray-400 tabular-nums">{timeOf(item.date)}</span>
                          </div>
                        </Reveal>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </Panel>
      </Reveal>

      <p className="mt-3 px-1 text-[13px] text-gray-400">Activity is cleared automatically after 15 days.</p>

      <Modal
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        busy={deleting}
        size="sm"
        title={confirm === 'all' ? 'Clear all activity?' : `Delete ${selected.length} entr${selected.length === 1 ? 'y' : 'ies'}?`}
        description={
          confirm === 'all'
            ? `All ${activities.length} records will be permanently deleted. This can't be undone.`
            : "The selected records will be permanently deleted. This can't be undone."
        }
        footer={
          <>
            <Button onClick={() => setConfirm(null)} disabled={deleting}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : confirm === 'all' ? 'Clear all' : 'Delete'}
            </Button>
          </>
        }
      />
    </div>
  );
};

export default ActivityPage;
