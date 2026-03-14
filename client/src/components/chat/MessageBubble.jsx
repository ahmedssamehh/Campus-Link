import React, { useState } from 'react';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

const MessageBubble = ({
  message, isSent, currentUserId,
  isEditing, editInput, onEditInputChange,
  onStartEdit, onCancelEdit, onSaveEdit,
  onDelete, onReaction, onRemoveReaction,
  chatType
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const senderName = typeof message.sender === 'object'
    ? message.sender?.name || 'Unknown'
    : message.sender || 'Unknown';

  const messageText = message.text || message.content || '';

  const messageTime = message.time || (message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : '');

  const isDeleted = message.deleted;

  // Delivery status for sent messages (private chat)
  const getDeliveryStatus = () => {
    if (!isSent || chatType !== 'private') return null;
    const readBy = message.readBy || [];
    const deliveredTo = message.deliveredTo || [];
    const senderId = typeof message.sender === 'object'
      ? (message.sender._id || message.sender.id || '').toString()
      : (message.sender || '').toString();

    const readByOther = readBy.some(id => (id || '').toString() !== senderId);
    const deliveredToOther = deliveredTo.some(id => (id || '').toString() !== senderId);

    if (readByOther) {
      return (
        <span className="text-blue-400 ml-1" title="Read">✓✓</span>
      );
    }
    if (deliveredToOther) {
      return (
        <span className="text-gray-400 dark:text-gray-500 ml-1" title="Delivered">✓✓</span>
      );
    }
    return (
      <span className="text-gray-400 dark:text-gray-500 ml-1" title="Sent">✓</span>
    );
  };

  // Render file attachments
  const renderAttachments = () => {
    if (!message.attachments || message.attachments.length === 0) return null;
    return (
      <div className="mt-2 space-y-1">
        {message.attachments.map((att, idx) => {
          const isImage = att.mimetype && att.mimetype.startsWith('image/');
          if (isImage) {
            return (
              <a key={idx} href={att.url} target="_blank" rel="noopener noreferrer">
                <img
                  src={att.url}
                  alt={att.filename}
                  className="max-w-full max-h-48 rounded-lg cursor-pointer"
                />
              </a>
            );
          }
          return (
            <a
              key={idx}
              href={att.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center space-x-2 p-2 rounded-lg text-sm ${
                isSent ? 'bg-blue-700/30 text-blue-100 hover:bg-blue-700/50' : 'bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-500'
              }`}
            >
              <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="truncate">{att.filename}</span>
              {att.size && <span className="text-xs opacity-70">({(att.size / 1024).toFixed(0)}KB)</span>}
            </a>
          );
        })}
      </div>
    );
  };

  // Render reactions row
  const renderReactions = () => {
    if (!message.reactions || message.reactions.length === 0) return null;
    const grouped = {};
    message.reactions.forEach((r) => {
      if (!grouped[r.emoji]) grouped[r.emoji] = [];
      const userId = typeof r.user === 'object' ? r.user._id : r.user;
      grouped[r.emoji].push(userId);
    });

    return (
      <div className="flex flex-wrap gap-1 mt-1 px-1">
        {Object.entries(grouped).map(([emoji, users]) => {
          const iMine = users.includes(currentUserId);
          return (
            <button
              key={emoji}
              onClick={() => iMine ? onRemoveReaction() : onReaction(emoji)}
              className={`text-xs px-1.5 py-0.5 rounded-full border transition ${
                iMine
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-500'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {emoji} {users.length > 1 ? users.length : ''}
            </button>
          );
        })}
      </div>
    );
  };

  // Deleted message
  if (isDeleted) {
    return (
      <div className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${isSent ? 'flex-row-reverse space-x-reverse' : ''}`}>
          {!isSent && (
            <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-semibold">{senderName.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <div>
            {!isSent && <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-1">{senderName}</p>}
            <div className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 italic">
              <p className="text-sm text-gray-400 dark:text-gray-500">This message was deleted</p>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 px-1">{messageTime}</p>
          </div>
        </div>
      </div>
    );
  }

  // Edit mode
  if (isEditing) {
    return (
      <div className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className="max-w-xs lg:max-w-md w-full">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-3">
            <input
              type="text"
              value={editInput}
              onChange={(e) => onEditInputChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') onSaveEdit(); if (e.key === 'Escape') onCancelEdit(); }}
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 dark:text-white focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex justify-end space-x-2 mt-2">
              <button onClick={onCancelEdit} className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">Cancel</button>
              <button onClick={onSaveEdit} className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">Save</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-4 group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowEmojiPicker(false); }}
    >
      <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${isSent ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {/* Avatar */}
        {!isSent && (
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-semibold">
              {senderName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Message Content */}
        <div className="relative">
          {!isSent && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-1">{senderName}</p>
          )}
          <div
            className={`px-4 py-2 rounded-lg ${
              isSent
                ? 'bg-blue-600 text-white rounded-br-none'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'
            }`}
          >
            <p className="text-sm whitespace-pre-wrap break-words">{messageText}</p>
            {renderAttachments()}
          </div>

          {/* Time + edited + delivery status */}
          <div className="flex items-center mt-1 px-1">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {messageTime}
            </p>
            {message.edited && (
              <span className="text-xs text-gray-400 dark:text-gray-500 ml-1 italic">(edited)</span>
            )}
            {getDeliveryStatus()}
          </div>

          {/* Reactions row */}
          {renderReactions()}

          {/* Hover Actions */}
          {showActions && (
            <div className={`absolute top-0 ${isSent ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} flex items-center space-x-1 px-1`}>
              {/* React button */}
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400"
                title="React"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              {/* Edit/Delete for own messages */}
              {isSent && (
                <>
                  <button
                    onClick={onStartEdit}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400"
                    title="Edit"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={onDelete}
                    className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-500 dark:text-gray-400 hover:text-red-600"
                    title="Delete"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          )}

          {/* Emoji Picker Popup */}
          {showEmojiPicker && (
            <div className={`absolute ${isSent ? 'right-0' : 'left-0'} -top-10 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg p-1.5 flex space-x-1 z-10`}>
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => { onReaction(emoji); setShowEmojiPicker(false); }}
                  className="hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-1 text-lg"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
