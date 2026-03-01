import { SetMetadata } from '@nestjs/common';
import { AppPermission } from '../rbac/role-permissions.map';

export const PERMISSION_KEY = 'permission';

export const Permission = (permission: AppPermission) =>
  SetMetadata(PERMISSION_KEY, permission);
