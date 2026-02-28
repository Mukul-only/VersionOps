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
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { ParticipantService } from './participant.service';
import { BulkImportService } from './bulk-import.service';
import { CreateParticipantDto, UpdateParticipantDto } from './dto';
import { QueryOptionsDto } from 'src/common/dto/query-options.dto';
import {
  BulkParticipantInput,
  BulkImportResult,
} from './types/participants.types';

@ApiTags('Participants')
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
  @ApiOperation({ summary: 'Bulk import participants' })
  @ApiBody({
    description: 'Array of participant data for bulk import',
    type: [Object], // Replace with class if converted from type
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk import completed',
  })
  async bulkImport(
    @Body() data: BulkParticipantInput[],
  ): Promise<BulkImportResult> {
    return this.bulkImportService.bulkImport(data);
  }

  // ────────────────────────────────────────────────
  // CHECK-IN PARTICIPANT
  // ────────────────────────────────────────────────
  @Post(':id/check-in')
  @ApiOperation({ summary: 'Check-in a participant' })
  @ApiParam({
    name: 'id',
    description: 'Participant ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Participant checked-in successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Participant not found',
  })
  async checkIn(@Param('id', ParseIntPipe) id: number) {
    return this.participantService.updateFestStatus(id, 'check-in');
  }

  // ────────────────────────────────────────────────
  // MARK PARTICIPANT AS NO-SHOW
  // ────────────────────────────────────────────────
  @Post(':id/no-show')
  @ApiOperation({ summary: 'Mark participant as no-show' })
  @ApiParam({
    name: 'id',
    description: 'Participant ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Participant marked as no-show successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Participant not found',
  })
  async markNoShow(@Param('id', ParseIntPipe) id: number) {
    return this.participantService.updateFestStatus(id, 'no-show');
  }

  // ────────────────────────────────────────────────
  // MARK PARTICIPANT AS REGISTERED
  // ────────────────────────────────────────────────
  @Post(':id/registered')
  @ApiOperation({ summary: 'Mark participant as registered' })
  @ApiParam({
    name: 'id',
    description: 'Participant ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Participant marked as registered successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Participant not found',
  })
  async markRegistered(@Param('id', ParseIntPipe) id: number) {
    return this.participantService.updateFestStatus(id, 'registered');
  }
  // ────────────────────────────────────────────────
  // CREATE PARTICIPANT
  // ────────────────────────────────────────────────
  @Post()
  @ApiOperation({ summary: 'Create a new participant' })
  @ApiResponse({ status: 201, description: 'Participant created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(@Body() dto: CreateParticipantDto) {
    return this.participantService.create(dto);
  }

  // ────────────────────────────────────────────────
  // GET ALL PARTICIPANTS
  // ────────────────────────────────────────────────
  @Get()
  @ApiOperation({
    summary: 'Get all participants with filtering and pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Participants fetched successfully',
  })
  async findAll(@Query() query: QueryOptionsDto) {
    return this.participantService.findAll(query);
  }

  // ────────────────────────────────────────────────
  // GET ONE PARTICIPANT
  // ────────────────────────────────────────────────
  @Get(':id')
  @ApiOperation({ summary: 'Get a single participant by ID' })
  @ApiParam({
    name: 'id',
    description: 'Participant ID',
    example: 1,
  })
  @ApiQuery({
    name: 'includeRelations',
    required: false,
    description: 'Include related entities (true/false)',
    example: 'true',
  })
  @ApiResponse({ status: 200, description: 'Participant fetched successfully' })
  @ApiResponse({ status: 404, description: 'Participant not found' })
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
  @ApiOperation({ summary: 'Update an existing participant' })
  @ApiParam({
    name: 'id',
    description: 'Participant ID',
    example: 1,
  })
  @ApiResponse({ status: 200, description: 'Participant updated successfully' })
  @ApiResponse({ status: 404, description: 'Participant not found' })
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
  @ApiOperation({ summary: 'Delete a participant by ID' })
  @ApiParam({
    name: 'id',
    description: 'Participant ID',
    example: 1,
  })
  @ApiResponse({ status: 200, description: 'Participant deleted successfully' })
  @ApiResponse({ status: 404, description: 'Participant not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.participantService.remove(id);
  }
}
