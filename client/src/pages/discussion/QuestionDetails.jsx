import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import AnswerCard from '../../components/discussion/AnswerCard';

const QuestionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [answerText, setAnswerText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questionVoteLoading, setQuestionVoteLoading] = useState(false);
  const [answerVoteLoadingId, setAnswerVoteLoadingId] = useState(null);

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

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await axios.get(`/discussion/questions/${id}`);
        if (response.data.success) {
          setQuestion(response.data.question);
          setAnswers(response.data.answers || []);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load question details');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();

    if (!answerText.trim()) return;

    try {
      setIsSubmitting(true);
      setError('');

      const response = await axios.post(`/discussion/questions/${id}/answers`, {
        content: answerText
      });

      if (response.data.success) {
        setAnswers((prev) => [...prev, response.data.answer]);
        setQuestion((prev) => prev ? { ...prev, answersCount: (prev.answersCount || 0) + 1 } : prev);
        setAnswerText('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuestionVote = async (type) => {
    try {
      setQuestionVoteLoading(true);
      setError('');
      const endpoint = type === 'up' ? 'upvote' : 'downvote';
      const response = await axios.post(`/discussion/questions/${id}/${endpoint}`);
      if (response.data.success) {
        setQuestion(response.data.question);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit question vote');
    } finally {
      setQuestionVoteLoading(false);
    }
  };

  const handleAnswerVote = async (answerId, type) => {
    setAnswerVoteLoadingId(answerId);
    try {
      const endpoint = type === 'up' ? 'upvote' : 'downvote';
      const response = await axios.post(`/discussion/answers/${answerId}/${endpoint}`);
      if (response.data.success) {
        setAnswers((prev) => prev.map((ans) => ans._id === answerId ? response.data.answer : ans));
      }
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to submit answer vote');
    } finally {
      setAnswerVoteLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center text-gray-600 dark:text-gray-300">
            Loading question...
          </div>
        </div>
      </div>
    );
  }

  if (error && !question) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center text-gray-600 dark:text-gray-300">
            Question not found.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/discussion')}
          className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium mb-6 transition duration-200"
        >
          <svg
            className="h-5 w-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Discussion Board
        </button>

        {/* Question */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-6">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{question.title}</h1>
            {(answers.length > 0) && (
              <span className="ml-4 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-sm font-semibold px-4 py-2 rounded-full flex items-center">
                <svg className="h-5 w-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
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

          <div className="flex items-center space-x-4 mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">
                  {(question.author?.name || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{question.author?.name || 'Unknown User'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Asked {getRelativeTime(question.createdAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 ml-auto">
              <button
                onClick={() => handleQuestionVote('up')}
                disabled={questionVoteLoading}
                className={`p-2 rounded-md transition ${
                  question.userVote === 'up'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
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
              <span className="text-sm font-semibold min-w-[30px] text-center">{question.votes || 0}</span>
              <button
                onClick={() => handleQuestionVote('down')}
                disabled={questionVoteLoading}
                className={`p-2 rounded-md transition ${
                  question.userVote === 'down'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
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
          </div>

          <div className="prose max-w-none mb-6">
            <p className="text-gray-800 dark:text-gray-200 whitespace-pre-line">{question.content}</p>
          </div>

          {question.tags && question.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {question.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-sm font-medium px-3 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Answers Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}
          </h2>
          <div className="space-y-4">
            {answers.map((answer) => (
              <AnswerCard
                key={answer._id}
                answer={answer}
                isAccepted={false}
                onVote={handleAnswerVote}
                isVoting={answerVoteLoadingId === answer._id}
              />
            ))}
          </div>
        </div>

        {/* Answer Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Your Answer</h3>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmitAnswer}>
            <textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Write your answer here..."
              rows={8}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 resize-none bg-white dark:bg-gray-700 dark:text-white"
              disabled={isSubmitting}
            />
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Please be respectful and provide helpful answers
              </p>
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting || !answerText.trim()}
              >
                {isSubmitting ? 'Posting...' : 'Post Answer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default QuestionDetails;
