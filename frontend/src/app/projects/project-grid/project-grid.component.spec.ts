import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ProjectGridComponent } from './project-grid.component';
import { Project } from '../../models/project';

describe('ProjectGridComponent', () => {
  let component: ProjectGridComponent;
  let fixture: ComponentFixture<ProjectGridComponent>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockProjects: Project[] = [
    {
      id: 1,
      user_id: 1,
      name: 'Test Project 1',
      description: 'Test description 1',
      status: 'active',
      is_sales_pipeline: false,
      sales_stage: null,
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      client_name: 'Test Client',
      client_email: 'test@example.com',
      budget: 10000,
      deal_value: null,
      deal_owner: null,
      expected_close_date: null,
      custom_fields: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ];

  beforeEach(async () => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [ProjectGridComponent],
      providers: [
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectGridComponent);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display projects in grid format', () => {
    component.projects = mockProjects;
    fixture.detectChanges();

    const projectCards = fixture.nativeElement.querySelectorAll('.bg-white.border');
    expect(projectCards.length).toBe(1);
  });

  it('should emit editProject event when edit button is clicked', () => {
    spyOn(component.editProject, 'emit');
    component.onEditProject(mockProjects[0]);
    expect(component.editProject.emit).toHaveBeenCalledWith(mockProjects[0]);
  });

  it('should emit deleteProject event when delete is confirmed', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(component.deleteProject, 'emit');
    
    component.onDeleteProject(1);
    
    expect(component.deleteProject.emit).toHaveBeenCalledWith(1);
  });

  it('should not emit deleteProject event when delete is cancelled', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    spyOn(component.deleteProject, 'emit');
    
    component.onDeleteProject(1);
    
    expect(component.deleteProject.emit).not.toHaveBeenCalled();
  });

  it('should navigate to project details', () => {
    component.viewProjectDetails(mockProjects[0]);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/projects', 1]);
  });

  it('should return correct status class', () => {
    expect(component.getStatusClass('active')).toBe('bg-green-100 text-green-800');
    expect(component.getStatusClass('on_hold')).toBe('bg-yellow-100 text-yellow-800');
    expect(component.getStatusClass('completed')).toBe('bg-blue-100 text-blue-800');
    expect(component.getStatusClass('cancelled')).toBe('bg-red-100 text-red-800');
    expect(component.getStatusClass('unknown')).toBe('bg-gray-100 text-gray-800');
  });

  it('should format date correctly', () => {
    const testDate = '2024-01-01';
    const formatted = component.formatDate(testDate);
    expect(formatted).toBe(new Date(testDate).toLocaleDateString());
  });

  it('should return "Not set" for null date', () => {
    expect(component.formatDate(null)).toBe('Not set');
  });

  it('should format currency correctly', () => {
    const amount = 10000;
    const formatted = component.formatCurrency(amount);
    expect(formatted).toBe('$10,000.00');
  });

  it('should return "Not set" for null amount', () => {
    expect(component.formatCurrency(null)).toBe('Not set');
  });
});
