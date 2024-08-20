const { withPlugins } = require('next-composed-plugins');

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withPlugins(
  {
    swcMinify: true,
    reactStrictMode: true,
    compiler: {
      emotion: true,
    },
    redirects: async () => [
      { source: '/', destination: '/swap', permanent: false },
      { source: '/mint', destination: '/swap', permanent: false },
    ],
    // NOTE: Unused for now
    transpilePackages: ['planck-demo-contracts'],
  },
  [withBundleAnalyzer],
);
