/**
 * RootLayout — 统一门户根布局。
 *
 * 包含：
 * - 顶部导航栏（Navbar）
 * - 主内容区（min-h-screen 确保页脚始终在底部）
 * - 底部页脚（Footer）
 */

import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import "./globals.css";

/**
 * IBM Plex Sans — 落地 DESIGN.md 的 Kraken 双字体体系：
 * - Display（标题）：Kraken-Brand 回退 = IBM Plex Sans 700 + 负字距
 * - Body（正文/UI）：Kraken-Product 回退 = IBM Plex Sans 400-600
 *
 * next/font 会在构建期下载并自托管字体（不依赖运行时外网），
 * 变量 --font-plex 注入 <html>，globals.css 中的 --font-display/
 * --font-body 直接引用它。
 */
const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex",
  display: "swap",
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
    <html lang="zh-CN" className={ibmPlexSans.variable}>
      <body className="antialiased">
        {/* 无障碍跳转链接：键盘用户可跳过导航直接到主内容（WCAG 2.4.1） */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-kraken focus:px-4 focus:py-2 focus:text-white"
        >
          跳到主内容
        </a>

        {/* 顶部导航 */}
        <Navbar />

        {/* 主内容区域（PageTransition 提供页面切换淡入过渡） */}
        <main id="main-content" className="min-h-[calc(100vh-8rem)]">
          <PageTransition>{children}</PageTransition>
        </main>

        {/* 底部页脚 */}
        <Footer />
      </body>
    </html>
  );
}
