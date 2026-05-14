# Etapa 1: Construcción — Node 22 requerido por pnpm 11.x
FROM node:22-alpine AS build-stage
WORKDIR /app

# Habilitar pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copiar manifiesto de dependencias
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

COPY . .

# Recibir la variable de entorno de Vite en tiempo de build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm run build

# Etapa 2: Producción con Nginx
FROM nginx:stable-alpine AS production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Configuración básica de Nginx para SPA (React Router)
RUN printf 'server {\n    listen 80;\n    location / {\n        root /usr/share/nginx/html;\n        index index.html index.htm;\n        try_files $uri $uri/ /index.html;\n    }\n}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
