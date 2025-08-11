/** @type {import('next').NextConfig} */
const nextConfig = {
  // ESSENCIAL: Gerar pasta standalone para Docker
  output: 'standalone',
  
  // Configurações de imagem
  images: {
    unoptimized: true,
    domains: ['localhost', 'www.centralretencao.com.br']
  },
  
  // Desabilitar telemetria
  experimental: {
    instrumentationHook: false
  },
  
  // Configurações básicas
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  
  // ESLint e TypeScript
  eslint: {
    ignoreDuringBuilds: false
  },
  typescript: {
    ignoreBuildErrors: false
  }
}

export default nextConfig
