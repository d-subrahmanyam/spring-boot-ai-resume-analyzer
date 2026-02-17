import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '../../test/test-utils';
import CandidateList from './CandidateList';
import { mockCandidates } from '../../test/mockData';

describe('CandidateList Component', () => {
  it('should render candidate list component', () => {
    render(<CandidateList />);
    expect(screen.getByText(/candidates/i)).toBeInTheDocument();
  });

  it('should display candidates when loaded', () => {
    const initialState = {
      candidates: {
        candidates: mockCandidates,
        loading: false,
        error: null,
      },
    };
    
    render(<CandidateList />, { preloadedState: initialState });
    
    // Check if candidate names are displayed
    expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    expect(screen.getByText(/Jane Smith/i)).toBeInTheDocument();
  });

  it('should show loading state', () => {
    const initialState = {
      candidates: {
        candidates: [],
        loading: true,
        error: null,
      },
    };
    
    render(<CandidateList />, { preloadedState: initialState });
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should show error message when error occurs', () => {
    const initialState = {
      candidates: {
        candidates: [],
        loading: false,
        error: 'Failed to load candidates',
      },
    };
    
    render(<CandidateList />, { preloadedState: initialState });
    
    expect(screen.getByText(/failed|error/i)).toBeInTheDocument();
  });

  it('should display candidate details', () => {
    const initialState = {
      candidates: {
        candidates: [mockCandidates[0]],
        loading: false,
        error: null,
      },
    };
    
    render(<CandidateList />, { preloadedState: initialState });
    
    expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    expect(screen.getByText(/john\.doe@example\.com/i)).toBeInTheDocument();
    expect(screen.getByText(/8 years/i)).toBeInTheDocument();
  });

  it('should show empty state when no candidates', () => {
    const initialState = {
      candidates: {
        candidates: [],
        loading: false,
        error: null,
      },
    };
    
    render(<CandidateList />, { preloadedState: initialState });
    
    expect(screen.getByText(/no candidates|empty/i)).toBeInTheDocument();
  });

  it('should render candidate skills', () => {
    const initialState = {
      candidates: {
        candidates: [mockCandidates[0]],
        loading: false,
        error: null,
      },
    };
    
    render(<CandidateList />, { preloadedState: initialState });
    
    expect(screen.getByText(/Java|Spring Boot|React/i)).toBeInTheDocument();
  });
});
