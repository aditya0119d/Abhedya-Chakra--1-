import React, { useState, useRef } from 'react';
import { Upload, FileCheck, AlertCircle, HardDrive, CheckCircle2, ArrowRight } from 'lucide-react';
import { EXPECTED_CSV_COLUMNS, ForensicEngine, IngestProgress } from '../engine/engine';
import { IngestionMetrics } from '../types/dataset';
import { generateSyntheticDataset } from '../lib/syntheticGenerator';

interface IngestPageProps {
  engine: ForensicEngine;
  onIngestSuccess: (metrics: IngestionMetrics) => void;
  onNavigate: (route: string) => void;
}

export const IngestPage: React.FC<IngestPageProps> = ({
  engine,
  onIngestSuccess,
  onNavigate,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<IngestProgress | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<IngestionMetrics | null>(engine.getMetrics());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  };

  const processFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setErrorMessage('Invalid file format. Please select a valid CSV file.');
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);
    setProgress({
      rowsParsed: 0,
      bytesRead: 0,
      totalBytes: file.size,
      percent: 0,
      elapsedMs: 0,
      stage: 'reading',
    });

    try {
      const result = await engine.loadCsvFile(file, (p) => {
        setProgress(p);
      });
      setMetrics(result);
      onIngestSuccess(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown parsing failure.';
      setErrorMessage(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadDemoDataset = async (size: 'small' | 'medium') => {
    setIsProcessing(true);
    setErrorMessage(null);
    const rowTarget = size === 'small' ? 5000 : 25000;

    setProgress({
      rowsParsed: 0,
      bytesRead: 0,
      percent: 10,
      elapsedMs: 0,
      stage: 'reading',
    });

    try {
      // Yield to let UI update
      await new Promise((r) => setTimeout(r, 20));
      const dataset = generateSyntheticDataset({
        totalRows: rowTarget,
        numVictims: 5,
        muleRingsCount: size === 'small' ? 4 : 12,
      });

      const blob = new Blob([dataset.csvText], { type: 'text/csv' });
      const file = new File([blob], `synthetic_forensic_${size}.csv`, { type: 'text/csv' });

      const result = await engine.loadCsvFile(file, (p) => {
        setProgress(p);
      });
      setMetrics(result);
      onIngestSuccess(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Demo dataset generation error.';
      setErrorMessage(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full px-4 py-6 sm:px-6">
      {/* Title and Module Context */}
      <div className="mb-6 border-b border-[#e4e4e0] pb-4 dark:border-[#27272a]">
        <div className="flex items-center gap-2 font-mono text-xs text-[#71717a] uppercase tracking-wider dark:text-[#a1a1aa]">
          <span>Module A</span>
          <span>&middot;</span>
          <span>High-Throughput Normalization Engine</span>
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#18181b] dark:text-[#f4f4f5]">
          Transaction Dataset Ingestion & CSR Indexer
        </h1>
        <p className="mt-1 text-sm text-[#52525b] dark:text-[#a1a1aa]">
          Stream, parse, and index multi-bank transaction ledgers into zero-allocation typed arrays
          and Compressed Sparse Row (CSR) adjacency. Designed for 2,000,000+ entries under 60 seconds.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Ingestion Zone */}
        <div className="lg:col-span-2 space-y-6">
          {/* File Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative flex flex-col items-center justify-center rounded border-2 border-dashed p-10 text-center transition-colors ${
              isDragging
                ? 'border-[#d97706] bg-amber-50/40 dark:bg-amber-950/20'
                : 'border-[#d4d4d0] bg-[#fbfbfa] hover:border-[#18181b] dark:border-[#3f3f46] dark:bg-[#121214] dark:hover:border-[#f4f4f5]'
            } ${isProcessing ? 'pointer-events-none opacity-60' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="hidden"
            />

            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f4f4f2] border border-[#e4e4e0] dark:border-[#27272a] dark:bg-[#18181b]">
              <Upload className="h-6 w-6 text-[#18181b] dark:text-[#f4f4f5]" />
            </div>

            <h3 className="mt-4 text-base font-semibold text-[#18181b] dark:text-[#f4f4f5]">
              Drag and drop banking transaction CSV here
            </h3>
            <p className="mt-1 text-xs text-[#71717a] dark:text-[#a1a1aa]">
              Supports standard CSV format with 11 forensic columns. Streamed via File.stream() chunking.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="cursor-pointer rounded border border-[#18181b] bg-[#18181b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#27272a] dark:border-[#f4f4f5] dark:bg-[#f4f4f5] dark:text-[#18181b] dark:hover:bg-[#e4e4e0]"
              >
                Browse CSV File
              </button>
            </div>
          </div>

          {/* Quick Offline Evaluation Datasets */}
          <div className="rounded border border-[#e4e4e0] bg-[#f4f4f2] p-4 text-xs dark:border-[#27272a] dark:bg-[#18181b]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="font-semibold text-[#18181b] dark:text-[#f4f4f5]">
                  Offline Evaluation Test Data
                </span>
                <p className="text-[#71717a] mt-0.5 dark:text-[#a1a1aa]">
                  Load pre-configured synthetic datasets with injected multi-tier mule rings for immediate jury testing.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleLoadDemoDataset('small')}
                  disabled={isProcessing}
                  className="rounded border border-[#d4d4d0] bg-white px-3 py-1.5 font-medium text-[#18181b] hover:bg-[#f4f4f2] cursor-pointer dark:border-[#3f3f46] dark:bg-[#121214] dark:text-[#f4f4f5] dark:hover:bg-[#1e1e22]"
                >
                  Load 5,000 Rows
                </button>
                <button
                  onClick={() => handleLoadDemoDataset('medium')}
                  disabled={isProcessing}
                  className="rounded border border-[#18181b] bg-[#18181b] px-3 py-1.5 font-medium text-white hover:bg-[#27272a] cursor-pointer dark:border-[#f4f4f5] dark:bg-[#f4f4f5] dark:text-[#18181b] dark:hover:bg-[#e4e4e0]"
                >
                  Load 25,000 Rows
                </button>
              </div>
            </div>
          </div>

          {/* Processing Progress Monitor */}
          {isProcessing && progress && (
            <div className="rounded border border-amber-300 bg-amber-50/50 p-4 font-mono text-xs">
              <div className="flex items-center justify-between text-amber-900 font-semibold mb-2">
                <span>
                  {progress.stage === 'reading' && 'Streaming & Parsing Row Chunks...'}
                  {progress.stage === 'indexing' && 'Building CSR & CSC Adjacency Arrays...'}
                  {progress.stage === 'complete' && 'Ingestion Finalized'}
                </span>
                <span>{progress.percent || 0}%</span>
              </div>

              {/* Progress bar */}
              <div className="h-2 w-full overflow-hidden rounded bg-amber-200">
                <div
                  className="h-full bg-amber-600 transition-all duration-150"
                  style={{ width: `${progress.percent || 0}%` }}
                />
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-amber-900">
                <div>
                  Rows Parsed: <span className="font-bold">{progress.rowsParsed.toLocaleString()}</span>
                </div>
                <div>
                  Bytes Read: <span className="font-bold">{(progress.bytesRead / (1024 * 1024)).toFixed(1)} MB</span>
                </div>
                <div>
                  Elapsed: <span className="font-bold">{(progress.elapsedMs / 1000).toFixed(1)}s</span>
                </div>
              </div>
            </div>
          )}

          {/* Error Message Display */}
          {errorMessage && (
            <div className="rounded border border-red-300 bg-red-50 p-4 text-xs text-red-900">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Ingestion Failure:</span>
                  <p className="mt-1 font-mono text-[11px]">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Post-Ingest Benchmark Results (Measured Data Only) */}
          {metrics && !isProcessing && (
            <div className="rounded border border-teal-300 bg-teal-50/40 p-5 font-mono text-xs text-teal-950">
              <div className="flex items-center justify-between border-b border-teal-200 pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-teal-600" />
                  <span className="text-sm font-bold text-teal-900">
                    Dataset Successfully Indexed
                  </span>
                </div>
                <button
                  onClick={() => onNavigate('#/victim-query')}
                  className="flex items-center gap-1.5 rounded bg-teal-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-900 cursor-pointer"
                >
                  <span>Proceed to Blind Victim Query</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="border-r border-teal-200 pr-2">
                  <p className="text-[10px] uppercase text-teal-700">Measured Rows</p>
                  <p className="mt-0.5 text-lg font-bold">{metrics.rowCount.toLocaleString()}</p>
                </div>
                <div className="border-r border-teal-200 pr-2">
                  <p className="text-[10px] uppercase text-teal-700">Distinct Accounts</p>
                  <p className="mt-0.5 text-lg font-bold">{metrics.distinctAccounts.toLocaleString()}</p>
                </div>
                <div className="border-r border-teal-200 pr-2">
                  <p className="text-[10px] uppercase text-teal-700">Ingestion Time</p>
                  <p className="mt-0.5 text-lg font-bold">
                    {(metrics.elapsedMs / 1000).toFixed(2)}s
                    <span className="text-[10px] font-normal text-teal-700 ml-1">
                      {metrics.meetsBenchmark ? '(Passed <60s SLA)' : '(Exceeded SLA)'}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-teal-700">Throughput</p>
                  <p className="mt-0.5 text-lg font-bold">
                    {metrics.throughputRowsPerSec.toLocaleString()} rows/s
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Schema & Specifications */}
        <div className="space-y-4">
          <div className="rounded border border-[#e4e4e0] bg-[#fbfbfa] p-4 text-xs">
            <h4 className="flex items-center gap-2 font-semibold text-[#18181b]">
              <FileCheck className="h-4 w-4 text-[#d97706]" />
              Required 11-Column Schema (Image 6)
            </h4>
            <p className="mt-1 text-[11px] text-[#71717a]">
              The parser enforces exact column headers. Mismatches will result in immediate rejection.
            </p>

            <ul className="mt-3 space-y-1.5 font-mono text-[11px] border-t border-[#e4e4e0] pt-3">
              {EXPECTED_CSV_COLUMNS.map((col, idx) => (
                <li key={col} className="flex items-center justify-between text-[#52525b]">
                  <span>
                    <span className="text-[#a1a1aa] mr-1.5">{idx + 1}.</span>
                    {col}
                  </span>
                  <span className="text-[10px] text-[#71717a]">
                    {col.includes('Account') ? '12-digit' : col.includes('IFSC') ? 'IFSC code' : col.includes('Amount') ? 'INR' : col.includes('Timestamp') ? 'ISO / YYYY' : 'Text'}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded border border-[#e4e4e0] bg-[#f4f4f2] p-4 text-xs">
            <h4 className="flex items-center gap-2 font-semibold text-[#18181b]">
              <HardDrive className="h-4 w-4 text-[#0d9488]" />
              Zero-Allocation Memory Architecture
            </h4>
            <p className="mt-1 text-[11px] text-[#71717a] leading-relaxed">
              Standard JavaScript object representations for 2 million records consume over 1GB heap.
              Abhedya-Chakra uses string interning tables and contiguous flat typed arrays
              (Uint32Array, Float64Array) requiring under 80MB RAM for instant graph traversals.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
