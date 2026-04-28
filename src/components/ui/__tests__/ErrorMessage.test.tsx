import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorMessage from '../ErrorMessage';

describe('ErrorMessage', () => {
  it('renders error message correctly', () => {
    render(
      <ErrorMessage
        title="Test Error"
        message="This is a test error message"
        variant="error"
      />
    );

    expect(screen.getByText('Test Error')).toBeInTheDocument();
    expect(screen.getByText('This is a test error message')).toBeInTheDocument();
  });

  it('renders without title', () => {
    render(
      <ErrorMessage
        message="This is a test error message"
        variant="error"
      />
    );

    expect(screen.getByText('This is a test error message')).toBeInTheDocument();
  });

  it('shows retry button when onRetry is provided', () => {
    const mockRetry = vi.fn();
    
    render(
      <ErrorMessage
        message="Test error"
        variant="error"
        onRetry={mockRetry}
        retryLabel="Retry Action"
      />
    );

    const retryButton = screen.getByRole('button', { name: /retry action/i });
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it('shows dismiss button when onDismiss is provided', () => {
    const mockDismiss = vi.fn();
    
    render(
      <ErrorMessage
        message="Test error"
        variant="error"
        onDismiss={mockDismiss}
        dismissLabel="Close"
      />
    );

    const dismissButton = screen.getByRole('button', { name: /close/i });
    expect(dismissButton).toBeInTheDocument();
    
    fireEvent.click(dismissButton);
    expect(mockDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders different variants correctly', () => {
    const { rerender } = render(
      <ErrorMessage message="Test" variant="error" />
    );
    
    let alertElement = screen.getByRole('alert');
    expect(alertElement).toHaveClass('border-red-200');

    rerender(<ErrorMessage message="Test" variant="warning" />);
    alertElement = screen.getByRole('alert');
    expect(alertElement).toHaveClass('border-orange-200');

    rerender(<ErrorMessage message="Test" variant="info" />);
    alertElement = screen.getByRole('alert');
    expect(alertElement).toHaveClass('border-blue-200');
  });

  it('has proper accessibility attributes', () => {
    render(
      <ErrorMessage
        title="Error Title"
        message="Error message"
        variant="error"
      />
    );

    const alertElement = screen.getByRole('alert');
    expect(alertElement).toHaveAttribute('role', 'alert');
    expect(alertElement).toHaveAttribute('aria-live', 'polite');
  });

  it('hides icon when showIcon is false', () => {
    render(
      <ErrorMessage
        message="Test error"
        variant="error"
        showIcon={false}
      />
    );

    // Icon should be hidden
    const iconContainer = screen.queryByLabelText(/error/i);
    expect(iconContainer).not.toBeInTheDocument();
  });
});