import React from 'react';
import { Link } from 'react-router-dom';
import { ChatIcon, ClockIcon, MegaphoneIcon, UsersIcon } from '../ui/Icons';
import { CountUp } from '../ui/motion';

// The sky behind the greeting follows the time of day, like Apple Weather.
const SKIES = {
  morning: {
    background: 'linear-gradient(160deg, #3B82D6 0%, #6FAEEA 55%, #F2C39B 100%)',
    glow: 'radial-gradient(circle, rgba(255,236,200,0.85) 0%, rgba(255,236,200,0) 68%)',
  },
  day: {
    background: 'linear-gradient(170deg, #1F63C9 0%, #3D8BE3 55%, #77B6F2 100%)',
    glow: 'radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 68%)',
  },
  evening: {
    background: 'linear-gradient(165deg, #2A2F6E 0%, #5B4A9B 50%, #D9787A 100%)',
    glow: 'radial-gradient(circle, rgba(255,190,150,0.75) 0%, rgba(255,190,150,0) 68%)',
  },
  night: {
    background: 'linear-gradient(170deg, #0B1230 0%, #18244F 60%, #2B3A72 100%)',
    glow: 'radial-gradient(circle, rgba(220,230,255,0.45) 0%, rgba(220,230,255,0) 62%)',
  },
};

const timeOfDay = (h) => {
  if (h >= 5 && h < 11) return 'morning';
  if (h >= 11 && h < 17) return 'day';
  if (h >= 17 && h < 20) return 'evening';
  return 'night';
};

const greetingFor = (period) =>
  ({ morning: 'Good morning', day: 'Good afternoon', evening: 'Good evening', night: 'Good evening' })[period];

const Chip = ({ to, Icon, label, value }) => (
  <Link
    to={to}
    className="press group flex min-w-0 flex-col rounded-2xl bg-white/15 px-3 py-3 sm:px-4 ring-1 ring-inset ring-white/20 backdrop-blur-md transition-colors hover:bg-white/[0.22]"
  >
    <span className="flex items-center gap-1.5 text-[13px] font-medium text-white/80">
      <Icon className="hidden h-3.5 w-3.5 flex-shrink-0 sm:block" strokeWidth={2.2} />
      <span className="truncate">{label}</span>
    </span>
    <span className="mt-1 text-[28px] font-semibold leading-none tracking-[-0.02em] text-white">
      <CountUp value={value} />
    </span>
  </Link>
);

const TodayHero = ({ firstName, date, summary, unread = 0, announcements = 0, requests, groupCount = 0 }) => {
  const period = timeOfDay(new Date().getHours());
  const sky = SKIES[period];

  return (
    <section
      className="reveal relative flex flex-col justify-end overflow-hidden rounded-[28px] p-6 text-white sm:min-h-[220px] sm:p-8 lg:min-h-[260px] lg:p-10"
      style={{ background: sky.background }}
    >
      {/* Sun / moon light source */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-24 h-[340px] w-[340px] sm:right-6 sm:-top-28"
        style={{ background: sky.glow }}
      />
      {period === 'night' && (
        <div
          aria-hidden
          className="pointer-events-none absolute right-16 top-10 hidden h-12 w-12 rounded-full bg-[#F4F1E6] shadow-[0_0_40px_8px_rgba(244,241,230,0.25)] sm:block"
        >
          <span className="absolute -right-1.5 -top-1.5 h-11 w-11 rounded-full" style={{ background: '#1A2650' }} />
        </div>
      )}

      <div className="relative flex w-full flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 max-w-xl">
          {date && <p className="mb-2 text-[15px] font-medium text-white/75">{date}</p>}
          <h1 className="text-[34px] font-bold leading-[1.05] tracking-[-0.03em] sm:text-[46px]">
            {greetingFor(period)}
            {firstName ? `, ${firstName}` : ''}.
          </h1>
          <p className="mt-3 text-[17px] leading-relaxed text-white/85">{summary}</p>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:w-[420px] lg:flex-shrink-0">
          <Chip to="/chat" Icon={ChatIcon} label="Messages" value={unread} />
          <Chip to="/announcements" Icon={MegaphoneIcon} label="News" value={announcements} />
          {requests !== undefined ? (
            <Chip to="/admin/requests" Icon={ClockIcon} label="Requests" value={requests} />
          ) : (
            <Chip to="/groups" Icon={UsersIcon} label="Groups" value={groupCount} />
          )}
        </div>
      </div>
    </section>
  );
};

export default TodayHero;
