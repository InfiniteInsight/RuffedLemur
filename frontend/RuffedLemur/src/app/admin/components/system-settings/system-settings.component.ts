import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { SystemSetting, SettingCategory } from '../../../shared/models/admin.model';
import { AdminService } from '../../services/admin.service';
import { ErrorService } from '../../../core/services/error/error.service';

@Component({
  selector: 'app-system-settings',
  templateUrl: './system-settings.component.html',
  styleUrls: ['./system-settings.component.scss']
})
export class SystemSettingsComponent implements OnInit {
  settingsForm: FormGroup;
  settings: SystemSetting[] = [];
  filteredSettings: SystemSetting[] = [];
  isLoading = true;
  isSaving = false;
  error = '';
  successMessage = '';

  // For filtering by category
  categories = Object.values(SettingCategory);
  selectedCategory: SettingCategory | null = null;

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private errorService: ErrorService
  ) {
    this.settingsForm = this.fb.group({});
  }

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.isLoading = true;

    this.adminService.getSettings().subscribe({
      next: (data) => {
        this.settings = data;
        this.filteredSettings = [...data];

        // Create form controls for each setting
        this.createSettingsForm();

        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load system settings';
        this.errorService.logError(err);
        this.isLoading = false;
      }
    });
  }

  createSettingsForm(): void {
    // Clear existing form controls
    this.settingsForm = this.fb.group({});

    // Create a form control for each setting
    this.settings.forEach(setting => {
      this.settingsForm.addControl(setting.key, this.fb.control({
        value: setting.value,
        disabled: !setting.editable
      }));
    });
  }

  filterByCategory(category: SettingCategory | null): void {
    this.selectedCategory = category;

    if (category === null) {
      // Show all settings
      this.filteredSettings = [...this.settings];
    } else {
      // Filter settings by category
      this.filteredSettings = this.settings.filter(s => s.category === category);
    }
  }

  saveSetting(setting: SystemSetting): void {
    // Skip if setting is not editable
    if (!setting.editable) return;

    const newValue = this.settingsForm.get(setting.key)?.value;

    // Skip if value hasn't changed
    if (newValue === setting.value) return;

    this.isSaving = true;

    this.adminService.updateSetting(setting.key, newValue).subscribe({
      next: (updatedSetting) => {
        // Update the setting in our local array
        const index = this.settings.findIndex(s => s.key === setting.key);
        if (index !== -1) {
          this.settings[index] = updatedSetting;
        }

        this.successMessage = `Setting "${setting.key}" updated successfully`;

        // Clear success message after 3 seconds
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);

        this.isSaving = false;
      },
      error: (err) => {
        this.error = `Failed to update setting "${setting.key}"`;
        this.errorService.logError(err);

        // Reset the form control to the original value
        this.settingsForm.get(setting.key)?.setValue(setting.value);

        this.isSaving = false;
      }
    });
  }

  getCategoryLabel(category: SettingCategory): string {
    return category.charAt(0).toUpperCase() + category.slice(1);
  }

  getSettingTypeIcon(value: string): string {
    // Try to determine the type of the setting value
    if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
      return 'toggle_on'; // Boolean
    } else if (!isNaN(Number(value))) {
      return 'pin'; // Number
    } else if (value.startsWith('http')) {
      return 'link'; // URL
    } else if (value.includes('@')) {
      return 'email'; // Email
    } else {
      return 'text_fields'; // Text
    }
  }
}
