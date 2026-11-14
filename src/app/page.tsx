'use client';

import { useState } from 'react';

export default function Home() {
  const [question, setQuestion] = useState('');
  const [claimId, setClaimId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitClaim = async () => {
    if (question.length < 15) {
      setError('Please enter a clear claim or question (at least 15 characters).');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      setClaimId(data.claimId);
      setStatus(data.status);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    if (!claimId) return;
    const res = await fetch(`/api/claims/${claimId}`);
    const data = await res.json();
    setStatus(data.status);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            VeritasClaim
          </h1>
          <p className="mt-3 text-lg text-slate-600 dark:text-slate-300">
            Multi-LLM consensus for trustworthy on-chain claim resolution.
            Powered by Chainlink CRE.
          </p>
        </header>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-700">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
            Claim or Question
          </label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Did the US Federal Reserve cut interest rates by at least 25 basis points in Q4 2026?"
            className="w-full h-32 p-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />

          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            onClick={submitClaim}
            disabled={loading}
            className="mt-6 w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl transition"
          >
            {loading ? 'Submitting…' : 'Submit Claim for Verification'}
          </button>

          {claimId && (
            <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white">Claim Status</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 break-all">
                ID: {claimId.slice(0, 18)}…
              </p>
              <p className="mt-2 text-lg font-medium">
                Status: <span className="capitalize text-indigo-600 dark:text-indigo-400">{status}</span>
              </p>
              <button
                onClick={checkStatus}
                className="mt-4 text-sm text-indigo-600 dark:text-indigo-400 underline"
              >
                Refresh status
              </button>
              <p className="mt-4 text-xs text-slate-500">
                Verification uses three independent LLMs with field-level consensus via Chainlink CRE.
                Actions only proceed when quorum and confidence thresholds are met. Otherwise the claim is rejected.
              </p>
            </div>
          )}
        </div>

        <footer className="mt-12 text-center text-sm text-slate-500">
          Residual risk: LLM consensus reduces but does not eliminate hallucination risk.
          On-chain verification enforces thresholds. Always review high-value claims.
        </footer>
      </div>
    </main>
  );
}
