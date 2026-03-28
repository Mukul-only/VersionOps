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
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { EventService } from './event.service';
import { CreateEventDto, UpdateEventDto } from './dto';
import { QueryOptionsDto } from 'src/common/dto/query-options.dto';
import { JwtAuthGuard } from '../auth/gaurds/jwt-auth.gaurd';
import { PermissionsGuard } from '../auth/gaurds/permission.gaurd';
import { Permission } from '../auth/decorators/permission.decorator';
import { PERMISSIONS } from '../auth/rbac/role-permissions.map';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Events')
@Controller({ path: 'events', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EventController {
  constructor(private readonly eventService: EventService) {}

  // ────────────────────────────────────────────────
  // GET PARTICIPANTS FOR EVENT (PUBLIC)
  // ────────────────────────────────────────────────
  @Public()
  @Get(':id/participants')
  @ApiOperation({ summary: 'Get participants for a specific event (Public)' })
  @ApiParam({
    name: 'id',
    description: 'Event ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Participants fetched successfully',
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async getParticipantsForEvent(
    @Query() query: QueryOptionsDto,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.eventService.getParticipantsForEvent(id, query);
  }

  // ────────────────────────────────────────────────
  // CREATE EVENT
  // ────────────────────────────────────────────────
  @Permission(PERMISSIONS.EVENT_CREATE)
  @Post()
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({ status: 201, description: 'Event created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(@Body() dto: CreateEventDto) {
    return this.eventService.create(dto);
  }

  // ────────────────────────────────────────────────
  // GET ALL EVENTS (PUBLIC)
  // ────────────────────────────────────────────────
  @Public()
  @Get()
  @ApiOperation({
    summary: 'Get all events with filtering and pagination (Public)',
  })
  @ApiResponse({ status: 200, description: 'Events fetched successfully' })
  async findAll(@Query() query: QueryOptionsDto) {
    return this.eventService.findAll(query);
  }

  // ────────────────────────────────────────────────
  // GET ONE EVENT (PUBLIC)
  // ────────────────────────────────────────────────
  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a single event by ID (Public)' })
  @ApiParam({
    name: 'id',
    description: 'Event ID',
    example: 1,
  })
  @ApiQuery({
    name: 'includeRelations',
    required: false,
    description: 'Include related entities (true/false)',
    example: 'true',
  })
  @ApiResponse({ status: 200, description: 'Event fetched successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('includeRelations') includeRelations?: string,
  ) {
    const includeRelationsBool = includeRelations === 'true';
    return this.eventService.findOne(id, includeRelationsBool);
  }

  // ────────────────────────────────────────────────
  // UPDATE EVENT
  // ────────────────────────────────────────────────
  @Permission(PERMISSIONS.EVENT_UPDATE)
  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing event' })
  @ApiParam({
    name: 'id',
    description: 'Event ID',
    example: 1,
  })
  @ApiResponse({ status: 200, description: 'Event updated successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEventDto,
  ) {
    return this.eventService.update(id, dto);
  }

  // ────────────────────────────────────────────────
  // DELETE EVENT
  // ────────────────────────────────────────────────
  @Permission(PERMISSIONS.EVENT_DELETE)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an event by ID' })
  @ApiParam({
    name: 'id',
    description: 'Event ID',
    example: 1,
  })
  @ApiResponse({ status: 200, description: 'Event deleted successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.eventService.remove(id);
  }
}
