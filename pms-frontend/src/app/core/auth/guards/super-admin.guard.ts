import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../../services/notification.service';

export const superAdminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const notif = inject(NotificationService);

  if (authService.hasRole('ROLE_OWNER') || authService.hasRole('SUPER_ADMIN') || authService.hasPermission('SETTINGS_MANAGE')) {
    return true;
  }

  notif.show('Access Denied: Only Super Admin can access Settings.', 'error');
  router.navigate(['/dashboard']);
  return false;
};
