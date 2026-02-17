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
import { CollegeService } from './college.service';
import { CreateCollegeDto, UpdateCollegeDto } from './dto';
import { QueryOptionsDto } from 'src/common/dto/query-options.dto';

@Controller({ path: 'colleges', version: '1' })
export class CollegeController {
  constructor(private readonly collegeService: CollegeService) {}

  // ────────────────────────────────────────────────
  // CREATE COLLEGE
  // ────────────────────────────────────────────────
  @Post()
  async create(@Body() dto: CreateCollegeDto) {
    return this.collegeService.create(dto);
  }

  // ────────────────────────────────────────────────
  // GET ALL COLLEGES
  // ────────────────────────────────────────────────
  @Get()
  async findAll(@Query() query: QueryOptionsDto) {
    return this.collegeService.findAll(query);
  }

  // ────────────────────────────────────────────────
  // GET ONE COLLEGE
  // ────────────────────────────────────────────────
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.collegeService.findOne(id);
  }

  // ────────────────────────────────────────────────
  // UPDATE COLLEGE
  // ────────────────────────────────────────────────
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCollegeDto,
  ) {
    return this.collegeService.update(id, dto);
  }

  // ────────────────────────────────────────────────
  // DELETE COLLEGE
  // ────────────────────────────────────────────────
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.collegeService.remove(id);
  }
}
