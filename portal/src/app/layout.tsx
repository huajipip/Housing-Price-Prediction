/**
 * RootLayout — 统一门户根布局。
 *
 * 包含：
 * - 顶部导航栏（Navbar）
 * - 主内容区（min-h-screen 确保页脚始终在底部）
 * - 底部页脚（Footer）
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Housing Price Portal",
  description: "统一房价预测门户 — 房源估值 + 市场分析",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* 顶部导航 */}
        <Navbar />

        {/* 主内容区域 */}
        <main className="min-h-[calc(100vh-8rem)]">{children}</main>

        {/* 底部页脚 */}
        <Footer />
      </body>
    </html>
  );
}
