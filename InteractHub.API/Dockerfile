FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# copy csproj and restore as distinct layers
COPY InteractHub.API/InteractHub.API.csproj ./InteractHub.API/
COPY InteractHub.API/*.sln ./
# COPY InteractHub.API/*.props ./ || true
RUN dotnet restore InteractHub.API/InteractHub.API.csproj

# copy everything and publish
COPY . .
WORKDIR /src/InteractHub.API
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:80
EXPOSE 80
ENTRYPOINT ["dotnet", "InteractHub.API.dll"]
