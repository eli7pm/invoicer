# syntax=docker/dockerfile:1
FROM --platform=linux/amd64 node:26-trixie-slim AS deps
RUN apt-get update && apt-get install -y --no-install-recommends unzip && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@12.18.0
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/shared/package.json apps/shared/
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    PUPPETEER_SKIP_DOWNLOAD=true pnpm install --frozen-lockfile --prod --ignore-scripts --filter api...
RUN cd apps/api \
  && PUPPETEER_CACHE_DIR=/tmp/browsers node node_modules/puppeteer/lib/puppeteer/node/cli.js browsers install chrome-headless-shell \
  && mv "$(dirname "$(find /tmp/browsers -type f -name chrome-headless-shell)")" /opt/chrome

FROM --platform=linux/amd64 node:26-trixie-slim
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates fontconfig fonts-liberation \
    libnss3 libnspr4 libatk1.0-0t64 libatk-bridge2.0-0t64 libcups2t64 libdrm2 libexpat1 libwayland-server0 \
    libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libasound2t64 \
    libpango-1.0-0 libcairo2 libdbus-1-3 \
  && cd /tmp && apt-get download libgbm1 \
  && dpkg-deb -x libgbm1_*.deb gbm && cp -a gbm/usr/lib/x86_64-linux-gnu/libgbm.so.1* /usr/lib/x86_64-linux-gnu/ && ldconfig \
  && rm -rf /tmp/gbm /tmp/*.deb /var/lib/apt/lists/* /var/cache/apt/archives/*.deb \
  && rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack /opt/yarn* /usr/local/bin/yarn /usr/local/bin/yarnpkg
COPY --from=deps /opt/chrome /opt/chrome
RUN missing=$(ldd /opt/chrome/chrome-headless-shell /usr/lib/x86_64-linux-gnu/libgbm.so.1 | grep "not found" || true); \
  if [ -n "$missing" ]; then echo "Missing libraries:"; echo "$missing"; exit 1; fi
ENV NODE_ENV=production \
    PUPPETEER_EXECUTABLE_PATH=/opt/chrome/chrome-headless-shell
WORKDIR /app
COPY --from=deps /app/node_modules node_modules
COPY --from=deps /app/apps/api/node_modules apps/api/node_modules
COPY --from=deps /app/apps/shared/node_modules apps/shared/node_modules
COPY apps/shared apps/shared
COPY apps/api apps/api
USER node
EXPOSE 3100
CMD ["node", "apps/api/src/index.js"]
