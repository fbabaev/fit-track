import React, { useState, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { ImportSchema } from '../lib/schemas';
import { entriestoCSV, downloadFile, cn } from '../lib/utils';
import { format } from 'date-fns';

type ImportState = 'idle' | 'parsing' | 'success' | 'error';

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export function Export() {
  const entries = useAppStore((s) => s.entries);
  const settings = useAppStore((s) => s.settings);
  const importEntries = useAppStore((s) => s.importEntries);
  const clearAllData = useAppStore((s) => s.clearAllData);

  const [importState, setImportState] = useState<ImportState>('idle');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const timestamp = format(new Date(), 'yyyy-MM-dd');

  const handleExportCSV = () => {
    const csv = entriestoCSV(entries);
    downloadFile(csv, `ramadan-fitness-${timestamp}.csv`, 'text/csv;charset=utf-8;');
  };

  const handleExportJSON = () => {
    const payload = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      entries,
      settings,
    };
    downloadFile(
      JSON.stringify(payload, null, 2),
      `ramadan-fitness-${timestamp}.json`,
      'application/json'
    );
  };

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.json')) {
      setImportState('error');
      setImportResult({ imported: 0, skipped: 0, errors: ['Only JSON files are supported for import. Use the exported format.'] });
      return;
    }

    setImportState('parsing');
    setImportResult(null);

    try {
      const text = await file.text();
      const raw = JSON.parse(text);
      const result = ImportSchema.safeParse(raw);

      if (!result.success) {
        const errorMessages = result.error.issues.map(
          (e) => `${e.path.map(String).join('.')}: ${e.message}`
        );
        setImportState('error');
        setImportResult({ imported: 0, skipped: 0, errors: errorMessages.slice(0, 8) });
        return;
      }

      importEntries(result.data.entries);
      setImportState('success');
      setImportResult({
        imported: result.data.entries.length,
        skipped: 0,
        errors: [],
      });
    } catch {
      setImportState('error');
      setImportResult({
        imported: 0,
        skipped: 0,
        errors: ['Could not parse file. Make sure it\'s a valid JSON export from this app.'],
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleClearData = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    clearAllData();
    setConfirmClear(false);
  };

  return (
    <div className="max-w-xl animate-fade-in">
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-neutral-900">Export & Import</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          Your data lives in your browser. Export regularly to avoid losing it.
        </p>
      </div>

      {/* Data summary */}
      <div className="card p-4 mb-5 flex gap-6">
        <div>
          <p className="text-xs text-neutral-400 mb-0.5">Entries logged</p>
          <p className="text-2xl font-semibold text-neutral-900 tabular-nums">{entries.length}</p>
        </div>
        {entries.length > 0 && (
          <>
            <div>
              <p className="text-xs text-neutral-400 mb-0.5">First entry</p>
              <p className="text-sm font-medium text-neutral-700">
                {entries.reduce((a, b) => (a.date < b.date ? a : b)).date}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-400 mb-0.5">Latest entry</p>
              <p className="text-sm font-medium text-neutral-700">
                {entries.reduce((a, b) => (a.date > b.date ? a : b)).date}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Export section */}
      <div className="card p-4 mb-4">
        <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Export</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleExportCSV}
            disabled={entries.length === 0}
            className="btn-secondary flex-col items-start gap-1 h-auto py-3 px-4"
          >
            <div className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <span className="font-semibold">Export CSV</span>
            </div>
            <span className="text-xs text-neutral-400 font-normal text-left">
              All {entries.length} entries. Opens in Excel, Sheets, Numbers.
            </span>
          </button>

          <button
            onClick={handleExportJSON}
            disabled={entries.length === 0}
            className="btn-secondary flex-col items-start gap-1 h-auto py-3 px-4"
          >
            <div className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
              </svg>
              <span className="font-semibold">Export JSON</span>
            </div>
            <span className="text-xs text-neutral-400 font-normal text-left">
              Includes settings. Use this to back up and restore.
            </span>
          </button>
        </div>

        <p className="text-xs text-neutral-400 mt-3">
          File will be named <code className="font-mono bg-neutral-100 px-1 rounded">ramadan-fitness-{timestamp}.csv / .json</code>
        </p>
      </div>

      {/* Import section */}
      <div className="card p-4 mb-4">
        <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Import</h2>
        <p className="text-xs text-neutral-400 mb-3">
          Import a previously exported JSON file. Existing entries with the same date will be overwritten.
        </p>

        <div
          className={cn(
            'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors duration-150',
            dragOver
              ? 'border-neutral-400 bg-neutral-50'
              : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
          )}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="Upload JSON file"
          onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
        >
          <svg className="w-8 h-8 mx-auto mb-2 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <p className="text-sm text-neutral-500">
            {dragOver ? 'Drop to import' : 'Drop a JSON file or click to browse'}
          </p>
          <p className="text-xs text-neutral-400 mt-1">Only .json exports from this app</p>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleFileChange}
          aria-label="Choose JSON file"
        />

        {/* Import status */}
        {importState === 'parsing' && (
          <div className="mt-3 flex items-center gap-2 text-xs text-neutral-500">
            <div className="w-3 h-3 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
            Validating and importing…
          </div>
        )}

        {importState === 'success' && importResult && (
          <div className="mt-3 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700">
            <p className="font-medium">Import successful</p>
            <p className="mt-0.5">
              {importResult.imported} {importResult.imported === 1 ? 'entry' : 'entries'} imported.
            </p>
          </div>
        )}

        {importState === 'error' && importResult && (
          <div className="mt-3 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            <p className="font-medium mb-1">Import failed</p>
            <ul className="space-y-0.5 list-disc list-inside">
              {importResult.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div className="card p-4 border-red-100">
        <h2 className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-2">Danger zone</h2>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-neutral-800">Clear all data</p>
            <p className="text-xs text-neutral-400">
              Permanently deletes all entries and resets settings. This cannot be undone.
            </p>
          </div>
          <button
            onClick={handleClearData}
            className={cn(
              'btn shrink-0',
              confirmClear ? 'btn-danger' : 'btn bg-neutral-100 text-neutral-500 hover:bg-red-50 hover:text-red-600'
            )}
          >
            {confirmClear ? 'Yes, delete everything' : 'Clear data'}
          </button>
        </div>
        {confirmClear && (
          <p className="text-xs text-red-500 mt-2">
            Click again to confirm. This cannot be undone. Export first if you want a backup.
          </p>
        )}
      </div>
    </div>
  );
}
