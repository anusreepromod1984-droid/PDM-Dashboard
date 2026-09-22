import path from "path";
import type { NextConfig } from "next";

// Where the Next.js SERVER process (not the browser) reaches the backend to proxy
// /api, /uploads, and /socket.io through — see the rewrites() comment below for why
// this matters. Defaults to the sibling dev process on localhost; docker-compose.prod.yml
// overrides this to the "backend" service's Compose-internal DNS name, since "localhost"
// inside the frontend container would otherwise resolve to itself, not the backend
// container. Deliberately NOT a NEXT_PUBLIC_* var — this is a server-only address the
// browser never needs to know.
const BACKEND_INTERNAL_URL = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8004";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  allowedDevOrigins: ["*.ngrok-free.dev", "*.ngrok-free.app", "*.ngrok.io", "172.16.1.199", "localhost:3000"],
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      // Uploaded assets (currently just per-company floor-plan images, see
      // backend/src/http/server.ts's /uploads static mount) — same single-origin
      // reasoning as /api above, so an `${API_URL}${path}` src (API_URL empty in this
      // dev setup) resolves through this proxy instead of 404ing against Next itself.
      { source: "/uploads/:path*", destination: `${BACKEND_INTERNAL_URL}/uploads/:path*` },
      // Backend's Socket.IO/Engine.IO only answers on a trailing slash — these two
      // exact rules hardcode it in the destination so an empty :path* can't strip it.
      { source: "/socket.io", destination: `${BACKEND_INTERNAL_URL}/socket.io/` },
      { source: "/socket.io/", destination: `${BACKEND_INTERNAL_URL}/socket.io/` },
      // :path+ (one-or-more) never matches empty, so it can't hit the same collapse bug.
      { source: "/socket.io/:path+", destination: `${BACKEND_INTERNAL_URL}/socket.io/:path+` },
    ];
  },
};

export default nextConfig;
