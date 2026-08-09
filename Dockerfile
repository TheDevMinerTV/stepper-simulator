FROM node:24-alpine AS builder
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install

COPY data ./data
COPY .prettierrc .prettierrc

COPY . .
RUN pnpm data:update-stepper-db

ARG VITE_BASE_URL=https://stepper-sim.devminer.xyz
ENV VITE_BASE_URL=$VITE_BASE_URL
RUN pnpm build

####
# The app is still a static SPA; the server exists so crawlers get per-link OpenGraph tags and a
# rendered torque graph, neither of which a JS-less crawler could ever get from the SPA itself
FROM node:24-alpine
WORKDIR /app

# curl for healthchecks. The OG image rasterizer has no CSS engine and no webfonts: it renders
# with whatever fonts the system provides, so one has to be installed (see OG_FONT_FAMILY)
RUN apk add --no-cache curl font-dejavu

COPY --from=builder /app/.output ./.output

ARG VITE_BASE_URL=https://stepper-sim.devminer.xyz
# Absolute URLs in the OpenGraph tags; override at runtime when the public origin differs from
# the one the request arrives with
ENV PUBLIC_BASE_URL=$VITE_BASE_URL
ENV OG_FONT_FAMILY="DejaVu Sans"
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
