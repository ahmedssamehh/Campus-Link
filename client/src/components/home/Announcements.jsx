import React from 'react';

const Announcements = ({ announcements }) => {
  if (!announcements || announcements.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Latest Announcements</h2>
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">No announcements yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Latest Announcements</h2>
        <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
          {announcements.length} new
        </span>
      </div>
      <div className="space-y-4">
        {announcements.map((announcement) => (
          <div
            key={announcement.id}
            className="border-l-4 border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-r-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition duration-200"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {announcement.groupName}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
                  {announcement.text}
                </p>
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <svg
                    className="h-4 w-4 mr-1"
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
                  {announcement.time}
                </div>
              </div>
              {announcement.isImportant && (
                <span className="ml-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-semibold px-2 py-1 rounded">
                  Important
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Announcements;
