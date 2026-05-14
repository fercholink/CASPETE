# Etapa 1: Construcción — Node 22 + pnpm 9 (sin restriccion de build scripts)
FROM node:22-alpine AS build-stage
WORKDIR /app

# Instalar pnpm 9.x (compatible con Node 22, sin ERR_PNPM_IGNORED_BUILDS)
RUN npm install -g pnpm@9

# Copiar manifiesto de dependencias
COPY package.json ./
RUN pnpm install --no-frozen-lockfile

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
