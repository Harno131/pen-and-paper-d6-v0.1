/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  // Deaktiviere statisches Rendering für Seiten mit localStorage
  output: 'standalone',
}

module.exports = nextConfig

