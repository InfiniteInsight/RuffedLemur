// frontend/RuffedLemur/src/app/plugins/components/plugin-install-dialog/plugin-install-dialog.component.ts
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PluginType, AvailablePlugin } from '../../../shared/models/plugin.model';

export interface PluginInstallDialogData {
  availablePlugins: AvailablePlugin[];
}

@Component({
  selector: 'app-plug,in-install-dialog',
  templateUrl: './plugin-install-dialog.component.html',
  styleUrls: ['./plugin-install-dialog.component.scss']
})
export class PluginInstallDialogComponent implements OnInit {
  installForm: FormGroup;
  filteredPlugins: AvailablePlugin[] = [];
  allPlugins: AvailablePlugin[] = [];
  searchText = '';
  pluginTypes = Object.values(PluginType);
  selectedType: PluginType | null = null;

  constructor(
    public dialogRef: MatDialogRef<PluginInstallDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PluginInstallDialogData,
    private fb: FormBuilder
  ) {
    this.installForm = this.fb.group({
      pluginName: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.allPlugins = [...this.data.availablePlugins];
    this.filteredPlugins = [...this.allPlugins];

    // Watch for search changes
    this.installForm.get('pluginName')?.valueChanges.subscribe(value => {
      this.applyFilters(value, this.selectedType);
    });
  }

  applyFilters(search: string | null, type: PluginType | null): void {
    let result = [...this.allPlugins];

    // Filter by search text
    if (search) {
      result = result.filter(plugin =>
        plugin.name.toLowerCase().includes(search.toLowerCase()) ||
        (plugin.description && plugin.description.toLowerCase().includes(search.toLowerCase()))
      );
    }

    // Filter by plugin type
    if (type) {
      result = result.filter(plugin => plugin.type === type);
    }

    this.filteredPlugins = result;
  }

  filterByType(type: PluginType | null): void {
    this.selectedType = type;
    const searchText = this.installForm.get('pluginName')?.value || '';
    this.applyFilters(searchText, type);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onInstall(): void {
    if (this.installForm.valid) {
      const pluginName = this.installForm.get('pluginName')?.value;
      // Find the complete plugin object to return
      const selectedPlugin = this.allPlugins.find(plugin => plugin.name === pluginName);
      this.dialogRef.close(selectedPlugin);
    }
  }

  getPluginTypeLabel(type: PluginType): string {
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  selectPlugin(plugin: AvailablePlugin): void {
    this.installForm.get('pluginName')?.setValue(plugin.name);
  }
}
