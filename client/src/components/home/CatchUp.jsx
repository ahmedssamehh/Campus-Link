import React from 'react';
import UserAvatar from '../common/UserAvatar';
import { CheckIcon, ClockIcon, InboxIcon, MegaphoneIcon } from '../ui/Icons';
import { groupInitials, groupTone } from '../../utils/groups';
import { CountPill, Tile, TileEmpty, TileHeadline, TileRow, TileSkeleton } from './Tile';

const IconTile = ({ className, children }) => (
  <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[11px] text-white ${className}`}>
    {children}
  </span>
);

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

/**
 * Everything that needs the user's attention, in one ranked list:
 * direct messages, busy groups, unread announcements and join requests.
 */
const CatchUp = ({ loading, people = [], groups = [], tones, announcements = { count: 0 }, pendingRequests = 0, className, index }) => {
  const rows = [
    ...people.map(({ user, count }) => ({
      key: `u-${user._id}`,
      count,
      to: '/chat',
      state: { openUserId: user._id },
      leading: <UserAvatar name={user.name} profilePhoto={user.profilePhoto} size="md" border={false} />,
      title: user.name,
      subtitle: plural(count, 'new message'),
    })),
    ...groups.map(({ group, count }) => ({
      key: `g-${group._id}`,
      count,
      to: `/groups/${group._id}`,
      leading: (
        <IconTile className={`${tones?.get(String(group._id)) || groupTone(group.name)} text-[13px] font-semibold`}>
          {groupInitials(group.subject || group.name)}
        </IconTile>
      ),
      title: group.name,
      subtitle: `${plural(count, 'new message')} in the group`,
    })),
    ...(announcements.count > 0
      ? [{
          key: 'announcements',
          count: announcements.count,
          to: '/announcements',
          leading: (
            <IconTile className="bg-rose-500">
              <MegaphoneIcon className="h-[18px] w-[18px]" />
            </IconTile>
          ),
          title: announcements.latestTitle || plural(announcements.count, 'new announcement'),
          subtitle: announcements.latestTitle ? plural(announcements.count, 'unread announcement') : 'From your groups',
        }]
      : []),
    ...(pendingRequests > 0
      ? [{
          key: 'requests',
          count: pendingRequests,
          to: '/admin/requests',
          leading: (
            <IconTile className="bg-orange-500">
              <ClockIcon className="h-[18px] w-[18px]" />
            </IconTile>
          ),
          title: 'Join requests',
          subtitle: `${plural(pendingRequests, 'request')} to review`,
        }]
      : []),
  ].sort((a, b) => b.count - a.count);

  const shown = rows.slice(0, 5);
  const hidden = rows.length - shown.length;

  return (
    <Tile index={index} label="Catch up" Icon={InboxIcon} tone="blue" className={className}>
      {loading ? (
        <TileSkeleton rows={4} />
      ) : rows.length === 0 ? (
        <TileEmpty Icon={CheckIcon} title="You're all caught up">
          New messages, announcements and requests will show up here.
        </TileEmpty>
      ) : (
        <>
          <TileHeadline>{plural(rows.length, 'thing')} need{rows.length === 1 ? 's' : ''} you</TileHeadline>
          <div className="divide-y divide-gray-100">
            {shown.map((r) => (
              <TileRow
                key={r.key}
                to={r.to}
                state={r.state}
                leading={r.leading}
                title={r.title}
                subtitle={r.subtitle}
                trailing={<CountPill count={r.count} />}
              />
            ))}
          </div>
          {hidden > 0 && <p className="mt-3 text-[13px] text-gray-500">and {hidden} more</p>}
        </>
      )}
    </Tile>
  );
};

export default CatchUp;
