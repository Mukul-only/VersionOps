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
import { CollegeService } from './college.service';
import { CreateCollegeDto, UpdateCollegeDto } from './dto';
import { QueryOptionsDto } from 'src/common/dto/query-options.dto';
import { JwtAuthGuard } from '../auth/gaurds/jwt-auth.gaurd';
import { PermissionsGuard } from '../auth/gaurds/permission.gaurd';
import { Permission } from '../auth/decorators/permission.decorator';
import { PERMISSIONS } from '../auth/rbac/role-permissions.map';

@ApiTags('Colleges')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'colleges', version: '1' })
export class CollegeController {
  constructor(private readonly collegeService: CollegeService) {}

  // ────────────────────────────────────────────────
  // CREATE COLLEGE
  // ────────────────────────────────────────────────
  @Permission(PERMISSIONS.COLLEGE_CREATE)
  @Post()
  @ApiOperation({ summary: 'Create a new college' })
  @ApiResponse({ status: 201, description: 'College created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(@Body() dto: CreateCollegeDto) {
    return this.collegeService.create(dto);
  }

  // ────────────────────────────────────────────────
  // GET ALL COLLEGES
  // ────────────────────────────────────────────────
  @Permission(PERMISSIONS.COLLEGE_READ)
  @Get()
  @ApiOperation({ summary: 'Get all colleges with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Colleges fetched successfully' })
  async findAll(@Query() query: QueryOptionsDto) {
    return this.collegeService.findAll(query);
  }

  // ────────────────────────────────────────────────
  // GET ONE COLLEGE
  // ────────────────────────────────────────────────
  @Permission(PERMISSIONS.COLLEGE_READ)
  @Get(':id')
  @ApiOperation({ summary: 'Get a single college by ID' })
  @ApiParam({
    name: 'id',
    description: 'College ID',
    example: 1,
  })
  @ApiQuery({
    name: 'includeRelations',
    required: false,
    description: 'Include related entities (true/false)',
    example: 'true',
  })
  @ApiResponse({ status: 200, description: 'College fetched successfully' })
  @ApiResponse({ status: 404, description: 'College not found' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('includeRelations') includeRelations?: string,
  ) {
    const includeRelationsBool = includeRelations === 'true';
    return this.collegeService.findOne(id, includeRelationsBool);
  }

  // ────────────────────────────────────────────────
  // UPDATE COLLEGE
  // ────────────────────────────────────────────────
  @Permission(PERMISSIONS.COLLEGE_UPDATE)
  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing college' })
  @ApiParam({
    name: 'id',
    description: 'College ID',
    example: 1,
  })
  @ApiResponse({ status: 200, description: 'College updated successfully' })
  @ApiResponse({ status: 404, description: 'College not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCollegeDto,
  ) {
    return this.collegeService.update(id, dto);
  }

  // ────────────────────────────────────────────────
  // DELETE COLLEGE
  // ────────────────────────────────────────────────
  @Permission(PERMISSIONS.COLLEGE_DELETE)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a college by ID' })
  @ApiParam({
    name: 'id',
    description: 'College ID',
    example: 1,
  })
  @ApiResponse({ status: 200, description: 'College deleted successfully' })
  @ApiResponse({ status: 404, description: 'College not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.collegeService.remove(id);
  }
}
