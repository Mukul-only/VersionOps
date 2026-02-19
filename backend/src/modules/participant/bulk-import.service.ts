import { Injectable, BadRequestException } from '@nestjs/common';
import { ParticipantService } from './participant.service';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  BulkParticipantInput,
  BulkImportResult,
  BulkImportError,
} from './types/participants.types';

@Injectable()
export class BulkImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly participantService: ParticipantService,
  ) {}

  // ─────────────────────────────
  // BULK IMPORT PARTICIPANTS
  // ─────────────────────────────
  async bulkImport(data: BulkParticipantInput[]): Promise<BulkImportResult> {
    if (!Array.isArray(data) || data.length === 0) {
      throw new BadRequestException('Invalid or empty import data');
    }

    const errors: BulkImportError[] = [];
    let inserted = 0;

    // 🔹 Preload colleges
    const colleges = await this.prisma.college.findMany({
      select: { id: true, code: true },
    });

    const collegeMap = new Map(colleges.map((c) => [c.code, c.id]));

    // 🔹 Process row by row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];

      try {
        const collegeId = collegeMap.get(row.collegeCode);

        if (!collegeId) {
          errors.push({
            index: i,
            email: row.email,
            reason: `College code not found: ${row.collegeCode}`,
          });
          continue;
        }

        // Call existing create()
        await this.participantService.create({
          name: row.name,
          email: row.email,
          collegeId,
          year: row.year,
          hackerearthUser: row.hackerearthUser,
          phone: row.phone,
        });

        inserted++;
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        errors.push({
          index: i,
          email: row.email,
          reason: errorMessage,
        });
      }
    }

    return {
      total: data.length,
      inserted,
      failed: errors.length,
      errors,
    };
  }
}
