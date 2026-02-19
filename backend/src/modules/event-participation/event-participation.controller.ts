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
import { EventParticipationService } from './event-participation.service';
import {
  BulkCopyParticipantsDto,
  CreateEventParticipationDto,
  UpdateEventParticipationDto,
} from './dto';
import { QueryOptionsDto } from 'src/common/dto/query-options.dto';

@Controller({ path: 'event-participations', version: '1' })
export class EventParticipationController {
  constructor(private readonly service: EventParticipationService) {}

  @Post('bulk-copy')
  async bulkCopyParticipants(@Body() dto: BulkCopyParticipantsDto) {
    return this.service.bulkCopyParticipants(dto);
  }

  @Post()
  async create(@Body() dto: CreateEventParticipationDto) {
    return this.service.create(dto);
  }

  @Get()
  async findAll(@Query() query: QueryOptionsDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('includeRelations') includeRelations?: string,
  ) {
    const includeRelationsBool = includeRelations === 'true';
    return this.service.findOne(id, includeRelationsBool);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEventParticipationDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
