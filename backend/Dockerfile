# Backend Dockerfile
# Lekki obraz oparty na Node.js
FROM node:22-alpine

WORKDIR /app

# Skopiuj tylko pliki zależności, aby wykorzystać cache warstw
COPY package*.json ./

# Zainstaluj zależności
RUN npm ci

# Skopiuj resztę aplikacji
COPY . .

# DODANE: Utworzenie folderu na bazę SQLite (zapobiega błędom braku ścieżki)
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

# Polecenie uruchomieniowe
CMD ["node", "src/index.js"]