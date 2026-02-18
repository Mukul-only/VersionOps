import { Controller, Get, Post } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { PaginatedLeaderboardResponse } from './types/leaderboard.types';
import { Query } from '@nestjs/common';
import { QueryOptionsDto } from 'src/common/dto/query-options.dto';

@Controller({ path: 'leaderboard', version: '1' })
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  // POST /leaderboard/recalculate
  @Post('recalculate')
  async recalculate(): Promise<{ success: boolean }> {
    return this.leaderboardService.recalculate();
  }

  // GET /leaderboard
  @Get()
  async getLeaderboard(
    @Query() query: QueryOptionsDto,
  ): Promise<PaginatedLeaderboardResponse> {
    return this.leaderboardService.getLeaderboard(query);
  }
}
