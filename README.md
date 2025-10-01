# 🪙 Mine_alltokens — TEOS Egypt Mining Portal

A complete civic-powered mining application for TEOS Egypt. Contributors unlock daily token rewards by completing civic verification steps and can upgrade to Basic or Pro tiers using TEOS, SOL, or Pi.

## 🌟 Features

### ✅ Civic Gate Verification Flow
- **Petition Signing**: Users must sign the TEOS petition on Change.org
- **Social Media Verification**: Join Telegram, follow Facebook and X (Twitter)
- **Automatic Unlock**: Mining access granted after completing all civic steps
- **Progressive Verification**: Users can complete steps in any order

### ⛏️ Tiered Mining Logic
- **Free Tier**: 12 TEOS, 6 TUT, 3 ERT daily
- **Basic Tier**: 24 TEOS, 12 TUT, 6 ERT daily ($5/month)
- **Pro Tier**: 36 TEOS, 18 TUT, 9 ERT daily ($10/month)
- **24-Hour Cooldown**: Mining resets every 24 hours
- **Referral Bonus**: +5% for inviters on all referral mining

### 🎯 Token Registry
- **TEOS**: Primary governance and utility token
- **TUT**: Tutankhamun Token - cultural heritage token
- **ERT**: Egypt Token - regional civic participation token

### 💎 Upgrade System
- **Multiple Payment Options**: SOL, TEOS, USDT, Pi Network
- **Secure Wallet Addresses**: Predefined payment wallets
- **Transaction Verification**: Hash-based payment confirmation
- **Automatic Tier Unlock**: Instant access after payment verification

### 🤝 Referral Engine
- **Unique Referral Codes**: Auto-generated for each user
- **5% Bonus System**: Referrers earn 5% of referred user's mining
- **Tracking Dashboard**: Complete referral statistics and earnings
- **Viral Growth**: Easy sharing with custom referral links

## 🚀 Quick Setup

### 1. Clone Repository
```bash
git clone https://github.com/Elmahrosa/Mine_alltokens.git
cd Mine_alltokens
```

### 2. Configure Supabase
1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Copy `.env.example` to `.env` and fill in your Supabase credentials:
```bash
cp .env.example .env
```

3. Run the database schema:
```sql
-- Execute the contents of supabase_schema.sql in your Supabase SQL editor
```

### 3. Update Configuration
Edit the following files with your specific URLs and wallet addresses:
- **Social Media Links**: Update in `index.html` civic verification section
- **Payment Wallets**: Update wallet addresses in `upgrade.js`
- **App URLs**: Update base URLs in referral and mining logic

### 4. Deploy

#### Option 1: Static Hosting (Simplest)
- Upload all files to any static hosting service
- Recommended: Netlify, Vercel, GitHub Pages
- Domain: `mine.teosegypt.com`

#### Option 2: Local Development
```bash
# Serve locally with any HTTP server
python -m http.server 8000
# or
npx serve .
# or
live-server
```

## 📁 Project Structure

```
Mine_alltokens/
├── index.html               # Main portal with civic gate + mining interface
├── styles.css               # Complete styling with Egyptian theme
├── mining.js                # Core mining logic and user authentication
├── upgrade.js               # Payment processing and tier management
├── referral.js              # Referral system and bonus tracking
├── supabase_schema.sql      # Complete database schema with RLS
├── .env.example            # Environment variables template
├── README.md               # This file
└── assets/                 # Images, logos, and media files
    ├── teos-logo.png
    ├── hero-bg.jpg
    ├── favicon.ico
    └── ...
```

## 🗄️ Database Schema

### Core Tables
- **`tokens`**: TEOS, TUT, ERT registry with metadata
- **`users`**: User profiles with civic verification status
- **`mining_events`**: Complete mining history and rewards
- **`referrals`**: Referral relationships and bonus tracking
- **`payments`**: Tier upgrade transactions and verification
- **`user_balances`**: Real-time token balances per user

### Key Functions
- **`execute_mining()`**: Handles mining logic with tier-based rewards
- **`can_user_mine()`**: Checks 24-hour cooldown eligibility
- **`handle_new_user()`**: Auto-creates user profile and referral code
- **Row Level Security**: Ensures users only access their own data

## 🎮 User Journey

### 1. Registration & Onboarding
1. User visits `mine.teosegypt.com`
2. Signs up with email/password (optional referral code)
3. Automatic profile creation with unique referral code

### 2. Civic Verification
1. Complete civic steps in any order:
   - Sign TEOS petition on Change.org
   - Join Telegram community
   - Follow Facebook page
   - Follow X (Twitter) account
2. Mark each step as completed
3. Automatic verification unlocks mining access

### 3. Daily Mining
1. Click "Mine Tokens" button (24-hour cooldown)
2. Receive tier-based rewards:
   - Free: 12 TEOS, 6 TUT, 3 ERT
   - Basic: 24 TEOS, 12 TUT, 6 ERT
   - Pro: 36 TEOS, 18 TUT, 9 ERT
3. Referrer receives 5% bonus automatically

### 4. Tier Upgrades
1. Choose Basic ($5) or Pro ($10) tier
2. Select payment method (SOL, TEOS, USDT, Pi)
3. Send payment to provided wallet address
4. Submit transaction hash for verification
5. Automatic tier unlock after confirmation

### 5. Referral Program
1. Share unique referral code or link
2. Earn 5% of all referred users' mining
3. Track referrals and bonuses in dashboard

## 🔧 Technical Implementation

### Frontend Architecture
- **Pure HTML/CSS/JavaScript**: No frameworks, maximum compatibility
- **Supabase Integration**: Real-time database and authentication
- **Responsive Design**: Mobile-first approach with Egyptian theming
- **Progressive Enhancement**: Works with JavaScript disabled

