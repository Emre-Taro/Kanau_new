import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/",           // トップページ（/）にアクセスが来たら
        destination: "/login", // /login に自動で転送する
        permanent: false,      // 一時的なリダイレクト（ステータスコード 307）
      },
    ];
  },
};

export default nextConfig;
