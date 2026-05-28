import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Ngăn clickjacking
          { key: "X-Frame-Options", value: "DENY" },
          // Ngăn MIME sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Kiểm soát referrer
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Ngăn XSS cơ bản
          { key: "X-XSS-Protection", value: "1; mode=block" },
          // Permissions Policy
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()"
          },
        ],
      },
    ];
  },
};

export default nextConfig;
