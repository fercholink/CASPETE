import { prisma } from './src/lib/prisma.js';

async function main() {
  const schools = await prisma.school.findMany();
  const stores = await prisma.store.findMany();
  console.log('--- SCHOOLS ---');
  console.log(JSON.stringify(schools, null, 2));
  console.log('--- STORES ---');
  console.log(JSON.stringify(stores, null, 2));
  await prisma.$disconnect();
}

main().catch(console.error);
