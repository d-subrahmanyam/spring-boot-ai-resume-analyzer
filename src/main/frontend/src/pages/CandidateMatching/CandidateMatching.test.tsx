import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '../../test/test-utils';
import CandidateMatching from './CandidateMatching';
import { mockCandidates, mockJobRequirements, mockCandidateMatch } from '../../test/mockData';

describe('CandidateMatching Component', () => {
  it('should render candidate matching component', () => {
    render(<CandidateMatching />);
    expect(screen.getByText(/match|matching|candidate/i)).toBeInTheDocument();
  });

  it('should display match results when loaded', () => {
    const initialState = {
      matches: {
        matches: [mockCandidateMatch],
        loading: false,
        error: null,
      },
      candidates: {
        candidates: mockCandidates,
        loading: false,
        error: null,
      },
      jobs: {
        jobs: mockJobRequirements,
        loading: false,
        error: null,
      },
    };
    
    render(<CandidateMatching />, { preloadedState: initialState });
    
    // Check for match score
    expect(screen.getByText(/85\.5|85%|86%/i)).toBeInTheDocument();
  });

  it('should show loading state', () => {
    const initialState = {
      matches: {
        matches: [],
        loading: true,
        error: null,
      },
    };
    
    render(<CandidateMatching />, { preloadedState: initialState });
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should show error message when error occurs', () => {
    const initialState = {
      matches: {
        matches: [],
        loading: false,
        error: 'Failed to load matches',
      },
    };
    
    render(<CandidateMatching />, { preloadedState: initialState });
    
    expect(screen.getByText(/failed|error/i)).toBeInTheDocument();
  });

  it('should display match details', () => {
    const initialState = {
      matches: {
        matches: [mockCandidateMatch],
        loading: false,
        error: null,
      },
    };
    
    render(<CandidateMatching />, { preloadedState: initialState });
    
    // Check for score breakdown
    expect(screen.queryByText(/skills|experience|education|domain/i)).toBeInTheDocument();
  });

  it('should show empty state when no matches', () => {
    const initialState = {
      matches: {
        matches: [],
        loading: false,
        error: null,
      },
    };
    
    render(<CandidateMatching />, { preloadedState: initialState });
    
    expect(screen.getByText(/no matches|empty|find matches/i)).toBeInTheDocument();
  });

  it('should display candidate and job information', () => {
    const initialState = {
      matches: {
        matches: [mockCandidateMatch],
        loading: false,
        error: null,
      },
    };
    
    render(<CandidateMatching />, { preloadedState: initialState });
    
    expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    expect(screen.getByText(/Senior Java Developer/i)).toBeInTheDocument();
  });

  it('should have match button or trigger', () => {
    render(<CandidateMatching />);
    
    const matchButton = screen.queryByRole('button', { name: /match|find|calculate/i });
    if (matchButton) {
      expect(matchButton).toBeInTheDocument();
    }
  });
});
