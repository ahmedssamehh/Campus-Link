import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QuestionCard from '../../components/discussion/QuestionCard';

const Discussion = () => {
  const navigate = useNavigate();

  // Mock data for questions
  const [questions] = useState([
    {
      id: 1,
      title: 'How do I implement recursion in JavaScript?',
      content: 'I am having trouble understanding how recursion works in JavaScript. Can someone explain with examples?',
      author: 'John Doe',
      time: '2 hours ago',
      answers: 5,
      views: 124,
      isSolved: true,
      tags: ['JavaScript', 'Programming', 'Recursion'],
    },
    {
      id: 2,
      title: 'What is the difference between let and var in JavaScript?',
      content: 'I keep seeing both let and var being used in JavaScript. What are the differences and when should I use each?',
      author: 'Sarah Johnson',
      time: '5 hours ago',
      answers: 8,
      views: 256,
      isSolved: true,
      tags: ['JavaScript', 'Syntax'],
    },
    {
      id: 3,
      title: 'Help with calculus integration problem',
      content: 'I am stuck on solving this integration problem: ∫(x^2 + 3x + 2)dx. Can someone show me the steps?',
      author: 'Mike Chen',
      time: '1 day ago',
      answers: 3,
      views: 89,
      isSolved: false,
      tags: ['Mathematics', 'Calculus'],
    },
    {
      id: 4,
      title: 'Best practices for React state management?',
      content: 'What are the current best practices for managing state in a large React application? Should I use Context, Redux, or something else?',
      author: 'Emma Davis',
      time: '1 day ago',
      answers: 12,
      views: 342,
      isSolved: false,
      tags: ['React', 'State Management'],
    },
    {
      id: 5,
      title: 'Understanding Newtons Laws of Motion',
      content: 'Can someone explain the practical applications of Newtons three laws of motion with real-world examples?',
      author: 'Alex Brown',
      time: '2 days ago',
      answers: 7,
      views: 178,
      isSolved: true,
      tags: ['Physics', 'Classical Mechanics'],
    },
    {
      id: 6,
      title: 'How to prepare for database design interview?',
      content: 'I have an interview coming up and they mentioned database design. What topics should I focus on?',
      author: 'Lisa Wang',
      time: '3 days ago',
      answers: 15,
      views: 421,
      isSolved: false,
      tags: ['Database', 'Interview', 'Career'],
    },
  ]);

  const [filter, setFilter] = useState('all'); // all, solved, unsolved
  const [searchTerm, setSearchTerm] = useState('');

  // Filter questions
  const filteredQuestions = questions.filter((question) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'solved' && question.isSolved) ||
      (filter === 'unsolved' && !question.isSolved);

    const matchesSearch =
      searchTerm === '' ||
      question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Discussion Board</h1>
            <p className="text-gray-600 mt-1">Ask questions and help your classmates</p>
          </div>
          <button
            onClick={() => navigate('/discussion/ask')}
            className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition duration-200 flex items-center"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Ask Question
          </button>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            {/* Search Bar */}
            <div className="flex-1 md:mr-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search questions or tags..."
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-md font-medium transition duration-200 ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('solved')}
                className={`px-4 py-2 rounded-md font-medium transition duration-200 ${
                  filter === 'solved'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Solved
              </button>
              <button
                onClick={() => setFilter('unsolved')}
                className={`px-4 py-2 rounded-md font-medium transition duration-200 ${
                  filter === 'unsolved'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Unsolved
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
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
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{questions.length}</p>
                <p className="text-sm text-gray-600">Total Questions</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-3">
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
                <p className="text-2xl font-bold text-gray-900">
                  {questions.filter((q) => q.isSolved).length}
                </p>
                <p className="text-sm text-gray-600">Solved</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
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
                <p className="text-2xl font-bold text-gray-900">
                  {questions.filter((q) => !q.isSolved).length}
                </p>
                <p className="text-sm text-gray-600">Unsolved</p>
              </div>
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          {filteredQuestions.length > 0 ? (
            filteredQuestions.map((question) => (
              <QuestionCard key={question.id} question={question} />
            ))
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
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
              <p className="text-gray-600 text-lg">No questions found</p>
              <p className="text-gray-500 text-sm mt-2">
                {searchTerm ? 'Try adjusting your search' : 'Be the first to ask a question!'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Discussion;
