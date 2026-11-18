import React, { useState } from 'react';
import { User } from '../../types';

// Falls back to initials when the avatar URL is missing or 404s, instead of a broken-image icon.
const PjaAvatar: React.FC<{ user?: User }> = ({ user }) => {
  const [failedUrl, setFailedUrl] = useState<string>();
  const url = user?.avatarUrl;

  if (url && url !== failedUrl) {
    return <img src={url} alt="PJA" className="w-full h-full object-cover" onError={() => setFailedUrl(url)} />;
  }
  return <>{user?.username?.substring(0, 2).toUpperCase() || 'PJA'}</>;
};

export default PjaAvatar;
