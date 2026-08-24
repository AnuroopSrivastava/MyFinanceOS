import fs from 'node:fs';

// The codebase uses ESM-style `.js` extensions on TypeScript source imports
// (NodeNext convention from the tsc build of packages/*). This resolver plugin
// intercepts any relative `*.js` specifier and re-points it at its real
// `.ts`/`.tsx` source file so webpack can consume the same sources ``tsc``
// compiles for the workspace packages.
class ResolveJsImportsPlugin {
  apply(resolver) {
    const target = resolver.ensureHook('resolve');
    resolver
      .getHook('resolve')
      .tapAsync('ResolveJsImportsPlugin', (request, resolveContext, callback) => {
        const req = request.request;
        if (req && req.endsWith('.js') && (req.startsWith('./') || req.startsWith('../'))) {
          for (const ext of ['.tsx', '.ts']) {
            const candidate = req.slice(0, -3) + ext;
            try {
              if (fs.existsSync(resolver.join(request.path || '', candidate))) {
                return resolver.doResolve(
                  target,
                  { ...request, request: candidate },
                  null,
                  resolveContext,
                  callback
                );
              }
            } catch { /* fall through */ }
          }
        }
        callback();
      });
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  transpilePackages: [
    '@financeos/ui',
    '@financeos/shared',
    '@financeos/database',
    '@financeos/auth',
  ],

  webpack(config, { isServer }) {
    config.resolve.plugins = config.resolve.plugins || [];
    config.resolve.plugins.push(new ResolveJsImportsPlugin());
    if (!isServer) {
      config.output.globalObject = 'self';
    }
    return config;
  },
};

export default nextConfig;
