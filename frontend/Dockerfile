FROM node:18-alpine AS build

WORKDIR /app

COPY package.json .
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

# Étape de production avec un serveur léger
FROM node:18-alpine

WORKDIR /app
RUN npm install -g serve

COPY --from=build /app/build ./build

EXPOSE 8080

CMD ["serve", "-s", "build", "-l", "8080"]
