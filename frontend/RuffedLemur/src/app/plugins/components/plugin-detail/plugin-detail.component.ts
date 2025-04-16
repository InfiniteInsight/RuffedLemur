// src/app/plugins/components/plugin-detail/plugin-detail.component.ts

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Plugin } from '../../../shared/models/plugin.model';
import { PluginService } from '../../services/plugin.service';
import { ErrorService } from '../../../core/services/error/error.service';

@Component({
  selector: 'app-plugin-detail',
  templateUrl: './plugin-detail.component.html',
  styleUrls: ['./plugin-detail.component.scss']
})
export class PluginDetailComponent implements OnInit {
  pluginId: number;
  plugin: Plugin | null = null;
  isLoading = true;
  isSaving = false;
  error = '';
  configForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pluginService: PluginService,
    private errorService: ErrorService,
    private fb: FormBuilder
  ) {
    this.pluginId = +this.route.snapshot.paramMap.get('id')!;
    this.configForm = this.fb.group({});
  }

  ngOnInit(): void {
    this.loadPlugin();
  }

  loadPlugin(): void {
    this.isLoading = true;
    this.pluginService.getPlugin(this.pluginId).subscribe({
      next: (data) => {
        this.plugin = data;
        this.createConfigForm(data.options || {});
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load plugin details';
        this.errorService.logError(err);
        this.isLoading = false;
      }
    });
  }

  createConfigForm(options: any): void {
    // Clear existing form
    this.configForm = this.fb.group({});

    // Create form controls for each option
    if (options) {
      Object.keys(options).forEach(key => {
        const value = options[key];
        const validators = [];

        // Here we would add validators based on the option metadata
        // For simplicity, we're not implementing advanced validation

        this.configForm.addControl(key, this.fb.control(value, validators));
      });
    }
  }

  onSubmit(): void {
    if (this.configForm.invalid) {
      this.markFormGroupTouched(this.configForm);
      return;
    }

    this.isSaving = true;

    const updatedPlugin = {
      ...this.plugin,
      options: this.configForm.value
    };

    this.pluginService.updatePlugin(this.pluginId, updatedPlugin).subscribe({
      next: (data) => {
        this.plugin = data;
        this.isSaving = false;
        // Show success message
      },
      error: (err) => {
        this.error = 'Failed to update plugin configuration';
        this.errorService.logError(err);
        this.isSaving = false;
      }
    });
  }

  togglePluginStatus(): void {
    if (!this.plugin) return;

    const action = this.plugin.enabled ?
      this.pluginService.disablePlugin(this.pluginId) :
      this.pluginService.enablePlugin(this.pluginId);

    action.subscribe({
      next: (updatedPlugin) => {
        this.plugin = updatedPlugin;
      },
      error: (err) => {
        this.error = `Failed to ${this.plugin?.enabled ? 'disable' : 'enable'} plugin`;
        this.errorService.logError(err);
      }
    });
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/plugins']);
  }

  getPluginTypeLabel(type: string): string {
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  getFormControlKeys(): string[] {
    return Object.keys(this.configForm.controls);
  }
}
