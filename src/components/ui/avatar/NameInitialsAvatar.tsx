import React from 'react';

interface NameInitialsAvatarProps {
  firstName: string;
  lastName: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export default function NameInitialsAvatar({ 
  firstName, 
  lastName, 
  size = 'md',
  className = '' 
}: NameInitialsAvatarProps) {
  const getInitials = () => {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return first + last;
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-8 h-8 text-sm';
      case 'md':
        return 'w-10 h-10 text-base';
      case 'lg':
        return 'w-12 h-12 text-lg';
      case 'xl':
        return 'w-16 h-16 text-xl';
      default:
        return 'w-10 h-10 text-base';
    }
  };

  const getBackgroundColor = () => {
    // Generate a consistent color based on the name
    const name = (firstName + lastName).toLowerCase();
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-red-500',
      'bg-yellow-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-cyan-500'
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  return (
    <div 
      className={`
        ${getSizeClasses()} 
        ${getBackgroundColor()}
        rounded-full 
        flex 
        items-center 
        justify-center 
        text-white 
        font-semibold 
        shadow-sm
        ${className}
      `}
      title={`${firstName} ${lastName}`}
    >
      {getInitials()}
    </div>
  );
}
