'use client';

import React from 'react';

interface DiffViewerProps {
  original: string;
  corrected: string;
}

interface DiffChunk {
  type: 'added' | 'removed' | 'common';
  value: string;
}

/**
 * Computes simple word-level differences between original and corrected text
 */
function computeWordDiff(origText: string, corrText: string): DiffChunk[] {
  const origWords = origText.split(/(\s+)/);
  const corrWords = corrText.split(/(\s+)/);

  const chunks: DiffChunk[] = [];
  let i = 0;
  let j = 0;

  while (i < origWords.length && j < corrWords.length) {
    if (origWords[i] === corrWords[j]) {
      chunks.push({ type: 'common', value: origWords[i] });
      i++;
      j++;
    } else {
      // Lookahead match
      let foundInCorr = -1;
      let foundInOrig = -1;

      for (let look = 1; look <= 5; look++) {
        if (j + look < corrWords.length && origWords[i] === corrWords[j + look]) {
          foundInCorr = look;
          break;
        }
        if (i + look < origWords.length && origWords[i + look] === corrWords[j]) {
          foundInOrig = look;
          break;
        }
      }

      if (foundInCorr !== -1) {
        for (let k = 0; k < foundInCorr; k++) {
          chunks.push({ type: 'added', value: corrWords[j++] });
        }
      } else if (foundInOrig !== -1) {
        for (let k = 0; k < foundInOrig; k++) {
          chunks.push({ type: 'removed', value: origWords[i++] });
        }
      } else {
        chunks.push({ type: 'removed', value: origWords[i++] });
        chunks.push({ type: 'added', value: corrWords[j++] });
      }
    }
  }

  while (i < origWords.length) {
    chunks.push({ type: 'removed', value: origWords[i++] });
  }

  while (j < corrWords.length) {
    chunks.push({ type: 'added', value: corrWords[j++] });
  }

  return chunks;
}

export default function DiffViewer({ original, corrected }: DiffViewerProps) {
  const diffs = computeWordDiff(original, corrected);

  return (
    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm leading-relaxed overflow-y-auto max-h-[420px] font-mono whitespace-pre-wrap select-text">
      {diffs.map((chunk, idx) => {
        if (chunk.type === 'added') {
          return (
            <span
              key={idx}
              className="bg-emerald-100 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-300 font-semibold px-0.5 rounded"
            >
              {chunk.value}
            </span>
          );
        }
        if (chunk.type === 'removed') {
          return (
            <span
              key={idx}
              className="bg-red-100 text-red-900 dark:bg-red-950/70 dark:text-red-300 line-through decoration-red-500 px-0.5 rounded opacity-80"
            >
              {chunk.value}
            </span>
          );
        }
        return <span key={idx}>{chunk.value}</span>;
      })}
    </div>
  );
}
