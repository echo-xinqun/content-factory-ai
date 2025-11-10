'use client';

import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* 顶部导航栏 - 固定在顶部 */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <Header />
      </div>

      {/* 侧边栏 */}
      <Sidebar />

      {/* 主内容区域 */}
      <main className="flex-1 overflow-y-auto pt-16">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}