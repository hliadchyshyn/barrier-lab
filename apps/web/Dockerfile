FROM node:22-alpine
RUN npm install -g pnpm

WORKDIR /app
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/types/package.json ./packages/types/
RUN pnpm install --frozen-lockfile

COPY apps/web ./apps/web
COPY packages ./packages

RUN pnpm --filter @barrier-lab/web build

WORKDIR /app/apps/web
EXPOSE 3000
CMD ["node", "server.mjs"]
