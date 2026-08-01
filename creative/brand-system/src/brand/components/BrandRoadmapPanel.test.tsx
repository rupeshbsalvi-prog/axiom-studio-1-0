import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BrandRoadmapPanel } from './BrandRoadmapPanel';

describe('BrandRoadmapPanel', () => {
  it('renders all governed brand workstreams', () => {
    render(<BrandRoadmapPanel />);
    expect(screen.getByRole('heading', { name: 'Ultimate Branding Roadmap' })).toBeInTheDocument();
    expect(screen.getByText('Brand Governance & Control')).toBeInTheDocument();
    expect(screen.getByText('Measurement, Learning & Evolution')).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(19);
  });
});
