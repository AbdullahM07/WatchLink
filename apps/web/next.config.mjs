/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Compile the workspace shared package from source.
  transpilePackages: ['@watchlink/shared'],
  eslint: {
    // We run lint separately; don't fail production builds on lint.
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
};

export default nextConfig;
