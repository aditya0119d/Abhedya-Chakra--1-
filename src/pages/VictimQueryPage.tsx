import React, { useState } from 'react';
import { Search, Zap, AlertCircle, ArrowRight, ShieldAlert, CheckCircle, FileText, ChevronRight, CornerDownRight } from 'lucide-react';
import { ForensicEngine } from '../engine/engine';
import { TraceNode, TraceResult } from '../types/dataset';
import { SigmaGraphView } from '../components/graph/SigmaGraphView';
import { formatINR } from '../lib/currency';

interface VictimQueryPageProps {
  engine: ForensicEngine;
  last5Traces: TraceResult[];
  activeTrace: TraceResult | null;
  onTraceCompleted: (trace: TraceResult) => void;
  onSelectTraceTab: (trace: TraceResult) => void;
  onSelectAccount: (accountNumber: string) => void;
  onNavigate: (route: string) => void;
}

export const VictimQueryPage: React.FC<VictimQueryPageProps> = ({
  engine,
  last5Traces,
  activeTrace,
  onTraceCompleted,
  onSelectTraceTab,
  onSelectAccount,
  onNavigate,
}) => {
  const [inputAccount, setInputAccount] = useState('');
  const [isTracing, setIsTracing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<TraceNode | null>(null);
  const [selectedHopFilter, setSelectedHopFilter] = useState<'ALL' | 'L1' | 'L2' | 'L3' | 'HOLDING'>('ALL');

  const sampleAccounts = engine.getSampleVictimAccounts(5);

  const handleRunTrace = async (accountToTrace?: string) => {
    const target = (accountToTrace || inputAccount).trim();
    if (!target) {
      setErrorMessage('Please enter a Victim Account ID to initiate multi-hop money trail analysis.');
      return;
    }

    setErrorMessage(null);
    setIsTracing(true);

    try {
      const result = await engine.traceVictim(target, 4);
      onTraceCompleted(result);
      setSelectedNode(result.nodes[0] || null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Trace failed.';
      setErrorMessage(msg);
    } finally {
      setIsTracing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleRunTrace();
    }
  };

  const filteredNodes = activeTrace
    ? activeTrace.nodes.filter((node) => {
        if (selectedHopFilter === 'L1') return node.layer === 'L1_COLLECTOR';
        if (selectedHopFilter === 'L2') return node.layer === 'L2_DISTRIBUTOR';
        if (selectedHopFilter === 'L3') return node.layer === 'L3_TERMINAL';
        if (selectedHopFilter === 'HOLDING') return node.isHolding && node.hop > 0;
        return true;
      })
    : [];

  return (
    <div className="w-full px-4 py-6 sm:px-6">
      {/* Title & Jury Criteria Badge */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#e4e4e0] pb-4 dark:border-[#27272a]">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-[#71717a] uppercase tracking-wider dark:text-[#a1a1aa]">
            <span>Primary Evaluation Benchmark</span>
            <span>&middot;</span>
            <span className="font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-300">
              40% Jury Criterion: Blind Victim Query Test
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#18181b] dark:text-[#f4f4f5]">
            Blind Victim Query & Money Trail Trace
          </h1>
          <p className="mt-1 text-sm text-[#52525b] dark:text-[#a1a1aa]">
            Computes downstream fund dispersion across Layer 1 (Collectors), Layer 2 (Distributors),
            and Layer 3 (Terminal Cash-Outs) up to 4 hops deep within 2 seconds.
          </p>
        </div>

        {activeTrace && (
          <button
            onClick={() => onNavigate('#/case-officer')}
            className="flex items-center gap-2 rounded border border-[#18181b] bg-[#18181b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#27272a] cursor-pointer dark:border-[#f4f4f5] dark:bg-[#f4f4f5] dark:text-[#18181b] dark:hover:bg-[#e4e4e0]"
          >
            <FileText className="h-4 w-4" />
            <span>Generate Sec 91 Notice & Police Diary</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Large Input Box for Victim Account ID */}
      <div className="rounded border border-[#e4e4e0] bg-[#fbfbfa] p-5 shadow-xs dark:border-[#27272a] dark:bg-[#121214]">
        <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-[#52525b] mb-2 dark:text-[#a1a1aa]">
          Enter Victim Account ID (12-digit format):
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputAccount}
              onChange={(e) => setInputAccount(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. 9110000000"
              disabled={isTracing}
              className="w-full rounded border border-[#d4d4d0] bg-white px-4 py-3 font-mono text-base font-semibold text-[#18181b] placeholder:text-[#a1a1aa] focus:border-[#d97706] focus:outline-none dark:border-[#3f3f46] dark:bg-[#18181b] dark:text-[#f4f4f5]"
            />
          </div>
          <button
            onClick={() => handleRunTrace()}
            disabled={isTracing}
            className="flex items-center gap-2 rounded border border-[#18181b] bg-[#18181b] px-6 py-3 font-mono text-xs font-semibold text-white hover:bg-[#27272a] disabled:opacity-50 cursor-pointer dark:border-[#f4f4f5] dark:bg-[#f4f4f5] dark:text-[#18181b] dark:hover:bg-[#e4e4e0]"
          >
            <Search className="h-4 w-4" />
            <span>{isTracing ? 'Tracing Trail...' : 'Execute Trace (Enter)'}</span>
          </button>
        </div>

        {/* Quick sample victim accounts for testing */}
        {sampleAccounts.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-xs text-[#71717a] dark:text-[#a1a1aa]">
            <span>Sample Victim Accounts in Ledger:</span>
            {sampleAccounts.map((acc) => (
              <button
                key={acc}
                onClick={() => {
                  setInputAccount(acc);
                  handleRunTrace(acc);
                }}
                className="rounded border border-[#e4e4e0] bg-[#f4f4f2] px-2 py-0.5 text-[11px] font-semibold text-[#18181b] hover:border-[#18181b] cursor-pointer dark:border-[#3f3f46] dark:bg-[#1e1e22] dark:text-[#f4f4f5]"
              >
                {acc}
              </button>
            ))}
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 flex items-center gap-2 rounded border border-red-200 bg-red-50 p-3 text-xs text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Tabs for Last 5 Queries (Judges Criterion: Flip between last 5 tests) */}
      {last5Traces.length > 0 && (
        <div className="mt-4 flex items-center gap-2 border-b border-[#e4e4e0] pb-2 overflow-x-auto dark:border-[#27272a]">
          <span className="font-mono text-xs text-[#71717a] font-medium mr-1 whitespace-nowrap dark:text-[#a1a1aa]">
            Recent Queries (5 Tabs):
          </span>
          {last5Traces.map((t, idx) => {
            const isTabActive = activeTrace?.victimAccount === t.victimAccount;
            return (
              <button
                key={t.victimAccount + idx}
                onClick={() => {
                  onSelectTraceTab(t);
                  setSelectedNode(t.nodes[0] || null);
                }}
                className={`flex items-center gap-2 rounded px-3 py-1.5 font-mono text-xs cursor-pointer border transition-colors whitespace-nowrap ${
                  isTabActive
                    ? 'border-[#18181b] bg-[#18181b] text-white font-semibold dark:border-[#f4f4f5] dark:bg-[#f4f4f5] dark:text-[#18181b]'
                    : 'border-[#e4e4e0] bg-white text-[#52525b] hover:border-[#18181b] dark:border-[#3f3f46] dark:bg-[#18181b] dark:text-[#a1a1aa]'
                }`}
              >
                <span>{t.victimAccount}</span>
                <span className="text-[10px] opacity-75">
                  ({t.traceLatencyMs}ms)
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Active Trace Dashboard */}
      {activeTrace && (
        <div className="mt-6 space-y-6">
          {/* Trace Key Metrics Banner */}
          <div className="rounded border border-[#e4e4e0] bg-[#f4f4f2] p-4 dark:border-[#27272a] dark:bg-[#18181b]">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5 text-xs font-mono">
              <div className="border-r border-[#e4e4e0] pr-3 dark:border-[#27272a]">
                <span className="text-[10px] text-[#71717a] uppercase dark:text-[#a1a1aa]">Victim Account</span>
                <p className="mt-0.5 font-bold text-sm text-[#18181b] dark:text-[#f4f4f5]">{activeTrace.victimAccount}</p>
              </div>
              <div className="border-r border-[#e4e4e0] pr-3 dark:border-[#27272a]">
                <span className="text-[10px] text-[#71717a] uppercase dark:text-[#a1a1aa]">Total Siphoned</span>
                <p className="mt-0.5 font-bold text-sm text-[#dc2626]">{formatINR(activeTrace.totalSiphoned)}</p>
              </div>
              <div className="border-r border-[#e4e4e0] pr-3 dark:border-[#27272a]">
                <span className="text-[10px] text-[#71717a] uppercase dark:text-[#a1a1aa]">Measured Trace Latency</span>
                <p className="mt-0.5 font-bold text-sm text-[#0d9488] flex items-center gap-1">
                  <Zap className="h-3.5 w-3.5" />
                  {activeTrace.traceLatencyMs.toFixed(2)} ms
                  <span className="text-[10px] font-normal text-[#71717a] dark:text-[#a1a1aa]">(&lt;2000ms SLA)</span>
                </p>
              </div>
              <div className="border-r border-[#e4e4e0] pr-3 dark:border-[#27272a]">
                <span className="text-[10px] text-[#71717a] uppercase dark:text-[#a1a1aa]">Nodes & Hops</span>
                <p className="mt-0.5 font-bold text-sm text-[#18181b] dark:text-[#f4f4f5]">
                  {activeTrace.nodes.length} nodes &middot; {activeTrace.edges.length} transfers
                </p>
              </div>
              <div>
                <span className="text-[10px] text-[#71717a] uppercase dark:text-[#a1a1aa]">Holding Accounts</span>
                <p className="mt-0.5 font-bold text-sm text-[#b45309]">
                  {activeTrace.layerBreakdown.holdingAccounts.length} recommended to freeze
                </p>
              </div>
            </div>
          </div>

          {/* Main Visual & Data Split: Graph takes full remaining height; Tables sit on right at >=1280px */}
          <div className="flex flex-col xl:flex-row gap-6 items-start">
            {/* Left Column: Full-Height Interactive Visual Graph */}
            <div className="w-full xl:flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#18181b] uppercase tracking-wide font-mono dark:text-[#f4f4f5]">
                  Visual Downstream Flow Graph (WebGL Engine)
                </h3>
                <div className="text-[11px] font-mono text-[#71717a] dark:text-[#a1a1aa]">
                  Click any node to inspect account dossier
                </div>
              </div>

              <SigmaGraphView
                nodes={activeTrace.nodes}
                edges={activeTrace.edges}
                selectedAccountId={selectedNode?.accountNumber}
                onSelectNode={(acc) => {
                  const n = activeTrace.nodes.find((item) => item.accountNumber === acc);
                  if (n) setSelectedNode(n);
                }}
                className="h-[540px] xl:h-[calc(100dvh-290px)] xl:min-h-[580px]"
              />
            </div>

            {/* Right Column: Layer Tables & Node Dossier */}
            <div className="w-full xl:w-[500px] xl:shrink-0 flex flex-col gap-4">
              {/* Layer Breakdown Table */}
              <div className="rounded border border-[#e4e4e0] bg-white p-4 dark:border-[#27272a] dark:bg-[#121214]">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e4e4e0] pb-3 dark:border-[#27272a]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#18181b] font-mono dark:text-[#f4f4f5]">
                      Accounts by Layer
                    </span>
                    <span className="rounded bg-[#f4f4f2] px-2 py-0.5 font-mono text-[11px] text-[#71717a] border border-[#e4e4e0] dark:border-[#27272a] dark:bg-[#18181b] dark:text-[#a1a1aa]">
                      {filteredNodes.length} accts
                    </span>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1 font-mono text-[11px]">
                    {(['ALL', 'L1', 'L2', 'L3', 'HOLDING'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setSelectedHopFilter(filter)}
                        className={`px-1.5 py-0.5 rounded cursor-pointer ${
                          selectedHopFilter === filter
                            ? 'bg-[#18181b] text-white font-semibold dark:bg-[#f4f4f5] dark:text-[#18181b]'
                            : 'bg-[#f4f4f2] text-[#52525b] hover:bg-[#e4e4e0] dark:bg-[#18181b] dark:text-[#a1a1aa]'
                        }`}
                      >
                        {filter === 'ALL' && 'All'}
                        {filter === 'L1' && 'L1'}
                        {filter === 'L2' && 'L2'}
                        {filter === 'L3' && 'L3'}
                        {filter === 'HOLDING' && 'Hold'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Table */}
                <div className="mt-3 overflow-x-auto max-h-[290px] scrollbar-thin">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="sticky top-0 bg-[#f4f4f2] border-b border-[#e4e4e0] text-[11px] text-[#71717a] dark:bg-[#18181b] dark:border-[#27272a] dark:text-[#a1a1aa]">
                      <tr>
                        <th className="py-1.5 px-2">Layer</th>
                        <th className="py-1.5 px-2">Account</th>
                        <th className="py-1.5 px-2 text-right">Inflow</th>
                        <th className="py-1.5 px-2 text-right">Holding</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e4e4e0] dark:divide-[#27272a]">
                      {filteredNodes.map((node) => {
                        const isSelected = selectedNode?.accountNumber === node.accountNumber;
                        return (
                          <tr
                            key={node.accountNumber}
                            onClick={() => setSelectedNode(node)}
                            className={`hover:bg-[#fbfbfa] cursor-pointer transition-colors dark:hover:bg-[#18181b] ${
                              isSelected ? 'bg-amber-50/70 font-semibold dark:bg-amber-950/40' : ''
                            }`}
                          >
                            <td className="py-2 px-2 whitespace-nowrap">
                              <span
                                className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                  node.layer === 'VICTIM'
                                    ? 'bg-[#475569] text-white'
                                    : node.layer === 'L1_COLLECTOR'
                                    ? 'bg-blue-100 text-blue-900 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
                                    : node.layer === 'L2_DISTRIBUTOR'
                                    ? 'bg-amber-100 text-amber-900 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                                    : 'bg-red-100 text-red-900 border border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800'
                                }`}
                              >
                                {node.layer === 'L1_COLLECTOR'
                                  ? 'L1'
                                  : node.layer === 'L2_DISTRIBUTOR'
                                  ? 'L2'
                                  : node.layer === 'L3_TERMINAL'
                                  ? 'L3'
                                  : node.layer}
                              </span>
                            </td>
                            <td className="py-2 px-2">
                              <div className="font-bold text-[#18181b] dark:text-[#f4f4f5]">{node.accountNumber}</div>
                              <div className="text-[10px] text-[#71717a] dark:text-[#a1a1aa]">{node.bankName}</div>
                            </td>
                            <td className="py-2 px-2 text-right text-teal-800 dark:text-teal-400 font-semibold">
                              {formatINR(node.inflowFromTrace)}
                            </td>
                            <td className="py-2 px-2 text-right font-bold">
                              {node.isHolding ? (
                                <span className="text-amber-800 bg-amber-50 px-1 py-0.5 rounded border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
                                  {formatINR(node.netHoldingInTrace)}
                                </span>
                              ) : (
                                <span className="text-[#a1a1aa]">₹ 0</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Selected Node Dossier Card */}
              <div className="rounded border border-[#e4e4e0] bg-[#fbfbfa] p-4 text-xs dark:border-[#27272a] dark:bg-[#121214]">
                <div className="border-b border-[#e4e4e0] pb-2 font-mono dark:border-[#27272a]">
                  <span className="text-[10px] uppercase text-[#71717a] dark:text-[#a1a1aa]">Inspected Node Dossier</span>
                  <div className="mt-1 flex items-center justify-between">
                    <h4 className="font-bold text-sm text-[#18181b] dark:text-[#f4f4f5]">
                      {selectedNode ? selectedNode.accountNumber : 'Select a Node'}
                    </h4>
                    {selectedNode && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#18181b] text-white dark:bg-[#f4f4f5] dark:text-[#18181b]">
                        {selectedNode.layer}
                      </span>
                    )}
                  </div>
                </div>

                {selectedNode ? (
                  <div className="mt-3 space-y-2.5 font-mono text-[11px]">
                    <div>
                      <span className="text-[#71717a] dark:text-[#a1a1aa]">Bank & Branch:</span>
                      <p className="font-semibold text-[#18181b] dark:text-[#f4f4f5]">{selectedNode.bankName}</p>
                      <p className="text-[#71717a] text-[10px] dark:text-[#a1a1aa]">IFSC: {selectedNode.primaryIfsc}</p>
                    </div>

                    <div className="border-t border-[#e4e4e0] pt-2 space-y-1 dark:border-[#27272a]">
                      <div className="flex justify-between">
                        <span className="text-[#71717a] dark:text-[#a1a1aa]">Trace Inflow:</span>
                        <span className="font-semibold text-teal-800 dark:text-teal-400">{formatINR(selectedNode.inflowFromTrace)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#71717a] dark:text-[#a1a1aa]">Trace Outflow:</span>
                        <span className="font-semibold text-red-800 dark:text-red-400">{formatINR(selectedNode.outflowInTrace)}</span>
                      </div>
                      <div className="flex justify-between border-t border-[#e4e4e0] pt-1 dark:border-[#27272a]">
                        <span className="text-[#71717a] dark:text-[#a1a1aa]">Holding Balance:</span>
                        <span className="font-bold text-amber-900 dark:text-amber-300">{formatINR(selectedNode.netHoldingInTrace)}</span>
                      </div>
                    </div>

                    {selectedNode.isHolding && (
                      <div className="rounded border border-amber-300 bg-amber-50 p-2 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                        <p className="font-bold flex items-center gap-1">
                          <ShieldAlert className="h-3.5 w-3.5 text-amber-700" />
                          Recommended for Immediate Freezing
                        </p>
                      </div>
                    )}

                    {selectedNode.anomalies.length > 0 && (
                      <div className="border-t border-[#e4e4e0] pt-2 dark:border-[#27272a]">
                        <span className="text-[#dc2626] font-semibold">Forensic Anomalies:</span>
                        <ul className="mt-1 space-y-0.5 list-disc list-inside text-red-800 text-[10px] dark:text-red-400">
                          {selectedNode.anomalies.map((anom, i) => (
                            <li key={i}>{anom}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="border-t border-[#e4e4e0] pt-2 dark:border-[#27272a]">
                      <button
                        onClick={() => {
                          onSelectAccount(selectedNode.accountNumber);
                          onNavigate('#/explorer');
                        }}
                        className="w-full rounded border border-[#18181b] bg-white py-1.5 font-semibold text-[#18181b] hover:bg-[#f4f4f2] text-center cursor-pointer dark:border-[#3f3f46] dark:bg-[#18181b] dark:text-[#f4f4f5] dark:hover:bg-[#1e1e22]"
                      >
                        Open Full Account Explorer Timeline
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-[#71717a] dark:text-[#a1a1aa]">
                    Click any account in the graph or table to view detailed counterparty metrics.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
