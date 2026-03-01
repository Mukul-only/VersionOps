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
  UseGuards,
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
import { JwtAuthGuard } from '../auth/gaurds/jwt-auth.gaurd';
import { PermissionsGuard } from '../auth/gaurds/permission.gaurd';
import { Permission } from '../auth/decorators/permission.decorator';
import { PERMISSIONS } from '../auth/rbac/role-permissions.map';

@ApiTags('Event Results')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'event-results', version: '1' })
export class EventResultController {
  constructor(private readonly eventResultService: EventResultService) {}

  // ─────────────────────────────
  // CREATE
  // ─────────────────────────────
  @Permission(PERMISSIONS.RESULT_MANAGE)
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
  @Permission(PERMISSIONS.RESULT_MANAGE)
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
  @Permission(PERMISSIONS.RESULT_MANAGE)
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
  @Permission(PERMISSIONS.RESULT_MANAGE)
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
  @Permission(PERMISSIONS.RESULT_MANAGE)
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
