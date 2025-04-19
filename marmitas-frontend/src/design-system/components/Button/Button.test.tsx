import React from 'react';
import { render, screen } from '@testing-library/react';
import Button from './Button';

describe('Button Component', () => {
  it('renders correctly with default props', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByTestId('button');
    
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Click me');
    expect(button).not.toBeDisabled();
  });

  it('renders in disabled state', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByTestId('button');
    
    expect(button).toBeDisabled();
  });

  it('renders with loading state', () => {
    render(<Button loading>Loading</Button>);
    const button = screen.getByTestId('button');
    
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Loading');
    
    // Check for loading spinner SVG
    const svg = button.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders with left and right icons', () => {
    const leftIcon = <span data-testid="left-icon">L</span>;
    const rightIcon = <span data-testid="right-icon">R</span>;
    
    render(
      <Button leftIcon={leftIcon} rightIcon={rightIcon}>
        With Icons
      </Button>
    );
    
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    expect(screen.getByTestId('button')).toHaveTextContent('With Icons');
  });

  it('applies variant and size classes correctly', () => {
    render(
      <Button variant="outline" size="lg">
        Styled Button
      </Button>
    );
    
    const button = screen.getByTestId('button');
    
    // Check for specific classes based on the variants
    expect(button.className).toContain('border');  // From outline variant
    expect(button.className).toContain('h-11');    // From lg size
    expect(button.className).toContain('px-8');    // From lg size
  });
}); 