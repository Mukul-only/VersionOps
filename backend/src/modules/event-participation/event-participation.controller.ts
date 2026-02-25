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
} from '@nestjs/swagger';

import { EventParticipationService } from './event-participation.service';
import {
  BulkCopyParticipantsDto,
  CreateEventParticipationDto,
  UpdateEventParticipationDto,
} from './dto';
import { QueryOptionsDto } from 'src/common/dto/query-options.dto';

@ApiTags('Event Participations')
@Controller({ path: 'event-participations', version: '1' })
export class EventParticipationController {
  constructor(private readonly service: EventParticipationService) {}

  // ─────────────────────────────
  // BULK COPY PARTICIPANTS
  // ─────────────────────────────
  @Post('bulk-copy')
  @ApiOperation({
    summary: 'Bulk copy participants from one event to another',
  })
  @ApiResponse({
    status: 200,
    description: 'Participants copied successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid event IDs or participants',
  })
  bulkCopyParticipants(@Body() dto: BulkCopyParticipantsDto) {
    return this.service.bulkCopyParticipants(dto);
  }

  // ─────────────────────────────
  // CREATE
  // ─────────────────────────────
  @Post()
  @ApiOperation({
    summary: 'Create event participation (assign participant to event)',
  })
  @ApiResponse({
    status: 201,
    description: 'Participation created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  create(@Body() dto: CreateEventParticipationDto) {
    return this.service.create(dto);
  }

  // ─────────────────────────────
  // GET ALL
  // ─────────────────────────────
  @Get()
  @ApiOperation({
    summary: 'Get all event participations with pagination and filtering',
  })
  @ApiResponse({
    status: 200,
    description: 'Event participations fetched successfully',
  })
  findAll(@Query() query: QueryOptionsDto) {
    return this.service.findAll(query);
  }

  // ─────────────────────────────
  // GET ONE
  // ─────────────────────────────
  @Get(':id')
  @ApiOperation({
    summary: 'Get single event participation by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Event participation ID',
    example: 1,
  })
  @ApiQuery({
    name: 'includeRelations',
    required: false,
    description: 'Include related entities (true/false)',
    example: 'true',
  })
  @ApiResponse({
    status: 200,
    description: 'Event participation fetched successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Event participation not found',
  })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('includeRelations') includeRelations?: string,
  ) {
    const includeRelationsBool = includeRelations === 'true';
    return this.service.findOne(id, includeRelationsBool);
  }

  // ─────────────────────────────
  // UPDATE
  // ─────────────────────────────
  @Patch(':id')
  @ApiOperation({
    summary: 'Update event participation',
  })
  @ApiParam({
    name: 'id',
    description: 'Event participation ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Event participation updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Event participation not found',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEventParticipationDto,
  ) {
    return this.service.update(id, dto);
  }

  // ─────────────────────────────
  // DELETE
  // ─────────────────────────────
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete event participation by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Event participation ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Event participation deleted successfully',
    schema: {
      example: { success: true },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Event participation not found',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
