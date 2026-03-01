import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/gaurds/jwt-auth.gaurd';
import { Permission } from '../auth/decorators/permission.decorator';
import { PERMISSIONS } from '../auth/rbac/role-permissions.map';
import { PermissionsGuard } from '../auth/gaurds/permission.gaurd';
@Controller({ path: 'users', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Permission(PERMISSIONS.USERS_MANAGE)
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }
  @Permission(PERMISSIONS.USERS_MANAGE)
  @Get()
  findAll() {
    return this.userService.findAll();
  }
  @Permission(PERMISSIONS.USERS_MANAGE)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }
  @Permission(PERMISSIONS.USERS_MANAGE)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto);
  }
  @Permission(PERMISSIONS.USERS_MANAGE)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
