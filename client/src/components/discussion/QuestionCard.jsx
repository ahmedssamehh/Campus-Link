import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getMediaUrl } from '../../utils/media';

const QuestionCard = ({ question }) => {
  const navigate = useNavigate();

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

  const handleClick = () => {
    navigate(`/discussion/${question._id}`);
  };

  const isSolved = Boolean(question.isSolved);
  const authorName = question.author?.name || 'Unknown User';

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); } }}
      onClick={handleClick}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition duration-300 cursor-pointer border-l-4 border-blue-500 min-w-0 max-w-full"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3 mb-3 min-w-0">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition duration-200 break-words [overflow-wrap:anywhere] min-w-0 flex-1">
          {question.title}
        </h3>
        {isSolved && (
          <span className="shrink-0 self-start bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-xs font-semibold px-3 py-1 rounded-full inline-flex items-center">
            <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Solved
          </span>
        )}
      </div>

      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2 break-words min-w-0">{question.content}</p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between min-w-0">
        <div className="flex items-center space-x-2 min-w-0">
          <div className="flex items-center space-x-2 min-w-0">
            {question.author?.profilePhoto ? (
              <img src={getMediaUrl(question.author.profilePhoto)} alt={authorName} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-xs">
                  {authorName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{authorName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{getRelativeTime(question.createdAt)}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 sm:gap-6 flex-shrink-0">
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <svg
              className="h-5 w-5 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
            <span className="text-sm font-medium">{question.votes || 0}</span>
          </div>
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <svg
              className="h-5 w-5 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span className="text-sm font-medium">{question.answersCount || 0}</span>
          </div>
        </div>
      </div>

      {question.tags && question.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {question.tags.map((tag, index) => (
            <span
              key={index}
              className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-medium px-3 py-1 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestionCard;
