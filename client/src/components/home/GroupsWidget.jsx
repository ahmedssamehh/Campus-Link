import React from 'react';
import { Link } from 'react-router-dom';
import UserAvatar from '../common/UserAvatar';
import { PlusIcon, UsersIcon } from '../ui/Icons';
import { distinctGroupTones, groupInitials } from '../../utils/groups';
import { Tile, TileAction } from './Tile';

const GroupTile = ({ group, tone, unread, online, index = 0 }) => {
  const id = group._id || group.id;
  return (
    <Link
      to={`/groups/${id}`}
      className={`reveal press lift relative flex aspect-[4/3] min-w-0 flex-col justify-between overflow-hidden rounded-2xl p-4 text-white hover:brightness-[1.06] sm:aspect-[5/4] ${tone}`}
      style={{ '--reveal-delay': `${240 + index * 50}ms` }}
    >
      {/* Light falls from the top, like Shortcuts tiles */}
      <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.16] to-transparent" />

      <div className="relative flex items-start justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-[13px] font-semibold">
          {groupInitials(group.subject || group.name)}
        </span>
        {unread > 0 && (
          <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-white px-2 text-xs font-semibold text-gray-900 tabular-nums">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </div>

      <div className="relative min-w-0">
        <p className="truncate text-[17px] font-semibold tracking-[-0.01em]">{group.name}</p>
        <div className="mt-1 flex items-center gap-2">
          {online.length > 0 && (
            <span className="flex -space-x-1.5">
              {online.slice(0, 3).map((m) => (
                <UserAvatar
                  key={m._id}
                  name={m.name}
                  profilePhoto={m.profilePhoto}
                  size="xs"
                  border={false}
                  className="ring-2 ring-white/40"
                />
              ))}
            </span>
          )}
          <span className="truncate text-[13px] text-white/80">
            {online.length > 0 ? `${online.length} online` : `${group.members?.length || 0} members`}
          </span>
        </div>
      </div>
    </Link>
  );
};

/** The user's groups as colourful, Shortcuts-style tiles. */
const GroupsWidget = ({ loading, groups = [], unreadByGroup = {}, onlineUsers, userId, tones, className, index }) => {
  const shown = groups.slice(0, 4);
  const toneMap = tones || distinctGroupTones(groups);

  return (
    <Tile index={index}
      label="Your study groups"
      Icon={UsersIcon}
      tone="indigo"
      className={className}
      action={<TileAction to="/groups">{groups.length > 0 ? 'See all' : 'Browse'}</TileAction>}
    >
      {loading ? (
        <div className="grid animate-pulse grid-cols-2 gap-3 lg:grid-cols-4" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="aspect-[4/3] rounded-2xl bg-gray-100 sm:aspect-[5/4]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {shown.map((g, i) => {
            const id = g._id || g.id;
            const online = (g.members || []).filter(
              (m) => m && typeof m === 'object' && String(m._id) !== String(userId) && onlineUsers?.has?.(m._id)
            );
            return <GroupTile key={id} index={i} group={g} tone={toneMap.get(String(id))} unread={unreadByGroup[id] || 0} online={online} />;
          })}

          {shown.length < 4 && (
            <Link
              to="/groups"
              className="press flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 text-center text-gray-500 transition-colors hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-600 sm:aspect-[5/4]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                <PlusIcon className="h-5 w-5" />
              </span>
              <span className="text-[15px] font-semibold">{groups.length === 0 ? 'Join your first group' : 'Find more groups'}</span>
            </Link>
          )}
        </div>
      )}
    </Tile>
  );
};

export default GroupsWidget;
