# Trading Journal Web App

A modern, responsive web application for tracking and analyzing your trading performance. Built with React, TypeScript, Supabase, and Tailwind CSS.

## Features

### Trade Management
- Add, edit, and delete trades with comprehensive metadata
- Support for multiple instrument types (stocks, forex, futures, options, crypto)
- Track long and short positions with leverage support
- Record entry/exit prices, timestamps, fees, commissions, and slippage
- Tag trades and assign strategies for better organization
- Add notes and screenshots to trades
- Import/export trades via CSV

### Dashboard & Analytics
- Real-time KPIs:
  - Total P&L, Win Rate, Number of Trades
  - Average R, Expectancy, Max Drawdown
  - Best/Worst Day, Open P&L, Profit Factor
- Time-range selector (last 10 days, week, month, 3 months, YTD, year, all time, custom)
- Multiple chart visualizations:
  - Equity Curve (cumulative balance after each trade)
  - P&L by Day of Week
  - Drawdown Chart
  - P&L Distribution Histogram
  - Rolling Win Rate (30-trade window)
  - Trading Heatmap (day x hour)
  - Strategy Comparison
  - Symbol Leaderboard

### Multi-Account Support
- Create and manage multiple trading accounts
- Track different account types (live, demo, paper)
- Set initial balance and currency for each account
- Separate P&L tracking per account

### Journal System
- Create rich-text journal entries
- Document trading thoughts, lessons learned, and observations
- Link journal entries to specific trades
- Organize and review your trading journey

### Filters & Search
- Filter trades by account, symbol, strategy, tags, win/loss, P&L range, date range
- Save filter presets for quick access
- Full-text search across trade symbols

### Security & Data Management
- JWT-based authentication with secure password hashing
- Row-level security (RLS) on all data
- Audit logs for trade edits
- Data export capabilities
- GDPR-compliant data management

### User Experience
- Clean, modern interface with light/dark mode
- Fully responsive design (mobile, tablet, desktop)
- Fast performance even with 10,000+ trades
- Intuitive navigation and workflows

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **Icons**: Lucide React

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- A Supabase account and project

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Environment variables are already configured in `.env`

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

## Usage

### First Time Setup

1. **Register an Account**: Create your account with email and password
2. **Create a Trading Account**: Go to Settings and add your first trading account (e.g., "My Live Account" with initial balance)
3. **Add Trades**: Navigate to Trades and click "Add Trade" to record your first trade
4. **View Analytics**: Check the Dashboard to see your performance metrics and charts

### Adding Trades

You can add trades in two ways:

1. **Manual Entry**: Click "Add Trade" and fill in the form with trade details
2. **CSV Import**: Click "Import CSV" and upload a CSV file with your trades

#### CSV Format Example
```csv
symbol,instrument_type,direction,quantity,entry_price,exit_price,entry_time,exit_time,fees,commission,strategy,status
AAPL,stocks,long,100,150.50,155.25,2024-01-15T09:30:00,2024-01-15T15:30:00,1.50,2.00,Momentum,closed
EURUSD,forex,short,10000,1.0850,1.0820,2024-01-16T08:00:00,2024-01-16T14:00:00,0,5.00,Breakout,closed
```

### Understanding the Dashboard

- **KPI Cards**: Quick overview of your key performance metrics
- **Time Range Selector**: Filter all charts and KPIs by time period
- **Equity Curve**: Shows your account balance progression over time
- **Drawdown Chart**: Visualizes peak-to-trough declines
- **Heatmap**: Identifies your most profitable trading times

### Managing Multiple Accounts

1. Go to Settings
2. Click "Add Account"
3. Specify account name, type, currency, and initial balance
4. When adding trades, select the appropriate account

### Using Journals

1. Navigate to Journals
2. Click "New Entry"
3. Write your observations, lessons, or trade reviews
4. Optionally link to specific trades

## Project Structure

```
src/
├── components/
│   ├── auth/          # Authentication pages
│   ├── charts/        # Chart visualizations
│   ├── dashboard/     # Dashboard and KPIs
│   ├── journals/      # Journal entries
│   ├── layout/        # App layout and navigation
│   ├── settings/      # Settings and account management
│   └── trades/        # Trade management
├── contexts/          # React contexts (Auth, Theme)
├── lib/              # Supabase client and types
├── utils/            # Utility functions and calculations
├── App.tsx           # Main app component
└── main.tsx          # Entry point
```

## Database Schema

### Tables
- **accounts**: User trading accounts
- **trades**: Individual trade records
- **trade_screenshots**: Image attachments for trades
- **trade_ohlc_data**: Candlestick data for chart overlays
- **journals**: Journal entries
- **journal_attachments**: Journal image attachments
- **filter_presets**: Saved filter configurations
- **csv_mapping_presets**: Saved CSV import mappings
- **audit_logs**: Edit history and audit trail

All tables have Row Level Security (RLS) enabled to ensure users can only access their own data.

## Performance Considerations

- Server-side aggregation for handling large datasets
- Indexed database queries for fast filtering
- Optimized chart rendering with SVG
- Lazy loading of components

## Future Enhancements

Potential features for future versions:
- Advanced trade detail page with review checklists
- OHLC candlestick charts with entry/exit markers
- PDF report generation
- More advanced statistics (Sharpe ratio, Sortino ratio)
- Trade replay functionality
- Mobile app version

## License

MIT License

## Support

For issues or questions, please open an issue in the repository.
