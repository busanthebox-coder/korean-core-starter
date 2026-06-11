import { render, fireEvent, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Talk from './Talk.svelte';

describe('Talk', () => {
  it('opens a line-by-line shadow mode for a scene', async () => {
    render(Talk);

    await fireEvent.click(await screen.findByText('Start shadow'));

    expect(screen.getByText('Shadow Mode')).toBeInTheDocument();
    expect(screen.getByText('Line 1')).toBeInTheDocument();

    await fireEvent.click(screen.getByText('I said it'));
    expect(screen.getByText('Next line')).toBeInTheDocument();
  });
});
