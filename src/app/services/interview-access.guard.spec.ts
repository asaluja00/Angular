import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { interviewAccessGuard } from './interview-access.guard';

describe('interviewAccessGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => interviewAccessGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
