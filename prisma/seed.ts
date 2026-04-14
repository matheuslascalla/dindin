import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding default expense types...');

  const defaultTypes = [
    {
      name: 'Custo fixo',
      limitPercent: 40,
      color: '#6366F1',
      icon: 'home',
    },
    {
      name: 'Metas',
      limitPercent: 5,
      color: '#10B981',
      icon: 'target',
    },
    {
      name: 'Conforto',
      limitPercent: 20,
      color: '#F59E0B',
      icon: 'sofa',
    },
    {
      name: 'Prazeres',
      limitPercent: 5,
      color: '#EC4899',
      icon: 'heart',
    },
    {
      name: 'Liberdade financeira',
      limitPercent: 25,
      color: '#8B5CF6',
      icon: 'trending-up',
    },
    {
      name: 'Conhecimento',
      limitPercent: 5,
      color: '#06B6D4',
      icon: 'book-open',
    },
  ];

  for (const type of defaultTypes) {
    const exists = await prisma.expenseType.findFirst({
      where: { name: type.name },
    });
    if (!exists) {
      await prisma.expenseType.create({ data: type });
    }
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
