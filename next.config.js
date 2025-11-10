/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // If deploying to username.github.io/repo-name, set basePath
  // basePath: '/problemsiteV3',
  // assetPrefix: '/problemsiteV3/',
};

module.exports = nextConfig;

