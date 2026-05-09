# Usar una imagen ligera de Node.js
FROM node:20-alpine

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm install

# Generar el cliente de Prisma
RUN npm run db:generate

# Copiar el resto del código
COPY . .

# Compilar TypeScript a JavaScript
RUN npm run build

# Exponer el puerto (el backend usa el 3000 por defecto)
EXPOSE 3000

# Comando para arrancar en producción
CMD ["npm", "start"]
