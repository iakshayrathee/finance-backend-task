/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow cross-origin requests to the backend during development
  async rewrites() {
    return [];
  },
};

export default nextConfig;
