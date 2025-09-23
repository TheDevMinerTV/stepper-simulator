FROM node:22-alpine AS builder
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
FROM ghcr.io/thedevminertv/gostatic
CMD ["-spa", "/app/dist"]

# curl for healthchecks
RUN apk add --no-cache curl

COPY --from=builder /app/dist /static