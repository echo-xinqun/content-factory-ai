import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '内容工厂',
  description: '智能内容创作与发布管理平台',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="font-sans">{children}</body>
    </html>
  )
}