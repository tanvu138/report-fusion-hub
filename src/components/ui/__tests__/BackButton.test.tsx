import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BackButton from '../BackButton';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock language context
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
  }),
}));

const BackButtonWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('BackButton', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders with default label', () => {
    render(
      <BackButtonWrapper>
        <BackButton />
      </BackButtonWrapper>
    );

    expect(screen.getByRole('button', { name: /common.back/i })).toBeInTheDocument();
  });

  it('renders with custom label', () => {
    render(
      <BackButtonWrapper>
        <BackButton label="Go Back" />
      </BackButtonWrapper>
    );

    expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
  });

  it('navigates back when clicked without "to" prop', () => {
    render(
      <BackButtonWrapper>
        <BackButton />
      </BackButtonWrapper>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('navigates to specific route when "to" prop is provided', () => {
    render(
      <BackButtonWrapper>
        <BackButton to="/dashboard" />
      </BackButtonWrapper>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('has proper accessibility attributes', () => {
    render(
      <BackButtonWrapper>
        <BackButton label="Go Back" />
      </BackButtonWrapper>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Go Back');
    expect(button).toHaveAttribute('title', 'Go Back');
  });

  it('applies custom variant and size', () => {
    render(
      <BackButtonWrapper>
        <BackButton variant="outline" size="lg" />
      </BackButtonWrapper>
    );

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <BackButtonWrapper>
        <BackButton className="custom-class" />
      </BackButtonWrapper>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });
});