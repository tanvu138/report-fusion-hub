// Vietnamese seed data — rich reports with realistic business content
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const CONTENT = require('./seed-content-vi');

const prisma = new PrismaClient();

// --- Data definitions ---

const DEPARTMENTS = [
  'Phòng Tài chính', 'Phòng Nhân sự', 'Phòng Vận hành',
  'Phòng Kinh doanh', 'Phòng Marketing', 'Phòng Kỹ thuật',
  'Phòng Hành chính', 'Phòng Pháp chế',
];

const USERS = [
  { username: 'admin', name: 'Nguyễn Văn An', email: 'admin@tpg.test', password: 'admin123', role: 'secretary', dept: null },
  { username: 'lead', name: 'Trần Thị Bích', email: 'lead@tpg.test', password: '123123', role: 'secretary', dept: null },
  { username: 'finance', name: 'Lê Hoàng Minh', email: 'finance@tpg.test', password: '123123', role: 'department', dept: 'Phòng Tài chính' },
  { username: 'hr', name: 'Phạm Thu Hương', email: 'hr@tpg.test', password: '123123', role: 'department', dept: 'Phòng Nhân sự' },
  { username: 'ops', name: 'Võ Đức Thành', email: 'ops@tpg.test', password: '123123', role: 'department', dept: 'Phòng Vận hành' },
  { username: 'sales', name: 'Nguyễn Thị Mai', email: 'sales@tpg.test', password: '123123', role: 'department', dept: 'Phòng Kinh doanh' },
  { username: 'marketing', name: 'Đặng Quốc Việt', email: 'marketing@tpg.test', password: '123123', role: 'department', dept: 'Phòng Marketing' },
  { username: 'tech', name: 'Hoàng Anh Tuấn', email: 'tech@tpg.test', password: '123123', role: 'department', dept: 'Phòng Kỹ thuật' },
  { username: 'admin_dept', name: 'Bùi Thị Lan', email: 'admin_dept@tpg.test', password: '123123', role: 'department', dept: 'Phòng Hành chính' },
  { username: 'legal', name: 'Trịnh Văn Hải', email: 'legal@tpg.test', password: '123123', role: 'department', dept: 'Phòng Pháp chế' },
  { username: 'department', name: 'Nguyễn Văn Tài', email: 'department@tpg.test', password: 'dept123', role: 'department', dept: 'Phòng Tài chính' },
];

