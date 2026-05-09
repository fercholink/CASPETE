import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany({
      select: {
        email: true,
        role: true,
        full_name: true
      }
    });
    console.log('--- USUARIOS DEL SISTEMA ---');
    users.forEach(u => {
      console.log(`Email: ${u.email} | Rol: ${u.role} | Nombre: ${u.full_name}`);
    });
  } catch (err) {
    console.error('Error al obtener usuarios:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
