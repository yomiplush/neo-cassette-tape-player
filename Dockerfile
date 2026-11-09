FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG PLAYER_EDITION=selfhost
RUN if [ "$PLAYER_EDITION" = "selfhost" ]; then npm run build:selfhost && mv dist-selfhost dist; \
    elif [ "$PLAYER_EDITION" = "demo" ]; then npm run build:demo; \
    else echo "PLAYER_EDITION must be selfhost or demo" >&2; exit 1; fi
FROM nginx:alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
