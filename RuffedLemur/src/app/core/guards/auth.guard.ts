import { Injectable } from "@angular/core";
import { CanActivate, ActivatedRouteSnapshot, Router, GuardResult, MaybeAsync, RouterStateSnapshot } from "@angular/router";
import { AuthService } from "../services/auth/auth.service";

@Injectable({
  providedIn: 'root'
})

export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if(this.authService.isLoggedIn()){
      //check for required roles if specified
      const requiredRoles = route.data['roles'] as Array<string>;
      if(requiredRoles) {
        const hasRequiredRole = requiredRoles.some(role => this.authService.hasRole(role));
        if(!hasRequiredRole) {
          this.router.navigate(['/unauthorized']);
          return false;
        }
      }
      return true;
    }

    //Store the attempted url for redirecting after login
    this.router.navigate(['/auth/login'], {queryParams: {returnUrl: state.url}});
    return false;
  }
}
