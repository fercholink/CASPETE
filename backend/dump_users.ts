import { prisma } from './src/lib/prisma.js';

async function main() {
  const users = await prisma.user.findMany();
  console.log(JSON.stringify(users, null, 2));
  await prisma.$disconnect();
}

main().catch(console.error);
