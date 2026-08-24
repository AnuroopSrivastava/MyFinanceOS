import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { FileDropzone } from './FileDropzone.js';

describe('FileDropzone component', () => {
  it('renders default dropzone area with labels', () => {
    render(
      <FileDropzone
        label="Upload Statement"
        sublabel="Supports .csv and .txt"
      />
    );

    expect(screen.getByText('Upload Statement')).toBeDefined();
    expect(screen.getByText('Supports .csv and .txt')).toBeDefined();
    expect(screen.getByRole('button')).toBeDefined();
  });

  it('triggers onFileSelect when a file is selected via input', () => {
    const handleSelect = vi.fn();
    const { container } = render(
      <FileDropzone
        accept=".csv,.txt"
        onFileSelect={handleSelect}
      />
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeDefined();

    const file = new File(['date,amount\n2026-07-01,1000'], 'statement.csv', { type: 'text/csv' });
    fireEvent.change(input, { target: { files: [file] } });

    expect(handleSelect).toHaveBeenCalledWith(file);
  });

  it('rejects files that violate accepted extension list', () => {
    const handleSelect = vi.fn();
    const { container } = render(
      <FileDropzone
        accept=".csv,.txt"
        onFileSelect={handleSelect}
      />
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['some image data'], 'photo.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });

    expect(handleSelect).not.toHaveBeenCalled();
    expect(screen.getByText(/Invalid file format/i)).toBeDefined();
  });

  it('rejects files that exceed maximum size', () => {
    const handleSelect = vi.fn();
    const { container } = render(
      <FileDropzone
        maxSizeMB={1}
        onFileSelect={handleSelect}
      />
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    // 2MB file
    const bigContent = new Uint8Array(2 * 1024 * 1024);
    const file = new File([bigContent], 'large.csv', { type: 'text/csv' });
    fireEvent.change(input, { target: { files: [file] } });

    expect(handleSelect).not.toHaveBeenCalled();
    expect(screen.getByText(/File exceeds maximum size limit of 1 MB/i)).toBeDefined();
  });

  it('handles drag and drop event correctly', () => {
    const handleSelect = vi.fn();
    render(
      <FileDropzone
        accept=".json"
        onFileSelect={handleSelect}
      />
    );

    const dropArea = screen.getByRole('button');
    const file = new File(['{"test": true}'], 'data.json', { type: 'application/json' });

    fireEvent.dragOver(dropArea);
    fireEvent.drop(dropArea, {
      dataTransfer: {
        files: [file]
      }
    });

    expect(handleSelect).toHaveBeenCalledWith(file);
  });

  it('renders selected file card when selectedFile is provided', () => {
    const handleRemove = vi.fn();
    render(
      <FileDropzone
        selectedFile={{ name: 'taxes_2026.json', size: 1024 * 50 }}
        onFileRemove={handleRemove}
      />
    );

    expect(screen.getByText('taxes_2026.json')).toBeDefined();
    expect(screen.getByText('50.0 KB')).toBeDefined();

    const removeBtn = screen.getByLabelText('Remove selected file');
    fireEvent.click(removeBtn);
    expect(handleRemove).toHaveBeenCalled();
  });
});
