// src/app/shared/components/plugin-config/plugin-config.component.ts
import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-plugin-config',
  templateUrl: './plugin-config.component.html',
  styleUrls: ['./plugin-config.component.scss']
})
export class PluginConfigComponent implements OnInit, OnChanges {
  @Input() pluginSchema: any;
  @Input() existingConfig: any = {};
  @Output() configChange = new EventEmitter<any>();

  configForm: FormGroup;
  formFields: any[] = [];

  constructor(private fb: FormBuilder) {
    this.configForm = this.fb.group({});
  }

  ngOnInit(): void {
    this.buildForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes.pluginSchema && !changes.pluginSchema.firstChange) ||
        (changes.existingConfig && !changes.existingConfig.firstChange)) {
      this.buildForm();
    }
  }

  /**
   * Build form based on plugin schema
   */
  buildForm(): void {
    if (!this.pluginSchema) {
      return;
    }

    // Reset form
    this.configForm = this.fb.group({});
    this.formFields = [];

    // Process each property in the schema
    if (this.pluginSchema.properties) {
      Object.keys(this.pluginSchema.properties).forEach(key => {
        const prop = this.pluginSchema.properties[key];
        const isRequired = this.pluginSchema.required?.includes(key) || false;

        // Create validators based on schema
        const validators = [];
        if (isRequired) {
          validators.push(Validators.required);
        }

        // Add validation based on property type
        if (prop.type === 'string' && prop.minLength) {
          validators.push(Validators.minLength(prop.minLength));
        }
        if (prop.type === 'number' || prop.type === 'integer') {
          if (prop.minimum !== undefined) {
            validators.push(Validators.min(prop.minimum));
          }
          if (prop.maximum !== undefined) {
            validators.push(Validators.max(prop.maximum));
          }
        }
        if (prop.pattern) {
          validators.push(Validators.pattern(prop.pattern));
        }

        // Get default value or existing value
        const value = this.existingConfig[key] !== undefined
          ? this.existingConfig[key]
          : prop.default;

        // Add control to form
        this.configForm.addControl(key, this.fb.control(value, validators));

        // Add to form fields array for template rendering
        this.formFields.push({
          key,
          label: prop.title || this.formatLabel(key),
          type: this.getInputType(prop),
          description: prop.description,
          required: isRequired,
          options: prop.enum || [],
          placeholder: prop.examples?.[0] || ''
        });
      });
    }

    // Subscribe to form changes
    this.configForm.valueChanges.subscribe(value => {
      this.configChange.emit(value);
    });
  }

  /**
   * Format field label from camelCase or snake_case
   */
  private formatLabel(key: string): string {
    // Convert camelCase or snake_case to Title Case With Spaces
    return key
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  /**
   * Get input type based on property type
   */
  private getInputType(prop: any): string {
    if (prop.enum) {
      return 'select';
    }

    switch (prop.type) {
      case 'boolean':
        return 'checkbox';
      case 'integer':
      case 'number':
        return 'number';
      case 'string':
        if (prop.format === 'password') {
          return 'password';
        }
        if (prop.format === 'date-time') {
          return 'datetime-local';
        }
        if (prop.format === 'date') {
          return 'date';
        }
        if (prop.format === 'email') {
          return 'email';
        }
        if (prop.format === 'uri') {
          return 'url';
        }
        return 'text';
      default:
        return 'text';
    }
  }
}
