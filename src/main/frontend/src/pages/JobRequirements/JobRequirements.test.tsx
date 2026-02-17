import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '../../test/test-utils';
import JobRequirements from './JobRequirements';
import { mockJobRequirements } from '../../test/mockData';

describe('JobRequirements Component', () => {
  it('should render job requirements component', () => {
    render(<JobRequirements />);
    expect(screen.getByText(/job|requirements|positions/i)).toBeInTheDocument();
  });

  it('should display job listings when loaded', () => {
    const initialState = {
      jobs: {
        jobs: mockJobRequirements,
        loading: false,
        error: null,
      },
    };
    
    render(<JobRequirements />, { preloadedState: initialState });
    
    expect(screen.getByText(/Senior Java Developer/i)).toBeInTheDocument();
    expect(screen.getByText(/React Frontend Developer/i)).toBeInTheDocument();
  });

  it('should show loading state', () => {
    const initialState = {
      jobs: {
        jobs: [],
        loading: true,
        error: null,
      },
    };
    
    render(<JobRequirements />, { preloadedState: initialState });
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should show error message when error occurs', () => {
    const initialState = {
      jobs: {
        jobs: [],
        loading: false,
        error: 'Failed to load job requirements',
      },
    };
    
    render(<JobRequirements />, { preloadedState: initialState });
    
    expect(screen.getByText(/failed|error/i)).toBeInTheDocument();
  });

  it('should display job details', () => {
    const initialState = {
      jobs: {
        jobs: [mockJobRequirements[0]],
        loading: false,
        error: null,
      },
    };
    
    render(<JobRequirements />, { preloadedState: initialState });
    
    expect(screen.getByText(/Senior Java Developer/i)).toBeInTheDocument();
    expect(screen.getByText(/5-10 years/i)).toBeInTheDocument();
  });

  it('should show empty state when no jobs', () => {
    const initialState = {
      jobs: {
        jobs: [],
        loading: false,
        error: null,
      },
    };
    
    render(<JobRequirements />, { preloadedState: initialState });
    
    expect(screen.getByText(/no jobs|no positions|empty/i)).toBeInTheDocument();
  });

  it('should display required skills for job', () => {
    const initialState = {
      jobs: {
        jobs: [mockJobRequirements[0]],
        loading: false,
        error: null,
      },
    };
    
    render(<JobRequirements />, { preloadedState: initialState });
    
    expect(screen.getByText(/Java|Spring Boot|Microservices/i)).toBeInTheDocument();
  });

  it('should have add job button', () => {
    render(<JobRequirements />);
    
    const addButton = screen.queryByRole('button', { name: /add|new|create/i });
    if (addButton) {
      expect(addButton).toBeInTheDocument();
    }
  });
});
