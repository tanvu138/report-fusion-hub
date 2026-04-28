/**
 * Debug script to check database and API directly
 */
require('dotenv-safe').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Checking database connection...');
  
  try {
    // Test database connection
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('Database connection successful:', result);
    
    // Check if reports table exists and has data
    console.log('\nChecking for reports in database...');
    const reportsCount = await prisma.report.count();
    console.log(`Found ${reportsCount} reports in database`);
    
    if (reportsCount > 0) {
      // Fetch a sample of reports
      const reports = await prisma.report.findMany({
        take: 3,
        select: {
          id: true,
          title: true,
          state: true,
          cycle: true,
          createdAt: true,
          _count: {
            select: { sections: true }
          }
        }
      });
      
      console.log('\nSample reports:');
      console.log(JSON.stringify(reports, null, 2));
    } else {
      console.log('\nNo reports found. Creating a test report...');
      
      // Check if user exists to assign as author
      const user = await prisma.user.findFirst({
        select: { id: true }
      });
      
      if (!user) {
        console.log('No users found. Creating test user...');
        await prisma.user.create({
          data: {
            name: 'Test User',
            email: 'test@example.com',
            password: '$2a$10$6UUtr6p8R1BfwdbwFSQVM.LQp7C9xHIj6r1CmjPMa9H5TvQTj0JKe', // hashed 'password123'
            role: 'secretary'
          }
        });
      }
      
      // Create a test report
      const authorId = (await prisma.user.findFirst()).id;
      const report = await prisma.report.create({
        data: {
          title: 'Test Report',
          cycle: 'WEEKLY',
          state: 'DRAFT',
          authorId
        }
      });
      
      console.log('Created test report:', report);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
