import React from 'react';

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-20 h-20 text-2xl',
};

const gradients = [
  'from-blue-500 to-purple-500',
  'from-green-500 to-teal-500',
  'from-orange-500 to-red-500',
  'from-pink-500 to-rose-500',
  'from-indigo-500 to-blue-500',
  'from-yellow-400 to-orange-500',
  'from-cyan-500 to-blue-500',
  'from-violet-500 to-purple-500',
];

function getGradient(name) {
  if (!name) return gradients[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

const UserAvatar = ({
  name = '',
  profilePhoto = '',
  size = 'md',
  className = '',
  border = true,
}) => {
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const borderClass = border ? 'border border-gray-300 dark:border-gray-600' : '';
  const initial = (name || '?').charAt(0).toUpperCase();
  const gradient = getGradient(name);

  if (profilePhoto) {
    return (
      <img
        src={profilePhoto}
        alt={name}
        className={`${sizeClass} rounded-full object-cover flex-shrink-0 ${borderClass} ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} bg-gradient-to-br ${gradient} rounded-full flex items-center justify-center flex-shrink-0 ${className}`}
    >
      <span className="text-white font-semibold">{initial}</span>
    </div>
  );
};

export default UserAvatar;
