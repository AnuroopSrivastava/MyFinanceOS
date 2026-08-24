import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PaginationControls } from './PaginationControls.js';

describe('PaginationControls', () => {
  it('renders nothing when totalPages is 1 and no items', () => {
    const { container } = render(
      <PaginationControls
        currentPage={1}
        totalPages={1}
        totalItems={0}
        onPageChange={() => {}}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders page summary and navigation buttons', () => {
    const onPageChange = vi.fn();
    render(
      <PaginationControls
        currentPage={2}
        totalPages={5}
        totalItems={100}
        pageSize={20}
        itemLabel="records"
        onPageChange={onPageChange}
      />
    );

    expect(screen.getByText(/Showing/i)).toBeDefined();
    expect(screen.getByText('21–40')).toBeDefined();
    expect(screen.getByText('100')).toBeDefined();
    expect(screen.getByText(/records/i)).toBeDefined();

    const prevBtn = screen.getByRole('button', { name: /previous page/i }) as HTMLButtonElement;
    const nextBtn = screen.getByRole('button', { name: /next page/i }) as HTMLButtonElement;

    expect(prevBtn.disabled).toBe(false);
    expect(nextBtn.disabled).toBe(false);

    fireEvent.click(prevBtn);
    expect(onPageChange).toHaveBeenCalledWith(1);

    fireEvent.click(nextBtn);
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('disables Prev on first page and Next on last page', () => {
    const { rerender } = render(
      <PaginationControls
        currentPage={1}
        totalPages={3}
        onPageChange={() => {}}
      />
    );

    const prevBtn = screen.getByRole('button', { name: /previous page/i }) as HTMLButtonElement;
    const nextBtn = screen.getByRole('button', { name: /next page/i }) as HTMLButtonElement;
    expect(prevBtn.disabled).toBe(true);
    expect(nextBtn.disabled).toBe(false);

    rerender(
      <PaginationControls
        currentPage={3}
        totalPages={3}
        onPageChange={() => {}}
      />
    );

    expect(prevBtn.disabled).toBe(false);
    expect(nextBtn.disabled).toBe(true);
  });

  it('supports compact variant without label text', () => {
    render(
      <PaginationControls
        currentPage={1}
        totalPages={4}
        variant="compact"
        showItemCount={false}
        onPageChange={() => {}}
      />
    );

    expect(screen.getByText('1 / 4')).toBeDefined();
    expect(screen.queryByText('Prev')).toBeNull();
    expect(screen.queryByText('Next')).toBeNull();
  });
});
