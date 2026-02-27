import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QuestionForm from '../../components/discussion/QuestionForm';

const AskQuestion = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (formData) => {
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      console.log('Question submitted:', formData);
      setIsLoading(false);
      // Redirect back to discussion board
      navigate('/discussion');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Ask a Question</h1>
          <p className="text-gray-600">
            Get help from your classmates and contribute to the learning community
          </p>
        </div>

        {/* Tips Card */}
        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">
                Tips for asking a good question:
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Be specific and clear in your title</li>
                <li>• Provide context and explain what you've tried</li>
                <li>• Include relevant code or examples if applicable</li>
                <li>• Add appropriate tags to help others find your question</li>
                <li>• Be respectful and follow community guidelines</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Question Form */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <QuestionForm onSubmit={handleSubmit} isLoading={isLoading} />
        </div>

        {/* Guidelines Card */}
        <div className="mt-6 bg-gray-100 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Community Guidelines</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div className="flex items-start">
              <svg
                className="h-5 w-5 text-green-600 mr-2 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Ask genuine questions you need help with</span>
            </div>
            <div className="flex items-start">
              <svg
                className="h-5 w-5 text-green-600 mr-2 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Show what you've attempted so far</span>
            </div>
            <div className="flex items-start">
              <svg
                className="h-5 w-5 text-green-600 mr-2 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Use proper formatting and grammar</span>
            </div>
            <div className="flex items-start">
              <svg
                className="h-5 w-5 text-green-600 mr-2 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Accept helpful answers to help others</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AskQuestion;
