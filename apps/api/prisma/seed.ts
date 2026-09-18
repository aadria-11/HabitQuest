import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: {
      email: {
        contains: '@',
      },
    },
  });

  if (!user) {
    console.error(
      'No user found. Please authenticate first before running seed.'
    );
    return;
  }

  console.log(`Using user: ${user.email}`);

  // Delete existing test habits
  await prisma.habit.deleteMany({
    where: {
      userId: user.id,
      name: {
        in: ['Test Habit 2 Days', 'Test Habit 6 Days', 'Test Habit 29 Days'],
      },
    },
  });

  // Create three test habits with specified check-ins
  const testHabits = [
    { name: 'Test Habit 2 Days', checkInCount: 2 },
    { name: 'Test Habit 6 Days', checkInCount: 6 },
    { name: 'Test Habit 29 Days', checkInCount: 29 },
  ];

  for (const { name, checkInCount } of testHabits) {
    const habit = await prisma.habit.create({
      data: {
        userId: user.id,
        name,
        description: `Test habit with ${checkInCount} check-ins`,
        startDate: new Date(
          new Date().getTime() - checkInCount * 24 * 60 * 60 * 1000
        ),
        currentStreak: checkInCount,
        bestStreak: checkInCount,
      },
    });

    // Create check-in entries for consecutive days
    for (let i = checkInCount - 1; i >= 0; i--) {
      const checkInDate = new Date();
      checkInDate.setDate(checkInDate.getDate() - i);
      checkInDate.setHours(0, 0, 0, 0);

      await prisma.habitCheckIn.create({
        data: {
          habitId: habit.id,
          checkInDate,
        },
      });
    }

    console.log(`✓ Created ${name} with ${checkInCount} check-ins`);
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
