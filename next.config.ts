import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      // Our own S3 buckets, named explicitly. A "**.s3.ap-south-1.amazonaws.com"
      // wildcard here would let the image optimizer fetch and re-serve from ANY
      // bucket in the region — including buckets we don't own — turning this app
      // into an open image proxy for third-party content.
      {
        protocol: "https",
        hostname: "ai-marketplace-listing-images.s3.ap-south-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "ai-marketplace-listing-pdfs.s3.ap-south-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "aikart-listing-images-840928784470.s3.ap-south-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "s3.ap-south-1.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;
