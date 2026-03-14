import React, { useState } from 'react';

const AnswerCard = ({ answer, isAccepted, onVote, isVoting }) => {
  const [localError, setLocalError] = useState('');

  const getRelativeTime = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const handleVote = async (type) => {
    if (!onVote) return;
    setLocalError('');
    try {
      await onVote(answer._id, type);
    } catch (err) {
      setLocalError(err.message || 'Failed to submit vote');
    }
  };

  const authorName = answer.author?.name || 'Unknown User';
  const isUpvoted = answer.userVote === 'up';
  const isDownvoted = answer.userVote === 'down';

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${isAccepted ? 'border-2 border-green-500' : ''}`}>
      {isAccepted && (
        <div className="mb-3 flex items-center text-green-600 dark:text-green-400">
          <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-semibold text-sm">Accepted Answer</span>
        </div>
      )}

      <div className="flex space-x-4">
        {/* Voting Section */}
        <div className="flex flex-col items-center space-y-2">
          <button
            onClick={() => handleVote('up')}
            disabled={isVoting}
            className={`p-2 rounded-full transition duration-200 ${
              isUpvoted
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <span className="font-bold text-lg text-gray-900 dark:text-white">{answer.votes || 0}</span>
          <button
            onClick={() => handleVote('down')}
            disabled={isVoting}
            className={`p-2 rounded-full transition duration-200 ${
              isDownvoted
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Answer Content */}
        <div className="flex-1">
          <p className="text-gray-800 dark:text-gray-200 mb-4 whitespace-pre-line">{answer.content}</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {authorName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{authorName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Answered {getRelativeTime(answer.createdAt)}</p>
              </div>
            </div>
          </div>
          {localError && (
            <p className="text-sm text-red-600 mt-2">{localError}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnswerCard;
