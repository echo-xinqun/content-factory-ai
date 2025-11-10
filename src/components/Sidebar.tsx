'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  SearchIcon,
  PenToolIcon,
  ClipboardListIcon,
  HistoryIcon
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen pt-16">
      <nav className="px-4 py-6">
        <ul className="space-y-2">
          {/* Dashboard */}
          <li>
            <Link
              href="/"
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                isActive('/')
                  ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <HomeIcon className="mr-3 h-5 w-5" />
              仪表盘
            </Link>
          </li>

          {/* Topic Analysis */}
          <li>
            <Link
              href="/analysis"
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                isActive('/analysis')
                  ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <SearchIcon className="mr-3 h-5 w-5" />
              选题分析
            </Link>
          </li>

          {/* Historical Topics */}
          <li>
            <Link
              href="/historical-topics"
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                isActive('/historical-topics')
                  ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <HistoryIcon className="mr-3 h-5 w-5" />
              历史选题
            </Link>
          </li>

          {/* Other Menu Items */}
          <li>
            <Link
              href="/create"
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                isActive('/create')
                  ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <PenToolIcon className="mr-3 h-5 w-5" />
              内容创作
            </Link>
          </li>

          <li>
            <Link
              href="/publish"
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                isActive('/publish')
                  ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <ClipboardListIcon className="mr-3 h-5 w-5" />
              发布管理
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}