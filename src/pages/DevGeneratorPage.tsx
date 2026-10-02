import React, { useState } from 'react';
import { FlaskConical, Download, Play, CheckCircle2, AlertTriangle, FileCode } from 'lucide-react';
import { generateSyntheticDataset, SyntheticDatasetOutput } from '../lib/syntheticGenerator';
import { ForensicEngine } from '../engine/engine';
import { IngestionMetrics } from '../types/dataset';

interface DevGeneratorPageProps {
  engine: ForensicEngine;
  onDatasetLoaded: (metrics: IngestionMetrics) => void;
  onNavigateTrace: (victimAccount: string) => void;
}

export const DevGeneratorPage: React.FC<DevGeneratorPageProps> = ({
  engine,
  onDatasetLoaded,
  onNavigateTrace,
}) => {
  const [rowCount, setRowCount] = useState<number>(10000);
  const [numVictims, setNumVictims] = useState<number>(5);
  const [muleRings, setMuleRings] = useState<number>(8);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<SyntheticDatasetOutput | null>(null);
  const [loadStatus, setLoadStatus] = useState<string | null>(null);

  const handleGenerate = () => {
    setIsGenerating(true);
    setLoadStatus(null);
    setTimeout(() => {
      try {
        const out = generateSyntheticDataset({
          totalRows: rowCount,
          numVictims,
          muleRingsCount: muleRings,
        });
        setGeneratedResult(out);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Generation failed.');
      } finally {
        setIsGenerating(false);
      }
    }, 50);
  };

  const handleDownloadCsv = () => {
    if (!generatedResult) return;
    const blob = new Blob([generatedResult.csvText], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `abhedya_synthetic_${generatedResult.totalRows}_records.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadGroundTruth = () => {
    if (!generatedResult) return;
    const blob = new Blob([generatedResult.groundTruthCsvText], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `abhedya_ground_truth_${generatedResult.totalRows}_records.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleLoadDirectlyIntoEngine = async () => {
    if (!generatedResult) return;
    setLoadStatus('Loading into in-memory typed engine...');
    try {
      const blob = new Blob([generatedResult.csvText], { type: 'text/csv' });
      const file = new File([blob], `synthetic_${generatedResult.totalRows}.csv`, { type: 'text/csv' });
      const metrics = await engine.loadCsvFile(file);
      onDatasetLoaded(metrics);
      setLoadStatus(`Successfully indexed ${metrics.rowCount.toLocaleString()} transactions across ${metrics.distinctAccounts.toLocaleString()} accounts in ${(metrics.elapsedMs / 1000).toFixed(2)}s.`);
    } catch (err) {
      setLoadStatus(`Error: ${err instanceof Error ? err.message : 'Load failed'}`);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* Title */}
      <div className="mb-6 border-b border-[#e4e4e0] pb-4">
        <div className="flex items-center gap-2 font-mono text-xs text-[#71717a] uppercase tracking-wider">
          <span>Development & Test Harness</span>
          <span>&middot;</span>
          <span className="font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
            Route: /dev/generator
          </span>
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#18181b]">
          Synthetic Forensic Dataset Generator
        </h1>
        <p className="mt-1 text-sm text-[#52525b]">
          Generates synthetic 11-column CSV datasets matching Image 6 schema with injected multi-tiered
          money mule networks for offline benchmarking and jury verification.
        </p>
      </div>

      {/* Development Only Notice */}
      <div className="mb-6 rounded border border-amber-300 bg-amber-50/50 p-4 font-mono text-xs text-amber-950 flex items-start gap-2.5">
        <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <strong className="block font-semibold">
            Synthetic Test Data, Development Only
          </strong>
          <p className="text-[11px] mt-0.5 text-amber-900 leading-relaxed">
            Per prompt requirements: Nothing synthetic is bundled as default data, and the production app starts empty.
            Use this tool to generate realistic test ledgers and ground-truth validation pairs for offline demonstration.
          </p>
        </div>
      </div>

      {/* Generator Controls */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded border border-[#e4e4e0] bg-white p-5 font-mono text-xs space-y-4">
          <h3 className="font-bold text-[#18181b] border-b border-[#e4e4e0] pb-2">
            Dataset Parameters
          </h3>

          <div>
            <label className="text-[#52525b] block font-semibold mb-1">Target Total Rows:</label>
            <select
              value={rowCount}
              onChange={(e) => setRowCount(parseInt(e.target.value, 10))}
              className="w-full rounded border border-[#d4d4d0] bg-white px-2.5 py-1.5 text-xs text-[#18181b]"
            >
              <option value="5000">5,000 Transactions (Instant evaluation)</option>
              <option value="10000">10,000 Transactions (Standard test)</option>
              <option value="25000">25,000 Transactions (Extended test)</option>
              <option value="50000">50,000 Transactions (Stress test)</option>
              <option value="100000">100,000 Transactions (Deep graph test)</option>
            </select>
          </div>

          <div>
            <label className="text-[#52525b] block font-semibold mb-1">Injected Victim Accounts:</label>
            <input
              type="number"
              min="1"
              max="20"
              value={numVictims}
              onChange={(e) => setNumVictims(parseInt(e.target.value, 10) || 1)}
              className="w-full rounded border border-[#d4d4d0] px-2.5 py-1.5 text-xs text-[#18181b]"
            />
          </div>

          <div>
            <label className="text-[#52525b] block font-semibold mb-1">Multi-Tier Mule Rings:</label>
            <input
              type="number"
              min="1"
              max="50"
              value={muleRings}
              onChange={(e) => setMuleRings(parseInt(e.target.value, 10) || 1)}
              className="w-full rounded border border-[#d4d4d0] px-2.5 py-1.5 text-xs text-[#18181b]"
            />
          </div>

          <div className="border-t border-[#e4e4e0] pt-4">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 rounded border border-[#18181b] bg-[#18181b] py-2.5 font-semibold text-white hover:bg-[#27272a] disabled:opacity-50 cursor-pointer"
            >
              <FlaskConical className="h-4 w-4" />
              <span>{isGenerating ? 'Synthesizing Records...' : 'Generate Synthetic Dataset'}</span>
            </button>
          </div>
        </div>

        {/* Output Panel */}
        <div className="lg:col-span-2 rounded border border-[#e4e4e0] bg-[#fbfbfa] p-5 font-mono text-xs">
          <h3 className="font-bold text-[#18181b] border-b border-[#e4e4e0] pb-2">
            Generated Dataset Status & Ground Truth Export
          </h3>

          {generatedResult ? (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 bg-white border border-[#e4e4e0] p-3 rounded">
                <div>
                  <span className="text-[10px] text-[#71717a] uppercase">Generated Rows</span>
                  <p className="mt-0.5 text-base font-bold text-[#18181b]">{generatedResult.totalRows.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-[10px] text-[#71717a] uppercase">Distinct Accounts</span>
                  <p className="mt-0.5 text-base font-bold text-[#18181b]">{generatedResult.distinctAccounts.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-[10px] text-[#71717a] uppercase">Injected Mules</span>
                  <p className="mt-0.5 text-base font-bold text-red-700">{generatedResult.injectedMules.length}</p>
                </div>
                <div>
                  <span className="text-[10px] text-[#71717a] uppercase">Sample Victims</span>
                  <p className="mt-0.5 text-base font-bold text-teal-800">{generatedResult.sampleVictims.length}</p>
                </div>
              </div>

              {/* Sample Victims Available to Test */}
              <div className="bg-white border border-[#e4e4e0] p-3 rounded">
                <span className="font-bold text-[#18181b] block mb-1">
                  Injected Victim Accounts (Click to trace in Blind Victim Query):
                </span>
                <div className="flex flex-wrap gap-2">
                  {generatedResult.sampleVictims.map((vic) => (
                    <button
                      key={vic}
                      onClick={() => onNavigateTrace(vic)}
                      className="px-2 py-1 rounded bg-[#f4f4f2] border border-[#e4e4e0] hover:border-[#18181b] text-xs font-bold text-[#18181b] cursor-pointer"
                    >
                      {vic} &rarr;
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={handleLoadDirectlyIntoEngine}
                  className="flex items-center gap-1.5 rounded border border-[#18181b] bg-[#18181b] px-4 py-2 font-semibold text-white hover:bg-[#27272a] cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5" />
                  <span>Load Directly into Forensic Engine</span>
                </button>
                <button
                  onClick={handleDownloadCsv}
                  className="flex items-center gap-1.5 rounded border border-[#d4d4d0] bg-white px-3 py-2 font-semibold text-[#18181b] hover:bg-[#f4f4f2] cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Transaction CSV</span>
                </button>
                <button
                  onClick={handleDownloadGroundTruth}
                  className="flex items-center gap-1.5 rounded border border-[#d4d4d0] bg-white px-3 py-2 font-semibold text-[#18181b] hover:bg-[#f4f4f2] cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Ground-Truth CSV</span>
                </button>
              </div>

              {loadStatus && (
                <div className="p-3 bg-teal-50 border border-teal-200 text-teal-950 rounded">
                  {loadStatus}
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-[#71717a]">
              Select row parameters and click &ldquo;Generate Synthetic Dataset&rdquo; to build offline test files.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
