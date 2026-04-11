import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { getMediaUrl } from '../../utils/media';

const MessageToast = () => {
  const { onNewMessage } = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [toasts, setToasts] = useState([]);

  const currentUserId = (user?._id || user?.id)?.toString();
  const locationRef = useRef(location.pathname);

  // Keep location ref in sync
  useEffect(() => {
    locationRef.current = location.pathname;
  }, [location.pathname]);

  // Remove a toast
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Listen for new messages
  useEffect(() => {
    const unsubscribe = onNewMessage((msg) => {
      const senderId = typeof msg.sender === 'object' ? msg.sender._id : msg.sender;
      const senderName = typeof msg.sender === 'object' ? msg.sender.name : msg.senderName || 'Someone';
      const content = msg.content || msg.text || '';

      // Don't show toast for own messages
      if (senderId === currentUserId) return;

      const toastId = Date.now() + Math.random();
      let title, body, targetPath, sourceId;

      if (msg.group) {
        title = `New message in group`;
        body = `${senderName}: ${content.substring(0, 60)}${content.length > 60 ? '...' : ''}`;
        targetPath = `/groups/${msg.group}`;
        sourceId = msg.group;

        // Don't show toast if user is already viewing this group chat
        if (locationRef.current === targetPath) return;
      } else if (msg.receiver) {
        title = senderName;
        body = content.substring(0, 60) + (content.length > 60 ? '...' : '');
        targetPath = '/chat';
        sourceId = senderId;

        // Don't show toast if user is already on the chat page
        // (the Chat.jsx component handles active view tracking)
        if (locationRef.current === '/chat') return;
      } else {
        return;
      }

      const senderPhoto = typeof msg.sender === 'object'
        ? getMediaUrl(msg.sender?.profilePhoto || '')
        : '';

      const toast = {
        id: toastId,
        title,
        body,
        targetPath,
        sourceId,
        senderName,
        senderInitial: senderName.charAt(0).toUpperCase(),
        senderPhoto,
        isGroup: !!msg.group,
        timestamp: new Date(),
      };

      setToasts((prev) => {
        // Keep max 3 toasts at a time
        const updated = [...prev, toast];
        return updated.slice(-3);
      });

      // Auto-remove after 5 seconds
      setTimeout(() => {
        removeToast(toastId);
      }, 5000);
    });

    return unsubscribe;
  }, [onNewMessage, currentUserId, removeToast]);

  const handleToastClick = (toast) => {
    removeToast(toast.id);
    if (toast.targetPath) {
      navigate(toast.targetPath);
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-3 left-3 right-3 z-[9999] flex flex-col items-stretch sm:items-end gap-2 pointer-events-none sm:top-4 sm:left-auto sm:right-4 sm:w-80 sm:max-w-none max-w-lg ml-auto">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => handleToastClick(toast)}
          className="pointer-events-auto w-full max-w-full sm:w-80 min-w-0 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 cursor-pointer transform transition-all duration-300 ease-out animate-slide-in-right hover:scale-[1.02] hover:shadow-3xl"
        >
          <div className="flex items-start space-x-3">
            {/* Avatar */}
            {!toast.isGroup && toast.senderPhoto ? (
              <img src={toast.senderPhoto} alt={toast.senderName} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                toast.isGroup
                  ? 'bg-gradient-to-br from-green-500 to-teal-500'
                  : 'bg-gradient-to-br from-blue-500 to-purple-500'
              }`}>
                {toast.isGroup ? (
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ) : (
                  <span className="text-white font-semibold text-sm">
                    {toast.senderInitial}
                  </span>
                )}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {toast.title}
                </p>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0 ml-2">
                  now
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-0.5">
                {toast.body}
              </p>
            </div>

            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeToast(toast.id);
              }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tap to view hint */}
          <p className="text-[10px] text-blue-500 dark:text-blue-400 mt-2 text-right">
            Tap to view
          </p>
        </div>
      ))}
    </div>
  );
};

export default MessageToast;
