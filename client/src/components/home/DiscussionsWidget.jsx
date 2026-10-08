import React from 'react';
import { Link } from 'react-router-dom';
import { CheckIcon, HelpIcon } from '../ui/Icons';
import { Tile, TileAction, TileEmpty, TileSkeleton } from './Tile';

/** The most-voted questions on the Q&A board. */
const DiscussionsWidget = ({ loading, questions = [], className, index }) => (
  <Tile index={index}
    label="Popular on Q&A"
    Icon={HelpIcon}
    tone="orange"
    className={className}
    action={<TileAction to="/discussion/ask">Ask a question</TileAction>}
  >
    {loading ? (
      <TileSkeleton rows={3} />
    ) : questions.length === 0 ? (
      <TileEmpty Icon={HelpIcon} title="No questions yet">
        Be the first to ask your classmates something.
      </TileEmpty>
    ) : (
      <ol className="divide-y divide-gray-100">
        {questions.slice(0, 4).map((q) => (
          <li key={q._id}>
            <Link
              to={`/discussion/${q._id}`}
              className="press -mx-2 flex items-start gap-4 rounded-xl px-2 py-3 transition-colors hover:bg-black/[0.03]"
            >
              <span className="w-9 flex-shrink-0 pt-0.5 text-center">
                <span className="block text-[17px] font-semibold leading-none tabular-nums text-gray-900">
                  {q.votes || 0}
                </span>
                <span className="mt-1 block text-[11px] text-gray-400">votes</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 text-[15px] font-medium leading-snug text-gray-900">
                  {q.title}
                </span>
                <span className="mt-1 flex flex-wrap items-center gap-x-2 text-[13px] text-gray-500">
                  {q.tags?.[0] && <span>{q.tags[0]}</span>}
                  {q.tags?.[0] && <span aria-hidden>·</span>}
                  <span>
                    {q.answersCount || 0} answer{q.answersCount === 1 ? '' : 's'}
                  </span>
                  {q.isSolved && (
                    <span className="inline-flex items-center gap-0.5 font-medium text-green-600">
                      <CheckIcon className="h-3.5 w-3.5" strokeWidth={2.6} />
                      Solved
                    </span>
                  )}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    )}
  </Tile>
);

export default DiscussionsWidget;
