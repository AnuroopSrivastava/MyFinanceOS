import { vi } from 'vitest';
import '@testing-library/jest-dom';

class IntersectionObserver {
    constructor() {}
    observe = vi.fn()
    unobserve = vi.fn()
    disconnect = vi.fn()
}

window.IntersectionObserver = IntersectionObserver;
global.IntersectionObserver = IntersectionObserver;

// ResizeObserver mock
class ResizeObserver {
    constructor() {}
    observe = vi.fn()
    unobserve = vi.fn()
    disconnect = vi.fn()
}

window.ResizeObserver = ResizeObserver;
global.ResizeObserver = ResizeObserver;
