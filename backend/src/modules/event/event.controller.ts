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
import { EventService } from './event.service';
import { CreateEventDto, UpdateEventDto } from './dto';
import { QueryOptionsDto } from 'src/common/dto/query-options.dto';

@Controller({ path: 'events', version: '1' })
export class EventController {
  constructor(private readonly eventService: EventService) {}

  // ────────────────────────────────────────────────
  // GET PARTICIPANTS FOR EVENT
  // ────────────────────────────────────────────────
  @Get(':id/participants')
  async getParticipantsForEvent(
    @Query() query: QueryOptionsDto,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.eventService.getParticipantsForEvent(id, query);
  }

  // ────────────────────────────────────────────────
  // CREATE EVENT
  // ────────────────────────────────────────────────
  @Post()
  async create(@Body() dto: CreateEventDto) {
    return this.eventService.create(dto);
  }

  // ────────────────────────────────────────────────
  // GET ALL EVENTS
  // ────────────────────────────────────────────────
  @Get()
  async findAll(@Query() query: QueryOptionsDto) {
    return this.eventService.findAll(query);
  }

  // ────────────────────────────────────────────────
  // GET ONE EVENT
  // ────────────────────────────────────────────────
  @Get(':id')
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
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEventDto,
  ) {
    return this.eventService.update(id, dto);
  }

  // ────────────────────────────────────────────────
  // DELETE EVENT
  // ────────────────────────────────────────────────
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.eventService.remove(id);
  }
}
