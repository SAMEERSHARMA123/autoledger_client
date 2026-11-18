import type { NextConfig } from "next";

const devOrigins = ["localhost"];
if (process.env.DEV_ORIGIN) {
  devOrigins.push(process.env.DEV_ORIGIN);
}

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins: devOrigins,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
