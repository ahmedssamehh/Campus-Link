import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import QuestionCard from '../../components/discussion/QuestionCard';

const Discussion = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filter, setFilter] = useState('all'); // all, solved, unsolved, mine
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await axios.get('/discussion/questions');
        if (response.data.success) {
          setQuestions(response.data.questions || []);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load discussion questions');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  const filteredQuestions = useMemo(() => questions.filter((question) => {
    const isSolved = Boolean(question.isSolved);
    const currentUserId = user?._id || user?.id;
    const isMine = currentUserId && (question.author?._id === currentUserId);
    const matchesFilter =
      filter === 'all' ||
      (filter === 'solved' && isSolved) ||
      (filter === 'unsolved' && !isSolved) ||
      (filter === 'mine' && isMine);

    const matchesSearch =
      searchTerm === '' ||
      question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (question.tags || []).some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesFilter && matchesSearch;
  }), [questions, filter, searchTerm, user]);

  const myQuestionsCount = questions.filter((question) => {
    const currentUserId = user?._id || user?.id;
    return currentUserId && question.author?._id === currentUserId;
  }).length;

  const solvedCount = questions.filter((q) => Boolean(q.isSolved)).length;
  const unsolvedCount = questions.length - solvedCount;

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-gray-50 dark:bg-gray-900 py-4 pb-20 sm:py-6 md:py-8 md:pb-8">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-8 min-w-0">
        {/* Header — stack on mobile to avoid horizontal overflow */}
        <div className="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between min-w-0">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Discussion Board</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 break-words">
              Ask questions and help your classmates
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/discussion/ask')}
            className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 min-h-[44px] px-4 sm:px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm sm:text-base font-medium hover:bg-blue-700 transition duration-200"
          >
            <svg
              className="h-5 w-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Ask Question
          </button>
        </div>

        {/* Search and Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6 min-w-0 overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 min-w-0">
            {/* Search Bar */}
            <div className="flex-1 min-w-0 lg:mr-4">
              <div className="relative">
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search questions or tags..."
                  className="w-full min-w-0 px-4 py-2.5 pl-10 text-base sm:text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
                />
                <svg
                  className="absolute left-3 top-3 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2 min-w-0">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition duration-200 min-h-[40px] ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilter('solved')}
                className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition duration-200 min-h-[40px] ${
                  filter === 'solved'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Solved
              </button>
              <button
                type="button"
                onClick={() => setFilter('unsolved')}
                className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition duration-200 min-h-[40px] ${
                  filter === 'unsolved'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Unsolved
              </button>
              <button
                type="button"
                onClick={() => setFilter('mine')}
                className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition duration-200 min-h-[40px] ${
                  filter === 'mine'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                My Questions ({myQuestionsCount})
              </button>
            </div>
          </div>
        </div>

        {/* Stats — 3-up on small screens to save vertical space */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6 min-w-0">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-4 min-w-0">
            <div className="flex items-center min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                <svg
                  className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{questions.length}</p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-tight">Total</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-4 min-w-0">
            <div className="flex items-center min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{solvedCount}</p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-tight">Solved</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-4 min-w-0">
            <div className="flex items-center min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 dark:bg-orange-900/40 rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                <svg
                  className="h-6 w-6 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{unsolvedCount}</p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-tight">Unsolved</p>
              </div>
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          ) : filteredQuestions.length > 0 ? (
            filteredQuestions.map((question) => (
              <QuestionCard key={question._id} question={question} />
            ))
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
              <svg
                className="h-16 w-16 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-gray-600 dark:text-gray-400 text-lg">No questions found</p>
              <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                {searchTerm
                  ? 'Try adjusting your search'
                  : (filter === 'mine' ? 'You have not asked any questions yet.' : 'Be the first to ask a question!')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Discussion;
