import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
  // Ensure proper chunk loading with unique build ID
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
};

export default nextConfig;
