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
}

export interface ExportMeta {
  scopeLabel: string;
  userName?: string;
  userEmail?: string;
  filtersSummary: string;
  summary: ExportLedgerSummary;
}

const formatDateLabel = (isoDate: string) =>
  new Date(isoDate).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const formatCurrency = (val: number) =>
  `₹${Number(val || 0).toLocaleString("en-IN", {
    minimumFractionDigits: val % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;

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
  items.map((tx, index) => ({
    "#": index + 1,
    Date: formatDateLabel(tx.date),
    Note: tx.notes || tx.category,
    Category: tx.category,
    Type: (tx.type || "EXPENSE").toUpperCase(),
    Method: tx.paymentMethod,
    Proof: tx.receiptUrl ? "ATTACHED" : "NONE",
    Amount: tx.type?.toUpperCase() === "INCOME" ? tx.amount : -tx.amount,
    FormattedAmount: `${tx.type?.toUpperCase() === "INCOME" ? "+" : "-"}${formatCurrency(tx.amount)}`,
  }));

export function exportLedgerAsCsv(items: ExportLedgerItem[], filePrefix = "autoledger-statement") {
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

export function exportLedgerAsXlsx(items: ExportLedgerItem[], filePrefix = "autoledger-statement") {
  const rows = buildRows(items).map(({ FormattedAmount, ...rest }) => rest);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Ledger Statement");

  worksheet["!cols"] = [
    { wch: 5 },
    { wch: 15 },
    { wch: 34 },
    { wch: 18 },
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
    { wch: 16 },
  ];

  const wbBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  triggerFileDownload(blob, `${filePrefix}.xlsx`);
}

export function exportLedgerAsPdfStatement(items: ExportLedgerItem[], meta: ExportMeta) {
  const printWindow = window.open("", "_blank", "width=920,height=780");
  if (!printWindow) return;

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
            return `
              <tr>
                <td class="mono muted">${String(idx + 1).padStart(2, "0")}</td>
                <td class="mono">${formatDateLabel(tx.date)}</td>
                <td>
                  <div class="tx-note">${escapeHtml(tx.notes || tx.category)}</div>
                  <div class="tx-tags">
                    <span class="badge">${escapeHtml(tx.category)}</span>
                    ${tx.isDebtRelated ? `<span class="badge debt">DEBT</span>` : ""}
                  </div>
                </td>
                <td class="mono">${escapeHtml(tx.paymentMethod)}</td>
                <td class="mono center">${tx.receiptUrl ? `<span class="proof-yes">BILL ATTACHED</span>` : `<span class="muted">—</span>`}</td>
                <td class="mono right ${isIncome ? "income" : "expense"}">${isIncome ? "+" : "-"}${formatCurrency(tx.amount)}</td>
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
      background: #f4f4f5;
      color: #0a0a0a;
      padding: 28px;
    }
    .sheet {
      max-width: 840px;
      margin: 0 auto;
      background: #ffffff;
      border: 2px solid #0a0a0a;
      box-shadow: 6px 6px 0px #0a0a0a;
      padding: 32px;
    }
    .mono { font-family: "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace; }
    .right { text-align: right; }
    .center { text-align: center; }
    .muted { color: #71717a; }

    /* Header / Brand Receipt Top */
    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0a0a0a;
      padding-bottom: 20px;
      margin-bottom: 20px;
      gap: 16px;
    }
    .brand-box {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo-mark {
      width: 44px;
      height: 44px;
      background: #0a0a0a;
      border: 2px solid #ea580c;
      color: #ea580c;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 16px;
      letter-spacing: -0.05em;
    }
    .brand-title {
      font-size: 22px;
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
    .doc-badge {
      display: inline-block;
      background: #ea580c;
      color: #0a0a0a;
      font-weight: 700;
      padding: 2px 8px;
      font-size: 10px;
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    /* Info Grid */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      background: #fafafa;
      border: 1px solid #e4e4e7;
      padding: 14px 16px;
      margin-bottom: 20px;
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

    /* Summary Strip */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }
    .stat-card {
      border: 2px solid #0a0a0a;
      padding: 12px 14px;
      background: #0a0a0a;
      color: #ffffff;
    }
    .stat-card.accent {
      background: #ea580c;
      color: #0a0a0a;
    }
    .stat-card.light {
      background: #ffffff;
      color: #0a0a0a;
    }
    .stat-label {
      font-size: 10px;
      text-transform: uppercase;
      opacity: 0.75;
      margin-bottom: 4px;
    }
    .stat-val {
      font-size: 20px;
      font-weight: 800;
    }
    .stat-sub {
      font-size: 10px;
      margin-top: 3px;
      opacity: 0.85;
    }

    /* Ledger Table */
    .section-title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 10px;
      color: #0a0a0a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      margin-bottom: 20px;
    }
    th {
      background: #0a0a0a;
      color: #ffffff;
      font-size: 10px;
      text-transform: uppercase;
      padding: 9px 10px;
      text-align: left;
      border: 1px solid #0a0a0a;
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
    .badge.debt {
      background: #fef2f2;
      border-color: #fecaca;
      color: #dc2626;
    }
    .proof-yes {
      font-size: 10px;
      color: #b45309;
      background: #fffbeb;
      border: 1px solid #fde68a;
      padding: 2px 6px;
    }
    .income { color: #16a34a; font-weight: 700; }
    .expense { color: #0a0a0a; font-weight: 700; }

    /* Footer */
    .footer {
      border-top: 2px solid #0a0a0a;
      padding-top: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      color: #71717a;
    }

    @media print {
      body { background: #ffffff; padding: 0; }
      .sheet { border: none; box-shadow: none; max-width: 100%; padding: 12px; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="top-bar">
      <div class="brand-box">
        <div class="logo-mark mono">AL//</div>
        <div>
          <div class="brand-title">AutoLedger</div>
          <div class="brand-sub mono">Verified Expense & Receipt Statement</div>
        </div>
      </div>
      <div class="doc-meta mono">
        <div class="doc-badge">Official Ledger Receipt</div>
        <div><strong>REF:</strong> ${statementNo}</div>
        <div><strong>ISSUED:</strong> ${generatedAt}</div>
      </div>
    </div>

    <div class="info-grid">
      <div>
        <div class="info-label mono">Account Holder</div>
        <div class="info-value">${escapeHtml(meta.userName || "Account User")}</div>
        <div class="mono muted" style="font-size:11px;margin-top:2px;">${escapeHtml(meta.userEmail || "")}</div>
      </div>
      <div>
        <div class="info-label mono">Export Scope & Filters</div>
        <div class="info-value">${escapeHtml(meta.scopeLabel)}</div>
        <div class="mono muted" style="font-size:11px;margin-top:2px;">${escapeHtml(meta.filtersSummary)}</div>
      </div>
    </div>

    <div class="summary-grid">
      <div class="stat-card">
        <div class="stat-label mono">Total Spend</div>
        <div class="stat-val mono">${formatCurrency(meta.summary.filteredTotal)}</div>
        <div class="stat-sub mono">${meta.summary.itemCount} Expense Items</div>
      </div>
      <div class="stat-card accent">
        <div class="stat-label mono">Highest Expense</div>
        <div class="stat-val mono">${formatCurrency(meta.summary.highestExpense.amount)}</div>
        <div class="stat-sub mono">${escapeHtml(meta.summary.highestExpense.category)}</div>
      </div>
      <div class="stat-card light">
        <div class="stat-label mono">Average Spend</div>
        <div class="stat-val mono">${formatCurrency(meta.summary.averageSpend)}</div>
        <div class="stat-sub mono">${items.length} Total Rows Exported</div>
      </div>
    </div>

    <div class="section-title mono">Transaction Breakdown</div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Date</th>
          <th>Description & Category</th>
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
      <span>AUTOLEDGER // SYSTEM GENERATED LEDGER RECEIPT</span>
      <span>SAVE AS PDF IN PRINT DIALOG FOR ARCHIVAL</span>
    </div>
  </div>

  <script>
    window.onload = function () {
      setTimeout(function () {
        window.print();
      }, 200);
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