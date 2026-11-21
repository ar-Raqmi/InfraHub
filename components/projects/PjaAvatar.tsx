import React from 'react';
import { User } from '../../types';

interface PjaAvatarProps {
    pja?: User;
    className?: string;
}

const PjaAvatar: React.FC<PjaAvatarProps> = ({ pja, className = 'w-6 h-6 text-[10px]' }) => (
    <div className={`${className} rounded-full bg-ink flex items-center justify-center font-bold text-paper shrink-0 overflow-hidden`}>
        {pja?.avatarUrl ? (
            <img src={pja.avatarUrl} alt={pja.username} className="w-full h-full object-cover" />
        ) : (
            pja?.username?.charAt(0).toUpperCase() || 'P'
        )}
    </div>
);

export default PjaAvatar;
