# Usar Node 22 (necesario para pnpm moderno)
FROM node:22-alpine

# pg_dump — necesario para el respaldo diario de la base de datos a S3
RUN apk add --no-cache postgresql-client

# Instalar pnpm 9.x (compatible con Node 22, sin restriccion ERR_PNPM_IGNORED_BUILDS)
RUN npm install -g pnpm@9

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package.json ./
COPY prisma ./prisma/

# Instalar dependencias (pnpm 9 ejecuta build scripts sin aprobacion)
RUN pnpm install --no-frozen-lockfile

# Generar el cliente de Prisma
RUN pnpm run db:generate

# Copiar el resto del código
COPY . .

# Compilar TypeScript a JavaScript
RUN pnpm run build

# Exponer el puerto
EXPOSE 3000

# Comando para arrancar en producción
# --import precarga la instrumentación de Sentry antes de que se cargue Express (requisito de Sentry en ESM)
CMD ["node", "--import", "./dist/instrument.js", "dist/server.js"]
