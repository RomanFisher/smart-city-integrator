Instrukcja budowy obrazów i publikacji na Docker Hub

1) Przygotuj:
   - konto Docker Hub
   - ustaw zmienną `MONGO_URI` w środowisku (używana przez backend)
   - zastąp `YOUR_DOCKERHUB_USERNAME` w `docker-compose.yml` swoim nickiem

2) Budowa obrazów (lokalnie):

Backend:
```bash
cd backend
docker build -t YOUR_DOCKERHUB_USERNAME/smart-city-backend:latest .
```

Frontend:
```bash
cd frontend
docker build -t YOUR_DOCKERHUB_USERNAME/smart-city-frontend:latest .
```

3) Test lokalny przy użyciu docker-compose
Upewnij się, że w pliku `.env` na root projektu ustawione są potrzebne zmienne (np. `MONGO_URI`).

```bash
# z katalogu głównego projektu
docker compose up --build
```

Backend będzie dostępny na `http://localhost:5000`, frontend na `http://localhost:8080`.

4) Zaloguj się do Docker Hub i wypchnij obrazy

```bash
docker login
# jeśli jeszcze nie oznaczyłeś: podnieś tag wersji zamiast używać :latest
docker push YOUR_DOCKERHUB_USERNAME/smart-city-backend:latest
docker push YOUR_DOCKERHUB_USERNAME/smart-city-frontend:latest
```

5) (Opcjonalne) Użycie GitHub Actions lub innego CI
- Dodaj kroki budowania i `docker push` w CI, korzystając z sekretów `DOCKERHUB_USERNAME` i `DOCKERHUB_TOKEN`.

Uwagi:
- Dockerfile dla backendu uruchamia `node src/index.js`. Upewnij się, że w `src/index.js` aplikacja czyta `MONGO_URI` z env.
- Frontend budowany jest przez Vite i serwowany przez nginx z katalogu `dist`.
- Dostosuj nazw obrazów w `docker-compose.yml` przed publikacją.
