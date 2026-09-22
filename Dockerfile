FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-bookworm-slim AS build
WORKDIR /app
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
# next.config.ts's rewrites() reads this to build the /api, /uploads, and /socket.io
# proxy destinations — and despite being a plain server-side env var (not a
# NEXT_PUBLIC_* one), its value gets resolved and baked into the build output here,
# NOT re-read from the environment when the runner stage's `next start` boots up.
# Setting it only at runtime (e.g. in docker-compose.prod.yml's `environment:`) has no
# effect — confirmed by building with one value and starting with another: the
# build-time value always wins. Must be passed as a build ARG.
ARG BACKEND_INTERNAL_URL
ENV BACKEND_INTERNAL_URL=$BACKEND_INTERNAL_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY package.json next.config.ts ./
EXPOSE 3000
CMD ["npm", "start"]
