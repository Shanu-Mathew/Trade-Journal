# Trading Journal - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Access the Application
The application is already built and ready to run. The development server starts automatically.

### Step 2: Create Your Account
1. You'll see the login page when you first open the app
2. Click "Don't have an account? Sign up"
3. Enter your email and password (minimum 6 characters)
4. Click "Sign Up"
5. You'll be automatically logged in

### Step 3: Set Up Your First Trading Account
1. After logging in, click "Settings" in the sidebar
2. Click "Add Account"
3. Fill in the details:
   - **Account Name**: e.g., "My Main Account"
   - **Account Type**: Live, Demo, or Paper
   - **Currency**: USD (or your preferred currency)
   - **Initial Balance**: e.g., 10000
4. Click "Add Account"

### Step 4: Add Your First Trade

#### Option A: Manual Entry
1. Click "Trades" in the sidebar
2. Click "Add Trade" button
3. Fill in the trade details:
   - Select your account
   - Enter symbol (e.g., AAPL, EURUSD)
   - Choose instrument type
   - Select direction (Long/Short)
   - Enter quantity, entry price
   - Add exit price if closed
   - Set timestamps
   - Add any fees, commissions
   - Optionally add strategy and tags
4. Click "Add Trade"

#### Option B: Import from CSV
1. Click "Trades" in the sidebar
2. Click "Import CSV"
3. Choose the sample file: `sample-trade-import.csv`
4. Click "Import"
5. Your sample trades will be loaded

### Step 5: View Your Dashboard
1. Click "Dashboard" in the sidebar
2. Explore your performance metrics:
   - KPI cards at the top
   - Various charts below
3. Use the time-range selector to filter data
4. Watch the metrics update in real-time

### Step 6: Explore Features

#### Filter Trades
1. In Trades view, click "Filters"
2. Select criteria (account, status, direction, P&L range)
3. Trades list updates automatically

#### Create a Journal Entry
1. Click "Journals" in the sidebar
2. Click "New Entry"
3. Add a title and content
4. Click "Create Entry"

#### Toggle Dark Mode
1. Click the Moon/Sun icon in the sidebar
2. The theme switches instantly

#### Export Your Data
1. Go to Trades view
2. Click "Export CSV"
3. Your trades are downloaded as a CSV file

## 📊 Understanding the Dashboard

### KPI Cards
- **Total P&L**: Your total profit/loss across all closed trades
- **Win Rate**: Percentage of winning trades
- **Number of Trades**: Total closed trades (with open trades shown)
- **Avg R**: Average risk-reward ratio
- **Expectancy**: Expected value per trade
- **Max Drawdown**: Largest peak-to-trough decline
- **Best/Worst Day**: Highest profit and largest loss in a single day
- **Open P&L**: Current unrealized profit/loss
- **Profit Factor**: Ratio of gross profit to gross loss

### Charts
1. **Equity Curve**: Shows your account balance progression
2. **P&L by Day of Week**: Identifies your best trading days
3. **Drawdown Chart**: Visualizes risk exposure over time
4. **P&L Distribution**: Shows the spread of your trade outcomes
5. **Rolling Win Rate**: 30-trade moving average win rate
6. **Strategy Comparison**: Compare performance by strategy
7. **Heatmap**: Find your most profitable trading hours
8. **Symbol Leaderboard**: Your top performing symbols

## 💡 Pro Tips

### Trade Entry Best Practices
1. Always fill in strategy and tags for better analysis
2. Add notes about your reasoning
3. Record all fees and commissions for accurate P&L
4. Use consistent symbol formatting (uppercase)

### Analysis Tips
1. Use the time-range selector to focus on recent performance
2. Check the heatmap to find your optimal trading hours
3. Review strategy comparison to identify what works
4. Monitor drawdown to manage risk

### Organization Tips
1. Create separate accounts for different strategies
2. Use tags consistently (e.g., "scalp", "swing", "earnings")
3. Set meaningful strategy names
4. Write journal entries after major wins/losses

### CSV Import Format
Your CSV should have these columns (in any order):
- symbol, instrument_type, direction, quantity
- entry_price, exit_price, entry_time, exit_time
- fees, commission, strategy, status

See `sample-trade-import.csv` for a working example.

## 🎨 Customization

### Dark Mode
- Automatically saves your preference
- Perfect for night trading sessions
- Easy on the eyes during long analysis

### Mobile Usage
- Fully responsive design
- Swipe to open sidebar on mobile
- All features available on smaller screens

## 🔐 Security Notes

- Your password is securely hashed
- All data is protected with Row Level Security
- Only you can see your trades and accounts
- Session management handled automatically

## 🆘 Troubleshooting

### Can't see trades?
- Make sure you've selected the correct account in filters
- Check your time-range selection
- Verify trades were imported/added successfully

### Charts showing "No data"?
- You need at least 1-2 closed trades with P&L
- Make sure exit prices are set
- Check time-range filter isn't excluding all trades

### Import not working?
- Verify CSV format matches the example
- Check for required fields: symbol, quantity, entry_price
- Ensure you have at least one account created

## 📈 Next Steps

1. **Import your historical trades** using CSV
2. **Set up meaningful tags and strategies** for better organization
3. **Review the dashboard regularly** to track improvement
4. **Use journals** to document lessons learned
5. **Experiment with filters** to find patterns in your trading

## 🎯 Goals

The app helps you:
- Track performance objectively
- Identify strengths and weaknesses
- Learn from past trades
- Build consistency
- Manage risk effectively

Happy trading and analyzing! 📊✨
