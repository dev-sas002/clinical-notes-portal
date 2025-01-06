/** @type {import('next').NextConfig} */
const nextConfig = {
  // Emits a self-contained server bundle, which is what the runtime Docker
  // stage copies - no node_modules in the final image.
  output: "standalone",
  // Type and lint errors fail the build. They used to be suppressed, which
  // is how eight real type errors survived in the tree.
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ["app", "src"],
  },
  images: {
    unoptimized: true,
  },
  poweredByHeader: false,
}

export default nextConfig
