import React from 'react';

const MessageBubble = ({ message, isSent }) => {
  return (
    <div className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${isSent ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {/* Avatar */}
        {!isSent && (
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-semibold">
              {message.sender.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        
        {/* Message Content */}
        <div>
          {!isSent && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-1">{message.sender}</p>
          )}
          <div
            className={`px-4 py-2 rounded-lg ${
              isSent
                ? 'bg-blue-600 text-white rounded-br-none'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'
            }`}
          >
            <p className="text-sm">{message.text}</p>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 px-1">
            {message.time}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
