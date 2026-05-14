# Usar Node 22 (requerido por pnpm 11.x)
FROM node:22-alpine

# Habilitar pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml* ./
COPY prisma ./prisma/

# Instalar dependencias
# Sin --frozen-lockfile para que pnpm.onlyBuiltDependencies del package.json
# sea respetado y los scripts de build nativos (prisma, bcrypt) se ejecuten
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
CMD ["node", "dist/server.js"]
