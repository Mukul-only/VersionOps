import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ParticipantService } from './participant.service';
import { BulkImportService } from './bulk-import.service';
import { CreateParticipantDto, UpdateParticipantDto } from './dto';
import { QueryOptionsDto } from 'src/common/dto/query-options.dto';
import {
  BulkParticipantInput,
  BulkImportResult,
} from './types/participants.types';

@Controller({ path: 'participants', version: '1' })
export class ParticipantController {
  constructor(
    private readonly participantService: ParticipantService,
    private readonly bulkImportService: BulkImportService,
  ) {}

  // ────────────────────────────────────────────────
  // BULK IMPORT PARTICIPANTS
  // ────────────────────────────────────────────────
  @Post('bulk-import')
  async bulkImport(
    @Body() data: BulkParticipantInput[],
  ): Promise<BulkImportResult> {
    return this.bulkImportService.bulkImport(data);
  }

  // ────────────────────────────────────────────────
  // CREATE PARTICIPANT
  // ────────────────────────────────────────────────
  @Post()
  async create(@Body() dto: CreateParticipantDto) {
    return this.participantService.create(dto);
  }

  // ────────────────────────────────────────────────
  // GET ALL PARTICIPANTS
  // ────────────────────────────────────────────────
  @Get()
  async findAll(@Query() query: QueryOptionsDto) {
    return this.participantService.findAll(query);
  }

  // ────────────────────────────────────────────────
  // GET ONE PARTICIPANT
  // ────────────────────────────────────────────────
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('includeRelations') includeRelations?: string,
  ) {
    const includeRelationsBool = includeRelations === 'true';
    return this.participantService.findOne(id, includeRelationsBool);
  }

  // ────────────────────────────────────────────────
  // UPDATE PARTICIPANT
  // ────────────────────────────────────────────────
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateParticipantDto,
  ) {
    return this.participantService.update(id, dto);
  }

  // ────────────────────────────────────────────────
  // DELETE PARTICIPANT
  // ────────────────────────────────────────────────
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.participantService.remove(id);
  }
}
