import React from 'react';
import { Link } from 'react-router-dom';
import { ActivityIcon, ClockIcon, LayersIcon, ShieldIcon, UsersIcon } from '../ui/Icons';
import { Tile, TileAction } from './Tile';

const tools = [
  { to: '/admin/users', label: 'Users', hint: 'Roles & accounts', Icon: UsersIcon, tone: 'bg-blue-600' },
  { to: '/admin/groups', label: 'Groups', hint: 'Create & manage', Icon: LayersIcon, tone: 'bg-indigo-500' },
  { to: '/admin/requests', label: 'Join requests', hint: 'Approve members', Icon: ClockIcon, tone: 'bg-orange-500', countKey: 'requests' },
  { to: '/admin/activity', label: 'Activity', hint: 'Recent events', Icon: ActivityIcon, tone: 'bg-teal-500' },
];

/** Admin/owner shortcuts, shown on Home so management is one tap away. */
const AdminTools = ({ pendingRequests = 0, role, className, index }) => (
  <Tile index={index}
    label={role === 'owner' ? 'Owner tools' : 'Admin tools'}
    Icon={ShieldIcon}
    tone="slate"
    className={className}
    action={<TileAction to="/admin">Open admin panel</TileAction>}
  >
    <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
      {tools.map(({ to, label, hint, Icon, tone, countKey }) => {
        const count = countKey === 'requests' ? pendingRequests : 0;
        return (
          <Link
            key={to}
            to={to}
            className="press relative flex flex-col items-start gap-2.5 rounded-2xl bg-gray-50 p-3.5 transition-colors hover:bg-gray-100 sm:flex-row sm:items-center sm:gap-3"
          >
            <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[11px] text-white ${tone}`}>
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-semibold text-gray-900">{label}</span>
              <span className="hidden truncate text-[13px] text-gray-500 sm:block">{hint}</span>
            </span>
            {count > 0 && (
              <span className="absolute right-3 top-3 flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-semibold text-white tabular-nums sm:static">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  </Tile>
);

export default AdminTools;
