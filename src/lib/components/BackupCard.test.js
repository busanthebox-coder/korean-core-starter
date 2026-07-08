import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BACKUP_META } from '../backup.js';
import BackupCard from './BackupCard.svelte';

const NOW = new Date('2026-07-08T12:00:00+09:00').getTime();

function jsonFile(payload, name = 'backup.json') {
  return new File([JSON.stringify(payload)], name, { type: 'application/json' });
}

describe('BackupCard', () => {
  let anchorClick;

  beforeEach(() => {
    localStorage.clear();
    anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    Object.defineProperty(URL, 'createObjectURL', { value: vi.fn(() => 'blob:kcs-backup'), configurable: true });
    Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), configurable: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('shows a backup reminder when progress exists without a recent export', () => {
    localStorage.setItem('kcs.progress', JSON.stringify(['chapter-01']));

    render(BackupCard, { now: () => NOW });

    expect(screen.getByText('Backup is due')).toBeInTheDocument();
  });

  it('exports current progress and records the latest backup time', async () => {
    localStorage.setItem('kcs.progress', JSON.stringify(['chapter-01']));

    render(BackupCard, { now: () => NOW });
    await fireEvent.click(screen.getByRole('button', { name: /Export progress/ }));

    expect(URL.createObjectURL).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:kcs-backup');
    expect(anchorClick).toHaveBeenCalledOnce();
    expect(localStorage.getItem(BACKUP_META.lastBackupAt)).toBe(String(NOW));
    expect(screen.getByRole('status')).toHaveTextContent('1 progress item exported.');
  });

  it('imports a valid backup and schedules a reload', async () => {
    const reload = vi.fn();
    const file = jsonFile({
      version: 1,
      app: 'korean-core-starter',
      exportedAt: NOW,
      data: { 'kcs.progress': JSON.stringify(['chapter-imported']) },
    });

    render(BackupCard, { reload, reloadDelay: 0, now: () => NOW });
    await fireEvent.change(screen.getByLabelText('Choose progress backup file'), { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('1 progress item restored. Refreshing...');
    });
    expect(JSON.parse(localStorage.getItem('kcs.progress'))).toEqual(['chapter-imported']);
    await waitFor(() => expect(reload).toHaveBeenCalledOnce());
  });

  it('shows an error for unsupported backup versions without changing progress', async () => {
    localStorage.setItem('kcs.progress', JSON.stringify(['chapter-local']));
    const file = jsonFile({
      version: 99,
      app: 'korean-core-starter',
      data: { 'kcs.progress': JSON.stringify(['chapter-remote']) },
    });

    render(BackupCard, { now: () => NOW });
    await fireEvent.change(screen.getByLabelText('Choose progress backup file'), { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Unsupported backup version: 99.');
    });
    expect(JSON.parse(localStorage.getItem('kcs.progress'))).toEqual(['chapter-local']);
  });
});
