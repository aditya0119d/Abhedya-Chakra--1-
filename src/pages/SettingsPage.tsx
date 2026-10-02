import React, { useState } from 'react';
import { Sliders, RotateCcw, Save, Server, Info, AlertTriangle, ShieldCheck } from 'lucide-react';
import { HeuristicThresholds, defaultHeuristicThresholds } from '../types/heuristics';

interface SettingsPageProps {
  thresholds: HeuristicThresholds;
  onSaveThresholds: (t: HeuristicThresholds) => void;
  localLlmEndpoint: string;
  onSaveLocalLlmEndpoint: (endpoint: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  thresholds,
  onSaveThresholds,
  localLlmEndpoint,
  onSaveLocalLlmEndpoint,
}) => {
  const [formThresholds, setFormThresholds] = useState<HeuristicThresholds>(thresholds);
  const [llmUrl, setLlmUrl] = useState<string>(localLlmEndpoint);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Split keywords for editing
  const [cryptoKeywordsText, setCryptoKeywordsText] = useState(
    formThresholds.walletCryptoKeywords.join(', ')
  );
  const [foreignIpsText, setForeignIpsText] = useState(
    formThresholds.foreignIpPrefixes.join(', ')
  );

  const handleSave = () => {
    const updated: HeuristicThresholds = {
      ...formThresholds,
      foreignIpPrefixes: foreignIpsText
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
      walletCryptoKeywords: cryptoKeywordsText
        .split(',')
        .map((s) => s.trim().toUpperCase())
        .filter((s) => s.length > 0),
    };

    onSaveThresholds(updated);
    onSaveLocalLlmEndpoint(llmUrl.trim());
    setSaveStatus('Heuristic parameters and local endpoint successfully stored in browser.');
    setTimeout(() => setSaveStatus(null), 3500);
  };

  const handleResetDefaults = () => {
    if (confirm('Reset all detection heuristic thresholds and weights back to operational defaults?')) {
      setFormThresholds(defaultHeuristicThresholds);
      setCryptoKeywordsText(defaultHeuristicThresholds.walletCryptoKeywords.join(', '));
      setForeignIpsText(defaultHeuristicThresholds.foreignIpPrefixes.join(', '));
      setLlmUrl('');
      onSaveThresholds(defaultHeuristicThresholds);
      onSaveLocalLlmEndpoint('');
      localStorage.removeItem('abhedya_heuristic_thresholds');
      localStorage.removeItem('abhedya_llm_endpoint');
      setSaveStatus('Defaults restored.');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* Title */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#e4e4e0] pb-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-[#71717a] uppercase tracking-wider">
            <span>Configuration & Calibration</span>
            <span>&middot;</span>
            <span>Module B Heuristic Engine</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#18181b]">
            Heuristic Thresholds & Local AI Officer Setup
          </h1>
          <p className="mt-1 text-sm text-[#52525b]">
            Calibrate Money Mule Risk Index (0 to 100) scoring parameters, pass-through time windows,
            fan-in/fan-out thresholds, and optional local AI inference endpoints.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 rounded border border-[#d4d4d0] bg-white px-3 py-2 font-semibold text-[#18181b] hover:bg-[#f4f4f2] cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Restore Defaults</span>
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 rounded border border-[#18181b] bg-[#18181b] px-4 py-2 font-semibold text-white hover:bg-[#27272a] cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>

      {saveStatus && (
        <div className="mb-6 rounded border border-teal-300 bg-teal-50 p-3 font-mono text-xs text-teal-900 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-teal-700" />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* Disclaimers & Calibration Notice */}
      <div className="mb-6 rounded border border-amber-200 bg-amber-50/50 p-4 text-xs font-mono text-amber-950 flex items-start gap-2.5">
        <Info className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <strong className="block font-semibold">
            Configurable Heuristic Thresholds (Operational Defaults)
          </strong>
          <p className="text-[11px] mt-0.5 text-amber-900 leading-relaxed">
            The parameters below represent defaults formulated according to financial fraud patterns observed
            by the 1930 Cyber Cell. They are subject to investigator calibration and are never claimed as universally
            validated constants. Any adjustment immediately influences the 0 to 100 Mule Risk Index scores.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pass-Through Velocity & Layer Topologies */}
        <div className="rounded border border-[#e4e4e0] bg-white p-5 font-mono text-xs space-y-4">
          <h3 className="font-bold text-[#18181b] border-b border-[#e4e4e0] pb-2 text-sm">
            1. Pass-Through & Layer Topologies
          </h3>

          <div>
            <label className="text-[#52525b] block font-semibold mb-1">
              Pass-Through Velocity Window (Minutes):
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={formThresholds.passThroughMinMinutes}
                onChange={(e) =>
                  setFormThresholds({ ...formThresholds, passThroughMinMinutes: parseInt(e.target.value, 10) || 1 })
                }
                className="w-20 rounded border border-[#d4d4d0] px-2.5 py-1.5 text-xs text-[#18181b]"
              />
              <span className="text-[#71717a]">min to</span>
              <input
                type="number"
                value={formThresholds.passThroughMaxMinutes}
                onChange={(e) =>
                  setFormThresholds({ ...formThresholds, passThroughMaxMinutes: parseInt(e.target.value, 10) || 15 })
                }
                className="w-20 rounded border border-[#d4d4d0] px-2.5 py-1.5 text-xs text-[#18181b]"
              />
              <span className="text-[#71717a]">minutes (Default: 3 to 15 min)</span>
            </div>
          </div>

          <div>
            <label className="text-[#52525b] block font-semibold mb-1">
              Pass-Through Ratio Threshold:
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                step="0.05"
                min="0.5"
                max="1.0"
                value={formThresholds.passThroughRatioThreshold}
                onChange={(e) =>
                  setFormThresholds({
                    ...formThresholds,
                    passThroughRatioThreshold: parseFloat(e.target.value) || 0.9,
                  })
                }
                className="w-24 rounded border border-[#d4d4d0] px-2.5 py-1.5 text-xs text-[#18181b]"
              />
              <span className="text-[#71717a]">
                Ratio of inflow dispersed ({Math.round(formThresholds.passThroughRatioThreshold * 100)}%, Default: 90%)
              </span>
            </div>
          </div>

          <div className="border-t border-[#e4e4e0] pt-3">
            <label className="text-[#52525b] block font-semibold mb-1">
              Collector Fan-In Minimum Senders (L1):
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={formThresholds.collectorMinSenders}
                onChange={(e) =>
                  setFormThresholds({ ...formThresholds, collectorMinSenders: parseInt(e.target.value, 10) || 3 })
                }
                className="w-20 rounded border border-[#d4d4d0] px-2.5 py-1.5 text-xs text-[#18181b]"
              />
              <span className="text-[#71717a]">distinct senders depositing into node (Default: 4)</span>
            </div>
          </div>

          <div>
            <label className="text-[#52525b] block font-semibold mb-1">
              Distributor Fan-Out Range (L2):
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={formThresholds.distributorMinReceivers}
                onChange={(e) =>
                  setFormThresholds({ ...formThresholds, distributorMinReceivers: parseInt(e.target.value, 10) || 3 })
                }
                className="w-20 rounded border border-[#d4d4d0] px-2.5 py-1.5 text-xs text-[#18181b]"
              />
              <span className="text-[#71717a]">to</span>
              <input
                type="number"
                value={formThresholds.distributorMaxReceivers}
                onChange={(e) =>
                  setFormThresholds({ ...formThresholds, distributorMaxReceivers: parseInt(e.target.value, 10) || 7 })
                }
                className="w-20 rounded border border-[#d4d4d0] px-2.5 py-1.5 text-xs text-[#18181b]"
              />
              <span className="text-[#71717a]">downstream accounts (Default: 3 to 7)</span>
            </div>
          </div>
        </div>

        {/* Signals & Markers */}
        <div className="rounded border border-[#e4e4e0] bg-white p-5 font-mono text-xs space-y-4">
          <h3 className="font-bold text-[#18181b] border-b border-[#e4e4e0] pb-2 text-sm">
            2. Cash-Out Anomaly Identifiers (L3)
          </h3>

          <div>
            <label className="text-[#52525b] block font-semibold mb-1">
              Foreign IP Proxy Prefixes (Comma-separated):
            </label>
            <input
              type="text"
              value={foreignIpsText}
              onChange={(e) => setForeignIpsText(e.target.value)}
              className="w-full rounded border border-[#d4d4d0] px-2.5 py-1.5 text-xs text-[#18181b]"
            />
            <span className="text-[10px] text-[#71717a] mt-0.5 block">
              Default prefixes from forensic specification: 185., 194.
            </span>
          </div>

          <div>
            <label className="text-[#52525b] block font-semibold mb-1">
              Wallet & P2P Crypto Narration Tokens (Comma-separated):
            </label>
            <textarea
              rows={2}
              value={cryptoKeywordsText}
              onChange={(e) => setCryptoKeywordsText(e.target.value)}
              className="w-full rounded border border-[#d4d4d0] px-2.5 py-1.5 text-xs text-[#18181b]"
            />
            <span className="text-[10px] text-[#71717a] mt-0.5 block">
              Tokens matched against narration field: WALLET, CRYPTO, P2P, BINANCE, USDT, CASHOUT, ATM
            </span>
          </div>

          {/* Local LLM Hook */}
          <div className="border-t border-[#e4e4e0] pt-3">
            <h4 className="font-bold text-[#18181b] mb-1 flex items-center gap-1.5">
              <Server className="h-3.5 w-3.5 text-purple-700" />
              Optional Localhost LLM Endpoint
            </h4>
            <p className="text-[11px] text-[#71717a] mb-2 leading-relaxed">
              To assist in narrative phrasing for police case diaries without cloud API dependencies,
              specify a localhost server URL (e.g. Ollama or vLLM). When blank, works fully deterministically.
            </p>
            <input
              type="text"
              value={llmUrl}
              onChange={(e) => setLlmUrl(e.target.value)}
              placeholder="e.g. http://localhost:11434/api/generate"
              className="w-full rounded border border-[#d4d4d0] px-2.5 py-1.5 text-xs text-[#18181b]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
