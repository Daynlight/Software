FROM node:22-alpine AS base
USER node
WORKDIR /home/node
COPY --chown=node:node package.json ./



# --- Development
FROM base AS development
ENV NODE_ENV=development
COPY --chown=node:node package.json ./
RUN npm i
COPY --chown=node:node . .
CMD ["npm", "run", "start:dev"]



# --- Production
FROM base AS production_builder
COPY --chown=node:node package.json ./
RUN npm i
COPY --chown=node:node . .
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine AS production
ENV NODE_ENV=production
USER node
WORKDIR /home/node
COPY --from=production_builder --chown=node:node /home/node/node_modules ./node_modules
COPY --from=production_builder --chown=node:node /home/node/dist ./dist
CMD ["node", "dist/main.js"]

