/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.second.me',
      },
    ],
  },
}

module.exports = nextConfig
