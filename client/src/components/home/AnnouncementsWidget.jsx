import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon, MegaphoneIcon } from '../ui/Icons';
import { Tile, TileAction, TileEmpty, TileSkeleton } from './Tile';

const relativeTime = (dateString) => {
  const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const Meta = ({ a }) => (
  <span className="text-[13px] text-gray-500">
    {a.group?.name && <>{a.group.name} · </>}
    {relativeTime(a.createdAt)}
  </span>
);

/** Latest announcement as a featured story, older ones as a compact list. */
const AnnouncementsWidget = ({ loading, announcements = [], stacked = false, className, index }) => {
  const [featured, ...rest] = announcements;

  return (
    <Tile index={index}
      label="Announcements"
      Icon={MegaphoneIcon}
      tone="rose"
      className={className}
      action={announcements.length > 0 && <TileAction to="/announcements">See all</TileAction>}
    >
      {loading ? (
        <TileSkeleton rows={2} />
      ) : !featured ? (
        <TileEmpty Icon={MegaphoneIcon} title="No announcements yet">
          Updates from your groups will appear here.
        </TileEmpty>
      ) : (
        <div className={stacked ? 'flex flex-1 flex-col gap-4' : 'grid gap-6 md:grid-cols-5 md:gap-8'}>
          <Link to="/announcements" className={`group ${stacked ? '' : 'md:col-span-3'}`}>
            <div className="flex items-center gap-2">
              {!featured.isRead && (
                <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-semibold text-rose-600">
                  New
                </span>
              )}
              <Meta a={featured} />
            </div>
            <h3 className="mt-2 text-[22px] font-semibold leading-tight tracking-[-0.02em] text-gray-900 group-hover:text-blue-600">
              {featured.title}
            </h3>
            <p className="mt-2 line-clamp-3 text-[15px] leading-relaxed text-gray-600">
              {featured.content}
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-blue-600">
              Read announcement
              <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>

          {rest.length > 0 && (
            <ul
              className={`divide-y divide-gray-100 border-t border-gray-100 ${
                stacked ? '' : 'md:col-span-2 md:border-l md:border-t-0 md:pl-8'
              }`}
            >
              {rest.slice(0, 3).map((a) => (
                <li key={a._id}>
                  <Link to="/announcements" className="group flex items-start gap-2.5 py-3">
                    <span
                      className={`mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full ${a.isRead ? 'bg-transparent' : 'bg-blue-600'}`}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-medium text-gray-900 group-hover:text-blue-600">
                        {a.title}
                      </span>
                      <Meta a={a} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Tile>
  );
};

export default AnnouncementsWidget;
