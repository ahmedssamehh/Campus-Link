import React from 'react';
import { useNavigate } from 'react-router-dom';
import UserAvatar from '../common/UserAvatar';
import { ChatIcon, CheckIcon, ChevronUpIcon } from '../ui/Icons';

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

const QuestionCard = ({ question }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/discussion/${question._id}`);
  };

  const isSolved = Boolean(question.isSolved);
  const authorName = question.author?.name || 'Unknown User';

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      onClick={handleClick}
      className="group flex min-w-0 max-w-full cursor-pointer gap-4 rounded-2xl bg-white p-4 transition-colors press hover:border-gray-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 sm:p-5"
    >
      {/* Vote box */}
      <div className="flex h-14 w-12 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-gray-100 text-gray-700">
        <ChevronUpIcon className="h-4 w-4" strokeWidth={2.5} />
        <span className="text-base font-semibold leading-none tabular-nums">{question.votes || 0}</span>
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="break-words text-base font-semibold text-gray-900 transition group-hover:text-blue-600 [overflow-wrap:anywhere] sm:text-lg">
          {question.title}
        </h3>
        <p className="mt-1 line-clamp-2 break-words text-sm text-gray-500">{question.content}</p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {(question.tags || []).map((tag, index) => (
            <span
              key={index}
              className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600"
            >
              {tag}
            </span>
          ))}
          {isSolved && (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600">
              <CheckIcon className="h-3 w-3" strokeWidth={3} />
              Solved
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
          <div className="flex min-w-0 items-center gap-2">
            <UserAvatar name={authorName} profilePhoto={question.author?.profilePhoto} size="xs" border={false} />
            <p className="truncate text-xs text-gray-500">
              <span className="font-semibold text-gray-700">{authorName}</span>
              {' · '}
              {getRelativeTime(question.createdAt)}
            </p>
          </div>
          <span className="flex flex-shrink-0 items-center gap-1.5 text-xs font-medium text-gray-500">
            <ChatIcon className="h-4 w-4" />
            {question.answersCount || 0} answer{question.answersCount === 1 ? '' : 's'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default QuestionCard;
