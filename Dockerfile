FROM node:26.13.1-bookworm-slim AS build

WORKDIR /app
COPY index.html sellers.html styles.css server.mjs ./
RUN node --check server.mjs

FROM node:26.13.1-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production PORT=8080
COPY --from=build --chown=node:node /app/ /app/
USER node
EXPOSE 8080
CMD ["node", "server.mjs"]
