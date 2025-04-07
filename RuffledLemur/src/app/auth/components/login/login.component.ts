import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  error = '';
  returnUrl: string;

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {
    //Redirect if already logged in
    if(this.authService.isLoggedIn()) {
      this.router.navigate(['/']);
    }
    this.loginForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });

    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  ngOnInit(): void {
    //check for SSO callback params
    this.route.queryParams.subscribe(params => {
      const code = params['code'];
      const state = params['state'];

      if(code && state) {
        this.handleSSOCallback(code, state);
      }
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.login(this.loginForm.value)
      .subscribe({
        next: () => {
          this.router.navigate([this.returnUrl]);
        },
        error: err => {
          this.error = err.message || 'Login Failed';
          this.loading = false;
        }
      });

  }

  loginWithSSO(provider: string): void {
    this.authService.initiateSSOLogin(provider);
  }

  private handleSSOCallback(code: string, state: string): void {
    this.loading = true;

    this.authService.handleSSOCallback(code, state)
    .subscribe({
      next: () => {
        this.router.navigate([this.returnUrl]);
      },
      error: err => {
        this.error = err.message || 'SSO Authentication failed';
        this.loading = false;
      }
    });

  }
}
