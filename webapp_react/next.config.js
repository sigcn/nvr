const nextConfig = {
  reactStrictMode: true,
  // output: 'standalone',
  output: 'export', // Outputs a Single-Page Application (SPA).
  distDir: './dist', // Changes the build output directory to `./dist/`.
  publicRuntimeConfig: {
    BASE_URL: process.env.BASE_URL,
  },
  compress: false,
  images: {unoptimized: true},
}

module.exports = nextConfig
