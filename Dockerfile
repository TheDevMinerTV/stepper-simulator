FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install

COPY . .
RUN pnpm build

####
FROM ghcr.io/thedevminertv/gostatic
CMD ["-spa", "/app/dist"]

COPY --from=builder /app/dist /static