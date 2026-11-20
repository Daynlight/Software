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
CMD ["npm", "run", "dev"]



# --- Production
FROM base AS production_builder
COPY --chown=node:node package.json ./
RUN npm i
COPY --chown=node:node . .
RUN npm run build

FROM node:22-alpine AS production
USER node
WORKDIR /home/node
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
COPY --from=production_builder --chown=node:node /home/node/public ./public
COPY --from=production_builder --chown=node:node /home/node/.next/standalone ./
COPY --from=production_builder --chown=node:node /home/node/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]