const TEMPLATES = [
  {
    name: 'Báo cáo Hàng tháng Ban Giám đốc',
    description: 'Mẫu báo cáo tổng hợp hàng tháng trình Ban Giám đốc',
    sections: [
      { name: 'Tổng quan Tài chính', dept: 'Phòng Tài chính', instructions: 'Trình bày kết quả doanh thu, chi phí, lợi nhuận tháng. Bao gồm bảng so sánh KH/TH và phân tích dòng tiền.' },
      { name: 'Tình hình Nhân sự', dept: 'Phòng Nhân sự', instructions: 'Báo cáo biến động nhân sự, tuyển dụng, đào tạo và các chính sách phúc lợi trong tháng.' },
      { name: 'Vận hành & Sản xuất', dept: 'Phòng Vận hành', instructions: 'Tổng hợp chỉ số sản xuất (OEE, sản lượng, tỷ lệ lỗi), tình hình kho vận, bảo trì và an toàn lao động.' },
      { name: 'Kinh doanh & Doanh số', dept: 'Phòng Kinh doanh', instructions: 'Báo cáo doanh số theo khu vực, top khách hàng, pipeline và hoạt động phát triển thị trường.' },
      { name: 'Marketing & Truyền thông', dept: 'Phòng Marketing', instructions: 'Tổng hợp kết quả chiến dịch digital, SEO, mạng xã hội và kế hoạch tháng tới.' },
    ],
  },
  {
    name: 'Báo cáo Tổng kết Quý',
    description: 'Mẫu báo cáo tổng kết hoạt động toàn diện theo quý',
    sections: [
      { name: 'Tổng kết Tài chính Quý', dept: 'Phòng Tài chính', instructions: 'Phân tích kết quả tài chính luỹ kế quý: doanh thu, biên lợi nhuận, tình hình tài sản và kiến nghị.' },
      { name: 'Tổng kết Nhân sự Quý', dept: 'Phòng Nhân sự', instructions: 'Biến động nhân sự, chi phí nhân sự, kết quả đánh giá KPI và kế hoạch quý tới.' },
      { name: 'Tổng kết Vận hành Quý', dept: 'Phòng Vận hành', instructions: 'Tổng hợp sản xuất, dự án cải tiến, an toàn lao động và kế hoạch quý tới.' },
      { name: 'Tổng kết Kinh doanh Quý', dept: 'Phòng Kinh doanh', instructions: 'Doanh số theo khu vực/kênh, phát triển khách hàng và chiến lược quý tới.' },
      { name: 'Tổng kết Marketing Quý', dept: 'Phòng Marketing', instructions: 'Ngân sách & ROI, nhận diện thương hiệu, nội dung nổi bật và kế hoạch quý tới.' },
    ],
  },
  {
    name: 'Báo cáo Tuần',
    description: 'Mẫu báo cáo nhanh hoạt động hàng tuần',
    sections: [
      { name: 'Vận hành Tuần', dept: 'Phòng Vận hành', instructions: 'Sản lượng, sự cố, giao hàng trong tuần.' },
      { name: 'Kinh doanh Tuần', dept: 'Phòng Kinh doanh', instructions: 'Doanh số tuần, đơn hàng mới, hoạt động nổi bật.' },
    ],
  },
  {
    name: 'Báo cáo Đặc biệt — Dự án Mở rộng',
    description: 'Mẫu báo cáo phân tích và kế hoạch cho dự án mở rộng nhà máy',
    sections: [
      { name: 'Phân tích Tài chính Đầu tư', dept: 'Phòng Tài chính', instructions: 'Tổng mức đầu tư, nguồn vốn, dự kiến hoàn vốn và phân tích rủi ro tài chính.' },
      { name: 'Kế hoạch Vận hành Nhà máy mới', dept: 'Phòng Vận hành', instructions: 'Thông số kỹ thuật, timeline triển khai và yêu cầu nhân sự vận hành.' },
      { name: 'Kế hoạch Nhân sự Mở rộng', dept: 'Phòng Nhân sự', instructions: 'Lộ trình tuyển dụng, chương trình đào tạo và chính sách đãi ngộ nhà máy mới.' },
    ],
  },
];

