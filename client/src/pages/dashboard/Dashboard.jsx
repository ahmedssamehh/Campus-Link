import React from 'react';

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          Campus Link Dashboard
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              💬 Messages
            </h2>
            <p className="text-gray-600">
              Connect with your classmates and professors
            </p>
            <div className="mt-4 text-3xl font-bold text-blue-600">
              12
            </div>
            <p className="text-sm text-gray-500">Unread messages</p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              👥 Groups
            </h2>
            <p className="text-gray-600">
              Join study groups and project teams
            </p>
            <div className="mt-4 text-3xl font-bold text-green-600">
              5
            </div>
            <p className="text-sm text-gray-500">Active groups</p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              🔔 Notifications
            </h2>
            <p className="text-gray-600">
              Stay updated with campus activities
            </p>
            <div className="mt-4 text-3xl font-bold text-purple-600">
              8
            </div>
            <p className="text-sm text-gray-500">New notifications</p>
          </div>

          {/* Card 4 */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              💡 Discussions
            </h2>
            <p className="text-gray-600">
              Ask questions and share knowledge
            </p>
            <div className="mt-4 text-3xl font-bold text-orange-600">
              24
            </div>
            <p className="text-sm text-gray-500">Active discussions</p>
          </div>

          {/* Card 5 */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              📅 Events
            </h2>
            <p className="text-gray-600">
              Upcoming campus events and deadlines
            </p>
            <div className="mt-4 text-3xl font-bold text-pink-600">
              3
            </div>
            <p className="text-sm text-gray-500">This week</p>
          </div>

          {/* Card 6 */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              📚 Resources
            </h2>
            <p className="text-gray-600">
              Access study materials and resources
            </p>
            <div className="mt-4 text-3xl font-bold text-teal-600">
              45
            </div>
            <p className="text-sm text-gray-500">Available resources</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
