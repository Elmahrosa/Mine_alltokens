# 🚀 TEOS Egypt Mining Portal Deployment Guide

## 📁 Project Structure Verification

Your complete TEOS Egypt Mining Portal should have this structure:

```
Mine_alltokens/
├── index.html               ✅ Main portal with civic gate + mining interface  
├── styles.css               ✅ Complete styling with Egyptian theme
├── mining.js                ✅ Core mining logic and user authentication
├── upgrade.js               ✅ Payment processing and tier management  
├── referral.js              ✅ Referral system and bonus tracking
├── supabase_schema.sql      ✅ Complete database schema with RLS
├── .env.example            ✅ Environment variables template
├── README.md               ✅ Comprehensive documentation
└── assets/                 ✅ Images, logos, and media files
    ├── README.md
    ├── teos-logo.png
    ├── hero-bg.jpg  
    ├── favicon.ico
    └── icons/
        ├── README.md
        ├── teos.png
        ├── tut.png
        └── ert.png
```

## 🔧 Quick Setup Instructions

### 1. Configure Supabase
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your Supabase credentials:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 2. Setup Database
1. Create new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor
3. Execute `supabase_schema.sql` content
4. Verify tables are created with RLS enabled

### 3. Update Configuration
Edit these files with your specific details:
- **Social Links**: Update URLs in `index.html` civic section
- **Payment Wallets**: Update addresses in `upgrade.js` 
- **Supabase URLs**: Update in `mining.js` initialization

### 4. Replace Placeholder Assets
```bash
# Replace with your actual assets:
assets/teos-logo.png        # 200x200px TEOS Egypt logo
assets/hero-bg.jpg          # 1920x1080px background image  
assets/favicon.ico          # Browser favicon
assets/icons/teos.png       # 64x64px TEOS token icon
assets/icons/tut.png        # 64x64px TUT token icon
assets/icons/ert.png        # 64x64px ERT token icon
```

### 5. Deploy Options

#### Option A: Static Hosting (Recommended)
```bash
# Upload all files to:
# - Netlify: drag & drop folder
# - Vercel: import from GitHub  
# - GitHub Pages: push to gh-pages branch
# - Any web host: upload via FTP
```

#### Option B: Local Testing
```bash
# Serve locally
python -m http.server 8000
# Visit: http://localhost:8000
```

## ⚡ Quick Start Checklist

- [ ] Supabase project created
- [ ] Database schema executed  
- [ ] Environment variables configured
- [ ] Social media URLs updated
- [ ] Payment wallet addresses updated
- [ ] Assets replaced with actual images
- [ ] Domain configured (mine.teosegypt.com)
- [ ] SSL certificate enabled
- [ ] DNS records pointed to hosting

## 🧪 Testing Your Portal

### 1. User Registration Flow
- [ ] Sign up with email works
- [ ] Email verification functions
- [ ] User profile auto-created
- [ ] Referral code generated

### 2. Civic Verification
- [ ] All four civic steps displayed
- [ ] External links work correctly
- [ ] Step verification updates database
- [ ] Mining unlocks after completion

### 3. Mining System
- [ ] Mining button enabled after verification
- [ ] 24-hour cooldown enforced
- [ ] Tier-based rewards calculated correctly
- [ ] Balances update in real-time

### 4. Upgrade System  
- [ ] Payment modal shows correct info
- [ ] Wallet addresses copy correctly
- [ ] Transaction submission works
- [ ] Payment verification flow

### 5. Referral System
- [ ] Referral codes generate properly
- [ ] Referral links work with ?ref= parameter
- [ ] Bonuses calculate at 5%
- [ ] Statistics display correctly

## 🔧 Configuration Updates Needed

### JavaScript Files
Update these placeholders in the code:

**mining.js** (lines ~25-27):
```javascript
// Replace with your Supabase credentials
this.supabase = window.supabase.createClient(
  'YOUR_SUPABASE_URL',      // ← Add your Supabase URL
  'YOUR_SUPABASE_ANON_KEY'  // ← Add your anon key
);
```

**upgrade.js** (lines ~11-16):
```javascript
// Update wallet addresses
this.wallets = {
  solana: 'YOUR_SOLANA_WALLET_ADDRESS',  // ← Update
  pi: 'YOUR_PI_WALLET_ADDRESS'           // ← Update  
};
```

### HTML Updates
**index.html** - Update civic verification URLs:
- Line 156: Petition URL
- Line 169: Telegram URL  
- Line 182: Facebook URL
- Line 195: X/Twitter URL

## 📞 Support & Deployment

### Need Help?
- **Documentation**: Read README.md for detailed instructions
- **Database**: Follow supabase_schema.sql setup guide
- **Assets**: Check assets/README.md for asset guidelines
- **Deployment**: Use any static hosting service

### Production Checklist
- [ ] Custom domain configured
- [ ] SSL/HTTPS enabled
- [ ] Environment variables secure
- [ ] Database RLS policies tested
- [ ] Payment wallets secured  
- [ ] Backup procedures in place
- [ ] Analytics configured (optional)

## 🎯 Success Metrics

Once deployed, monitor these key metrics:
- **User Registrations**: Track signups and civic completion
- **Mining Activity**: Daily mining events
- **Tier Upgrades**: Payment conversion rates
- **Referral Growth**: Viral coefficient and bonus distribution

---

**🚀 Your TEOS Egypt Mining Portal is ready for deployment!**

*Every miner, referrer, and contributor becomes part of the myth.* 🇪🇬