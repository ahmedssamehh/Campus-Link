import React, { useState } from 'react';

const AnswerCard = ({ answer, isAccepted }) => {
  const [upvotes, setUpvotes] = useState(answer.upvotes || 0);
  const [hasUpvoted, setHasUpvoted] = useState(false);

  const handleUpvote = () => {
    if (hasUpvoted) {
      setUpvotes(upvotes - 1);
      setHasUpvoted(false);
    } else {
      setUpvotes(upvotes + 1);
      setHasUpvoted(true);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${isAccepted ? 'border-2 border-green-500' : ''}`}>
      {isAccepted && (
        <div className="mb-3 flex items-center text-green-600">
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
            onClick={handleUpvote}
            className={`p-2 rounded-full transition duration-200 ${
              hasUpvoted
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
          <span className="font-bold text-lg text-gray-900">{upvotes}</span>
        </div>

        {/* Answer Content */}
        <div className="flex-1">
          <p className="text-gray-800 mb-4 whitespace-pre-line">{answer.content}</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {answer.author.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{answer.author}</p>
                <p className="text-xs text-gray-500">Answered {answer.time}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnswerCard;
