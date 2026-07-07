import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
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

  it('renders Same Root for 학교 and opens 학생 from a member button', async () => {
    const school = findEntry('word-noun-006');
    const student = findEntry('word-noun-001');
    const opened = vi.fn();
    const { component } = render(EntryDetail, { props: { entry: school } });
    component.$on('openEntry', (event) => opened(event.detail));

    expect(screen.getByText('Same Root')).toBeInTheDocument();
    expect(screen.getByText('學')).toBeInTheDocument();

    await fireEvent.click(screen.getByRole('button', { name: /학생/ }));

    expect(opened).toHaveBeenCalledWith(student);
  });
});
