import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { cn } from '../../lib/utils.js';
import { HOME, LOGIN, REGISTER, LOGOUT } from '../../constants/testIds/index.js';
import { Button } from './button.jsx';
import { Badge } from './badge.jsx';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card.jsx';
import { Separator } from './separator.jsx';

describe('Migrated Emergent UI Utilities & Components', () => {
  describe('cn utility', () => {
    it('merges class names and resolves tailwind conflicts', () => {
      expect(cn('p-4', 'p-8')).toBe('p-8');
      expect(cn('text-red-500', undefined, null, false, 'text-blue-500')).toBe('text-blue-500');
    });
  });

  describe('testIds registry', () => {
    it('exports all expected test IDs with correct keys and values', () => {
      expect(HOME.emergentLink).toBe('home-emergent-link');
      expect(LOGIN.submitButton).toBe('login-submit-button');
      expect(LOGIN.emailInput).toBe('login-email-input');
      expect(REGISTER.submitButton).toBe('register-submit-button');
      expect(LOGOUT.button).toBe('logout-button');
    });
  });

  describe('Shadcn UI Components', () => {
    it('renders Button component with variants', () => {
      render(<Button variant="destructive">Delete Account</Button>);
      const btn = screen.getByRole('button', { name: 'Delete Account' });
      expect(btn).toBeDefined();
      expect(btn.className).toContain('bg-destructive');
    });

    it('renders Badge component', () => {
      render(<Badge variant="secondary">Active</Badge>);
      expect(screen.getByText('Active')).toBeDefined();
    });

    it('renders Card component with structured content', () => {
      render(
        <Card data-testid="test-card">
          <CardHeader>
            <CardTitle>Emergent Card</CardTitle>
            <CardDescription>Card subtitle description</CardDescription>
          </CardHeader>
          <CardContent>Content Area</CardContent>
          <CardFooter>Footer Area</CardFooter>
        </Card>
      );
      expect(screen.getByTestId('test-card')).toBeDefined();
      expect(screen.getByText('Emergent Card')).toBeDefined();
      expect(screen.getByText('Card subtitle description')).toBeDefined();
    });

    it('renders Separator component', () => {
      const { container } = render(<Separator orientation="horizontal" />);
      expect(container.querySelector('[role="none"]')).toBeDefined();
    });
  });
});
