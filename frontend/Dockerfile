# Frontend Dockerfile (Vite) - build + nginx

# Build stage
FROM node:22-alpine AS builder
WORKDIR /app

# Skopiuj package.json i zainstaluj zależności
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Skopiuj źródła i zbuduj
COPY . .

# DODANE: Wstrzyknięcie adresu API dla Vite (zapobiega białemu ekranowi u innych!)
ENV VITE_API_URL=http://localhost:5000/api

RUN npm run build

# Runtime - nginx
FROM nginx:stable-alpine
# Usuń domyślny index.html (opcjonalnie)
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/dist /usr/share/nginx/html

# DODANE: Skopiuj niestandardowy plik konfiguracyjny Nginx (Fix dla SPA i 404)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]