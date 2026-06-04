FROM node:22-alpine AS base
RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/types/package.json ./packages/types/
RUN pnpm install --frozen-lockfile

FROM base AS build
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @barrier-lab/web build

FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=build /app/apps/web/dist ./apps/web/dist
COPY --from=build /app/apps/web/server.mjs ./apps/web/server.mjs
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/web/node_modules ./apps/web/node_modules
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["node", "server.mjs"]
