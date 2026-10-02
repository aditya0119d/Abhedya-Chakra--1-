import React, { useState, useEffect } from 'react';
import { Search, UserCheck, AlertTriangle, ShieldAlert, ArrowDownLeft, ArrowUpRight, Smartphone, Globe, Shield } from 'lucide-react';
import { ForensicEngine } from '../engine/engine';
import { AccountSummary } from '../types/dataset';
import { formatINR } from '../lib/currency';
import { escapeUntrustedText } from '../lib/sanitizer';

interface AccountExplorerPageProps {
  engine: ForensicEngine;
  initialAccount?: string;
  onNavigateTrace?: (accountNumber: string) => void;
}

export const AccountExplorerPage: React.FC<AccountExplorerPageProps> = ({
  engine,
  initialAccount = '',
  onNavigateTrace,
}) => {
  const [searchAccount, setSearchAccount] = useState(initialAccount);
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialAccount) {
      setSearchAccount(initialAccount);
      loadAccount(initialAccount);
    }
  }, [initialAccount]);

  const loadAccount = async (acc: string) => {
    const clean = acc.trim();
    if (!clean) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await engine.getAccountSummary(clean);
      if (!result) {
        setErrorMessage(`Account "${clean}" not found in loaded ledger.`);
        setSummary(null);
      } else {
        setSummary(result);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Lookup failed.');
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadAccount(searchAccount);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* Title */}
      <div className="mb-6 border-b border-[#e4e4e0] pb-4">
        <div className="flex items-center gap-2 font-mono text-xs text-[#71717a] uppercase tracking-wider">
          <span>Module A</span>
          <span>&middot;</span>
          <span>Entity Disambiguation & Instant Search</span>
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#18181b]">
          Account Dossier & Historical Flow Explorer
        </h1>
        <p className="mt-1 text-sm text-[#52525b]">
          Sub-second retrieval of an entity's complete transaction history, counter-parties,
          payment rails, device fingerprints, and heuristic risk scoring.
        </p>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchAccount}
            onChange={(e) => setSearchAccount(e.target.value)}
            placeholder="Enter any 12-digit bank account number..."
            className="w-full rounded border border-[#d4d4d0] bg-white px-4 py-2.5 font-mono text-sm text-[#18181b] focus:border-[#d97706] focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 rounded border border-[#18181b] bg-[#18181b] px-6 py-2.5 font-mono text-xs font-semibold text-white hover:bg-[#27272a] cursor-pointer"
        >
          <Search className="h-4 w-4" />
          <span>{isLoading ? 'Retrieving...' : 'Lookup Account'}</span>
        </button>
      </form>

      {errorMessage && (
        <div className="mb-6 rounded border border-red-200 bg-red-50 p-4 text-xs text-red-900">
          <p className="font-semibold">{errorMessage}</p>
        </div>
      )}

      {summary && (
        <div className="space-y-6">
          {/* Header Summary Card */}
          <div className="rounded border border-[#e4e4e0] bg-[#fbfbfa] p-5">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e4e4e0] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-mono text-xl font-bold text-[#18181b]">{summary.accountNumber}</h2>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-mono font-semibold ${
                      summary.layerTag === 'L1_COLLECTOR'
                        ? 'bg-blue-100 text-blue-900 border border-blue-200'
                        : summary.layerTag === 'L2_DISTRIBUTOR'
                        ? 'bg-amber-100 text-amber-900 border border-amber-200'
                        : summary.layerTag === 'L3_TERMINAL'
                        ? 'bg-red-100 text-red-900 border border-red-200'
                        : 'bg-teal-100 text-teal-900 border border-teal-200'
                    }`}
                  >
                    {summary.layerTag}
                  </span>
                </div>
                <p className="font-mono text-xs text-[#71717a] mt-1">
                  Bank: <span className="font-semibold text-[#18181b]">{summary.bankName}</span> &middot; Primary IFSC: <span className="font-semibold text-[#18181b]">{summary.primaryIfsc}</span>
                </p>
              </div>

              {/* Mule Risk Index Badge */}
              <div className="flex items-center gap-3 bg-white border border-[#e4e4e0] px-4 py-2 rounded">
                <div>
                  <div className="text-[10px] uppercase font-mono text-[#71717a]">Mule Risk Index</div>
                  <div
                    className={`font-mono text-2xl font-bold ${
                      summary.riskScore >= 60
                        ? 'text-[#dc2626]'
                        : summary.riskScore >= 30
                        ? 'text-[#d97706]'
                        : 'text-[#0d9488]'
                    }`}
                  >
                    {summary.riskScore} / 100
                  </div>
                </div>
                {onNavigateTrace && (
                  <button
                    onClick={() => onNavigateTrace(summary.accountNumber)}
                    className="ml-2 rounded border border-[#18181b] bg-[#18181b] px-3 py-1.5 font-mono text-xs font-medium text-white hover:bg-[#27272a] cursor-pointer"
                  >
                    Trace Downstream
                  </button>
                )}
              </div>
            </div>

            {/* Financial Ledger KPIs */}
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4 font-mono text-xs">
              <div className="border-r border-[#e4e4e0] pr-3">
                <span className="text-[#71717a] flex items-center gap-1">
                  <ArrowDownLeft className="h-3.5 w-3.5 text-teal-600" />
                  Total Inflow ({summary.inTxCount} tx)
                </span>
                <p className="mt-1 text-base font-bold text-teal-800">{formatINR(summary.totalInflow)}</p>
                <p className="text-[10px] text-[#71717a] mt-0.5">{summary.distinctSenders} distinct senders</p>
              </div>

              <div className="border-r border-[#e4e4e0] pr-3">
                <span className="text-[#71717a] flex items-center gap-1">
                  <ArrowUpRight className="h-3.5 w-3.5 text-red-600" />
                  Total Outflow ({summary.outTxCount} tx)
                </span>
                <p className="mt-1 text-base font-bold text-red-800">{formatINR(summary.totalOutflow)}</p>
                <p className="text-[10px] text-[#71717a] mt-0.5">{summary.distinctReceivers} distinct receivers</p>
              </div>

              <div className="border-r border-[#e4e4e0] pr-3">
                <span className="text-[#71717a]">Net Ledger Retained</span>
                <p className="mt-1 text-base font-bold text-[#18181b]">{formatINR(summary.netBalance)}</p>
                <p className="text-[10px] text-[#71717a] mt-0.5">Calculated ledger balance</p>
              </div>

              <div>
                <span className="text-[#71717a]">Active Window</span>
                <p className="mt-1 text-[11px] font-bold text-[#18181b]">{summary.firstTxTime}</p>
                <p className="text-[10px] text-[#71717a]">to {summary.lastTxTime}</p>
              </div>
            </div>
          </div>

          {/* Heuristic Breakdown & Forensic Anomalies */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Risk Factors */}
            <div className="rounded border border-[#e4e4e0] bg-white p-4 font-mono text-xs">
              <h3 className="font-bold text-[#18181b] border-b border-[#e4e4e0] pb-2 flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-[#d97706]" />
                Mule Risk Heuristic Flags
              </h3>

              <div className="mt-3 space-y-2">
                {summary.passThroughVelocity.flagged && (
                  <div className="rounded border border-amber-200 bg-amber-50/50 p-2.5">
                    <span className="font-bold text-amber-900">High-Velocity Pass-Through Detected:</span>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      {summary.passThroughVelocity.percentage}% of incoming funds dispersed within {summary.passThroughVelocity.windowMinutes} minutes.
                    </p>
                  </div>
                )}

                {summary.riskReasons.length > 0 ? (
                  <ul className="space-y-1.5 text-[11px] text-[#52525b]">
                    {summary.riskReasons.map((reason, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-amber-600 font-bold">&bull;</span>
                        <span>{escapeUntrustedText(reason)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[#71717a] text-[11px]">No severe mule anomalies triggered on this account.</p>
                )}
              </div>
            </div>

            {/* Environmental Fingerprints: IPs, Devices, Rails */}
            <div className="rounded border border-[#e4e4e0] bg-white p-4 font-mono text-xs">
              <h3 className="font-bold text-[#18181b] border-b border-[#e4e4e0] pb-2 flex items-center gap-1.5">
                <Globe className="h-4 w-4 text-[#0d9488]" />
                Payment Rails, Devices & IP Headers
              </h3>

              <div className="mt-3 space-y-3 text-[11px]">
                <div>
                  <span className="text-[#71717a] block mb-1">Payment Mode Distribution:</span>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(summary.paymentModesUsed).map(([mode, count]) => (
                      <span key={mode} className="rounded bg-[#f4f4f2] px-2 py-0.5 border border-[#e4e4e0]">
                        {mode}: <strong className="text-[#18181b]">{count} tx</strong>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border-t border-[#e4e4e0] pt-2">
                  <span className="text-[#71717a] block mb-1">Device Fingerprints Seen:</span>
                  <div className="flex flex-wrap gap-2">
                    {summary.deviceTypesSeen.map((dev) => (
                      <span
                        key={dev}
                        className={`rounded px-2 py-0.5 border ${
                          dev === 'Web_Emulator' || dev === 'Linux_Script'
                            ? 'bg-red-50 text-red-900 border-red-200 font-bold'
                            : 'bg-[#f4f4f2] text-[#52525b] border-[#e4e4e0]'
                        }`}
                      >
                        {escapeUntrustedText(dev)}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border-t border-[#e4e4e0] pt-2">
                  <span className="text-[#71717a] block mb-1">Observed IP Endpoints:</span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {summary.ipAddressesSeen.map((ip) => (
                      <span
                        key={ip}
                        className={`rounded px-1.5 py-0.5 text-[10px] font-mono border ${
                          ip.startsWith('185.') || ip.startsWith('194.')
                            ? 'bg-red-50 text-red-900 border-red-300 font-bold'
                            : 'bg-[#f4f4f2] text-[#52525b] border-[#e4e4e0]'
                        }`}
                      >
                        {escapeUntrustedText(ip)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
