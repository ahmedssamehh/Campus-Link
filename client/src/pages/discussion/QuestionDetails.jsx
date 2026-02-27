import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AnswerCard from '../../components/discussion/AnswerCard';

const QuestionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Mock data for the question
  const [question] = useState({
    id: parseInt(id),
    title: 'How do I implement recursion in JavaScript?',
    content: `I am having trouble understanding how recursion works in JavaScript. 

I understand that a recursive function calls itself, but I'm confused about:
1. When to use recursion vs. iteration
2. How to avoid infinite loops
3. What is the base case and why is it important

Can someone explain with practical examples? Maybe show me how to calculate factorial using recursion?

Any help would be appreciated!`,
    author: 'John Doe',
    time: '2 hours ago',
    views: 124,
    tags: ['JavaScript', 'Programming', 'Recursion'],
    isSolved: true,
  });

  // Mock data for answers
  const [answers, setAnswers] = useState([
    {
      id: 1,
      content: `Great question! Let me explain recursion with a factorial example.

A recursive function has two parts:
1. Base case: The condition that stops recursion
2. Recursive case: Where the function calls itself

Here's a factorial example:

function factorial(n) {
  // Base case
  if (n === 0 || n === 1) {
    return 1;
  }
  // Recursive case
  return n * factorial(n - 1);
}

console.log(factorial(5)); // Output: 120

The key is that each recursive call reduces the problem to a smaller version until it reaches the base case.`,
      author: 'Sarah Johnson',
      time: '1 hour ago',
      upvotes: 15,
      isAccepted: true,
    },
    {
      id: 2,
      content: `To add to the previous answer, here are some tips:

1. Always define a base case first
2. Make sure each recursive call moves toward the base case
3. Use recursion when the problem naturally breaks into smaller subproblems
4. Consider iteration if you need better performance (recursion uses more memory)

For avoiding infinite loops, always ensure your recursive call changes the parameter in a way that eventually satisfies the base case.`,
      author: 'Mike Chen',
      time: '45 minutes ago',
      upvotes: 8,
      isAccepted: false,
    },
    {
      id: 3,
      content: `Here's another practical example - calculating Fibonacci numbers:

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

This shows how recursion can elegantly solve problems that have a recursive structure.`,
      author: 'Emma Davis',
      time: '30 minutes ago',
      upvotes: 5,
      isAccepted: false,
    },
  ]);

  const [answerText, setAnswerText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitAnswer = (e) => {
    e.preventDefault();

    if (!answerText.trim()) return;

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      const newAnswer = {
        id: answers.length + 1,
        content: answerText,
        author: user?.name || 'You',
        time: 'just now',
        upvotes: 0,
        isAccepted: false,
      };

      setAnswers([...answers, newAnswer]);
      setAnswerText('');
      setIsSubmitting(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/discussion')}
          className="flex items-center text-blue-600 hover:text-blue-700 font-medium mb-6 transition duration-200"
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
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">{question.title}</h1>
            {question.isSolved && (
              <span className="ml-4 bg-green-100 text-green-700 text-sm font-semibold px-4 py-2 rounded-full flex items-center">
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
                  {question.author.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{question.author}</p>
                <p className="text-xs text-gray-500">Asked {question.time}</p>
              </div>
            </div>
            <div className="flex items-center text-gray-600 ml-auto">
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
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              <span className="text-sm">{question.views} views</span>
            </div>
          </div>

          <div className="prose max-w-none mb-6">
            <p className="text-gray-800 whitespace-pre-line">{question.content}</p>
          </div>

          {question.tags && question.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {question.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-700 text-sm font-medium px-3 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Answers Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}
          </h2>
          <div className="space-y-4">
            {answers.map((answer) => (
              <AnswerCard key={answer.id} answer={answer} isAccepted={answer.isAccepted} />
            ))}
          </div>
        </div>

        {/* Answer Form */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Your Answer</h3>
          <form onSubmit={handleSubmitAnswer}>
            <textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Write your answer here..."
              rows={8}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 resize-none"
              disabled={isSubmitting}
            />
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">
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
