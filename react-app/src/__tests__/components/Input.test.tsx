import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Mail } from 'lucide-react';
import Input from '@/components/ui/Input';

describe('Input Component', () => {
  it('renders correctly', () => {
    render(<Input placeholder="Enter text" />);
    const input = screen.getByPlaceholderText(/enter text/i);
    expect(input).toBeInTheDocument();
  });

  it('renders with label', () => {
    render(<Input label="Email" placeholder="Enter email" />);
    const label = screen.getByText(/email/i);
    const input = screen.getByPlaceholderText(/enter email/i);
    expect(label).toBeInTheDocument();
    expect(input).toBeInTheDocument();
  });

  it('displays error message when error prop is provided', () => {
    render(<Input error="This field is required" />);
    const errorMessage = screen.getByText(/this field is required/i);
    expect(errorMessage).toBeInTheDocument();
  });

  it('applies error styles when error is present', () => {
    render(<Input error="Error" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-danger');
  });

  it('handles user input', async () => {
    const user = userEvent.setup();
    render(<Input placeholder="Type here" />);

    const input = screen.getByPlaceholderText(/type here/i) as HTMLInputElement;
    await user.type(input, 'Hello');

    expect(input.value).toBe('Hello');
  });

  it('calls onChange handler', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<Input onChange={handleChange} placeholder="Type" />);

    const input = screen.getByPlaceholderText(/type/i);
    await user.type(input, 'a');

    expect(handleChange).toHaveBeenCalled();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Input disabled placeholder="Disabled input" />);
    const input = screen.getByPlaceholderText(/disabled input/i);
    expect(input).toBeDisabled();
  });

  it('renders with left icon', () => {
    render(<Input leftIcon={<Mail data-testid="mail-icon" />} />);
    const icon = screen.getByTestId('mail-icon');
    expect(icon).toBeInTheDocument();
  });

  it('renders with right icon', () => {
    render(<Input rightIcon={<Mail data-testid="mail-icon" />} />);
    const icon = screen.getByTestId('mail-icon');
    expect(icon).toBeInTheDocument();
  });

  it('applies fullWidth class when fullWidth prop is true', () => {
    render(<Input fullWidth label="Full Width" />);
    const container = screen.getByText(/full width/i).parentElement;
    expect(container).toHaveClass('w-full');
  });

  it('associates label with input via id', () => {
    render(<Input label="Username" id="username-input" />);
    const label = screen.getByText(/username/i) as HTMLLabelElement;
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(label.htmlFor).toBe('username-input');
    expect(input.id).toBe('username-input');
  });

  it('supports different input types', () => {
    const { rerender } = render(<Input type="email" />);
    let input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.type).toBe('email');

    rerender(<Input type="password" />);
    input = document.querySelector('input[type="password"]') as HTMLInputElement;
    expect(input.type).toBe('password');
  });
});