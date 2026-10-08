import React from 'react';
import { Link } from 'react-router-dom';
import UserAvatar from '../common/UserAvatar';
import { ChatIcon, RadioIcon, UsersIcon } from '../ui/Icons';
import { Tile, TileAction, TileEmpty, TileHeadline, TileSkeleton } from './Tile';

/** Classmates from the user's groups who are online right now. */
const OnCampus = ({ loading, people = [], className, index }) => {
  const shown = people.slice(0, 5);
  const hidden = people.length - shown.length;

  return (
    <Tile index={index}
      label="On campus now"
      Icon={RadioIcon}
      tone="green"
      className={className}
      action={people.length > 0 && <TileAction to="/chat">Messages</TileAction>}
    >
      {loading ? (
        <TileSkeleton rows={3} />
      ) : people.length === 0 ? (
        <TileEmpty Icon={UsersIcon} title="It's quiet right now">
          Classmates from your groups appear here when they come online.
        </TileEmpty>
      ) : (
        <>
          <TileHeadline>
            {people.length} classmate{people.length === 1 ? '' : 's'} online
          </TileHeadline>
          <ul className="space-y-1">
            {shown.map((p) => (
              <li key={p._id} className="flex items-center gap-3 py-1.5">
                <span className="relative">
                  <UserAvatar name={p.name} profilePhoto={p.profilePhoto} size="md" border={false} />
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium text-gray-900">{p.name}</span>
                  <span className="block text-[13px] text-green-600">Active now</span>
                </span>
                <Link
                  to="/chat"
                  state={{ openUserId: p._id }}
                  aria-label={`Message ${p.name}`}
                  className="press flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200"
                >
                  <ChatIcon className="h-4 w-4" />
                </Link>
              </li>
            ))}
          </ul>
          {hidden > 0 && <p className="mt-2 text-[13px] text-gray-500">and {hidden} more online</p>}
        </>
      )}
    </Tile>
  );
};

export default OnCampus;
