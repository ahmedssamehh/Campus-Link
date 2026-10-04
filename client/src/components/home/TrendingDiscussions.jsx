import React from 'react';
import { Link } from 'react-router-dom';
import { CardShell } from './YourGroups';
import { CheckIcon, ChevronUpIcon, HelpIcon } from '../ui/Icons';

const TrendingDiscussions = ({ questions, loading }) => (
  <CardShell
    title="Trending discussions"
    action={
      <Link to="/discussion/ask" className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400">
        Ask a question
      </Link>
    }
  >
    {loading ? (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex animate-pulse items-center gap-3 py-2">
            <div className="h-12 w-11 rounded-xl bg-gray-100 dark:bg-gray-700" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-3/4 rounded bg-gray-100 dark:bg-gray-700" />
              <div className="h-3 w-1/3 rounded bg-gray-100 dark:bg-gray-700" />
            </div>
          </div>
        ))}
      </div>
    ) : questions.length === 0 ? (
      <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
          <HelpIcon className="h-6 w-6" />
        </span>
        <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">No discussions yet</p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Be the first to ask your classmates something.</p>
      </div>
    ) : (
      <ul className="divide-y divide-gray-100 dark:divide-gray-700/60">
        {questions.slice(0, 3).map((q) => (
          <li key={q._id}>
            <Link
              to={`/discussion/${q._id}`}
              className="-mx-2 flex items-start gap-3 rounded-xl px-2 py-3 transition hover:bg-gray-50 dark:hover:bg-gray-700/40"
            >
              <span className="flex h-12 w-11 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20">
                <ChevronUpIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
                <span className="text-sm font-bold tabular-nums leading-none">{q.votes || 0}</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-gray-900 dark:text-white">{q.title}</span>
                <span className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  {q.tags?.[0] && (
                    <span className="rounded-md bg-gray-100 px-2 py-0.5 font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                      {q.tags[0]}
                    </span>
                  )}
                  <span>
                    {q.answersCount || 0} answer{q.answersCount === 1 ? '' : 's'}
                  </span>
                  {q.isSolved && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                      <CheckIcon className="h-3 w-3" strokeWidth={3} />
                      Solved
                    </span>
                  )}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    )}
  </CardShell>
);

export default TrendingDiscussions;
