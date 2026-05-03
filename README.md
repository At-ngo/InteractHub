# InteractHub

This repository contains an ASP.NET Core backend and a React (Vite) frontend.

## Local development

- Backend: `InteractHub.API` (ASP.NET Core)
- Frontend: `interacthub-frontend` (React + Vite)

Run backend locally:

```powershell
cd InteractHub.API
#$env:ASPNETCORE_ENVIRONMENT='Development'
dotnet run
```

Run frontend locally:

```powershell
cd interacthub-frontend
npm install
npm run dev
```

### Local Docker (recommended for parity)

Build and run the stack (MySQL + API + frontend):

```powershell
docker compose build
docker compose up
```

API will be available at http://localhost:5271 and frontend at http://localhost:5173 by default.

## CI/CD

- A GitHub Actions workflow `.github/workflows/ci.yml` runs on push/PR to `main`:
  - Builds backend and runs tests
  - Builds frontend

- A CD workflow `.github/workflows/cd.yml` can deploy the backend to Azure App Service using a publish profile.
  - Set the `AZURE_WEBAPP_PUBLISH_PROFILE` and `AZURE_WEBAPP_NAME` repository secrets to enable automatic deploys.

## Docker

- `InteractHub.API/Dockerfile` - multi-stage build for backend
- `interacthub-frontend/Dockerfile` - build frontend and serve via nginx
- `docker-compose.yml` - local compose for dev/test

## Next steps / Suggestions

- Add GitHub Secrets for Azure publish profile or Docker registry credentials if you want automatic deployment.
- Consider adding GitHub Actions to publish docker images to a registry and a deployment job for your chosen platform (AKS/ECS/Cloud Run).
