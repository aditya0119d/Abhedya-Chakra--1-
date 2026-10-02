import React, { useState } from 'react';
import { Network, Download, Filter, RefreshCw, ArrowUpDown, ShieldAlert, ExternalLink, SlidersHorizontal } from 'lucide-react';
import { ForensicEngine } from '../engine/engine';
import { MuleDetectionResult, HeuristicThresholds, defaultHeuristicThresholds } from '../types/heuristics';
import { formatINR } from '../lib/currency';
import { sanitizeForCsv } from '../lib/sanitizer';

interface MuleDetectionPageProps {
  engine: ForensicEngine;
  thresholds: HeuristicThresholds;
  onTraceAccount: (accountNumber: string) => void;
  onSelectAccount: (accountNumber: string) => void;
  onOpenSettings: () => void;
  onDetectionRun: (results: MuleDetectionResult[], executionMs: number) => void;
}

export const MuleDetectionPage: React.FC<MuleDetectionPageProps> = ({
  engine,
  thresholds,
  onTraceAccount,
  onSelectAccount,
  onOpenSettings,
  onDetectionRun,
}) => {
  const [results, setResults] = useState<MuleDetectionResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [filterLayer, setFilterLayer] = useState<string>('ALL');
  const [minRiskScore, setMinRiskScore] = useState<number>(30);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortField, setSortField] = useState<'risk' | 'inflow' | 'outflow'>('risk');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [scanElapsedMs, setScanElapsedMs] = useState<number | null>(null);

  const handleRunScan = async () => {
    setIsScanning(true);
    const t0 = performance.now();
    try {
      const scanResults = await engine.runMuleDetection(thresholds);
      const elapsed = Math.round(performance.now() - t0);
      setScanElapsedMs(elapsed);
      setResults(scanResults);
      onDetectionRun(scanResults, elapsed);
    } catch {
      // Handled
    } finally {
      setIsScanning(false);
    }
  };

  const handleExportCsv = () => {
    if (results.length === 0) return;

    const headers = [
      'Account_Number',
      'Bank_Name',
      'IFSC',
      'Mule_Risk_Index',
      'Layer',
      'Total_Inflow',
      'Total_Outflow',
      'Distinct_Senders',
      'Distinct_Receivers',
      'Risk_Reasons',
    ];

    const rows = results.map((r) => [
      sanitizeForCsv(r.accountNumber),
      sanitizeForCsv(r.bankName),
      sanitizeForCsv(r.primaryIfsc),
      r.muleRiskIndex,
      sanitizeForCsv(r.layer),
      r.totalInflow,
      r.totalOutflow,
      r.distinctSenders,
      r.distinctReceivers,
      sanitizeForCsv(r.reasons.join('; ')),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `abhedya_mule_detection_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredResults = results
    .filter((r) => {
      if (filterLayer !== 'ALL' && r.layer !== filterLayer) return false;
      if (r.muleRiskIndex < minRiskScore) return false;
      if (searchTerm) {
        const clean = searchTerm.toLowerCase();
        return (
          r.accountNumber.toLowerCase().includes(clean) ||
          r.bankName.toLowerCase().includes(clean) ||
          r.primaryIfsc.toLowerCase().includes(clean)
        );
      }
      return true;
    })
    .sort((a, b) => {
      let diff = 0;
      if (sortField === 'risk') diff = b.muleRiskIndex - a.muleRiskIndex;
      else if (sortField === 'inflow') diff = b.totalInflow - a.totalInflow;
      else if (sortField === 'outflow') diff = b.totalOutflow - a.totalOutflow;
      return sortAsc ? -diff : diff;
    });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* Title */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#e4e4e0] pb-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-[#71717a] uppercase tracking-wider">
            <span>Module B</span>
            <span>&middot;</span>
            <span>Graph Analytics Heuristics Engine</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#18181b]">
            Multi-Tier Mule Ring Detection
          </h1>
          <p className="mt-1 text-sm text-[#52525b]">
            Scores every account on a 0 to 100 Mule Risk Index based on high-velocity pass-through,
            collector fan-in, distributor fan-out, cyclical smurfing, and terminal cash-out signals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 rounded border border-[#d4d4d0] bg-white px-3 py-2 text-xs font-semibold text-[#18181b] hover:bg-[#f4f4f2] cursor-pointer"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Tune Thresholds & Weights</span>
          </button>
          <button
            onClick={handleRunScan}
            disabled={isScanning}
            className="flex items-center gap-1.5 rounded border border-[#18181b] bg-[#18181b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#27272a] disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning Dataset...' : 'Run Module B Scan'}</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Filters & CSV Export */}
      <div className="rounded border border-[#e4e4e0] bg-[#fbfbfa] p-4 text-xs font-mono mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search account, bank, IFSC..."
                className="w-56 rounded border border-[#d4d4d0] bg-white px-3 py-1.5 text-xs text-[#18181b] focus:border-[#d97706] focus:outline-none"
              />
            </div>

            {/* Layer Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[#71717a]">Layer:</span>
              <select
                value={filterLayer}
                onChange={(e) => setFilterLayer(e.target.value)}
                className="rounded border border-[#d4d4d0] bg-white px-2 py-1.5 text-xs text-[#18181b]"
              >
                <option value="ALL">All Layers</option>
                <option value="L1_COLLECTOR">L1 Collector</option>
                <option value="L2_DISTRIBUTOR">L2 Distributor</option>
                <option value="L3_TERMINAL">L3 Terminal Cash-Out</option>
                <option value="INTERMEDIARY">Intermediary</option>
              </select>
            </div>

            {/* Min Risk Score Filter */}
            <div className="flex items-center gap-2">
              <span className="text-[#71717a]">Min Risk:</span>
              <input
                type="range"
                min="0"
                max="90"
                step="10"
                value={minRiskScore}
                onChange={(e) => setMinRiskScore(parseInt(e.target.value, 10))}
                className="w-24 accent-[#18181b]"
              />
              <span className="font-bold text-[#18181b]">{minRiskScore}+</span>
            </div>
          </div>

          {/* Export and Scan Stats */}
          <div className="flex items-center gap-3">
            {scanElapsedMs !== null && (
              <span className="text-[#71717a]">
                Scan executed in <strong className="text-[#18181b]">{(scanElapsedMs / 1000).toFixed(2)}s</strong>
              </span>
            )}
            <button
              onClick={handleExportCsv}
              disabled={results.length === 0}
              className="flex items-center gap-1.5 rounded border border-[#d4d4d0] bg-white px-3 py-1.5 font-semibold text-[#18181b] hover:bg-[#f4f4f2] disabled:opacity-40 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Flagged Mules (CSV)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Flagged Accounts Table */}
      <div className="rounded border border-[#e4e4e0] bg-white overflow-hidden shadow-xs">
        <div className="border-b border-[#e4e4e0] bg-[#f4f4f2] px-4 py-2.5 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 font-bold text-[#18181b]">
            <ShieldAlert className="h-4 w-4 text-[#d97706]" />
            <span>Detected Mule Candidates</span>
            <span className="rounded bg-[#e4e4e0] px-2 py-0.5 text-[11px] text-[#52525b]">
              {filteredResults.length} accounts flagged
            </span>
          </div>
          <div className="text-[11px] text-[#71717a]">
            Click table headers to reorder
          </div>
        </div>

        <div className="overflow-x-auto max-h-[560px] scrollbar-thin">
          <table className="w-full text-left text-xs font-mono">
            <thead className="sticky top-0 bg-[#f4f4f2] border-b border-[#e4e4e0] text-[11px] text-[#71717a]">
              <tr>
                <th
                  onClick={() => {
                    setSortField('risk');
                    setSortAsc(!sortAsc);
                  }}
                  className="py-2.5 px-3 cursor-pointer hover:text-[#18181b]"
                >
                  <div className="flex items-center gap-1">
                    <span>Mule Risk Index</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-2.5 px-3">Layer Tag</th>
                <th className="py-2.5 px-3">Account Number</th>
                <th className="py-2.5 px-3">Bank & IFSC</th>
                <th
                  onClick={() => {
                    setSortField('inflow');
                    setSortAsc(!sortAsc);
                  }}
                  className="py-2.5 px-3 text-right cursor-pointer hover:text-[#18181b]"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Inflow</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => {
                    setSortField('outflow');
                    setSortAsc(!sortAsc);
                  }}
                  className="py-2.5 px-3 text-right cursor-pointer hover:text-[#18181b]"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Outflow</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-2.5 px-3">Heuristic Anomalies Triggered</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e4e4e0]">
              {filteredResults.length > 0 ? (
                filteredResults.map((mule) => (
                  <tr key={mule.accountNumber} className="hover:bg-[#fbfbfa] transition-colors">
                    {/* Risk Index */}
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-bold text-xs ${
                          mule.muleRiskIndex >= 70
                            ? 'bg-red-100 text-red-900 border border-red-200'
                            : mule.muleRiskIndex >= 50
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : 'bg-teal-100 text-teal-900 border border-teal-200'
                        }`}
                      >
                        {mule.muleRiskIndex} / 100
                      </span>
                    </td>

                    {/* Layer */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          mule.layer === 'L1_COLLECTOR'
                            ? 'bg-blue-100 text-blue-900 border border-blue-200'
                            : mule.layer === 'L2_DISTRIBUTOR'
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : 'bg-red-100 text-red-900 border border-red-200'
                        }`}
                      >
                        {mule.layer}
                      </span>
                    </td>

                    {/* Account */}
                    <td className="py-2.5 px-3 font-bold text-[#18181b]">{mule.accountNumber}</td>

                    {/* Bank & IFSC */}
                    <td className="py-2.5 px-3 text-[#52525b]">
                      <div>{mule.bankName}</div>
                      <div className="text-[10px] text-[#71717a]">{mule.primaryIfsc}</div>
                    </td>

                    {/* Inflow */}
                    <td className="py-2.5 px-3 text-right text-teal-800 font-semibold">
                      {formatINR(mule.totalInflow)}
                      <div className="text-[10px] text-[#71717a]">{mule.distinctSenders} senders</div>
                    </td>

                    {/* Outflow */}
                    <td className="py-2.5 px-3 text-right text-red-800 font-semibold">
                      {formatINR(mule.totalOutflow)}
                      <div className="text-[10px] text-[#71717a]">{mule.distinctReceivers} receivers</div>
                    </td>

                    {/* Reasons */}
                    <td className="py-2.5 px-3 max-w-xs text-[11px] text-[#52525b]">
                      <ul className="space-y-0.5 list-disc list-inside">
                        {mule.reasons.slice(0, 2).map((r, i) => (
                          <li key={i} className="truncate" title={r}>
                            {r}
                          </li>
                        ))}
                      </ul>
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onTraceAccount(mule.accountNumber)}
                          className="rounded border border-[#18181b] bg-white px-2 py-1 text-[10px] font-semibold text-[#18181b] hover:bg-[#f4f4f2] cursor-pointer"
                        >
                          Trace Money Trail
                        </button>
                        <button
                          onClick={() => onSelectAccount(mule.accountNumber)}
                          className="rounded border border-[#d4d4d0] bg-white px-2 py-1 text-[10px] font-medium text-[#71717a] hover:text-[#18181b] cursor-pointer"
                        >
                          Dossier
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#71717a] font-mono text-xs">
                    {results.length === 0
                      ? 'No scan executed yet. Click "Run Module B Scan" to evaluate all accounts against detection heuristics.'
                      : 'No accounts matched the active filter criteria.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
