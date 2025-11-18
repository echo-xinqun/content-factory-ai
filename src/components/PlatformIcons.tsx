// 平台Logo图标组件
import React from 'react';

interface PlatformIconProps {
  platformId: string;
  className?: string;
}

export default function PlatformIcon({ platformId, className = "w-4 h-4" }: PlatformIconProps) {
  const getPlatformIcon = () => {
    switch (platformId) {
      case 'xiaohongshu':
        return (
          <svg className={className} viewBox="0 0 24 24" fill="#FF2442">
            <rect width="24" height="24" rx="4" fill="#FF2442"/>
            <path d="M7 8.5C7 7.67 7.67 7 8.5 7S10 7.67 10 8.5 9.33 10 8.5 10 7 9.33 7 8.5zm6 0c0-.83.67-1.5 1.5-1.5S16 7.67 16 8.5 15.33 10 14.5 10 13 9.33 13 8.5zM8 12c0 .55.45 1 1 1h6c.55 0 1-.45 1-1s-.45-1-1-1H9c-.55 0-1 .45-1 1z" fill="white"/>
            <path d="M6 16h12v2H6z" fill="white"/>
            <circle cx="12" cy="6" r="1" fill="white"/>
          </svg>
        );
      case 'wechat':
        return (
          <svg className={className} viewBox="0 0 24 24" fill="#07C160">
            <rect width="24" height="24" rx="4" fill="#07C160"/>
            <g fill="white">
              <circle cx="8" cy="10" r="1.5"/>
              <circle cx="16" cy="10" r="1.5"/>
              <path d="M12 14c-2.21 0-4 1.79-4 4v2h8v-2c0-2.21-1.79-4-4-4z"/>
              <path d="M8 6c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm8 0c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"/>
            </g>
          </svg>
        );
      case 'douyin':
        return (
          <svg className={className} viewBox="0 0 24 24" fill="#000000">
            <rect width="24" height="24" rx="4" fill="#000000"/>
            <g fill="#FE2C55">
              <circle cx="12" cy="8" r="2"/>
              <path d="M10 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2z"/>
              <path d="M8 16h8v2H8z"/>
            </g>
            <path d="M15 4v2.5c1.5.5 2.5 2 2.5 3.5s-1 3-2.5 3.5V16c2.2-.5 4-2.5 4-5s-1.8-4.5-4-5z" fill="white" opacity="0.8"/>
          </svg>
        );
      case 'video':
        return (
          <svg className={className} viewBox="0 0 24 24" fill="#07C160">
            <rect width="24" height="24" rx="4" fill="#07C160"/>
            <g fill="white">
              <circle cx="12" cy="8" r="1.5"/>
              <path d="M8 12l6 3V9l-6 3z"/>
              <rect x="7" y="15" width="10" height="2" rx="1"/>
            </g>
            <text x="12" y="21" textAnchor="middle" fontSize="6" fill="white" fontWeight="bold">视频号</text>
          </svg>
        );
      default:
        return (
          <svg className={className} viewBox="0 0 24 24" fill="#6B7280">
            <rect width="24" height="24" rx="4" fill="#6B7280"/>
            <path d="M8 6l8 6-8 6V6z" fill="white"/>
          </svg>
        );
    }
  };

  return getPlatformIcon();
}