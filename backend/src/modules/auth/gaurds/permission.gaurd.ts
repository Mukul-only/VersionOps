import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from '../decorators/permission.decorator';
import { ROLE_PERMISSIONS, AppPermission } from '../rbac/role-permissions.map';
import { AuthenticatedUser } from '../strategies/access-token.strategy';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermission = this.reflector.getAllAndOverride<AppPermission>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermission) return true;

    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();

    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not found in request');
    }

    if (!user.role) {
      throw new UnauthorizedException('Unauthorized');
    }

    const role = user.role;

    const rolePermissions = ROLE_PERMISSIONS[role];

    if (rolePermissions[0] === '*') {
      return true;
    }

    if (
      (rolePermissions as readonly AppPermission[]).includes(requiredPermission)
    ) {
      return true;
    }

    throw new ForbiddenException('Access denied');
  }
}
