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
      // Lock down same-origin network and messaging globals inside the sandbox worker
      try {
        const blocked = ['fetch', 'XMLHttpRequest', 'importScripts', 'WebSocket', 'EventSource', 'BroadcastChannel'];
        for (const key of blocked) {
          try {
            Object.defineProperty(self, key, {
              value: undefined,
              writable: false,
              configurable: false,
            });
          } catch (_) {
            try { self[key] = undefined; } catch (_) {}
          }
        }
      } catch (_) {}

      self.onmessage = function(e) {
        const { userCode, testCases } = e.data;
        const logs = [];
        const consoleProxy = {
          log: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
          warn: (...args) => logs.push('[WARN] ' + args.map(a => String(a)).join(' ')),
          error: (...args) => logs.push('[ERR] ' + args.map(a => String(a)).join(' ')),
        };

        const shadowedGlobals = ['console', 'fetch', 'XMLHttpRequest', 'importScripts', 'WebSocket', 'EventSource', 'self', 'globalThis', 'postMessage'];

        try {
          new Function(...shadowedGlobals, '"use strict";\\n' + userCode);
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
            const fn = new Function(...shadowedGlobals, '"use strict";\\n' + userCode + '\\nreturn (' + tc.expression + ');');
            const actual = fn(consoleProxy, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined);
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

type SqlRow = Record<string, string | number>;

const SAMPLE_SQL_TABLES: Record<string, SqlRow[]> = {
  merchants: [
    { merchant_id: "M-101", city: "Jakarta", category: "Kuliner", orders_30d: 420, retained_30d: 365, revenue_idr: 84000000 },
    { merchant_id: "M-102", city: "Bandung", category: "Fashion", orders_30d: 290, retained_30d: 244, revenue_idr: 51200000 },
    { merchant_id: "M-103", city: "Surabaya", category: "Kuliner", orders_30d: 315, retained_30d: 258, revenue_idr: 63900000 },
    { merchant_id: "M-104", city: "Yogyakarta", category: "Elektronik", orders_30d: 180, retained_30d: 160, revenue_idr: 32500000 },
    { merchant_id: "M-105", city: "Jakarta", category: "Elektronik", orders_30d: 510, retained_30d: 472, revenue_idr: 112000000 },
    { merchant_id: "M-106", city: "Bandung", category: "Kuliner", orders_30d: 215, retained_30d: 189, revenue_idr: 38400000 },
  ],
  orders: [
    { order_id: "ORD-01", merchant_id: "M-101", city: "Jakarta", amount_idr: 145000, status: "paid" },
    { order_id: "ORD-02", merchant_id: "M-102", city: "Bandung", amount_idr: 230000, status: "paid" },
    { order_id: "ORD-03", merchant_id: "M-103", city: "Surabaya", amount_idr: 89000, status: "refunded" },
    { order_id: "ORD-04", merchant_id: "M-105", city: "Jakarta", amount_idr: 499000, status: "paid" },
  ],
};

function matchesWhereClause(row: SqlRow, whereRaw: string): boolean {
  const conditions = whereRaw.split(/\s+AND\s+/i).map((c) => c.trim()).filter(Boolean);
  for (const cond of conditions) {
    const likeMatch = cond.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s+LIKE\s+['"]([^'"]*)['"]$/i);
    if (likeMatch) {
      const colVal = String(row[likeMatch[1]] ?? "").toLowerCase();
      const pattern = likeMatch[2].replace(/%/g, "").toLowerCase();
      if (!colVal.includes(pattern)) return false;
      continue;
    }

    const opMatch = cond.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*(=|!=|<>|>=|<=|>|<)\s*(.+)$/);
    if (!opMatch) continue;
    const [, col, op, rawVal] = opMatch;
    const cleanedVal = rawVal.trim().replace(/^['"]|['"]$/g, "");
    const left = row[col];
    const numLeft = Number(left);
    const numRight = Number(cleanedVal);
    const bothNumeric = typeof left === "number" && !Number.isNaN(numRight);

    if (op === "=" && String(left).toLowerCase() !== cleanedVal.toLowerCase()) return false;
    if ((op === "!=" || op === "<>") && String(left).toLowerCase() === cleanedVal.toLowerCase()) return false;
    if (op === ">" && !(bothNumeric && numLeft > numRight)) return false;
    if (op === "<" && !(bothNumeric && numLeft < numRight)) return false;
    if (op === ">=" && !(bothNumeric && numLeft >= numRight)) return false;
    if (op === "<=" && !(bothNumeric && numLeft <= numRight)) return false;
  }
  return true;
}

function evaluateAggregateExpr(expr: string, groupRows: SqlRow[]): string | number {
  const trimmed = expr.trim();
  if (/^count\(\s*\*\s*\)$/i.test(trimmed)) return groupRows.length;

  const countCol = trimmed.match(/^count\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)$/i);
  if (countCol) return groupRows.filter((r) => r[countCol[1]] !== undefined && r[countCol[1]] !== null).length;

  const sumMatch = trimmed.match(/^sum\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)$/i);
  if (sumMatch) {
    return groupRows.reduce((acc, r) => acc + (Number(r[sumMatch[1]]) || 0), 0);
  }

  const avgMatch = trimmed.match(/^(?:round\(\s*)?avg\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)/i);
  if (avgMatch) {
    const total = groupRows.reduce((acc, r) => acc + (Number(r[avgMatch[1]]) || 0), 0);
    return groupRows.length > 0 ? Math.round((total / groupRows.length) * 100) / 100 : 0;
  }

  return groupRows[0]?.[trimmed] ?? "";
}

