import { prisma } from './src/lib/prisma.js';

async function main() {
  const students = await prisma.student.findMany();
  console.log(JSON.stringify(students, null, 2));
  await prisma.$disconnect();
}

main().catch(console.error);
