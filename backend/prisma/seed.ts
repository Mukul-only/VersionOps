import { PrismaClient, Year, Position, FestStatus, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function hash(password: string) {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log('🌱 Seeding database...');

  // ── Colleges ──────────────────────────────────────────────────────────────
  const colleges = await Promise.all([
    prisma.college.upsert({ where: { code: 'MIT' }, update: {}, create: { code: 'MIT', name: 'MIT College of Engineering' } }),
    prisma.college.upsert({ where: { code: 'VIT' }, update: {}, create: { code: 'VIT', name: 'VIT University' } }),
    prisma.college.upsert({ where: { code: 'BITS' }, update: {}, create: { code: 'BITS', name: 'BITS Pilani' } }),
    prisma.college.upsert({ where: { code: 'NIT' }, update: {}, create: { code: 'NIT', name: 'NIT Trichy' } }),
    prisma.college.upsert({ where: { code: 'COEP' }, update: {}, create: { code: 'COEP', name: 'COEP Technological University' } }),
  ]);
  console.log(`✅ ${colleges.length} colleges`);

  // ── Events ────────────────────────────────────────────────────────────────
  const events = await Promise.all([
    prisma.event.upsert({ where: { name: 'Code Sprint' }, update: {}, create: { name: 'Code Sprint', teamSize: 1, participationPoints: 5, firstPrizePoints: 50, secondPrizePoints: 30, thirdPrizePoints: 15 } }),
    prisma.event.upsert({ where: { name: 'Hackathon' }, update: {}, create: { name: 'Hackathon', teamSize: 3, participationPoints: 10, firstPrizePoints: 100, secondPrizePoints: 60, thirdPrizePoints: 30 } }),
    prisma.event.upsert({ where: { name: 'UI/UX Design' }, update: {}, create: { name: 'UI/UX Design', teamSize: 2, participationPoints: 5, firstPrizePoints: 40, secondPrizePoints: 25, thirdPrizePoints: 10 } }),
    prisma.event.upsert({ where: { name: 'Quiz Bowl' }, update: {}, create: { name: 'Quiz Bowl', teamSize: 1, participationPoints: 5, firstPrizePoints: 30, secondPrizePoints: 20, thirdPrizePoints: 10 } }),
    prisma.event.upsert({ where: { name: 'Robo Wars' }, update: {}, create: { name: 'Robo Wars', teamSize: 4, participationPoints: 10, firstPrizePoints: 80, secondPrizePoints: 50, thirdPrizePoints: 25 } }),
  ]);
  console.log(`✅ ${events.length} events`);

  // ── Participants ──────────────────────────────────────────────────────────
  const participantData = [
    { participantId: 'P001', name: 'Arjun Sharma',   email: 'arjun@mit.edu',   collegeIdx: 0, year: Year.ONE,  hackerearthUser: 'arjun_s',   festStatus: FestStatus.CHECKED_IN },
    { participantId: 'P002', name: 'Priya Nair',     email: 'priya@vit.edu',   collegeIdx: 1, year: Year.TWO,  hackerearthUser: 'priya_n',   festStatus: FestStatus.CHECKED_IN },
    { participantId: 'P003', name: 'Rohan Mehta',    email: 'rohan@bits.edu',  collegeIdx: 2, year: Year.ONE,  hackerearthUser: 'rohan_m',   festStatus: FestStatus.CHECKED_IN },
    { participantId: 'P004', name: 'Sneha Iyer',     email: 'sneha@nit.edu',   collegeIdx: 3, year: Year.TWO,  hackerearthUser: 'sneha_i',   festStatus: FestStatus.CHECKED_IN },
    { participantId: 'P005', name: 'Karan Patel',    email: 'karan@coep.edu',  collegeIdx: 4, year: Year.ONE,  hackerearthUser: 'karan_p',   festStatus: FestStatus.CHECKED_IN },
    { participantId: 'P006', name: 'Divya Rao',      email: 'divya@mit.edu',   collegeIdx: 0, year: Year.TWO,  hackerearthUser: 'divya_r',   festStatus: FestStatus.CHECKED_IN },
    { participantId: 'P007', name: 'Aditya Kumar',   email: 'aditya@vit.edu',  collegeIdx: 1, year: Year.ONE,  hackerearthUser: 'aditya_k',  festStatus: FestStatus.REGISTERED },
    { participantId: 'P008', name: 'Meera Singh',    email: 'meera@bits.edu',  collegeIdx: 2, year: Year.TWO,  hackerearthUser: 'meera_s',   festStatus: FestStatus.CHECKED_IN },
    { participantId: 'P009', name: 'Vikram Joshi',   email: 'vikram@nit.edu',  collegeIdx: 3, year: Year.ONE,  hackerearthUser: 'vikram_j',  festStatus: FestStatus.NO_SHOW },
    { participantId: 'P010', name: 'Ananya Desai',   email: 'ananya@coep.edu', collegeIdx: 4, year: Year.TWO,  hackerearthUser: 'ananya_d',  festStatus: FestStatus.CHECKED_IN },
    { participantId: 'P011', name: 'Rahul Gupta',    email: 'rahul@mit.edu',   collegeIdx: 0, year: Year.ONE,  hackerearthUser: 'rahul_g',   festStatus: FestStatus.CHECKED_IN },
    { participantId: 'P012', name: 'Pooja Verma',    email: 'pooja@vit.edu',   collegeIdx: 1, year: Year.TWO,  hackerearthUser: 'pooja_v',   festStatus: FestStatus.CHECKED_IN },
  ];

  const participants = await Promise.all(
    participantData.map((p) =>
      prisma.participant.upsert({
        where: { participantId: p.participantId },
        update: {},
        create: {
          participantId: p.participantId,
          name: p.name,
          email: p.email,
          collegeId: colleges[p.collegeIdx].id,
          year: p.year,
          hackerearthUser: p.hackerearthUser,
          festStatus: p.festStatus,
        },
      }),
    ),
  );
  console.log(`✅ ${participants.length} participants`);

  // ── Event Participations ──────────────────────────────────────────────────
  // Code Sprint: P001, P002, P003, P004, P005
  // Hackathon: P001+P002+P003 (team A), P004+P005+P006 (team B)
  // UI/UX Design: P007+P008, P009+P010
  // Quiz Bowl: P006, P007, P008, P011, P012
  // Robo Wars: P001+P002+P003+P004 (team X), P005+P006+P007+P008 (team Y)

  const participations: { eventIdx: number; participantIdx: number; dummyId: string; teamId?: string }[] = [
    // Code Sprint
    { eventIdx: 0, participantIdx: 0, dummyId: 'CS-001' },
    { eventIdx: 0, participantIdx: 1, dummyId: 'CS-002' },
    { eventIdx: 0, participantIdx: 2, dummyId: 'CS-003' },
    { eventIdx: 0, participantIdx: 3, dummyId: 'CS-004' },
    { eventIdx: 0, participantIdx: 4, dummyId: 'CS-005' },
    // Hackathon team A
    { eventIdx: 1, participantIdx: 0, dummyId: 'HK-001', teamId: 'TEAM-A' },
    { eventIdx: 1, participantIdx: 1, dummyId: 'HK-002', teamId: 'TEAM-A' },
    { eventIdx: 1, participantIdx: 2, dummyId: 'HK-003', teamId: 'TEAM-A' },
    // Hackathon team B
    { eventIdx: 1, participantIdx: 3, dummyId: 'HK-004', teamId: 'TEAM-B' },
    { eventIdx: 1, participantIdx: 4, dummyId: 'HK-005', teamId: 'TEAM-B' },
    { eventIdx: 1, participantIdx: 5, dummyId: 'HK-006', teamId: 'TEAM-B' },
    // UI/UX
    { eventIdx: 2, participantIdx: 6, dummyId: 'UX-001', teamId: 'UX-A' },
    { eventIdx: 2, participantIdx: 7, dummyId: 'UX-002', teamId: 'UX-A' },
    { eventIdx: 2, participantIdx: 8, dummyId: 'UX-003', teamId: 'UX-B' },
    { eventIdx: 2, participantIdx: 9, dummyId: 'UX-004', teamId: 'UX-B' },
    // Quiz Bowl
    { eventIdx: 3, participantIdx: 5,  dummyId: 'QZ-001' },
    { eventIdx: 3, participantIdx: 6,  dummyId: 'QZ-002' },
    { eventIdx: 3, participantIdx: 7,  dummyId: 'QZ-003' },
    { eventIdx: 3, participantIdx: 10, dummyId: 'QZ-004' },
    { eventIdx: 3, participantIdx: 11, dummyId: 'QZ-005' },
    // Robo Wars team X
    { eventIdx: 4, participantIdx: 0, dummyId: 'RW-001', teamId: 'RW-X' },
    { eventIdx: 4, participantIdx: 1, dummyId: 'RW-002', teamId: 'RW-X' },
    { eventIdx: 4, participantIdx: 2, dummyId: 'RW-003', teamId: 'RW-X' },
    { eventIdx: 4, participantIdx: 3, dummyId: 'RW-004', teamId: 'RW-X' },
    // Robo Wars team Y
    { eventIdx: 4, participantIdx: 4, dummyId: 'RW-005', teamId: 'RW-Y' },
    { eventIdx: 4, participantIdx: 5, dummyId: 'RW-006', teamId: 'RW-Y' },
    { eventIdx: 4, participantIdx: 6, dummyId: 'RW-007', teamId: 'RW-Y' },
    { eventIdx: 4, participantIdx: 7, dummyId: 'RW-008', teamId: 'RW-Y' },
  ];

  let epCount = 0;
  for (const ep of participations) {
    await prisma.eventParticipation.upsert({
      where: { eventId_participantId: { eventId: events[ep.eventIdx].id, participantId: participants[ep.participantIdx].id } },
      update: {},
      create: {
        eventId: events[ep.eventIdx].id,
        participantId: participants[ep.participantIdx].id,
        dummyId: ep.dummyId,
        teamId: ep.teamId ?? null,
      },
    });
    epCount++;
  }
  console.log(`✅ ${epCount} event participations`);

  // ── Event Results ─────────────────────────────────────────────────────────
  const results: { eventIdx: number; participantIdx: number; position: Position }[] = [
    // Code Sprint
    { eventIdx: 0, participantIdx: 0, position: Position.FIRST  },  // Arjun  (MIT)
    { eventIdx: 0, participantIdx: 2, position: Position.SECOND },  // Rohan  (BITS)
    { eventIdx: 0, participantIdx: 4, position: Position.THIRD  },  // Karan  (COEP)
    // Hackathon
    { eventIdx: 1, participantIdx: 0, position: Position.FIRST  },  // Arjun  (MIT)  team A
    { eventIdx: 1, participantIdx: 1, position: Position.FIRST  },  // Priya  (VIT)  team A
    { eventIdx: 1, participantIdx: 2, position: Position.FIRST  },  // Rohan  (BITS) team A
    { eventIdx: 1, participantIdx: 3, position: Position.SECOND },  // Sneha  (NIT)  team B
    { eventIdx: 1, participantIdx: 4, position: Position.SECOND },  // Karan  (COEP) team B
    { eventIdx: 1, participantIdx: 5, position: Position.SECOND },  // Divya  (MIT)  team B
    // UI/UX
    { eventIdx: 2, participantIdx: 8,  position: Position.FIRST  }, // Vikram (NIT)
    { eventIdx: 2, participantIdx: 9,  position: Position.SECOND }, // Ananya (COEP)
    { eventIdx: 2, participantIdx: 6,  position: Position.THIRD  }, // Aditya (VIT)
    // Quiz Bowl
    { eventIdx: 3, participantIdx: 10, position: Position.FIRST  }, // Rahul  (MIT)
    { eventIdx: 3, participantIdx: 11, position: Position.SECOND }, // Pooja  (VIT)
    { eventIdx: 3, participantIdx: 5,  position: Position.THIRD  }, // Divya  (MIT)
    // Robo Wars
    { eventIdx: 4, participantIdx: 0, position: Position.FIRST  },  // Arjun  (MIT)  team X
    { eventIdx: 4, participantIdx: 1, position: Position.FIRST  },  // Priya  (VIT)  team X
    { eventIdx: 4, participantIdx: 2, position: Position.FIRST  },  // Rohan  (BITS) team X
    { eventIdx: 4, participantIdx: 3, position: Position.FIRST  },  // Sneha  (NIT)  team X
    { eventIdx: 4, participantIdx: 4, position: Position.SECOND },  // Karan  (COEP) team Y
    { eventIdx: 4, participantIdx: 5, position: Position.SECOND },  // Divya  (MIT)  team Y
    { eventIdx: 4, participantIdx: 6, position: Position.SECOND },  // Aditya (VIT)  team Y
    { eventIdx: 4, participantIdx: 7, position: Position.SECOND },  // Meera  (BITS) team Y
  ];

  let resCount = 0;
  for (const r of results) {
    await prisma.eventResult.upsert({
      where: { eventId_participantId: { eventId: events[r.eventIdx].id, participantId: participants[r.participantIdx].id } },
      update: {},
      create: {
        eventId: events[r.eventIdx].id,
        participantId: participants[r.participantIdx].id,
        position: r.position,
      },
    });
    resCount++;
  }
  console.log(`✅ ${resCount} event results`);

  // ── Staff Users (OPERATOR + DESK) ─────────────────────────────────────────
  const staffUsers = [
    { name: 'Operator One', email: 'operator@fest.com', password: 'operator123', role: UserRole.OPERATOR },
    { name: 'Desk One',     email: 'desk@fest.com',     password: 'desk1234',    role: UserRole.DESK },
  ];

  for (const u of staffUsers) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (!existing) {
      await prisma.user.create({ data: { ...u, password: await hash(u.password) } });
    }
  }
  console.log(`✅ staff users (operator@fest.com / desk@fest.com)`);

  console.log('\n🎉 Seed complete!\n');
  console.log('  Admin     → a@b.com        / 12345678');
  console.log('  Operator  → operator@fest.com / operator123');
  console.log('  Desk      → desk@fest.com     / desk1234');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
