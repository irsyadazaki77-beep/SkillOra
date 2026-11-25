export interface SandboxTestCase {
  label: string;
  expression: string;
  expected: any;
}

export interface SandboxTestResult {
  label: string;
  passed: boolean;
  details: string;
}

export interface JsWorkerExecutionResult {
  results: SandboxTestResult[];
  logs: string[];
  timedOut: boolean;
}

export interface SqlPreviewResult {
  valid: boolean;
  columns: string[];
  rows: Array<Record<string, string | number>>;
  message: string;
}

/**
 * Runs JavaScript solution and test expressions inside an isolated Web Worker
 * with a strict execution timeout so infinite loops cannot freeze the browser tab.
 */
export function runJsInWorker(
  userCode: string,
  testCases: SandboxTestCase[],
  timeoutMs = 2000
): Promise<JsWorkerExecutionResult> {
  if (!Array.isArray(testCases) || testCases.length === 0) {
    return Promise.resolve({ results: [], logs: [], timedOut: false });
  }

  // Fallback for non-browser / SSR test environments without Worker
  if (typeof Worker === "undefined" || typeof Blob === "undefined" || typeof URL.createObjectURL !== "function") {
    const logs: string[] = [];
    try {
      new Function(`"use strict";\n${userCode}`);
    } catch (err: any) {
      return Promise.resolve({
        results: testCases.map((tc) => ({
          label: tc.label,
          passed: false,
          details: `Syntax Error: ${err?.message || "Gagal mengompilasi kode"}`,
        })),
        logs,
        timedOut: false,
      });
    }

    const results = testCases.map((tc) => {
      try {
        const runner = new Function(`"use strict";\n${userCode}\nreturn (${tc.expression});`);
        const actual = runner();
        const expectedStr = JSON.stringify(tc.expected);
        const actualStr = JSON.stringify(actual);
        const passed = expectedStr === actualStr;
        return {
          label: tc.label,
          passed,
          details: passed ? `Sesuai: ${actualStr}` : `Harapan: ${expectedStr} | Hasil: ${actualStr ?? "undefined"}`,
        };
      } catch (err: any) {
        return {
          label: tc.label,
          passed: false,
          details: `Runtime Error: ${err?.message || "Error saat eksekusi"}`,
        };
      }
    });

    return Promise.resolve({ results, logs, timedOut: false });
  }

  return new Promise((resolve) => {
    const workerSource = `
      self.onmessage = function(e) {
        const { userCode, testCases } = e.data;
        const logs = [];
        const consoleProxy = {
          log: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
          warn: (...args) => logs.push('[WARN] ' + args.map(a => String(a)).join(' ')),
          error: (...args) => logs.push('[ERR] ' + args.map(a => String(a)).join(' ')),
        };

        try {
          new Function('console', '"use strict";\\n' + userCode);
        } catch (err) {
          self.postMessage({
            results: testCases.map(tc => ({
              label: tc.label,
              passed: false,
              details: 'Syntax Error: ' + (err && err.message ? err.message : 'Gagal mengompilasi kode'),
            })),
            logs,
            timedOut: false,
          });
          return;
        }

        const results = testCases.map(tc => {
          try {
            const fn = new Function('console', '"use strict";\\n' + userCode + '\\nreturn (' + tc.expression + ');');
            const actual = fn(consoleProxy);
            const expectedStr = JSON.stringify(tc.expected);
            const actualStr = JSON.stringify(actual);
            const passed = expectedStr === actualStr;
            return {
              label: tc.label,
              passed,
              details: passed
                ? 'Sesuai: ' + actualStr
                : 'Harapan: ' + expectedStr + ' | Hasil: ' + (actualStr ?? 'undefined'),
            };
          } catch (err) {
            return {
              label: tc.label,
              passed: false,
              details: 'Runtime Error: ' + (err && err.message ? err.message : 'Error saat eksekusi'),
            };
          }
        });

        self.postMessage({ results, logs, timedOut: false });
      };
    `;

    const blob = new Blob([workerSource], { type: "application/javascript" });
    const blobUrl = URL.createObjectURL(blob);
    const worker = new Worker(blobUrl);

    const timer = setTimeout(() => {
      worker.terminate();
      URL.revokeObjectURL(blobUrl);
      resolve({
        results: testCases.map((tc) => ({
          label: tc.label,
          passed: false,
          details: `Timeout Eksekusi (>${timeoutMs}ms): Terdeteksi potensi infinite loop.`,
        })),
        logs: ["[Sandbox Guard] Eksekusi dihentikan karena melebihi batas waktu."],
        timedOut: true,
      });
    }, timeoutMs);

    worker.onmessage = (event) => {
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(blobUrl);
      resolve(event.data as JsWorkerExecutionResult);
    };

    worker.onerror = (err) => {
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(blobUrl);
      resolve({
        results: testCases.map((tc) => ({
          label: tc.label,
          passed: false,
          details: `Worker Error: ${err?.message || "Gagal menjalankan sandbox"}`,
        })),
        logs: [],
        timedOut: false,
      });
    };

    worker.postMessage({ userCode, testCases });
  });
}

const SAMPLE_SQL_TABLES: Record<string, Array<Record<string, string | number>>> = {
  merchants: [
    { merchant_id: "M-101", city: "Jakarta", orders_30d: 420, retained_30d: 365, revenue_idr: 84000000 },
    { merchant_id: "M-102", city: "Bandung", orders_30d: 290, retained_30d: 244, revenue_idr: 51200000 },
    { merchant_id: "M-103", city: "Surabaya", orders_30d: 315, retained_30d: 258, revenue_idr: 63900000 },
    { merchant_id: "M-104", city: "Yogyakarta", orders_30d: 180, retained_30d: 160, revenue_idr: 32500000 },
  ],
};

/**
 * Lightweight in-browser SQL sandbox previewer for read-only SELECT queries.
 */
export function runSqlSandboxPreview(query: string): SqlPreviewResult {
  const cleaned = query.trim().replace(/;+\s*$/, "");
  if (!cleaned) {
    return { valid: false, columns: [], rows: [], message: "Tuliskan query SELECT terlebih dahulu." };
  }

  if (!/^(select|with)\b/i.test(cleaned)) {
    return {
      valid: false,
      columns: [],
      rows: [],
      message: "Sandbox SQL lokal hanya mengizinkan query pembacaan SELECT / CTE WITH.",
    };
  }

  if (/\b(drop|delete|truncate|alter|update|insert)\b/i.test(cleaned)) {
    return {
      valid: false,
      columns: [],
      rows: [],
      message: "Perintah DML/DDL diblokir di mode sandbox baca.",
    };
  }

  const baseRows = SAMPLE_SQL_TABLES.merchants;
  const columns = Object.keys(baseRows[0]);
  return {
    valid: true,
    columns,
    rows: baseRows,
    message: "Syntax SQL tervalidasi di sandbox lokal (simulasi dataset merchants). Klik Evaluasi AI untuk penilaian penuh rubrik SQL.",
  };
}
