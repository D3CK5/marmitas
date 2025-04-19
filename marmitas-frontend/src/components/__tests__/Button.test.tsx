import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '../Button';

describe('Button Component', () => {
  it('renders correctly with default props', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByTestId('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Click me');
    // Verificar classe default (primary)
    expect(button.className).toContain('bg-primary');
  });

  it('renders with different variants', () => {
    const { rerender } = render(<Button variant="secondary">Secondary</Button>);
    
    expect(screen.getByTestId('button').className).toContain('bg-secondary');
    
    rerender(<Button variant="outline">Outline</Button>);
    expect(screen.getByTestId('button').className).toContain('border-input');
    
    rerender(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByTestId('button').className).toContain('hover:bg-accent');
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    
    expect(screen.getByTestId('button').className).toContain('h-9');
    
    rerender(<Button size="md">Medium</Button>);
    expect(screen.getByTestId('button').className).toContain('h-10');
    
    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByTestId('button').className).toContain('h-11');
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByTestId('button');
    await userEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    
    const button = screen.getByTestId('button');
    expect(button).toBeDisabled();
  });
}); 