import React from 'react';
import { Shield, HardDrive, Trash2 } from 'lucide-react';
import { siteConfig } from '../config/site';

export const PrivacyPage: React.FC = () => {
  const handleClearLocalStorage = () => {
    if (confirm('Clear all locally saved heuristic thresholds and browser settings?')) {
      localStorage.clear();
      alert('Local browser storage cleared.');
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="border-b border-[#e4e4e0] pb-4 mb-6">
        <div className="flex items-center gap-2 font-mono text-xs text-[#71717a] uppercase tracking-wider">
          <span>Security & Data Governance</span>
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#18181b]">
          Privacy Policy
        </h1>
        <p className="mt-1 text-xs font-mono text-[#71717a]">
          Last revised: October 2026 &middot; Operation Abhedya-Chakra
        </p>
      </div>

      <div className="prose prose-sm font-mono text-xs text-[#27272a] space-y-5 leading-relaxed">
        <section className="rounded border border-[#e4e4e0] bg-[#fbfbfa] p-4">
          <h2 className="text-sm font-bold text-[#18181b] flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-[#0d9488]" />
            1. Zero Cloud Transmission & Local Client-Side Execution
          </h2>
          <p className="mt-2 text-[#52525b]">
            All transaction datasets, banking records, account numbers, and forensic artifacts ingested into
            the Abhedya-Chakra Forensic Analytics Engine are processed exclusively within the investigator&apos;s
            local browser memory (Web Workers and typed array columnar buffers).
          </p>
          <p className="mt-2 text-[#52525b]">
            No financial records, personal data, or ledger rows are transmitted to remote servers, external APIs,
            or cloud storage endpoints. Core data ingestion, graph computation, and report rendering execute 100% offline.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-bold text-[#18181b]">2. Cookies and Telemetry</h2>
          <p className="mt-1 text-[#52525b]">
            The application does not use tracking cookies, session cookies, marketing pixels, or third-party
            analytics packages. No background network requests are initiated during operation.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-bold text-[#18181b]">3. Local Browser Storage (localStorage)</h2>
          <p className="mt-1 text-[#52525b]">
            The browser&apos;s <code className="bg-[#f4f4f2] px-1 py-0.5 rounded text-[#18181b]">localStorage</code> is
            utilized strictly to persist user-configured heuristic weights, detection thresholds, and optional localhost
            LLM endpoint settings across page refreshes. No transaction data or customer banking details are ever written to localStorage.
          </p>
          <div className="mt-3">
            <button
              onClick={handleClearLocalStorage}
              className="flex items-center gap-1.5 rounded border border-[#d4d4d0] bg-white px-3 py-1.5 text-xs font-semibold text-[#18181b] hover:bg-[#f4f4f2] cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5 text-red-600" />
              <span>Clear Local Storage Now</span>
            </button>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-bold text-[#18181b]">4. Optional Localhost AI Inference</h2>
          <p className="mt-1 text-[#52525b]">
            If an investigator configures a local LLM endpoint (e.g. Ollama or vLLM running on localhost),
            only sanitized structured facts are forwarded to that local loopback address. Cloud-hosted models
            are never contacted.
          </p>
        </section>

        <section className="border-t border-[#e4e4e0] pt-4 text-[11px] text-[#71717a]">
          <p>
            Governed under: {siteConfig.organization} &middot; {siteConfig.department}
          </p>
          {siteConfig.contactEmail && (
            <p className="mt-1">Official Inquiries: {siteConfig.contactEmail}</p>
          )}
        </section>
      </div>
    </div>
  );
};
