import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AppComponent } from './app.component';
import { ApiService } from '@core/services/api.service';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AppComponent,
        RouterTestingModule,
        HttpClientTestingModule
      ],
      providers: [ApiService]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should have logo text', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.logo-text')?.textContent).toContain('Payment Gateway');
  });

  it('should have navigation links', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const navLinks = compiled.querySelectorAll('.nav-link');
    expect(navLinks.length).toBe(3);
  });

  it('should display version', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.app-footer p')?.textContent).toContain('1.0.0');
  });

  it('should have router outlet', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });

  it('should check health on init', () => {
    spyOn(component['apiService'], 'checkHealth');
    component.ngOnInit();
    expect(component['apiService'].checkHealth).toHaveBeenCalled();
  });
});