/**
 * Lightweight in-browser SQL engine supporting SELECT, WHERE, GROUP BY, ORDER BY, LIMIT,
 * and aggregate helpers (COUNT, SUM, AVG) against local SkillOra datasets.
 */
export function runSqlSandboxPreview(query: string): SqlPreviewResult {
  const cleaned = query.trim().replace(/--.*$/gm, "").replace(/\s+/g, " ").replace(/;+\s*$/, "");
  if (!cleaned) {
    return { valid: false, columns: [], rows: [], message: "Tuliskan query SELECT terlebih dahulu." };
  }

  if (/\b(drop|delete|truncate|alter|update|insert|create|grant|revoke)\b/i.test(cleaned)) {
    return {
      valid: false,
      columns: [],
      rows: [],
      message: "Perintah DML/DDL diblokir di mode sandbox baca.",
    };
  }

  if (!/^(select|with)\b/i.test(cleaned)) {
    return {
      valid: false,
      columns: [],
      rows: [],
      message: "Sandbox SQL lokal hanya mengizinkan query pembacaan SELECT / CTE WITH.",
    };
  }

  const selectFromMatch = cleaned.match(
    /^select\s+(.+?)\s+from\s+([a-zA-Z_][a-zA-Z0-9_]*)(.*)$/i
  );

  if (!selectFromMatch) {
    const fallbackRows = SAMPLE_SQL_TABLES.merchants;
    return {
      valid: true,
      columns: Object.keys(fallbackRows[0]),
      rows: fallbackRows,
      message: "Query kompleks/CTE dikenali. Menampilkan sampel dataset merchants — gunakan Evaluasi AI untuk penilaian penuh.",
    };
  }

  const [, selectClause, tableRaw, tail] = selectFromMatch;
  const tableName = tableRaw.toLowerCase();
  const sourceTable = SAMPLE_SQL_TABLES[tableName];

  if (!sourceTable) {
    return {
      valid: false,
      columns: [],
      rows: [],
      message: `Tabel '${tableRaw}' tidak ditemukan di sandbox lokal (tersedia: ${Object.keys(SAMPLE_SQL_TABLES).join(", ")}).`,
    };
  }

  const whereMatch = tail.match(/\bwhere\s+(.+?)(?=\bgroup\s+by\b|\border\s+by\b|\blimit\b|$)/i);
  const groupMatch = tail.match(/\bgroup\s+by\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\s*,\s*[a-zA-Z_][a-zA-Z0-9_]*)*)/i);
  const orderMatch = tail.match(/\border\s+by\s+([a-zA-Z_][a-zA-Z0-9_]*)(?:\s+(asc|desc))?/i);
  const limitMatch = tail.match(/\blimit\s+(\d+)/i);

  let workingRows = sourceTable.filter((row) =>
    whereMatch ? matchesWhereClause(row, whereMatch[1]) : true
  );

  const selectItems =
    selectClause.trim() === "*"
      ? Object.keys(sourceTable[0]).map((c) => ({ expr: c, alias: c }))
      : selectClause.split(",").map((part) => {
          const asMatch = part.trim().match(/^(.+?)\s+as\s+([a-zA-Z_][a-zA-Z0-9_]*)$/i);
          if (asMatch) {
            return { expr: asMatch[1].trim(), alias: asMatch[2].trim() };
          }
          const cleanPart = part.trim();
          const simpleCol = cleanPart.match(/([a-zA-Z_][a-zA-Z0-9_]*)$/)?.[1] || cleanPart;
          return { expr: cleanPart, alias: cleanPart.includes("(") ? cleanPart : simpleCol };
        });

  const hasAggregates = selectItems.some((s) => /\b(count|sum|avg)\s*\(/i.test(s.expr));

  let outputRows: SqlRow[] = [];
  if (groupMatch || hasAggregates) {
    const groupCols = groupMatch
      ? groupMatch[1].split(",").map((c) => c.trim())
      : [];
    const groups = new Map<string, SqlRow[]>();

    for (const row of workingRows) {
      const key = groupCols.map((c) => String(row[c] ?? "")).join("||");
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(row);
    }

    outputRows = Array.from(groups.values()).map((grpRows) => {
      const out: SqlRow = {};
      for (const sel of selectItems) {
        out[sel.alias] = evaluateAggregateExpr(sel.expr, grpRows);
      }
      return out;
    });
  } else {
    outputRows = workingRows.map((row) => {
      const out: SqlRow = {};
      for (const sel of selectItems) {
        out[sel.alias] = row[sel.expr] ?? "";
      }
      return out;
    });
  }

  if (orderMatch) {
    const orderCol = orderMatch[1];
    const dir = orderMatch[2]?.toLowerCase() === "desc" ? -1 : 1;
    outputRows.sort((a, b) => {
      const va = a[orderCol];
      const vb = b[orderCol];
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va ?? "").localeCompare(String(vb ?? "")) * dir;
    });
  }

  if (limitMatch) {
    const lim = Math.max(0, Math.min(100, Number(limitMatch[1])));
    outputRows = outputRows.slice(0, lim);
  }

  const columns =
    outputRows.length > 0 ? Object.keys(outputRows[0]) : selectItems.map((s) => s.alias);

  return {
    valid: true,
    columns,
    rows: outputRows,
    message: `Query berhasil dieksekusi pada tabel '${tableName}': ${outputRows.length} baris hasil.`,
  };
}

