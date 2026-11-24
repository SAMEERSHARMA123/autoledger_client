import * as XLSX from "xlsx";

export interface ExportLedgerItem {
  _id: string;
  date: string;
  notes?: string;
  category: string;
  paymentMethod: string;
  amount: number;
  type: string;
  receiptUrl?: string;
  isDebtRelated?: boolean;
}

export interface ExportLedgerSummary {
  filteredTotal: number;
  itemCount: number;
  highestExpense: { amount: number; category: string };
  averageSpend: number;
  totalIncome?: number;
  incomeCount?: number;
}

export interface ExportMeta {
  scopeLabel: string;
  userName?: string;
  userEmail?: string;
  filtersSummary: string;
  summary: ExportLedgerSummary;
}

const formatIsoDate = (isoDate: string) => {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return String(isoDate || "");
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const formatReadableDate = (isoDate: string) => {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return String(isoDate || "");
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatCurrency = (val: number) =>
  `₹${Math.abs(Number(val || 0)).toLocaleString("en-IN", {
    minimumFractionDigits: val % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;

const isHttpUrl = (url?: string) =>
  typeof url === "string" && /^https?:\/\//i.test(url.trim());

const escapeCsv = (val: unknown) => {
  const str = String(val ?? "");
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const triggerFileDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const buildRows = (items: ExportLedgerItem[]) =>
  items.map((tx, index) => {
    const isIncome = tx.type?.toUpperCase() === "INCOME";
    const cleanProof = tx.receiptUrl?.trim() || "";
    const proofText = isHttpUrl(cleanProof)
      ? cleanProof
      : cleanProof
      ? "ATTACHED"
      : "NONE";

    return {
      "#": index + 1,
      Date: formatIsoDate(tx.date),
      Note: tx.notes || (isIncome ? "Income" : tx.category),
      Category: isIncome ? "—" : tx.category,
      Type: (tx.type || "EXPENSE").toUpperCase(),
      Method: tx.paymentMethod,
      Proof: proofText,
      Amount: Math.abs(Number(tx.amount || 0)),
    };
  });

export function exportLedgerAsCsv(
  items: ExportLedgerItem[],
  filePrefix = "autoledger-statement"
) {
  const rows = buildRows(items);
  const headers = ["#", "Date", "Note", "Category", "Type", "Method", "Proof", "Amount"];
  const csvLines = [
    headers.map(escapeCsv).join(","),
    ...rows.map((r) =>
      [r["#"], r.Date, r.Note, r.Category, r.Type, r.Method, r.Proof, r.Amount]
        .map(escapeCsv)
        .join(",")
    ),
  ];

  const blob = new Blob(["\uFEFF" + csvLines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  triggerFileDownload(blob, `${filePrefix}.csv`);
}

export function exportLedgerAsXlsx(
  items: ExportLedgerItem[],
  filePrefix = "autoledger-statement"
) {
  const rows = buildRows(items).map((row, idx) => {
    const rawUrl = items[idx]?.receiptUrl?.trim() || "";
    return {
      ...row,
      Proof: isHttpUrl(rawUrl) ? "View Proof" : row.Proof,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  items.forEach((tx, idx) => {
    const rawUrl = tx.receiptUrl?.trim() || "";
    if (isHttpUrl(rawUrl)) {
      const cellRef = XLSX.utils.encode_cell({ r: idx + 1, c: 6 });
      if (worksheet[cellRef]) {
        worksheet[cellRef].l = { Target: rawUrl, Tooltip: "Open Receipt Proof" };
      }
    }
  });

  worksheet["!cols"] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 36 },
    { wch: 18 },
    { wch: 12 },
    { wch: 12 },
    { wch: 22 },
    { wch: 16 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Ledger Statement");

  const wbBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  triggerFileDownload(blob, `${filePrefix}.xlsx`);
}

export function exportLedgerAsPdfStatement(
  items: ExportLedgerItem[],
  meta: ExportMeta
) {
  const printWindow = window.open("", "_blank", "width=920,height=780");
  if (!printWindow) return;

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const logoSrc = `${origin}/slogo%20(2).svg`;

  const generatedAt = new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const statementNo = `AL-${Date.now().toString().slice(-6)}`;

  const tableRowsHtml =
    items.length === 0
      ? `<tr><td colspan="6" style="text-align:center;padding:24px;color:#71717a;font-family:monospace;">NO TRANSACTIONS FOUND FOR SELECTED SCOPE</td></tr>`
      : items
          .map((tx, idx) => {
            const isIncome = tx.type?.toUpperCase() === "INCOME";
            const proofUrl = tx.receiptUrl?.trim() || "";
            const proofCellHtml = isHttpUrl(proofUrl)
              ? `<a href="${escapeHtml(
                  proofUrl
                )}" target="_blank" rel="noopener noreferrer" class="proof-link">View Proof ↗</a>`
              : proofUrl
              ? `<span class="proof-yes">Attached</span>`
              : `<span class="muted">—</span>`;

            const tagHtml = isIncome
              ? `<span class="badge income-badge">INCOME</span>`
              : `<span class="badge">${escapeHtml(tx.category)}</span>${
                  tx.isDebtRelated ? `<span class="badge debt">DEBT</span>` : ""
                }`;

            return `
              <tr>
                <td class="mono muted">${String(idx + 1).padStart(2, "0")}</td>
                <td class="mono">${formatReadableDate(tx.date)}</td>
                <td>
                  <div class="tx-note">${escapeHtml(tx.notes || (isIncome ? "Income" : tx.category))}</div>
                  <div class="tx-tags">${tagHtml}</div>
                </td>
                <td class="mono">${escapeHtml(tx.paymentMethod)}</td>
                <td class="mono center">${proofCellHtml}</td>
                <td class="mono right ${isIncome ? "income" : "expense"}">${formatCurrency(
              tx.amount
            )}</td>
              </tr>
            `;
          })
          .join("");

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>AutoLedger Statement — ${statementNo}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #ffffff;
      color: #0a0a0a;
      padding: 24px;
    }
    .sheet {
      max-width: 840px;
      margin: 0 auto;
      background: #ffffff;
      border: 1.5px solid #0a0a0a;
      padding: 28px;
    }
    .mono { font-family: "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace; }
    .right { text-align: right; }
    .center { text-align: center; }
    .muted { color: #71717a; }

    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1.5px solid #0a0a0a;
      padding-bottom: 16px;
      margin-bottom: 18px;
      gap: 16px;
    }
    .brand-box {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-logo {
      width: 44px;
      height: 44px;
      object-fit: contain;
    }
    .brand-title {
      font-size: 20px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: -0.02em;
    }
    .brand-sub {
      font-size: 11px;
      color: #71717a;
      text-transform: uppercase;
      margin-top: 2px;
    }
    .doc-meta {
      text-align: right;
      font-size: 11px;
      line-height: 1.6;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      border: 1px solid #e4e4e7;
      padding: 12px 14px;
      margin-bottom: 16px;
      font-size: 12px;
    }
    .info-label {
      font-size: 10px;
      text-transform: uppercase;
      color: #71717a;
      margin-bottom: 3px;
    }
    .info-value {
      font-weight: 600;
      color: #0a0a0a;
    }

    .metrics-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      border: 1px solid #d4d4d8;
      margin-bottom: 20px;
    }
    .metric-cell {
      padding: 10px 14px;
      border-right: 1px solid #d4d4d8;
    }
    .metric-cell:last-child {
      border-right: none;
    }
    .metric-label {
      font-size: 10px;
      text-transform: uppercase;
      color: #71717a;
    }
    .metric-val {
      font-size: 16px;
      font-weight: 800;
      margin-top: 2px;
      color: #0a0a0a;
    }
    .metric-sub {
      font-size: 10px;
      color: #71717a;
      margin-top: 2px;
    }

    .section-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 8px;
      color: #0a0a0a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      margin-bottom: 18px;
    }
    th {
      background: #f4f4f5;
      color: #0a0a0a;
      font-size: 10px;
      text-transform: uppercase;
      padding: 8px 10px;
      text-align: left;
      border-top: 1.5px solid #0a0a0a;
      border-bottom: 1.5px solid #0a0a0a;
    }
    th.right { text-align: right; }
    th.center { text-align: center; }
    td {
      padding: 9px 10px;
      border-bottom: 1px solid #e4e4e7;
      vertical-align: top;
    }
    .tx-note { font-weight: 600; color: #0a0a0a; }
    .tx-tags { margin-top: 4px; display: flex; gap: 6px; }
    .badge {
      font-size: 9px;
      text-transform: uppercase;
      background: #f4f4f5;
      border: 1px solid #d4d4d8;
      padding: 1px 6px;
      color: #3f3f46;
    }
    .badge.income-badge {
      background: #f0fdf4;
      border-color: #bbf7d0;
      color: #16a34a;
    }
    .badge.debt {
      background: #fef2f2;
      border-color: #fecaca;
      color: #dc2626;
    }
    .proof-link {
      font-size: 10px;
      color: #ea580c;
      font-weight: 700;
      text-decoration: underline;
    }
    .proof-yes {
      font-size: 10px;
      color: #52525b;
    }
    .income { color: #16a34a; font-weight: 700; }
    .expense { color: #0a0a0a; font-weight: 700; }

    .footer {
      border-top: 1.5px solid #0a0a0a;
      padding-top: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      color: #71717a;
    }

    @media print {
      body { padding: 0; }
      .sheet { border: none; max-width: 100%; padding: 8px; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="top-bar">
      <div class="brand-box">
        <img src="${logoSrc}" alt="AutoLedger" class="brand-logo" />
        <div>
          <div class="brand-title">AutoLedger</div>
          <div class="brand-sub mono">Expense & Receipt Statement</div>
        </div>
      </div>
      <div class="doc-meta mono">
        <div><strong>STATEMENT:</strong> ${statementNo}</div>
        <div><strong>DATE:</strong> ${generatedAt}</div>
      </div>
    </div>

    <div class="info-grid">
      <div>
        <div class="info-label mono">Account Holder</div>
        <div class="info-value">${escapeHtml(meta.userName || "Account User")}</div>
        <div class="mono muted" style="font-size:11px;margin-top:2px;">${escapeHtml(
          meta.userEmail || ""
        )}</div>
      </div>
      <div>
        <div class="info-label mono">Scope & Filters</div>
        <div class="info-value">${escapeHtml(meta.scopeLabel)}</div>
        <div class="mono muted" style="font-size:11px;margin-top:2px;">${escapeHtml(
          meta.filtersSummary
        )}</div>
      </div>
    </div>

    <div class="metrics-row">
      <div class="metric-cell">
        <div class="metric-label mono">Total Spend</div>
        <div class="metric-val mono">${formatCurrency(meta.summary.filteredTotal)}</div>
        <div class="metric-sub mono">${meta.summary.itemCount} Expense Items</div>
      </div>
      <div class="metric-cell">
        <div class="metric-label mono">Highest Expense</div>
        <div class="metric-val mono">${formatCurrency(
          meta.summary.highestExpense.amount
        )}</div>
        <div class="metric-sub mono">${escapeHtml(
          meta.summary.highestExpense.category
        )}</div>
      </div>
      <div class="metric-cell">
        <div class="metric-label mono">Average Spend</div>
        <div class="metric-val mono">${formatCurrency(meta.summary.averageSpend)}</div>
        <div class="metric-sub mono">${items.length} Rows Exported</div>
      </div>
    </div>

    <div class="section-title mono">Transaction Breakdown</div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Date</th>
          <th>Description & Tag</th>
          <th>Method</th>
          <th class="center">Receipt Proof</th>
          <th class="right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${tableRowsHtml}
      </tbody>
    </table>

    <div class="footer mono">
      <span>AUTOLEDGER // SYSTEM GENERATED STATEMENT</span>
      <span>SAVE AS PDF IN PRINT DIALOG</span>
    </div>
  </div>

  <script>
    window.onload = function () {
      setTimeout(function () {
        window.print();
      }, 250);
    };
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

function escapeHtml(str: string) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}