### Backend Services
- **Supabase**: Authentication, database, and real-time subscriptions
- **Row Level Security**: Secure data access patterns
- **Database Functions**: Server-side logic for mining and referrals
- **Automatic Triggers**: User creation and balance management

### Security Features
- **Email Authentication**: Secure user registration and login
- **RLS Policies**: Users can only access their own data
- **Payment Verification**: Transaction hash validation
- **Rate Limiting**: 24-hour mining cooldown prevents abuse

## 🌍 Customization

### Branding
- **Colors**: Update CSS variables in `styles.css`
- **Logo**: Replace `assets/teos-logo.png`
- **Domain**: Update all references to `mine.teosegypt.com`

### Social Links
- **Petition**: Update Change.org petition URL
- **Telegram**: Update Telegram group link
- **Facebook**: Update Facebook page URL
- **X/Twitter**: Update X account URL

### Mining Rewards
- **Tier Amounts**: Modify in `mining.js` and database schema
- **Cooldown Period**: Adjust 24-hour limit in mining logic
- **Referral Bonus**: Change 5% bonus percentage

### Payment Integration
- **Wallet Addresses**: Update in `upgrade.js`
- **Supported Currencies**: Add/remove payment options
- **Pricing**: Modify tier prices in upgrade system

## 📊 Analytics & Monitoring

### Key Metrics
- **User Registrations**: Track signups and civic verification
- **Mining Activity**: Monitor daily mining events
- **Tier Upgrades**: Track payment conversions
- **Referral Performance**: Measure viral growth

### Dashboard Queries
```sql
-- Total verified users
SELECT COUNT(*) FROM users WHERE civic_verified = true;

-- Daily mining stats
SELECT DATE(mined_at), COUNT(*), SUM(amount)
FROM mining_events 
GROUP BY DATE(mined_at)
ORDER BY DATE(mined_at) DESC;

-- Referral leaderboard
SELECT u.email, u.total_referrals, SUM(r.bonus_earned)
FROM users u
LEFT JOIN referrals r ON u.id = r.referrer_id
GROUP BY u.id
ORDER BY u.total_referrals DESC;
```

## 🔒 Environment Variables

Create `.env` file with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Payment Wallets
SOLANA_WALLET=F1YLmukcxAyZj6zVpi2XaVctmYnuZQB5uHpd3uUpXxr6
PI_WALLET=GDIW2DXDR3DU4CYTRHDS3WYDGHMUQZG7E5FJWWW6XSADOC5VHMYRYD6F

# Social Media URLs
PETITION_URL=https://www.change.org/p/join-the-movement-sign-the-petition-to-regulate-digital-currencies-in-egypt
TELEGRAM_URL=https://t.me/Elmahrosapi
FACEBOOK_URL=https://www.facebook.com/teosegypt
X_URL=https://x.com/king_teos

# Application Settings
APP_URL=https://mine.teosegypt.com
BASIC_TIER_PRICE=5
PRO_TIER_PRICE=10
MINING_COOLDOWN_HOURS=24
REFERRAL_BONUS_PERCENT=5
```

## 🚀 Deployment Options

### Netlify (Recommended)
1. Connect GitHub repository
2. Set environment variables in Netlify dashboard
3. Deploy automatically on commits
4. Custom domain: `mine.teosegypt.com`

### Vercel
1. Import project from GitHub
2. Configure environment variables
3. Deploy with automatic HTTPS

### GitHub Pages
1. Enable GitHub Pages in repository settings
2. Use GitHub Actions for environment variable injection
3. Custom domain configuration

### Self-Hosted
1. Upload files to web server
2. Configure environment variables
3. Set up HTTPS with Let's Encrypt
4. Configure domain and DNS

## 🛠️ Development

### Local Development
```bash
# Clone repository
git clone https://github.com/Elmahrosa/Mine_alltokens.git
cd Mine_alltokens

# Create environment file
cp .env.example .env
# Edit .env with your Supabase credentials

# Start local server
python -m http.server 8000
# Visit http://localhost:8000
```

### Testing
- **User Registration**: Test signup flow with referral codes
- **Civic Verification**: Complete all civic steps
- **Mining Logic**: Test 24-hour cooldown and tier rewards
- **Payment Flow**: Test payment submission (use testnet)
- **Referral System**: Test bonus calculations

### Debugging
- **Browser Console**: Check for JavaScript errors
- **Supabase Logs**: Monitor database queries and errors
- **Network Tab**: Verify API calls and responses

## 📜 License

Open-source for civic use. Fork, remix, and deploy for your own sovereign campaigns.

## 🌍 Join the Movement

This portal is part of TEOS Egypt's global digital legacy. Every miner, referrer, and contributor becomes part of the myth.

### Community Links
- **Telegram**: [t.me/Elmahrosapi](https://t.me/Elmahrosapi)
- **Facebook**: [facebook.com/teosegypt](https://www.facebook.com/teosegypt)
- **X (Twitter)**: [x.com/king_teos](https://x.com/king_teos)
- **Petition**: [Change.org TEOS Petition](https://www.change.org/p/join-the-movement-sign-the-petition-to-regulate-digital-currencies-in-egypt)

### Support
- **Email**: support@teosegypt.com
- **Telegram Support**: [t.me/Elmahrosapi](https://t.me/Elmahrosapi)
- **GitHub Issues**: [GitHub Repository](https://github.com/Elmahrosa/Mine_alltokens/issues)

---

**Made with ❤️ by the TEOS Egypt community**

*Become a Verified TEOS Pioneer 🇪🇬*