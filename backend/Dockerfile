# Usar una imagen ligera de Node.js
FROM node:20-alpine

# Habilitar pnpm (gestor de paquetes seguro)
RUN corepack enable && corepack prepare pnpm@latest --activate

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml* ./
COPY prisma ./prisma/

# Instalar dependencias con pnpm
RUN pnpm install --frozen-lockfile

# Generar el cliente de Prisma
RUN pnpm run db:generate

# Copiar el resto del código
COPY . .

# Compilar TypeScript a JavaScript
RUN pnpm run build

# Exponer el puerto
EXPOSE 3000

# Comando para arrancar en producción
CMD ["node", "dist/app.js"]
