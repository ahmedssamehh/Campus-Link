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
  'bg-blue-600',
  'bg-sky-500',
  'bg-indigo-500',
  'bg-blue-600',
  'bg-cyan-500',
  'bg-slate-600',
  'bg-blue-600',
  'bg-sky-500',
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
  const borderClass = border ? 'ring-2 ring-white' : '';
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
      className={`${sizeClass} ${gradient} rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${className}`}
    >
      <span className="text-white font-semibold">{initial}</span>
    </div>
  );
};

export default UserAvatar;
