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

import { EventResultService } from './event-result.service';
import { CreateEventResultDto, UpdateEventResultDto } from './dto';
import { QueryOptionsDto } from 'src/common/dto/query-options.dto';
import {
  EventResultResponse,
  PaginatedEventResultResponse,
} from './types/event-result.types';

@Controller({ path: 'event-results', version: '1' })
export class EventResultController {
  constructor(private readonly eventResultService: EventResultService) {}

  // ─────────────────────────────
  // CREATE
  // ─────────────────────────────
  @Post()
  create(@Body() dto: CreateEventResultDto): Promise<EventResultResponse> {
    return this.eventResultService.create(dto);
  }

  // ─────────────────────────────
  // GET ALL
  // ─────────────────────────────
  @Get()
  findAll(
    @Query() query: QueryOptionsDto,
  ): Promise<PaginatedEventResultResponse> {
    return this.eventResultService.findAll(query);
  }

  // ─────────────────────────────
  // GET ONE
  // ─────────────────────────────
  @Get(':id')
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
  remove(@Param('id', ParseIntPipe) id: number): Promise<{ success: boolean }> {
    return this.eventResultService.remove(id);
  }
}
