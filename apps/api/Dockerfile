FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/contracts/package.json packages/contracts/package.json

RUN npm ci --include=dev \
  && npm cache clean --force

COPY tsconfig.base.json ./
COPY apps/api apps/api
COPY packages/contracts packages/contracts

ENV NODE_ENV=production
ENV PORT=3001

RUN chown -R node:node /app

USER node

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3001/health/ready').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["./node_modules/.bin/tsx", "--tsconfig", "apps/api/tsconfig.json", "apps/api/src/main.ts"]
