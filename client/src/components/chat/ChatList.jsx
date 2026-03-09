import React from 'react';

const roleMeta = {
  owner: { label: 'Owner', cls: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  admin: { label: 'Admin', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  user:  { label: 'Member', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
};

const RoleBadge = ({ role }) => {
  if (!role) return null;
  const meta = roleMeta[role] || roleMeta.user;
  return (
    <span className={`inline-block text-xs font-medium px-1.5 py-0.5 rounded ${meta.cls}`}>
      {meta.label}
    </span>
  );
};

const ChatList = ({ chats, activeChat, onSelectChat, unreadMessages, lastSeenMap }) => {
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

  return (
    <div className="h-full flex flex-col">
      {/* Search Bar */}
      <div className="p-4 border-b dark:border-gray-700">
        <input
          type="text"
          placeholder="Search conversations..."
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
        />
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {chats.map((chat) => {
          const unreadCount = unreadMessages?.[chat.id] || 0;
          const previewMsg = chat.lastMessage;
          const previewTime = chat.lastMessageTime;

          return (
          <div
            key={chat.id}
            onClick={() => onSelectChat(chat)}
            className={`flex items-center space-x-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150 ${
              activeChat?.id === chat.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600' : 'border-l-4 border-transparent'
            }`}
          >
            {/* Avatar */}
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold">
                  {chat.name.charAt(0).toUpperCase()}
                </span>
              </div>
              {chat.isOnline && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
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
              <div className="flex items-center justify-between">
                <p className={`text-sm truncate ${unreadCount > 0 ? 'text-gray-900 dark:text-gray-200 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                  {previewMsg}
                </p>
                {unreadCount > 0 && (
                  <span className="ml-2 bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded-full min-w-[24px] text-center">
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
