import React from 'react';
import { Shield, User as UserIcon } from 'lucide-react';
import { User, Role } from '../../types';

interface UserAvatarProps {
  user: User;
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ user, className = 'w-12 h-12 rounded-2xl' }) => (
  <div className={`${className} flex items-center justify-center shadow-lg text-white shrink-0 overflow-hidden ${user.role === Role.ADMIN ? 'bg-gradient-to-br from-teal-500 to-emerald-600' : 'bg-gradient-to-br from-blue-400 to-cyan-500'}`}>
    {user.avatarUrl ? (
      <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
    ) : (
      user.role === Role.ADMIN ? <Shield className="w-6 h-6" /> : <UserIcon className="w-6 h-6" />
    )}
  </div>
);

export default UserAvatar;
