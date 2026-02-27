import React from 'react';

const WelcomeCard = ({ userName }) => {
  const currentHour = new Date().getHours();
  let greeting = 'Good morning';
  
  if (currentHour >= 12 && currentHour < 17) {
    greeting = 'Good afternoon';
  } else if (currentHour >= 17) {
    greeting = 'Good evening';
  }

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-8 text-white">
      <h1 className="text-3xl font-bold mb-2">
        {greeting}, {userName}! 👋
      </h1>
      <p className="text-blue-100 text-lg">
        Welcome back to Campus Link
      </p>
    </div>
  );
};

export default WelcomeCard;
