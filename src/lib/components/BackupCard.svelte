<script>
  import { BACKUP_META, backupReminderState, exportProgress, importProgress } from '../backup.js';

  export let now = () => Date.now();
  export let reload = () => window.location.reload();
  export let reloadDelay = 700;

  let fileInput;
  let status = '';
  let error = '';
  let reminder = backupReminderState(now());

  function refreshReminder() {
    reminder = backupReminderState(now());
  }

  function filename(ts) {
    return `kcs-progress-${new Date(ts).toISOString().slice(0, 10).replace(/-/g, '')}.json`;
  }

  function downloadBackup(payload, name) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function exportBackup() {
    const ts = now();
    const payload = exportProgress(ts);
    downloadBackup(payload, filename(ts));
    localStorage.setItem(BACKUP_META.lastBackupAt, String(ts));
    error = '';
    status = `${Object.keys(payload.data).length} progress item${Object.keys(payload.data).length === 1 ? '' : 's'} exported.`;
    refreshReminder();
  }

  function readFileText(file) {
    if (typeof file.text === 'function') return file.text();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  async function importBackup(event) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    const text = await readFileText(file);
    const result = importProgress(text);
    input.value = '';
    if (!result.ok) {
      status = '';
      error = result.error || 'Backup could not be restored.';
      return;
    }
    error = '';
    status = `${result.imported.length} progress item${result.imported.length === 1 ? '' : 's'} restored. Refreshing...`;
    setTimeout(reload, reloadDelay);
  }
</script>

<section class="backup-card" aria-labelledby="backup-title">
  <div class="backup-top">
    <div>
      <span class="eyebrow">Progress backup</span>
      <h2 id="backup-title">Save your study record</h2>
      <p>Export a JSON backup, then import it after changing devices or clearing browser data.</p>
    </div>
    {#if reminder.shouldRemind}
      <span class="backup-badge">Backup is due</span>
    {/if}
  </div>

  <div class="backup-actions">
    <button class="btn3d" type="button" on:click={exportBackup}>
      <i class="ti ti-download" aria-hidden="true"></i> Export progress
    </button>
    <button class="ghost" type="button" on:click={() => fileInput.click()}>
      <i class="ti ti-upload" aria-hidden="true"></i> Import backup
    </button>
    <input
      bind:this={fileInput}
      class="file-input"
      type="file"
      accept="application/json"
      aria-label="Choose progress backup file"
      on:change={importBackup}
    />
  </div>

  {#if status}<p class="status" role="status">{status}</p>{/if}
  {#if error}<p class="error" role="alert">{error}</p>{/if}
</section>

<style>
  .backup-card { display: grid; gap: 14px; padding: 18px; border-radius: var(--radius); background: var(--surface);
    border: 1px solid var(--border); border-left: 4px solid var(--green); box-shadow: var(--shadow-1); }
  .backup-top { display: flex; align-items: start; justify-content: space-between; gap: 14px; }
  .eyebrow { display: block; margin-bottom: 5px; font-size: 10px; font-weight: 800; letter-spacing: .14em;
    text-transform: uppercase; color: var(--green-dark); }
  h2 { margin: 0; font-family: var(--serif-ko); font-size: 22px; font-weight: 600; letter-spacing: -0.01em; }
  p { margin: 4px 0 0; color: var(--ink-3); line-height: 1.55; }
  .backup-badge { flex: none; padding: 5px 9px; border-radius: 999px; background: var(--gold-wash);
    border: 1px solid var(--gold); color: var(--ink-2); font-size: 11px; font-weight: 850; letter-spacing: .04em;
    text-transform: uppercase; }
  .backup-actions { display: flex; flex-wrap: wrap; gap: 8px; }
  .backup-actions button { display: inline-flex; align-items: center; gap: 7px; }
  .ghost { padding: 11px 16px; border-radius: 999px; border: 1px solid var(--border); background: var(--surface-2);
    color: var(--ink-2); font-weight: 850; }
  .ghost:hover { border-color: var(--ink-3); color: var(--ink); }
  .file-input { position: absolute; width: 1px; height: 1px; overflow: hidden; opacity: 0; pointer-events: none; }
  .status, .error { margin: 0; padding: 9px 11px; border-radius: var(--r-1); font-size: 13px; font-weight: 750; }
  .status { background: var(--green-soft); color: var(--green-dark); }
  .error { background: var(--danger-soft); color: var(--danger); }
  @media (max-width: 520px) {
    .backup-top { display: grid; }
    .backup-badge { justify-self: start; }
    .backup-actions { display: grid; }
    .backup-actions button { justify-content: center; }
  }
</style>
