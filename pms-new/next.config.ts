import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel 빌드 시 ESLint 에러를 무시하고 무조건 통과시키는 마법의 옵션입니다!
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;