// Reports to seed — references template name, content keys, states
const REPORTS = [
  {
    title: 'Báo cáo Ban Giám đốc — Tháng 02/2026',
    description: 'Báo cáo tổng hợp hoạt động kinh doanh tháng 02/2026 trình Ban Giám đốc',
    cycle: 'MONTHLY', state: 'PUBLISHED', template: 'Báo cáo Hàng tháng Ban Giám đốc',
    createdAt: '2026-02-01', dueAt: '2026-03-05',
    sections: [
      { idx: 0, content: CONTENT.t2_taichinh, state: 'SUBMITTED', updater: 'finance' },
      { idx: 1, content: CONTENT.t2_nhansu, state: 'SUBMITTED', updater: 'hr' },
      { idx: 2, content: CONTENT.t2_vanhanh, state: 'SUBMITTED', updater: 'ops' },
      { idx: 3, content: CONTENT.t2_kinhdoanh, state: 'SUBMITTED', updater: 'sales' },
      { idx: 4, content: CONTENT.t2_marketing, state: 'SUBMITTED', updater: 'marketing' },
    ],
  },
  {
    title: 'Báo cáo Ban Giám đốc — Tháng 03/2026',
    description: 'Báo cáo tổng hợp hoạt động kinh doanh tháng 03/2026 (đang soạn)',
    cycle: 'MONTHLY', state: 'DRAFT', template: 'Báo cáo Hàng tháng Ban Giám đốc',
    createdAt: '2026-03-01', dueAt: '2026-04-05',
    sections: [
      { idx: 0, content: CONTENT.t3_taichinh, state: 'SUBMITTED', updater: 'finance' },
      { idx: 1, content: null, state: 'DRAFT', updater: null },
      { idx: 2, content: null, state: 'DRAFT', updater: null },
      { idx: 3, content: CONTENT.t3_kinhdoanh, state: 'SUBMITTED', updater: 'sales' },
      { idx: 4, content: null, state: 'DRAFT', updater: null },
    ],
  },
  {
    title: 'Báo cáo Tổng kết Quý 1/2026',
    description: 'Báo cáo tổng kết toàn diện hoạt động Quý 1 năm 2026',
    cycle: 'MONTHLY', state: 'FINAL', template: 'Báo cáo Tổng kết Quý',
    createdAt: '2026-03-05', dueAt: '2026-04-10',
    sections: [
      { idx: 0, content: CONTENT.q1_taichinh, state: 'SUBMITTED', updater: 'finance' },
      { idx: 1, content: CONTENT.q1_nhansu, state: 'SUBMITTED', updater: 'hr' },
      { idx: 2, content: CONTENT.q1_vanhanh, state: 'SUBMITTED', updater: 'ops' },
      { idx: 3, content: CONTENT.q1_kinhdoanh, state: 'SUBMITTED', updater: 'sales' },
      { idx: 4, content: CONTENT.q1_marketing, state: 'SUBMITTED', updater: 'marketing' },
    ],
  },
  {
    title: 'Báo cáo Tuần 10/2026 (04–10/03)',
    description: 'Báo cáo nhanh hoạt động tuần 10 năm 2026',
    cycle: 'WEEKLY', state: 'DRAFT', template: 'Báo cáo Tuần',
    createdAt: '2026-03-04', dueAt: '2026-03-11',
    sections: [
      { idx: 0, content: CONTENT.w10_vanhanh, state: 'SUBMITTED', updater: 'ops' },
      { idx: 1, content: CONTENT.w10_kinhdoanh, state: 'SUBMITTED', updater: 'sales' },
    ],
  },
  {
    title: 'Kế hoạch Mở rộng Nhà máy Long An 2026–2027',
    description: 'Phân tích tài chính, kế hoạch vận hành và nhân sự cho dự án mở rộng nhà máy tại Long An',
    cycle: 'ADHOC', state: 'PUBLISHED', template: 'Báo cáo Đặc biệt — Dự án Mở rộng',
    createdAt: '2026-01-15', dueAt: '2026-02-28',
    sections: [
      { idx: 0, content: CONTENT.special_taichinh, state: 'SUBMITTED', updater: 'finance' },
      { idx: 1, content: CONTENT.special_vanhanh, state: 'SUBMITTED', updater: 'ops' },
      { idx: 2, content: CONTENT.special_nhansu, state: 'SUBMITTED', updater: 'hr' },
    ],
  },
];

// --- Seed runner ---

