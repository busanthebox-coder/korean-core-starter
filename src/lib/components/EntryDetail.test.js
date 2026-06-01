import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import EntryDetail from './EntryDetail.svelte';
import { findEntry } from '../data.js';

describe('EntryDetail', () => {
  it('renders a verb with a Forms section', () => {
    const verb = findEntry('word-verb-001');
    render(EntryDetail, { props: { entry: verb } });
    expect(screen.getByText(verb.english)).toBeInTheDocument();
    expect(screen.getByText('Forms')).toBeInTheDocument();
    expect(screen.getByText('Examples')).toBeInTheDocument();
  });
  it('renders a pattern without crashing and shows no Forms section', () => {
    const pat = findEntry('pattern-004');
    render(EntryDetail, { props: { entry: pat } });
    expect(screen.getByText(pat.english)).toBeInTheDocument();
    expect(screen.queryByText('Forms')).toBeNull();
  });
});
