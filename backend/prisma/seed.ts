import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

// We use the direct postgres driver for the seed to ensure it works in various environments
async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('Seeding database...');

  // 1. Seed Schools
  const schools = [
    {
      id: '9e8a1b24-4372-47be-a016-b7eb504d7255',
      name: 'Liceo Moderno (Medellín)',
      nit: null,
      city: 'Medellín',
      address: 'Cra 43A #1-50',
      plan: 'PREMIUM',
      active: true,
    },
    {
      id: 'e4348165-3d9b-4b85-81fb-c8d56237290d',
      name: 'Liceo Moderno (Bogotá)',
      nit: '900123456',
      city: 'Bogotá',
      address: null,
      plan: 'STANDARD',
      active: true,
    },
    {
      id: '6e1cee30-83b9-43d1-9db9-55390f41e343',
      name: 'LA NORMAL',
      nit: '900.000.000-1',
      city: 'PIEDECUESTA',
      address: 'Calle 105 #113-22',
      plan: 'PREMIUM',
      active: true,
    }
  ];

  for (const s of schools) {
    await prisma.school.upsert({
      where: { id: s.id },
      update: s,
      create: s,
    });
  }
  console.log('Schools seeded.');

  // 2. Seed Stores
  const stores = [
    {
      id: '53508f44-c1dd-4dce-bd33-563d1f8db1e0',
      school_id: '9e8a1b24-4372-47be-a016-b7eb504d7255',
      name: 'Cafetería Principal',
      active: true,
    },
    {
      id: 'ddfbfaea-48bc-47f0-b022-9c9cea038d74',
      school_id: 'e4348165-3d9b-4b85-81fb-c8d56237290d',
      name: 'Tienda Central',
      active: true,
    },
    {
      id: 'a9314a4f-3a72-413f-87c1-f8921227059f',
      school_id: '6e1cee30-83b9-43d1-9db9-55390f41e343',
      name: 'Cafeteria 1',
      active: true,
    }
  ];

  for (const st of stores) {
    await prisma.store.upsert({
      where: { id: st.id },
      update: st,
      create: st,
    });
  }
  console.log('Stores seeded.');

  // 3. Seed Users
  const users = [
    {
      id: '32c5f41f-3f0a-4bd5-abc1-0ff285fe18be',
      email: 'fercho028890@gmail.com',
      password_hash: '$2b$12$lAE51HpgtM5zduIRPRET2OXkR6rW3aivV3JrhyrXl0jklcs.klE5G',
      role: 'SUPER_ADMIN',
      full_name: 'ferney blanco',
      active: true,
    },
    {
      id: 'cc9a663e-afe3-42f0-9d10-a9e409a634e9',
      email: 'testadmin2@caspete.co',
      password_hash: '$2b$12$cSSmcsSXaqyl3koTGbzHO.IqtC6mOrIlmmXKgR/68Ue166qtj8SrS',
      role: 'SCHOOL_ADMIN',
      full_name: 'Test Admin 2',
      active: true,
    },
    {
      id: '1462f09a-9074-4cb9-8185-04abe6652bcf',
      school_id: 'e4348165-3d9b-4b85-81fb-c8d56237290d',
      email: 'padre@liceomoderno.co',
      password_hash: '$2b$12$vz2Vsd4zhBMgo7nLEgSNzO9woQ9mzDK0HQk7yjjmGtefbWDcvmi32',
      role: 'PARENT',
      full_name: 'Carlos Ramírez',
      active: true,
    },
    {
      id: 'f5320859-0dc9-4dab-9e8a-d2bdeda980c1',
      email: 'ferneysamudio90@gmail.com',
      password_hash: '$2b$12$/PeOlB63eQFDHaBzueufK.4L.esRZFnDSUPImAfnpyzOt1JWM5D82',
      role: 'PARENT',
      full_name: 'maria alejandra perez',
      active: true,
    },
    {
      id: 'e4a6d3f4-30a7-4d1a-a189-9a5db277954a',
      school_id: '6e1cee30-83b9-43d1-9db9-55390f41e343',
      email: 'f_nis88@hotmail.com',
      password_hash: '$2b$12$GYqd4GCdDOyh8XTs5N.dheGai//iSGZ93l02TfjFFZQ42TedIYYZu',
      role: 'VENDOR',
      full_name: 'Pedro Garcia',
      active: true,
    }
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: u as any,
      create: u as any,
    });
  }
  console.log('Users seeded.');

  console.log('Database seeded successfully!');
  await prisma.$disconnect();
  await pool.end();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
