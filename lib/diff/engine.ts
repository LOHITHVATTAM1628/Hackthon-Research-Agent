import * as Diff from 'diff';

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
  lineNumberOld?: number;
  lineNumberNew?: number;
}

export interface ReportDiffResult {
  stats: {
    addedLines: number;
    removedLines: number;
    unchangedLines: number;
    changePercentage: number;
  };
  lines: DiffLine[];
}

/**
 * Computes structured line-by-line diff between two report versions
 */
export function computeReportDiff(oldText: string, newText: string): ReportDiffResult {
  const patch = Diff.diffLines(oldText, newText);

  const lines: DiffLine[] = [];
  let addedCount = 0;
  let removedCount = 0;
  let unchangedCount = 0;

  let oldLine = 1;
  let newLine = 1;

  for (const part of patch) {
    const rawLines = part.value.split('\n');
    // Remove trailing empty string from split if exists
    if (rawLines[rawLines.length - 1] === '') {
      rawLines.pop();
    }

    if (part.added) {
      addedCount += rawLines.length;
      for (const line of rawLines) {
        lines.push({
          type: 'added',
          value: line,
          lineNumberNew: newLine++,
        });
      }
    } else if (part.removed) {
      removedCount += rawLines.length;
      for (const line of rawLines) {
        lines.push({
          type: 'removed',
          value: line,
          lineNumberOld: oldLine++,
        });
      }
    } else {
      unchangedCount += rawLines.length;
      for (const line of rawLines) {
        lines.push({
          type: 'unchanged',
          value: line,
          lineNumberOld: oldLine++,
          lineNumberNew: newLine++,
        });
      }
    }
  }

  const total = addedCount + removedCount + unchangedCount;
  const changePercentage = total > 0 ? Math.round(((addedCount + removedCount) / total) * 100) : 0;

  return {
    stats: {
      addedLines: addedCount,
      removedLines: removedCount,
      unchangedLines: unchangedCount,
      changePercentage,
    },
    lines,
  };
}
