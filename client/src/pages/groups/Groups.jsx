import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Mock data for study groups
const mockGroups = [
  {
    id: 1,
    name: 'Computer Science Study Group',
    subject: 'Computer Science',
    description: 'Weekly study sessions for CS courses, algorithm practice, and project collaboration',
    members: 24,
    isJoined: true,
    color: 'blue',
  },
  {
    id: 2,
    name: 'Mathematics Study Group',
    subject: 'Mathematics',
    description: 'Calculus, Linear Algebra, and Discrete Math help sessions',
    members: 18,
    isJoined: true,
    color: 'green',
  },
  {
    id: 3,
    name: 'Physics Lab Partners',
    subject: 'Physics',
    description: 'Lab report discussions and exam preparation',
    members: 15,
    isJoined: false,
    color: 'purple',
  },
  {
    id: 4,
    name: 'Web Development Team',
    subject: 'Web Development',
    description: 'Learn React, Node.js, and full-stack development together',
    members: 32,
    isJoined: false,
    color: 'indigo',
  },
  {
    id: 5,
    name: 'Data Science Club',
    subject: 'Data Science',
    description: 'Machine Learning, Python, and data analysis projects',
    members: 28,
    isJoined: false,
    color: 'pink',
  },
  {
    id: 6,
    name: 'English Literature Circle',
    subject: 'Literature',
    description: 'Book discussions and essay writing workshops',
    members: 12,
    isJoined: false,
    color: 'yellow',
  },
  {
    id: 7,
    name: 'Chemistry Lab Group',
    subject: 'Chemistry',
    description: 'Organic and Inorganic Chemistry study sessions',
    members: 20,
    isJoined: false,
    color: 'red',
  },
  {
    id: 8,
    name: 'Business Analytics Team',
    subject: 'Business',
    description: 'Case studies and business strategy discussions',
    members: 16,
    isJoined: false,
    color: 'teal',
  },
];

const colorClasses = {
  blue: 'from-blue-500 to-blue-600',
  green: 'from-green-500 to-green-600',
  purple: 'from-purple-500 to-purple-600',
  indigo: 'from-indigo-500 to-indigo-600',
  pink: 'from-pink-500 to-pink-600',
  yellow: 'from-yellow-500 to-yellow-600',
  red: 'from-red-500 to-red-600',
  teal: 'from-teal-500 to-teal-600',
};

const Groups = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState(mockGroups);
  const [filter, setFilter] = useState('all'); // 'all', 'joined', 'available'

  const handleJoinGroup = (groupId) => {
    setGroups(groups.map(group => 
      group.id === groupId 
        ? { ...group, isJoined: !group.isJoined, members: group.isJoined ? group.members - 1 : group.members + 1 }
        : group
    ));
  };

  const handleViewGroup = (groupId) => {
    navigate(`/groups/${groupId}`);
  };

  const filteredGroups = groups.filter(group => {
    if (filter === 'joined') return group.isJoined;
    if (filter === 'available') return !group.isJoined;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Study Groups</h1>
              <p className="text-gray-600 mt-1">Join groups and collaborate with your peers</p>
            </div>
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-200 font-semibold">
              + Create Group
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-4 mt-6">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition duration-200 ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All Groups
            </button>
            <button
              onClick={() => setFilter('joined')}
              className={`px-4 py-2 rounded-lg font-medium transition duration-200 ${
                filter === 'joined'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              My Groups
            </button>
            <button
              onClick={() => setFilter('available')}
              className={`px-4 py-2 rounded-lg font-medium transition duration-200 ${
                filter === 'available'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Available
            </button>
          </div>
        </div>
      </div>

      {/* Groups Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group) => (
            <div
              key={group.id}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition duration-300 overflow-hidden"
            >
              {/* Group Header */}
              <div className={`h-32 bg-gradient-to-r ${colorClasses[group.color]} p-6 flex items-center justify-between`}>
                <div>
                  <h3 className="text-white text-xl font-bold mb-2">{group.name}</h3>
                  <span className="bg-white bg-opacity-30 text-white text-xs px-3 py-1 rounded-full font-medium">
                    {group.subject}
                  </span>
                </div>
              </div>

              {/* Group Body */}
              <div className="p-6">
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {group.description}
                </p>

                {/* Members Info */}
                <div className="flex items-center text-gray-700 mb-4">
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
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <span className="text-sm font-medium">{group.members} members</span>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleViewGroup(group.id)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition duration-200 font-medium"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleJoinGroup(group.id)}
                    className={`flex-1 py-2 px-4 rounded-lg transition duration-200 font-medium ${
                      group.isJoined
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {group.isJoined ? 'Leave' : 'Join'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredGroups.length === 0 && (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-16 w-16 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No groups found</h3>
            <p className="mt-2 text-sm text-gray-500">
              Try adjusting your filter or create a new group
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Groups;
