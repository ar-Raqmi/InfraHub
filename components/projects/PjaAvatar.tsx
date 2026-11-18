import React from 'react';
import { User } from '../../types';

interface PjaAvatarProps {
    pja?: User;
    className?: string;
}

const PjaAvatar: React.FC<PjaAvatarProps> = ({ pja, className = 'w-6 h-6 text-[10px]' }) => (
    <div className={`${className} rounded-full bg-emerald-500 flex items-center justify-center font-black text-white shrink-0 overflow-hidden shadow-sm`}>
        {pja?.avatarUrl ? (
            <img src={pja.avatarUrl} alt={pja.username} className="w-full h-full object-cover" />
        ) : (
            pja?.username?.charAt(0).toUpperCase() || 'P'
        )}
    </div>
);

export default PjaAvatar;