async function main() {
  console.log('🗑️  Cleaning database...');
  await prisma.reportSection.deleteMany();
  await prisma.reportImage.deleteMany();
  await prisma.sharedReportLink.deleteMany();
  await prisma.report.deleteMany();
  await prisma.reportTemplateSection.deleteMany();
  await prisma.templatePackItem.deleteMany();
  await prisma.templatePack.deleteMany();
  await prisma.reportTemplate.deleteMany();
  await prisma.globalSetting.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  // 1. Departments
  console.log('\n📁 Seeding departments...');
  const deptMap = {};
  for (const name of DEPARTMENTS) {
    const d = await prisma.department.create({ data: { name } });
    deptMap[name] = d.id;
    console.log(`  ✓ ${name}`);
  }

  // 2. Users
  console.log('\n👤 Seeding users...');
  const userMap = {};
  for (const u of USERS) {
    const hashed = await bcrypt.hash(u.password, 10);
    const created = await prisma.user.create({
      data: {
        username: u.username, name: u.name, email: u.email,
        password: hashed, role: u.role,
        departmentId: u.dept ? deptMap[u.dept] : null,
      },
    });
    userMap[u.username] = created.id;
    console.log(`  ✓ ${u.username} (${u.name}) — mật khẩu: ${u.password}`);
  }

  // 3. Templates
  console.log('\n📋 Seeding templates...');
  const templateMap = {};
  const templateSectionsMap = {}; // templateName -> [{ sectionName, deptId, instructions, order }]
  for (const tpl of TEMPLATES) {
    const created = await prisma.reportTemplate.create({
      data: {
        name: tpl.name, description: tpl.description,
        createdById: userMap['admin'], isActive: true,
      },
    });
    templateMap[tpl.name] = created.id;
    templateSectionsMap[tpl.name] = [];

    for (let i = 0; i < tpl.sections.length; i++) {
      const s = tpl.sections[i];
      const ts = await prisma.reportTemplateSection.create({
        data: {
          templateId: created.id, sectionName: s.name,
          instructions: s.instructions,
          departmentId: deptMap[s.dept], displayOrder: i + 1,
        },
      });
      templateSectionsMap[tpl.name].push({
        id: ts.id, sectionName: s.name,
        departmentId: deptMap[s.dept], instructions: s.instructions,
        displayOrder: i + 1,
      });
    }
    console.log(`  ✓ ${tpl.name} (${tpl.sections.length} phần)`);
  }

  // 4. Reports with sections
  console.log('\n📊 Seeding reports...');
  for (const r of REPORTS) {
    const tplSections = templateSectionsMap[r.template];
    const report = await prisma.report.create({
      data: {
        title: r.title, description: r.description,
        cycle: r.cycle, state: r.state,
        dueAt: new Date(r.dueAt),
        templateId: templateMap[r.template],
        createdById: userMap['admin'],
        createdAt: new Date(r.createdAt),
        finalizedAt: r.state === 'PUBLISHED' ? new Date(r.dueAt) : null,
      },
    });

    for (const sec of r.sections) {
      const tplSec = tplSections[sec.idx];
      await prisma.reportSection.create({
        data: {
          reportId: report.id,
          sectionName: tplSec.sectionName,
          instructions: tplSec.instructions,
          departmentId: tplSec.departmentId,
          displayOrder: tplSec.displayOrder,
          state: sec.state,
          contentMarkdown: sec.content,
          updatedById: sec.updater ? userMap[sec.updater] : null,
          submittedAt: sec.state === 'SUBMITTED' ? new Date() : null,
          reportTemplateSectionId: tplSec.id,
          isActive: true,
          dueAt: new Date(r.dueAt),
        },
      });
    }
    console.log(`  ✓ ${r.title} [${r.state}] — ${r.sections.length} phần`);
  }

  // 5. Global settings
  console.log('\n⚙️  Seeding global settings...');
  await prisma.globalSetting.create({
    data: { key: 'navigation_type', value: 'vertical', createdBy: userMap['admin'], updatedBy: userMap['admin'] },
  });
  console.log('  ✓ navigation_type = vertical');

  // Summary
  console.log('\n✅ Seed hoàn tất!');
  console.log(`   ${DEPARTMENTS.length} phòng ban | ${USERS.length} người dùng | ${TEMPLATES.length} mẫu | ${REPORTS.length} báo cáo`);
  console.log('\n🔑 Tài khoản đăng nhập:');
  for (const u of USERS) {
    console.log(`   ${u.username}: ${u.password} (${u.name})`);
  }
}

main()
  .catch(e => { console.error('❌ Lỗi:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
