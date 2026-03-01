import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LeaderboardService } from './leaderboard.service';
import { PaginatedLeaderboardResponse } from './types/leaderboard.types';
import { QueryOptionsDto } from 'src/common/dto/query-options.dto';
import { AdjustScoreDto } from './adjust-score.dto';

@ApiTags('Leaderboard')
@Controller({ path: 'leaderboard', version: '1' })
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  // ────────────────────────────────────────────────
  // RECALCULATE LEADERBOARD
  // ────────────────────────────────────────────────
  @Post('recalculate')
  @ApiOperation({
    summary: 'Recalculate leaderboard rankings',
    description: 'Triggers recalculation of leaderboard scores and rankings.',
  })
  @ApiResponse({
    status: 200,
    description: 'Leaderboard recalculated successfully',
    schema: {
      example: { success: true },
    },
  })
  async recalculate(): Promise<{ success: boolean }> {
    return this.leaderboardService.recalculate();
  }

  // ────────────────────────────────────────────────
  // GET LEADERBOARD
  // ────────────────────────────────────────────────
  @Get()
  @ApiOperation({
    summary: 'Get leaderboard with pagination and filtering',
  })
  @ApiResponse({
    status: 200,
    description: 'Leaderboard fetched successfully',
  })
  async getLeaderboard(
    @Query() query: QueryOptionsDto,
  ): Promise<PaginatedLeaderboardResponse> {
    return this.leaderboardService.getLeaderboard(query);
  }

  @Post('adjust')
  @ApiOperation({
    summary: 'Adjust College Score (+, -)',
  })
  async adjustScore(@Body() dto: AdjustScoreDto) {
    return this.leaderboardService.adjustScore(dto);
  }
}
