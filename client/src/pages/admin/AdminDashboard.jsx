import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import ActivityChart from '../../components/admin/ActivityChart';
import { ErrorBanner, Panel, PanelHeader, StatTile, timeAgo } from '../../components/admin/AdminUI';
import { Button, Reveal, Shimmer } from '../../components/ui/motion';
import { ActivityIcon, CheckIcon, ClockIcon, LayersIcon, ShieldIcon, UsersIcon } from '../../components/ui/Icons';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [statsRes, activityRes] = await Promise.all([
        axios.get('/admin/stats'),
        axios.get('/admin/activity').catch(() => null),
      ]);
      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
        setRecent(statsRes.data.activity || []);
      }
      setActivities(activityRes?.data?.success ? activityRes.data.activities || [] : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const pending = stats?.pendingRequests || 0;
  const totalUsers = stats?.totalUsers || 0;
  const admins = stats?.adminCount || 0;
  const adminShare = totalUsers ? Math.round((admins / totalUsers) * 100) : 0;
  const twoWeeks = activities.filter((a) => Date.now() - new Date(a.date) < 14 * 86400000).length;

  return (
    <div className="space-y-4 lg:space-y-5">
      {error && <ErrorBanner message={error} onRetry={fetchData} />}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
        <StatTile index={0} label="Members" value={totalUsers} Icon={UsersIcon} tone="blue" loading={loading}
          note={`${admins} with admin access`} onClick={() => navigate('/admin/users')} />
        <StatTile index={1} label="Study groups" value={stats?.totalGroups} Icon={LayersIcon} tone="indigo" loading={loading}
          note="Across all subjects" onClick={() => navigate('/admin/groups')} />
        <StatTile index={2} label="Pending requests" value={pending} Icon={ClockIcon} tone="orange" loading={loading}
          note={pending > 0 ? 'Waiting for review' : 'All clear'} onClick={() => navigate('/admin/requests')} />
        <StatTile index={3} label="Activity" value={twoWeeks} Icon={ActivityIcon} tone="teal" loading={loading}
          note="Events in the last 14 days" onClick={() => navigate('/admin/activity')} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
        <Reveal index={4} className="lg:col-span-8">
          <Panel className="h-full">
            <PanelHeader title="Last 14 days" actions={<Link to="/admin/activity" className="text-[13px] font-medium text-blue-600 hover:text-blue-700">All activity</Link>} />
            <div className="px-5 pb-5 pt-2 sm:px-6 sm:pb-6">
              <ActivityChart activities={activities} loading={loading} />
            </div>
          </Panel>
        </Reveal>

        <Reveal index={5} className="flex flex-col gap-4 lg:col-span-4 lg:gap-5">
          {/* What needs a decision */}
          <Panel className="flex-1 p-5 sm:p-6">
            {loading ? (
              <div className="space-y-3">
                <Shimmer className="h-4 w-1/3" />
                <Shimmer className="h-7 w-2/3" />
                <Shimmer className="h-9 w-32 !rounded-full" />
              </div>
            ) : pending > 0 ? (
              <>
                <p className="flex items-center gap-1.5 text-[13px] font-semibold text-orange-500">
                  <ClockIcon className="h-4 w-4" strokeWidth={2.2} />
                  Needs your review
                </p>
                <p className="mt-2 text-[22px] font-semibold leading-tight tracking-[-0.02em] text-gray-900">
                  {pending} join request{pending === 1 ? '' : 's'} waiting
                </p>
                <p className="mt-1 text-[15px] text-gray-500">Students are waiting to get into their groups.</p>
                <Button variant="primary" className="mt-4" onClick={() => navigate('/admin/requests')}>
                  Review requests
                </Button>
              </>
            ) : (
              <>
                <p className="flex items-center gap-1.5 text-[13px] font-semibold text-green-600">
                  <CheckIcon className="h-4 w-4" strokeWidth={2.4} />
                  All caught up
                </p>
                <p className="mt-2 text-[22px] font-semibold leading-tight tracking-[-0.02em] text-gray-900">No requests waiting</p>
                <p className="mt-1 text-[15px] text-gray-500">New join requests will show up here.</p>
              </>
            )}
          </Panel>

          {/* Who can manage */}
          <Panel className="p-5 sm:p-6">
            <p className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-500">
              <ShieldIcon className="h-4 w-4" strokeWidth={2.2} />
              Access
            </p>
            {loading ? (
              <Shimmer className="mt-3 h-2 w-full !rounded-full" />
            ) : (
              <>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full origin-left rounded-full bg-blue-600 transition-transform duration-700 ease-out"
                    style={{ width: `${Math.max(adminShare, admins ? 4 : 0)}%` }}
                  />
                </div>
                <p className="mt-2 text-[13px] text-gray-500">
                  <span className="font-semibold text-gray-900 tabular-nums">{admins}</span> admin{admins === 1 ? '' : 's'} ·{' '}
                  <span className="font-semibold text-gray-900 tabular-nums">{Math.max(totalUsers - admins, 0)}</span> students
                </p>
              </>
            )}
          </Panel>
        </Reveal>
      </div>

      <Reveal index={6}>
        <Panel>
          <PanelHeader title="Recent activity" actions={<Button variant="ghost" className="!h-8 !px-3" onClick={fetchData}>Refresh</Button>} />
          {loading ? (
            <div className="space-y-4 px-5 pb-6 pt-2 sm:px-6">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Shimmer className="h-9 w-9 !rounded-full" />
                  <Shimmer className="h-3.5 w-1/2" />
                </div>
              ))}
            </div>
          ) : recent.length === 0 ? (
            <p className="px-6 pb-8 pt-4 text-center text-[15px] text-gray-500">No recent activity.</p>
          ) : (
            <ol className="px-5 pb-4 sm:px-6">
              {recent.map((item, i) => (
                <Reveal as="li" index={i} key={item._id || i} className="relative flex gap-3 pb-4 last:pb-2">
                  {i < recent.length - 1 && <span className="absolute left-[17px] top-10 h-[calc(100%-36px)] w-px bg-gray-100" aria-hidden />}
                  <span
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-white ${
                      item.type === 'group' ? 'bg-indigo-400' : 'bg-blue-600'
                    }`}
                  >
                    {item.type === 'group' ? <LayersIcon className="h-4 w-4" /> : <UsersIcon className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 pt-1.5">
                    <p className="text-[15px] text-gray-900">
                      <span className="font-semibold">{item.name}</span> <span className="text-gray-600">{item.action}</span>
                    </p>
                    <p className="mt-0.5 text-[13px] text-gray-400">{timeAgo(item.date)}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          )}
        </Panel>
      </Reveal>
    </div>
  );
};

export default AdminDashboard;
