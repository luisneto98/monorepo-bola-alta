/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // O monorepo é a raiz do build — evita o Next subir demais procurando lockfile.
  outputFileTracingRoot: new URL('../..', import.meta.url).pathname,
  async rewrites() {
    // Em dev o Next faz proxy para a API, assim o cookie httpOnly fica no
    // mesmo domínio (localhost:3000) e o front não precisa de CORS.
    // Em produção o Traefik é quem roteia /api para o container da API.
    return process.env.NODE_ENV === 'development'
      ? [
          {
            source: '/api/:path*',
            destination: `${process.env.API_URL ?? 'http://localhost:3334'}/api/:path*`,
          },
        ]
      : [];
  },
};

export default nextConfig;
