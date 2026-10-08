import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SegmentedControl } from '../../components/ui/motion';
import { ActivityIcon, ClockIcon, HomeIcon, LayersIcon, UsersIcon } from '../../components/ui/Icons';

const tabs = [
  { value: '/admin', label: 'Overview', icon: <HomeIcon className="hidden h-3.5 w-3.5 sm:block" /> },
  { value: '/admin/users', label: 'Users', icon: <UsersIcon className="hidden h-3.5 w-3.5 sm:block" /> },
  { value: '/admin/groups', label: 'Groups', icon: <LayersIcon className="hidden h-3.5 w-3.5 sm:block" /> },
  { value: '/admin/requests', label: 'Requests', icon: <ClockIcon className="hidden h-3.5 w-3.5 sm:block" /> },
  { value: '/admin/activity', label: 'Activity', icon: <ActivityIcon className="hidden h-3.5 w-3.5 sm:block" /> },
];

/** Admin section: shared header + animated tab bar; sub-pages cross-fade beneath it. */
const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const current = tabs.find((t) => t.value === location.pathname)?.value || '/admin';

  return (
    <div className="min-h-screen bg-gray-50 pb-28 pt-6 md:pb-12 md:pt-8">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[15px] font-semibold text-gray-500">
              {user?.role === 'owner' ? 'Owner' : 'Admin'} · Campus Link
            </p>
            <h1 className="mt-0.5 text-[32px] font-bold leading-tight tracking-[-0.025em] text-gray-900">Manage campus</h1>
          </div>
          <SegmentedControl options={tabs} value={current} onChange={(v) => navigate(v)} ariaLabel="Admin sections" />
        </header>

        <div key={location.pathname} className="page-enter">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