/**
 * Generates an isolated HTML/CSS/JS preview document for Frontend Lab challenges.
 */
export function buildFrontendPreviewHtml(code: string): string {
  const trimmed = code.trim();
  if (/<!doctype|<html|<body/i.test(trimmed)) {
    return trimmed;
  }

  if (/</.test(trimmed) && !/function\s+\w+\s*\(/.test(trimmed)) {
    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: system-ui, sans-serif; padding: 16px; margin: 0; color: #0f172a; background: #ffffff; }
  </style>
</head>
<body>${trimmed}</body>
</html>`;
  }

  const safeScriptCode = trimmed.replace(/<\/script/gi, "<\\/script");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: system-ui, sans-serif; padding: 16px; margin: 0; color: #0f172a; background: #f8fafc; }
    .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; font-size: 13px; }
    pre { background: #0f172a; color: #e2e8f0; padding: 10px; border-radius: 8px; overflow-x: auto; font-size: 12px; }
  </style>
</head>
<body>
  <div class="card">
    <strong>Frontend Sandbox Preview</strong>
    <div id="app" style="margin-top: 8px;">Memuat pratinjau komponen / fungsi JS...</div>
    <pre id="console-out"></pre>
  </div>
  <script>
    const out = document.getElementById('console-out');
    const logs = [];
    const origLog = console.log;
    console.log = (...args) => {
      logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '));
      out.textContent = logs.join('\\n');
      origLog.apply(console, args);
    };
    try {
      ${safeScriptCode}
      if (!logs.length) out.textContent = 'Kode JavaScript valid dan siap dijalankan via Uji Otomatis.';
    } catch (err) {
      out.textContent = 'Error: ' + err.message;
    }
  </script>
</body>
</html>`;
}
