# Build from the repository root:
#   docker build -f server/Dockerfile -t guess-the-block-server .
# The server needs the same block dataset and comparison code as the web game.

FROM node:22-alpine AS data
WORKDIR /app
COPY FakeApi.json ./
COPY guessTheBlock/scripts guessTheBlock/scripts
COPY guessTheBlock/public/models guessTheBlock/public/models
COPY guessTheBlock/public/img guessTheBlock/public/img
RUN node guessTheBlock/scripts/build-data.mjs

FROM node:22-alpine
ENV NODE_ENV=production \
    PORT=3000 \
    DATABASE_PATH=/data/guess-the-block.db
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY server/src ./src
COPY guessTheBlock/src/modules/data/compare.ts /app/guessTheBlock/src/modules/data/compare.ts
COPY --from=data /app/guessTheBlock/public/data/blocks.json /app/guessTheBlock/public/data/blocks.json
RUN mkdir -p /data && chown node:node /data
VOLUME /data
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1
CMD ["node", "--disable-warning=ExperimentalWarning", "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON", "src/index.ts"]
