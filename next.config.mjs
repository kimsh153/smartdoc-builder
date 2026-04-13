/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  turbopack: {
    resolveAlias: {
      // SSR 환경에서 fflate Node Worker 오류 방지
      // browser 번들은 실제 패키지, server 번들은 빈 스텁 사용
      'html2pdf.js': {
        browser: 'html2pdf.js',
        default: './lib/html2pdf-stub.js',
      },
      'jspdf': {
        browser: 'jspdf',
        default: './lib/jspdf-stub.js',
      },
      'html2canvas': {
        browser: 'html2canvas',
        default: './lib/html2canvas-stub.js',
      },
    },
  },
}

export default nextConfig
