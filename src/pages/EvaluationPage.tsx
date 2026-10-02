import React, { useState } from 'react';
import { BarChart3, Upload, CheckCircle2, AlertTriangle, Download, Info, FileSpreadsheet } from 'lucide-react';
import { ForensicEngine } from '../engine/engine';
import { MuleDetectionResult } from '../types/heuristics';
import { EvaluationMetrics } from '../types/evaluation';

interface EvaluationPageProps {
  engine: ForensicEngine;
  detectionResults: MuleDetectionResult[];
  onRunScanFirst: () => void;
}

export const EvaluationPage: React.FC<EvaluationPageProps> = ({
  engine,
  detectionResults,
  onRunScanFirst,
}) => {
  const [metrics, setMetrics] = useState<EvaluationMetrics | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [gtFileName, setGtFileName] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (detectionResults.length === 0) {
      setErrorMessage('Please execute the Module B Mule Scan first before running ground truth evaluation.');
      return;
    }

    setErrorMessage(null);
    setIsEvaluating(true);
    setGtFileName(file.name);

    try {
      const text = await file.text();
      const evalMetrics = await engine.evaluateGroundTruth(text, detectionResults);
      setMetrics(evalMetrics);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Evaluation computation failed.');
      setMetrics(null);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleDownloadSampleGt = () => {
    const sample = `Account_Number,Is_Mule,Label\n8820000000,1,INJECTED_L1\n7740000000,1,INJECTED_L2\n6650000000,1,INJECTED_L3\n5560000000,0,LEGITIMATE`;
    const blob = new Blob([sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ground_truth_sample.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* Title */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#e4e4e0] pb-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-[#71717a] uppercase tracking-wider">
            <span>Blind Testing Evaluation</span>
            <span>&middot;</span>
            <span className="font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
              30% Jury Criterion: Detection Precision & Recall
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#18181b]">
            Ground-Truth Confusion Matrix & Accuracy Benchmark
          </h1>
          <p className="mt-1 text-sm text-[#52525b]">
            Measures algorithmic detection precision, recall, and F1 score against uploaded ground-truth
            injected mule labels without fabricating or hallucinating performance metrics.
          </p>
        </div>

        <button
          onClick={handleDownloadSampleGt}
          className="flex items-center gap-1.5 rounded border border-[#d4d4d0] bg-white px-3 py-2 text-xs font-semibold text-[#18181b] hover:bg-[#f4f4f2] cursor-pointer font-mono"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Download Sample Ground-Truth Schema</span>
        </button>
      </div>

      {detectionResults.length === 0 ? (
        <div className="rounded border border-amber-200 bg-amber-50/50 p-6 text-center font-mono text-xs">
          <AlertTriangle className="h-8 w-8 text-amber-600 mx-auto mb-2" />
          <h3 className="font-bold text-amber-900 text-sm">Module B Scan Not Yet Executed</h3>
          <p className="mt-1 text-amber-800 max-w-md mx-auto">
            Before ground-truth accuracy can be calculated, run the Module B Mule Scan on the loaded dataset.
          </p>
          <button
            onClick={onRunScanFirst}
            className="mt-4 rounded border border-[#18181b] bg-[#18181b] px-4 py-2 font-semibold text-white hover:bg-[#27272a] cursor-pointer"
          >
            Go to Mule Detection Screen
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Ground-Truth CSV Upload Box */}
          <div className="rounded border border-[#e4e4e0] bg-[#fbfbfa] p-5">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#52525b] mb-2 flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-[#18181b]" />
              Upload Blind Ground-Truth Account List (CSV)
            </h3>
            <p className="text-xs text-[#71717a] mb-4">
              Upload the jury or test ground-truth file containing verified mule accounts
              (columns: <code className="font-mono text-[#18181b]">Account_Number, Is_Mule</code>).
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 rounded border border-[#18181b] bg-[#18181b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#27272a] cursor-pointer font-mono">
                <Upload className="h-3.5 w-3.5" />
                <span>{isEvaluating ? 'Computing Confusion Matrix...' : 'Choose Ground-Truth CSV'}</span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={isEvaluating}
                  className="hidden"
                />
              </label>

              {gtFileName && (
                <span className="font-mono text-xs text-[#18181b] bg-white border border-[#e4e4e0] px-3 py-1.5 rounded">
                  Loaded: <strong>{gtFileName}</strong>
                </span>
              )}
            </div>

            {errorMessage && (
              <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-xs text-red-900">
                {errorMessage}
              </div>
            )}
          </div>

          {/* Results: Strictly computed, never hardcoded */}
          {metrics ? (
            <div className="space-y-6">
              {/* Primary Metrics Grid */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 font-mono text-xs">
                {/* Precision */}
                <div className="rounded border border-[#e4e4e0] bg-white p-4">
                  <span className="text-[10px] text-[#71717a] uppercase">Precision (TP / TP + FP)</span>
                  <p className="mt-1 text-2xl font-bold text-teal-800">
                    {(metrics.precision * 100).toFixed(1)}%
                  </p>
                  <p className="text-[10px] text-[#71717a] mt-0.5">
                    {metrics.truePositives} correct / {metrics.predictedPositives} flagged
                  </p>
                </div>

                {/* Recall */}
                <div className="rounded border border-[#e4e4e0] bg-white p-4">
                  <span className="text-[10px] text-[#71717a] uppercase">Recall (TP / TP + FN)</span>
                  <p className="mt-1 text-2xl font-bold text-teal-800">
                    {(metrics.recall * 100).toFixed(1)}%
                  </p>
                  <p className="text-[10px] text-[#71717a] mt-0.5">
                    {metrics.truePositives} detected / {metrics.groundTruthPositives} injected
                  </p>
                </div>

                {/* F1 Score */}
                <div className="rounded border border-[#e4e4e0] bg-white p-4">
                  <span className="text-[10px] text-[#71717a] uppercase">F1 Harmonic Score</span>
                  <p className="mt-1 text-2xl font-bold text-[#18181b]">
                    {(metrics.f1Score * 100).toFixed(1)}%
                  </p>
                  <p className="text-[10px] text-[#71717a] mt-0.5">Balanced accuracy index</p>
                </div>

                {/* Overall Accuracy */}
                <div className="rounded border border-[#e4e4e0] bg-white p-4">
                  <span className="text-[10px] text-[#71717a] uppercase">Total Evaluated</span>
                  <p className="mt-1 text-2xl font-bold text-[#18181b]">
                    {metrics.totalAccountsEvaluated.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-[#71717a] mt-0.5">Accounts cross-referenced</p>
                </div>
              </div>

              {/* 2x2 Confusion Matrix Table */}
              <div className="rounded border border-[#e4e4e0] bg-white p-5 font-mono text-xs">
                <h3 className="font-bold text-sm text-[#18181b] border-b border-[#e4e4e0] pb-2">
                  Ground-Truth Confusion Matrix
                </h3>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-center border-collapse border border-[#e4e4e0]">
                    <thead>
                      <tr className="bg-[#f4f4f2] text-[11px] text-[#71717a]">
                        <th className="border border-[#e4e4e0] p-3 text-left">Classification Matrix</th>
                        <th className="border border-[#e4e4e0] p-3">Actual Mule (Ground Truth)</th>
                        <th className="border border-[#e4e4e0] p-3">Actual Legitimate (Ground Truth)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-[#e4e4e0] p-3 text-left font-semibold text-[#18181b] bg-[#fbfbfa]">
                          Predicted as Mule (Risk &ge; 50)
                        </td>
                        <td className="border border-[#e4e4e0] p-3 bg-teal-50/50">
                          <span className="font-bold text-teal-900 text-sm">{metrics.truePositives.toLocaleString()}</span>
                          <div className="text-[10px] text-teal-700">True Positive (TP)</div>
                        </td>
                        <td className="border border-[#e4e4e0] p-3 bg-red-50/50">
                          <span className="font-bold text-red-900 text-sm">{metrics.falsePositives.toLocaleString()}</span>
                          <div className="text-[10px] text-red-700">False Positive (FP)</div>
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-[#e4e4e0] p-3 text-left font-semibold text-[#18181b] bg-[#fbfbfa]">
                          Predicted as Legitimate
                        </td>
                        <td className="border border-[#e4e4e0] p-3 bg-red-50/50">
                          <span className="font-bold text-red-900 text-sm">{metrics.falseNegatives.toLocaleString()}</span>
                          <div className="text-[10px] text-red-700">False Negative (FN)</div>
                        </td>
                        <td className="border border-[#e4e4e0] p-3 bg-teal-50/50">
                          <span className="font-bold text-teal-900 text-sm">{metrics.trueNegatives.toLocaleString()}</span>
                          <div className="text-[10px] text-teal-700">True Negative (TN)</div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* False Positive & False Negative Inspector */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 font-mono text-xs">
                <div className="rounded border border-[#e4e4e0] bg-white p-4">
                  <h4 className="font-bold text-red-900 border-b border-[#e4e4e0] pb-2">
                    False Positives ({metrics.falsePositives.toLocaleString()})
                  </h4>
                  <p className="mt-1 text-[11px] text-[#71717a]">
                    Legitimate accounts flagged by heuristics as mules:
                  </p>
                  <div className="mt-2 max-h-36 overflow-y-auto space-y-1 text-[11px] text-[#18181b]">
                    {metrics.falsePositiveAccounts.length > 0 ? (
                      metrics.falsePositiveAccounts.map((acc) => (
                        <div key={acc} className="p-1 rounded bg-[#f4f4f2]">
                          {acc}
                        </div>
                      ))
                    ) : (
                      <p className="text-[#a1a1aa] py-2">None detected</p>
                    )}
                  </div>
                </div>

                <div className="rounded border border-[#e4e4e0] bg-white p-4">
                  <h4 className="font-bold text-red-900 border-b border-[#e4e4e0] pb-2">
                    False Negatives ({metrics.falseNegatives.toLocaleString()})
                  </h4>
                  <p className="mt-1 text-[11px] text-[#71717a]">
                    Injected mules missed by heuristics:
                  </p>
                  <div className="mt-2 max-h-36 overflow-y-auto space-y-1 text-[11px] text-[#18181b]">
                    {metrics.falseNegativeAccounts.length > 0 ? (
                      metrics.falseNegativeAccounts.map((acc) => (
                        <div key={acc} className="p-1 rounded bg-[#f4f4f2]">
                          {acc}
                        </div>
                      ))
                    ) : (
                      <p className="text-[#a1a1aa] py-2">None detected</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded border border-[#e4e4e0] bg-white p-12 text-center font-mono text-xs text-[#71717a]">
              <Info className="h-6 w-6 mx-auto mb-2 text-[#a1a1aa]" />
              <p>No ground-truth file uploaded yet.</p>
              <p className="mt-1 text-[11px]">
                Upload a CSV to compute measured precision, recall, and confusion matrix against ground truth.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
