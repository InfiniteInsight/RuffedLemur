import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PluginDetailComponent } from './plugin-detail.component';

describe('PluginDetailComponent', () => {
  let component: PluginDetailComponent;
  let fixture: ComponentFixture<PluginDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PluginDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PluginDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
