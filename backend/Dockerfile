# syntax=docker/dockerfile:1.7

FROM node:24-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

FROM deps AS build
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN apk add --no-cache poppler-utils tesseract-ocr tesseract-ocr-data-por \
    tesseract-ocr-data-osd imagemagick imagemagick-jpeg

# Alpine's language package uses tessdata, unlike the tessdata_fast model tested
# on Ubuntu. Pin the model bytes, retaining OSD and the distribution TSV configs.
COPY scripts/install-ocr-model.sh /tmp/install-ocr-model.sh
# Windows checkouts may rewrite shell scripts to CRLF. Normalize defensively
# inside the Linux image before invoking /bin/sh.
RUN sed -i 's/\r$//' /tmp/install-ocr-model.sh \
    && sh /tmp/install-ocr-model.sh /usr/share/tessdata \
    && rm /tmp/install-ocr-model.sh
ENV TESSDATA_PREFIX=/usr/share/tessdata

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY --chown=node:node templates ./templates
COPY --chown=node:node migrations ./migrations
COPY --chown=node:node scripts/smoke-ocr-runtime.mjs ./scripts/smoke-ocr-runtime.mjs
COPY --chown=node:node scripts/fixtures/identity-synthetic.png ./scripts/fixtures/identity-synthetic.png

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "dist/server.js"]
