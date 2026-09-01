import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "a3-sd-bucket.s3.us-east-005.backblazeb2.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
