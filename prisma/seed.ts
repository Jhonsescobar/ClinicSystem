import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seeding...')

  // Create Super Admin
  const superAdminPassword = await bcrypt.hash('admin123', 12)
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@klinik.com' },
    update: {},
    create: {
      email: 'admin@klinik.com',
      password: superAdminPassword,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  })
  console.log('✓ Created super admin:', superAdmin.email)

  // Create Admin
  const adminPassword = await bcrypt.hash('user123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'staff@klinik.com' },
    update: {},
    create: {
      email: 'staff@klinik.com',
      password: adminPassword,
      name: 'Staff Klinik',
      role: 'ADMIN',
      isActive: true,
    },
  })
  console.log('✓ Created admin:', admin.email)

  // Create Shifts
  const shift1 = await prisma.shift.upsert({
    where: { name: 'Shift 1' },
    update: {},
    create: {
      name: 'Shift 1',
      startTime: '08:00',
      endTime: '14:00',
      description: 'Pagi',
    },
  })
  console.log('✓ Created shift:', shift1.name)

  const shift2 = await prisma.shift.upsert({
    where: { name: 'Shift 2' },
    update: {},
    create: {
      name: 'Shift 2',
      startTime: '14:00',
      endTime: '20:00',
      description: 'Siang',
    },
  })
  console.log('✓ Created shift:', shift2.name)

  const shift3 = await prisma.shift.upsert({
    where: { name: 'Shift 3' },
    update: {},
    create: {
      name: 'Shift 3',
      startTime: '20:00',
      endTime: '08:00',
      description: 'Malam',
    },
  })
  console.log('✓ Created shift:', shift3.name)

  // Create Sample Doctors
  const doctor1 = await prisma.doctor.upsert({
    where: { id: 'doc-1' },
    update: {},
    create: {
      id: 'doc-1',
      name: 'Dr. Ahmad',
      status: 'PERMANENT',
      isActive: true,
    },
  })
  console.log('✓ Created doctor:', doctor1.name)

  const doctor2 = await prisma.doctor.upsert({
    where: { id: 'doc-2' },
    update: {},
    create: {
      id: 'doc-2',
      name: 'Dr. Siti',
      status: 'PERMANENT',
      isActive: true,
    },
  })
  console.log('✓ Created doctor:', doctor2.name)

  // Create Medical Actions
  const action1 = await prisma.medicalAction.upsert({
    where: { id: 'action-1' },
    update: {},
    create: {
      id: 'action-1',
      name: 'Konsultasi',
      price: 150000,
      isActive: true,
    },
  })
  console.log('✓ Created action:', action1.name)

  const action2 = await prisma.medicalAction.upsert({
    where: { id: 'action-2' },
    update: {},
    create: {
      id: 'action-2',
      name: 'Operasi Minor',
      price: 300000,
      isActive: true,
    },
  })
  console.log('✓ Created action:', action2.name)

  const action3 = await prisma.medicalAction.upsert({
    where: { id: 'action-3' },
    update: {},
    create: {
      id: 'action-3',
      name: 'Jahit Luka',
      price: 200000,
      isActive: true,
    },
  })
  console.log('✓ Created action:', action3.name)

  const action4 = await prisma.medicalAction.upsert({
    where: { id: 'action-4' },
    update: {},
    create: {
      id: 'action-4',
      name: 'Bersihkan Luka',
      price: 100000,
      isActive: true,
    },
  })
  console.log('✓ Created action:', action4.name)

  console.log('\n✅ Database seeding completed!')
  console.log('\n📝 Login credentials:')
  console.log('   Super Admin: admin@klinik.com / admin123')
  console.log('   Admin:       staff@klinik.com / user123')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
