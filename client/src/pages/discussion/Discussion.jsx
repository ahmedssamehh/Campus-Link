import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import QuestionCard from '../../components/discussion/QuestionCard';
import PageHeader from '../../components/layout/PageHeader';
import { CheckIcon, ClockIcon, HelpIcon, PlusIcon, SearchIcon } from '../../components/ui/Icons';

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

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'solved', label: 'Solved' },
    { key: 'unsolved', label: 'Unsolved' },
    { key: 'mine', label: `Mine (${myQuestionsCount})` },
  ];

  const stats = [
    { label: 'Total questions', value: questions.length, Icon: HelpIcon, tone: 'from-blue-400 to-blue-600' },
    { label: 'Solved', value: solvedCount, Icon: CheckIcon, tone: 'from-emerald-400 to-emerald-600' },
    { label: 'Open', value: unsolvedCount, Icon: ClockIcon, tone: 'from-sky-400 to-blue-500' },
  ];

  return (
    <div className="bg-grid-soft min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-gray-50 pb-24 pt-6 dark:bg-gray-900 md:pb-10 md:pt-8">
      <div className="mx-auto min-w-0 max-w-5xl px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="Q&A board"
          subtitle="Ask questions and help your classmates"
          actions={
            <button
              type="button"
              onClick={() => navigate('/discussion/ask')}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 px-4 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5"
            >
              <PlusIcon className="h-4 w-4" />
              Ask a question
            </button>
          }
        />

        {/* Stats */}
        <div className="mb-5 grid min-w-0 grid-cols-3 gap-3 sm:gap-4">
          {stats.map(({ label, value, Icon, tone }) => (
            <div
              key={label}
              className="flex min-w-0 items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-card dark:border-gray-700/60 dark:bg-gray-800 sm:p-4"
            >
              <span className={`hidden h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${tone} text-white shadow-sm sm:flex`}>
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xl font-bold tabular-nums text-gray-900 dark:text-white sm:text-2xl">{value}</p>
                <p className="truncate text-xs text-gray-500 dark:text-gray-400 sm:text-sm">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search and filter */}
        <div className="mb-5 flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search questions or tags…"
              className="h-11 w-full min-w-0 rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-base shadow-sm transition placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/15 dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:text-sm"
            />
          </div>
          <div className="inline-flex max-w-full overflow-x-auto rounded-2xl border border-gray-200/80 bg-white p-1 shadow-sm no-scrollbar dark:border-gray-700 dark:bg-gray-800">
            {filters.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`flex-shrink-0 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                  filter === f.key
                    ? 'bg-blue-600 text-white shadow-glow'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Questions list */}
        <div className="space-y-3">
          {loading ? (
            [0, 1, 2].map((i) => (
              <div key={i} className="h-36 animate-pulse rounded-2xl border border-gray-100 bg-white dark:border-gray-700/60 dark:bg-gray-800" />
            ))
          ) : error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
              {error}
            </div>
          ) : filteredQuestions.length > 0 ? (
            filteredQuestions.map((question) => <QuestionCard key={question._id} question={question} />)
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white/60 px-6 py-16 text-center dark:border-gray-700 dark:bg-gray-800/40">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
                <HelpIcon className="h-7 w-7" />
              </span>
              <p className="mt-4 text-base font-semibold text-gray-900 dark:text-white">No questions found</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
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
