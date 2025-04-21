// plugin-list.component.spec.ts - Corrected version with null check
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { PluginListComponent } from './plugin-list.component';
import { PluginService } from '../../services/plugin.service';
import { ErrorService } from '../../../core/services/error/error.service';
import { Plugin, PluginType, PluginStat, PluginMetadata, PluginOptions } from '../../../shared/models/plugin.model';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';

describe('PluginListComponent', () => {
  let component: PluginListComponent;
  let fixture: ComponentFixture<PluginListComponent>;
  let pluginServiceSpy: jasmine.SpyObj<PluginService>;
  let errorServiceSpy: jasmine.SpyObj<ErrorService>;

  // Mock data
  const mockPluginMetadata: PluginMetadata = {
    apiKey: {
      required: true,
      type: 'string',
      description: 'API key for authentication',
      validation: '^[A-Za-z0-9]+$'
    },
    endpoint: {
      required: false,
      type: 'string',
      description: 'Service endpoint URL',
      default: 'https://api.default.com'
    }
  };

  const mockPluginOptions: PluginOptions = {
    name: 'apiSettings',
    description: 'API Configuration Options',
    type: 'string',
    required: true
  };

  const mockPlugins: Plugin[] = [
    {
      id: 1, // Ensure ID is provided
      name: 'Test Plugin 1',
      description: 'Test description',
      version: '1.0.0',
      author: 'Test Author',
      enabled: true,
      type: PluginType.ISSUER,
      metadata: mockPluginMetadata,
      options: mockPluginOptions
    },
    {
      id: 2, // Ensure ID is provided
      name: 'Test Plugin 2',
      description: 'Another test plugin',
      version: '1.0.0',
      author: 'Test Author',
      enabled: false,
      type: PluginType.NOTIFICATION,
      metadata: mockPluginMetadata,
      options: mockPluginOptions
    }
  ];

  const mockStats: PluginStat[] = [
    { type: PluginType.ISSUER, count: 2, enabledCount: 1 },
    { type: PluginType.NOTIFICATION, count: 1, enabledCount: 1 }
  ];

  beforeEach(async () => {
    // Create spies
    pluginServiceSpy = jasmine.createSpyObj('PluginService', [
      'getPlugins', 'getPluginStats', 'enablePlugin',
      'disablePlugin', 'uninstallPlugin'
    ]);
    errorServiceSpy = jasmine.createSpyObj('ErrorService', [
      'logError', 'handleError', 'showSuccess'
    ]);

    // Configure spy responses
    pluginServiceSpy.getPlugins.and.returnValue(of({
      items: mockPlugins,
      total: mockPlugins.length,
      page: 0,
      size: 10
    }));
    pluginServiceSpy.getPluginStats.and.returnValue(of(mockStats));
    pluginServiceSpy.enablePlugin.and.returnValue(of({...mockPlugins[1], enabled: true}));
    pluginServiceSpy.disablePlugin.and.returnValue(of({...mockPlugins[0], enabled: false}));
    pluginServiceSpy.uninstallPlugin.and.returnValue(of(undefined));

    await TestBed.configureTestingModule({
      declarations: [PluginListComponent, ConfirmationDialogComponent],
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        MatDialogModule,
        FormsModule,
        MatTableModule,
        MatPaginatorModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: PluginService, useValue: pluginServiceSpy },
        { provide: ErrorService, useValue: errorServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PluginListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load plugins on init', () => {
    expect(pluginServiceSpy.getPlugins).toHaveBeenCalled();
    expect(component.plugins.length).toBe(2);
    expect(component.totalItems).toBe(2);
  });

  it('should load stats on init', () => {
    expect(pluginServiceSpy.getPluginStats).toHaveBeenCalled();
    expect(component.stats.length).toBe(2);
  });

  it('should filter by type', () => {
    // Set up
    component.selectedType = PluginType.ISSUER;

    // Call the method
    component.applyFilter();

    // Verify
    expect(pluginServiceSpy.getPlugins).toHaveBeenCalledWith(
      jasmine.objectContaining({ type: PluginType.ISSUER })
    );
  });

  it('should handle plugin enable correctly', () => {
    // Set up - ensure plugin has a non-undefined ID
    const plugin = {...mockPlugins[1]};
    expect(plugin.id).toBeDefined(); // Assert ID exists

    // Call the method
    component.togglePluginStatus(plugin);

    // Verify with non-null assertion
    expect(pluginServiceSpy.enablePlugin).toHaveBeenCalledWith(plugin.id!);
    expect(errorServiceSpy.showSuccess).toHaveBeenCalled();
    expect(pluginServiceSpy.getPluginStats).toHaveBeenCalled();
  });

  it('should handle plugin disable correctly', () => {
    // Set up - ensure plugin has a non-undefined ID
    const plugin = {...mockPlugins[0]};
    expect(plugin.id).toBeDefined(); // Assert ID exists

    // Call the method
    component.togglePluginStatus(plugin);

    // Verify with non-null assertion
    expect(pluginServiceSpy.disablePlugin).toHaveBeenCalledWith(plugin.id!);
    expect(errorServiceSpy.showSuccess).toHaveBeenCalled();
    expect(pluginServiceSpy.getPluginStats).toHaveBeenCalled();
  });

  it('should handle error during plugin toggle', () => {
    // Set up
    const plugin = {...mockPlugins[0]};
    pluginServiceSpy.disablePlugin.and.returnValue(throwError(() => new Error('Test error')));

    // Call the method
    component.togglePluginStatus(plugin);

    // Verify
    expect(errorServiceSpy.handleError).toHaveBeenCalled();
  });

  it('should calculate stats correctly', () => {
    expect(component.getTotalPluginsCount()).toBe(3); // Sum of all counts
    expect(component.getTotalEnabledPluginsCount()).toBe(2); // Sum of enabled counts
    expect(component.getStatForType(PluginType.ISSUER)).toBe(1); // One enabled ISSUER
  });

  it('should format plugin type labels correctly', () => {
    expect(component.getPluginTypeLabel(PluginType.ISSUER)).toBe('Issuer');
    expect(component.getPluginTypeLabel(PluginType.NOTIFICATION)).toBe('Notification');
  });
});
