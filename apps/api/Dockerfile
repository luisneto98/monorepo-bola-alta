# Build a partir da raiz do monorepo: docker build -f apps/api/Dockerfile .
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
RUN npm ci --workspace @bola-alta/api --include-workspace-root
COPY apps/api apps/api
RUN npm run build --workspace @bola-alta/api

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
RUN npm ci --workspace @bola-alta/api --include-workspace-root --omit=dev \
  && npm cache clean --force
COPY --from=build /app/apps/api/dist apps/api/dist
EXPOSE 3333
CMD ["node", "apps/api/dist/main.js"]
