import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
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

import { EventResultService } from './event-result.service';
import { CreateEventResultDto, UpdateEventResultDto } from './dto';
import { QueryOptionsDto } from 'src/common/dto/query-options.dto';
import {
  EventResultResponse,
  PaginatedEventResultResponse,
} from './types/event-result.types';

@ApiTags('Event Results')
@Controller({ path: 'event-results', version: '1' })
export class EventResultController {
  constructor(private readonly eventResultService: EventResultService) {}

  // ─────────────────────────────
  // CREATE
  // ─────────────────────────────
  @Post()
  @ApiOperation({
    summary: 'Create event result (assign position to participant)',
  })
  @ApiResponse({
    status: 201,
    description: 'Event result created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  create(@Body() dto: CreateEventResultDto): Promise<EventResultResponse> {
    return this.eventResultService.create(dto);
  }

  // ─────────────────────────────
  // GET ALL
  // ─────────────────────────────
  @Get()
  @ApiOperation({
    summary: 'Get all event results with pagination and filtering',
  })
  @ApiResponse({
    status: 200,
    description: 'Event results fetched successfully',
  })
  findAll(
    @Query() query: QueryOptionsDto,
  ): Promise<PaginatedEventResultResponse> {
    return this.eventResultService.findAll(query);
  }

  // ─────────────────────────────
  // GET ONE
  // ─────────────────────────────
  @Get(':id')
  @ApiOperation({ summary: 'Get a single event result by ID' })
  @ApiParam({
    name: 'id',
    description: 'Event result ID',
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
    description: 'Event result fetched successfully',
  })
  @ApiResponse({ status: 404, description: 'Event result not found' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('includeRelations') includeRelations?: string,
  ): Promise<EventResultResponse> {
    return this.eventResultService.findOne(id, includeRelations === 'true');
  }

  // ─────────────────────────────
  // UPDATE
  // ─────────────────────────────
  @Patch(':id')
  @ApiOperation({ summary: 'Update event result' })
  @ApiParam({
    name: 'id',
    description: 'Event result ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Event result updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Event result not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEventResultDto,
  ): Promise<EventResultResponse> {
    return this.eventResultService.update(id, dto);
  }

  // ─────────────────────────────
  // DELETE
  // ─────────────────────────────
  @Delete(':id')
  @ApiOperation({ summary: 'Delete event result by ID' })
  @ApiParam({
    name: 'id',
    description: 'Event result ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Event result deleted successfully',
    schema: {
      example: { success: true },
    },
  })
  @ApiResponse({ status: 404, description: 'Event result not found' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<{ success: boolean }> {
    return this.eventResultService.remove(id);
  }
}
