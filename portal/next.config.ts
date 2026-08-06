import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // standalone 输出模式：生成自包含的 Node.js 服务，用于 Docker 部署
  output: "standalone",
};

export default nextConfig;
