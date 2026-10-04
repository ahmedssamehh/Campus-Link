import React, { useState, useMemo } from 'react';
import UserAvatar from '../common/UserAvatar';
import { SearchIcon } from '../ui/Icons';

const roleMeta = {
  owner: { label: 'Owner', cls: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300' },
  admin: { label: 'Admin', cls: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300' },
  user:  { label: 'Member', cls: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300' },
};

const RoleBadge = ({ role }) => {
  if (!role) return null;
  const meta = roleMeta[role] || roleMeta.user;
  return (
    <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${meta.cls}`}>
      {meta.label}
    </span>
  );
};

const ChatList = ({
  chats,
  activeChat,
  showChatWindow,
  listTypingByUserId,
  onSelectChat,
  unreadMessages,
  lastSeenMap,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const formatLastSeen = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    return d.toLocaleDateString();
  };

  const filteredChats = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter((c) => {
      const name = (c.name || '').toLowerCase();
      const email = (c.email || '').toLowerCase();
      const preview = (c.lastMessage || '').toLowerCase();
      return name.includes(q) || email.includes(q) || preview.includes(q);
    });
  }, [chats, searchQuery]);

  return (
    <div className="h-full flex flex-col">
      {/* Search Bar */}
      <div className="p-4 pb-2">
        <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search conversations..."
          autoComplete="off"
          aria-label="Search conversations"
          className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm transition placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/15 dark:border-gray-700 dark:bg-gray-700/60 dark:text-white dark:placeholder-gray-400"
        />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {filteredChats.length === 0 && chats.length > 0 && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-10 px-4">
            No conversations match your search.
          </p>
        )}
        {filteredChats.map((chat) => {
          const chatId = String(chat.id);
          const unreadCount = unreadMessages?.[chat.id] || unreadMessages?.[chatId] || 0;
          const previewMsg = chat.lastMessage;
          const previewTime = chat.lastMessageTime;
          const peerTypingName = listTypingByUserId?.[chatId];
          const hideTypingInThisRow =
            Boolean(activeChat && String(activeChat.id) === chatId && showChatWindow);
          const showTypingPreview = Boolean(peerTypingName) && !hideTypingInThisRow;

          return (
          <div
            key={chat.id}
            onClick={() => onSelectChat(chat)}
            className={`flex items-center gap-3 rounded-xl px-3 py-3 cursor-pointer transition duration-150 ${
              activeChat?.id === chat.id ? 'bg-blue-50 ring-1 ring-blue-100 dark:bg-blue-500/10 dark:ring-blue-500/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            {/* Avatar */}
            <div className="relative">
              <UserAvatar name={chat.name} profilePhoto={chat.profilePhoto} size="lg" border={false} />
              {chat.isOnline && (
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-gray-800"></div>
              )}
            </div>

            {/* Chat Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <h3 className={`text-sm font-semibold truncate ${unreadCount > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                  {chat.name}
                </h3>
                <span className={`text-xs flex-shrink-0 ml-2 ${unreadCount > 0 ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>
                  {previewTime}
                </span>
              </div>
              {chat.role && (
                <div className="mb-1">
                  <RoleBadge role={chat.role} />
                </div>
              )}
              {!chat.isOnline && lastSeenMap && lastSeenMap[chat.id] && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">
                  Last seen {formatLastSeen(lastSeenMap[chat.id])}
                </p>
              )}
              <div className="flex items-center justify-between gap-2 min-w-0">
                <p
                  className={`text-sm truncate min-w-0 ${
                    showTypingPreview
                      ? 'italic text-blue-600 dark:text-blue-400'
                      : unreadCount > 0
                        ? 'text-gray-900 dark:text-gray-200 font-medium'
                        : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {showTypingPreview ? `${peerTypingName} is typing…` : previewMsg || 'Tap to chat'}
                </p>
                {unreadCount > 0 && (
                  <span className="ml-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1.5 text-[11px] font-bold text-white shadow-glow">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChatList;
