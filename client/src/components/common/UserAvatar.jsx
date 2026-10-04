import React, { useState } from 'react';
import { getMediaUrl } from '../../utils/media';

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-20 h-20 text-2xl',
};

const gradients = [
  'from-blue-500 to-blue-700',
  'from-sky-400 to-blue-600',
  'from-indigo-500 to-blue-800',
  'from-blue-400 to-indigo-600',
  'from-cyan-500 to-blue-600',
  'from-slate-600 to-blue-900',
  'from-blue-600 to-indigo-900',
  'from-sky-500 to-indigo-600',
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
  const [imgError, setImgError] = useState(false);
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const borderClass = border ? 'ring-2 ring-white dark:ring-gray-800' : '';
  const initial = (name || '?').charAt(0).toUpperCase();
  const gradient = getGradient(name);

  if (profilePhoto && !imgError) {
    return (
      <img
        src={getMediaUrl(profilePhoto)}
        alt={name}
        className={`${sizeClass} rounded-full object-cover flex-shrink-0 ${borderClass} ${className}`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} bg-gradient-to-br ${gradient} rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${className}`}
    >
      <span className="text-white font-semibold">{initial}</span>
    </div>
  );
};

export default UserAvatar;
