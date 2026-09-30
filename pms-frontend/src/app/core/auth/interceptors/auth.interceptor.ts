import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const notificationService = inject(NotificationService);
  const router = inject(Router);
  const token = authService.getToken();

  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      const isLoginRequest = req.url.includes('/auth/login');

      // If it's a login attempt, let LoginComponent display the in-card error banner without queuing toasts
      if (isLoginRequest) {
        return throwError(() => error);
      }

      let userFriendlyMessage = '';

      if (error.status === 0) {
        // Network / Connection drop
        userFriendlyMessage = 'Network Connection Error: Unable to reach the pharmacy backend server. Please check your internet connection or verify the server is running.';
        notificationService.error(userFriendlyMessage);
      } 
      else if (error.status === 401) {
        userFriendlyMessage = error.error?.message || 'Your login session has expired. Please sign in again to continue.';
        notificationService.warning(userFriendlyMessage);
        authService.logout();
      } 
      else if (error.status === 403) {
        // Forbidden: Permission denied or account deactivated
        const serverMsg = (error.error?.message || '').toLowerCase();
        if (serverMsg.includes('deactivated') || serverMsg.includes('suspended')) {
          userFriendlyMessage = error.error?.message || 'Account Suspended: Your staff account has been deactivated or suspended by the administrator. Please contact pharmacy management.';
          notificationService.error(userFriendlyMessage);
          authService.logout();
        } else {
          userFriendlyMessage = error.error?.message || 'Permission Denied: You do not have the required permissions to perform this action (e.g., adding/editing medications, adjusting stock, or changing settings). Please contact your administrator.';
          notificationService.error(userFriendlyMessage);
        }
      } 
      else if (error.status === 404) {
        userFriendlyMessage = error.error?.message || 'Resource Not Found: The requested item or record could not be found or may have been deleted.';
      } 
      else if (error.status === 409) {
        userFriendlyMessage = error.error?.message || 'Conflict: The requested change conflicts with existing records (such as duplicate barcodes, stock concurrency, or linked invoices).';
        notificationService.warning(userFriendlyMessage);
      } 
      else if (error.status === 400 || error.status === 422) {
        if (error.error?.message) {
          userFriendlyMessage = error.error.message;
        } else if (error.error?.errors) {
          userFriendlyMessage = Object.values(error.error.errors).join('; ');
        } else {
          userFriendlyMessage = 'Invalid Request: Please check the submitted form values and required fields.';
        }
      } 
      else if (error.status === 500) {
        userFriendlyMessage = error.error?.message || 'System Error: A temporary server error occurred while processing your request. Please try again or contact support.';
        notificationService.error(userFriendlyMessage);
      } 
      else if (error.status === 502 || error.status === 503 || error.status === 504) {
        userFriendlyMessage = 'Service Unavailable: The pharmacy backend server is currently offline or restarting. Please retry in a few moments.';
        notificationService.error(userFriendlyMessage);
      }

      return throwError(() => error);
    })
  );
};

