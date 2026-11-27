# AutoLedger — Frontend

A fast, clean expense tracker interface for logging daily spending, splitting money with friends, and understanding where your money goes.

**Live demo:** https://autoledger-client.onrender.com
**Backend repo:** https://github.com/SAMEERSHARMA123/Auto_Ledger_Server

---

## Tech Stack

| Area | Technology |
|------|------------|
| Framework | Next.js |
| Styling | Tailwind CSS |
| Auth | Email/password and Google sign-in (handled by the backend API) |
| Exports | CSV, XLSX and PDF, generated in the browser |
| Image proof | Camera capture or file upload, stored on Cloudinary |

---

## Features

### 1. Dashboard
- Four summary banners: net balance, monthly inflow, monthly outflow, active debts
- Recent activity showing the last 7 transactions
- Quick add form for an expense or income
- **AI quick add:** speak your expenses and they are added with titles and categories (limited to 2 uses per week)
- Daily safe spending limit and monthly burn progress
- Bar chart of the current week's daily spending
- Category split chart
- Global search bar that takes you to the matching page
- Profile menu

### 2. Ledger History
- Summary banners for total spend, total income, highest expense and average spend
- **Export current view** as CSV, XLSX or PDF, with a custom date range
- Filters: search by note/name, category, payment method (UPI, Cash, Card) and min/max amount
- Edit any entry: category, payment method, and expense/income type
- Add proof to an entry by capturing a photo or uploading an image
- Pagination

### 3. Debts (Lent / Borrowed)
- Banners for amount to receive, amount to pay and net balance
- Add a lent or borrowed record; pick an existing person while typing or add a new one
- Partial payments and full settlement
- Settled history with a clean breakdown per person

### 4. Spending Insights
- Budget usage and remaining amount
- Highest-spending category
- Category donut chart and horizontal bar chart
- Weekly AI summary with spending tips, generated once a week from your activity

### 5. Settings
- Change display name and profile photo
- Set monthly budget limit and alert thresholds
- Five colour themes
- Change password

---

## Getting Started

### Prerequisites
- Node.js 18 or later
- The AutoLedger backend running (see the backend repo)

### Installation

```bash
git clone <frontend-repo-url>
cd autoledger-client
npm install
```

### Environment variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Add any other public keys your app uses (for example, a Google client ID), then run:

```bash
npm run dev
```

The app runs at `http://localhost:3000`.

### Production build

```bash
npm run build
npm start
```

---

## Project Structure

```
autoledger-client/
├── app/            # Pages and routes (dashboard, ledger, debts, insights, settings, login)
├── components/     # Reusable UI components and charts
├── lib/            # API helpers and export utilities (CSV, XLSX, PDF)
├── public/         # Static assets
└── ...
```

---

## Deployment

The frontend is deployed on Render. Set `NEXT_PUBLIC_API_URL` to your deployed backend URL in the service's environment settings.

---

## Author

**Sameer Sharma** — Jaipur, India

© 2026 Sameer Sharma. See LICENSE for terms.