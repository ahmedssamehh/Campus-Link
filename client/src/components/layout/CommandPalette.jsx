import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
  ChatIcon,
  HelpIcon,
  HomeIcon,
  MegaphoneIcon,
  PlusIcon,
  SearchIcon,
  ShieldIcon,
  UserIcon,
  UsersIcon,
} from '../ui/Icons';

const CommandPaletteContext = createContext({ open: () => {} });

export const useCommandPalette = () => useContext(CommandPaletteContext);

const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?';

export const CommandPaletteProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const value = useMemo(() => ({ open }), [open]);

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
      {isOpen && <Palette onClose={close} />}
    </CommandPaletteContext.Provider>
  );
};

const Palette = ({ onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [groups, setGroups] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const userId = user?._id || user?.id;
  const isAdminOrOwner = user?.role === 'admin' || user?.role === 'owner';

  useEffect(() => {
    inputRef.current?.focus();
    let alive = true;
    axios
      .get('/groups')
      .then((res) => alive && res.data.success && setGroups(res.data.groups || []))
      .catch(() => {});
    axios
      .get('/discussion/questions')
      .then((res) => alive && res.data.success && setQuestions(res.data.questions || []))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (...fields) => !q || fields.some((f) => (f || '').toLowerCase().includes(q));

    const pages = [
      { label: 'Home', hint: 'Dashboard', path: '/home', Icon: HomeIcon },
      { label: 'Chat', hint: 'Direct messages', path: '/chat', Icon: ChatIcon },
      { label: 'Study groups', hint: 'Browse & join', path: '/groups', Icon: UsersIcon },
      { label: 'Q&A board', hint: 'Discussions', path: '/discussion', Icon: HelpIcon },
      { label: 'Ask a question', hint: 'New discussion', path: '/discussion/ask', Icon: PlusIcon },
      { label: 'Announcements', hint: 'Campus news', path: '/announcements', Icon: MegaphoneIcon },
      { label: 'Profile', hint: 'Your account', path: '/profile', Icon: UserIcon },
      ...(isAdminOrOwner ? [{ label: 'Admin panel', hint: 'Manage campus', path: '/admin', Icon: ShieldIcon }] : []),
    ]
      .filter((p) => match(p.label, p.hint))
      .map((p) => ({ ...p, section: 'Go to' }));

    const groupItems = groups
      .filter((g) => match(g.name, g.subject))
      .slice(0, 6)
      .map((g) => {
        const joined = g.members?.some((m) => (m._id || m) === userId);
        return {
          section: 'Groups',
          label: g.name,
          hint: `${g.members?.length || 0} members${joined ? '' : ' · Not joined'}`,
          path: joined ? `/groups/${g._id || g.id}` : '/groups',
          badge: initials(g.name),
        };
      });

    const questionItems = q
      ? questions
          .filter((x) => match(x.title, ...(x.tags || [])))
          .slice(0, 5)
          .map((x) => ({
            section: 'Discussions',
            label: x.title,
            hint: `${x.answersCount || 0} answers`,
            path: `/discussion/${x._id}`,
            Icon: HelpIcon,
          }))
      : [];

    return [...pages, ...groupItems, ...questionItems];
  }, [query, groups, questions, userId, isAdminOrOwner]);

  useEffect(() => setActiveIndex(0), [query]);

  const go = (item) => {
    onClose();
    navigate(item.path);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && items[activeIndex]) {
      e.preventDefault();
      go(items[activeIndex]);
    }
  };

  let lastSection = null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center bg-black/25 px-4 pt-[12vh] animate-fade-in"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-xl origin-top overflow-hidden rounded-2xl border border-black/[0.06] bg-white/95 shadow-2xl backdrop-blur-xl animate-scale-in"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Search Campus Link"
      >
        <div className="flex items-center gap-3 border-b border-gray-100 px-4">
          <SearchIcon className="h-5 w-5 text-gray-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search groups, discussions, pages…"
            className="h-14 flex-1 bg-transparent text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />
          <kbd className="rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[11px] font-semibold text-gray-500">
            Esc
          </kbd>
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-2">
          {items.length === 0 && (
            <p className="px-3 py-10 text-center text-sm text-gray-500">
              No results for “{query}”
            </p>
          )}
          {items.map((item, idx) => {
            const header = item.section !== lastSection ? item.section : null;
            lastSection = item.section;
            const active = idx === activeIndex;
            return (
              <React.Fragment key={`${item.section}-${item.path}-${item.label}`}>
                {header && (
                  <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    {header}
                  </p>
                )}
                <button
                  type="button"
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => go(item)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                    active ? 'bg-blue-50' : ''
                  }`}
                >
                  {item.badge ? (
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-[11px] font-semibold text-white shadow-sm">
                      {item.badge}
                    </span>
                  ) : (
                    <span
                      className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${
                        active
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <item.Icon className="h-[18px] w-[18px]" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-gray-900">
                      {item.label}
                    </span>
                    <span className="block truncate text-xs text-gray-500">{item.hint}</span>
                  </span>
                  {active && <span className="text-xs font-medium text-blue-600">↵</span>}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
