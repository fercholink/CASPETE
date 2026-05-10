import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL']! });
const p = new PrismaClient({ adapter });

async function main() {
  const existing = await p.paymentMethod.count();
  if (existing > 0) { console.log('Payment methods already exist, skipping.'); return; }

  await p.paymentMethod.createMany({
    data: [
      {
        key: 'NEQUI', label: 'Nequi', icon: '📱', color: '#8B5CF6',
        fields: [{ label: 'Número de celular', value: '310 000 0000' }, { label: 'Nombre', value: 'CASPETE S.A.S.' }],
        sort_order: 1,
      },
      {
        key: 'BANCOLOMBIA', label: 'Bancolombia', icon: '🏦', color: '#F59E0B',
        fields: [
          { label: 'Tipo de cuenta', value: 'Ahorros' },
          { label: 'Número de cuenta', value: '000-000000-00' },
          { label: 'Nombre', value: 'CASPETE S.A.S.' },
          { label: 'NIT', value: '000.000.000-0' },
        ],
        sort_order: 2,
      },
      {
        key: 'DAVIVIENDA', label: 'Davivienda', icon: '🏛️', color: '#EF4444',
        fields: [
          { label: 'Tipo de cuenta', value: 'Ahorros' },
          { label: 'Número de cuenta', value: '0000000000000' },
          { label: 'Nombre', value: 'CASPETE S.A.S.' },
          { label: 'NIT', value: '000.000.000-0' },
        ],
        sort_order: 3,
      },
    ],
  });
  console.log('✅ Payment methods seeded');
}

main().catch(console.error).finally(() => p.$disconnect());
