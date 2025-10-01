# TEOS Egypt Mining Portal - Assets Directory

This directory contains all visual assets for the TEOS Egypt Mining Portal.

## Required Assets

### Logo Files
- `teos-logo.png` - Main TEOS Egypt logo (recommended: 200x200px)
- `favicon.ico` - Browser favicon (16x16, 32x32, 48x48px)

### Background Images
- `hero-bg.jpg` - Hero section background (recommended: 1920x1080px)
- `mining-bg.jpg` - Mining section background (optional)

### Token Icons
- `icons/teos.png` - TEOS token icon (64x64px)
- `icons/tut.png` - TUT token icon (64x64px)
- `icons/ert.png` - ERT token icon (64x64px)

### Egyptian Theme Assets
- `pyramid.png` - Pyramid graphic for theming
- `sphinx.png` - Sphinx graphic for theming
- `hieroglyphs.png` - Hieroglyphic patterns

### Avatar/Profile Images
- `avatars/pioneer-1.png` through `pioneer-10.png` - User avatars

## Asset Guidelines

### File Formats
- **Logos/Icons**: PNG with transparency
- **Photos**: JPG for photographs, PNG for graphics
- **Favicons**: ICO format preferred

### Sizing
- **Mobile-first**: Ensure assets work well on mobile screens
- **Retina-ready**: Provide 2x versions for high-DPI displays
- **Optimization**: Compress images to reduce loading times

### Egyptian Theme Colors
- **Gold**: #FFD700 (Primary accent)
- **Red**: #CE1126 (Egyptian flag red)
- **Black**: #000000 (Egyptian flag black)
- **White**: #FFFFFF (Egyptian flag white)
- **Blue**: #1E40AF (TEOS blue)

## Quick Asset Creation

For development/testing, you can use placeholder services:

```bash
# Download placeholder logos
wget https://via.placeholder.com/200x200/FFD700/000000?text=TEOS -O teos-logo.png
wget https://via.placeholder.com/64x64/FFD700/000000?text=T -O icons/teos.png
wget https://via.placeholder.com/64x64/FCD34D/000000?text=TUT -O icons/tut.png
wget https://via.placeholder.com/64x64/CE1126/FFFFFF?text=ERT -O icons/ert.png

# Download placeholder backgrounds
wget https://picsum.photos/1920/1080?random=1 -O hero-bg.jpg
```

## Brand Identity

### TEOS Egypt Visual Identity
- **Mythic onboarding**: Ancient Egyptian mystique meets modern crypto
- **Dolphin avatars**: Community spirit and intelligence
- **Regional portals**: Local Egyptian pride
- **Pioneer badges**: Achievement and status symbols

### Typography
- **Primary**: Inter (modern, clean)
- **Accent**: Could use Egyptian-inspired font for headers

### Iconography
- **Egyptian motifs**: Pyramids, sphinxes, hieroglyphs
- **Modern crypto**: Mining pickaxes, coins, blockchain symbols
- **Civic elements**: Egyptian flag, government buildings

## Usage in Code

Assets are referenced in the HTML/CSS:

```html
<!-- Logo -->
<img src="assets/teos-logo.png" alt="TEOS Egypt" class="logo-img">

<!-- Token icons -->
<span class="token-icon">
  <img src="assets/icons/teos.png" alt="TEOS">
</span>

<!-- Background images -->
<section class="hero" style="background-image: url('assets/hero-bg.jpg')">
```

```css
/* CSS Background */
.hero {
  background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), 
              url('assets/hero-bg.jpg');
  background-size: cover;
  background-position: center;
}
```

## License

All assets should be:
- Original creations owned by TEOS Egypt
- Licensed under Creative Commons
- Royalty-free stock images with proper licensing
- Never use copyrighted material without permission

---

**Note**: Replace placeholder assets with professional designs before production deployment.