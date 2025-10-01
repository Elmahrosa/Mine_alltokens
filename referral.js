// TEOS Egypt Mining Portal - Referral System
// Handles invite tracking and bonus logic

class ReferralSystem {
  constructor() {
    this.supabase = null;
    this.currentUser = null;
    this.referralStats = {
      totalReferrals: 0,
      bonusEarned: 0,
      activeReferrals: []
    };
    this.isInitialized = false;
  }

  // Initialize referral system
  init() {
    if (this.isInitialized) return;
    
    try {
      // Get Supabase instance from mining app
      this.supabase = window.MiningApp?.supabase;
      if (!this.supabase) {
        console.warn('Supabase not available. Referral system will initialize when mining app is ready.');
        setTimeout(() => this.init(), 1000);
        return;
      }

      this.setupEventListeners();
      this.updateReferralDisplay();
      
      this.isInitialized = true;
      console.log('Referral system initialized');
      
    } catch (error) {
      console.error('Failed to initialize referral system:', error);
    }
  }

  // Set up event listeners
  setupEventListeners() {
    // Copy referral code button
    const copyReferralCodeBtn = document.getElementById('copy-referral-code');
    if (copyReferralCodeBtn) {
      copyReferralCodeBtn.addEventListener('click', () => {
        const code = document.getElementById('referral-code-display')?.value;
        if (code) {
          this.copyToClipboard(code);
        }
      });
    }

    // Copy referral link button
    const copyReferralLinkBtn = document.getElementById('copy-referral-link');
    if (copyReferralLinkBtn) {
      copyReferralLinkBtn.addEventListener('click', () => {
        const link = document.getElementById('referral-link-display')?.value;
        if (link) {
          this.copyToClipboard(link);
        }
      });
    }

    // Listen for user changes from mining app
    document.addEventListener('userUpdated', (e) => {
      this.currentUser = e.detail;
      this.updateReferralDisplay();
      this.loadReferralStats();
    });

    // Listen for mining events to calculate referral bonuses
    this.setupMiningEventListener();
  }

  // Set up mining event listener for real-time bonus calculation
  setupMiningEventListener() {
    if (!this.supabase) return;

    // Subscribe to mining events for users referred by current user
    this.supabase
      .channel('mining-events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mining_events'
        },
        (payload) => {
          this.handleMiningEvent(payload.new);
        }
      )
      .subscribe();
  }

  // Handle mining event for referral bonus calculation
  async handleMiningEvent(miningEvent) {
    if (!this.currentUser || !miningEvent) return;

    try {
      // Check if the miner was referred by current user
      const { data: referral, error } = await this.supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', this.currentUser.id)
        .eq('referred_id', miningEvent.user_id)
        .eq('status', 'active')
        .single();

      if (error || !referral) return;

      // Calculate 5% bonus for TEOS mining
      if (miningEvent.token_symbol === 'TEOS') {
        const bonusAmount = miningEvent.amount * 0.05;
        
        // Award bonus to referrer
        await this.awardReferralBonus(miningEvent.user_id, bonusAmount, miningEvent.id);
      }
      
    } catch (error) {
      console.error('Error handling mining event for referral:', error);
    }
  }

  // Award referral bonus
  async awardReferralBonus(referredUserId, bonusAmount, originalMiningEventId) {
    if (!this.currentUser) return;

    try {
      // Create bonus mining event for referrer
      const { error: miningError } = await this.supabase
        .from('mining_events')
        .insert({
          user_id: this.currentUser.id,
          token_symbol: 'TEOS',
          amount: bonusAmount,
          tier: this.currentUser.tier || 'free',
          referral_bonus: bonusAmount,
          transaction_hash: `referral_${originalMiningEventId}`
        });

      if (miningError) throw miningError;

      // Update referrer's TEOS balance
      const { error: balanceError } = await this.supabase
        .from('user_balances')
        .update({
          balance: this.supabase.sql`balance + ${bonusAmount}`,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', this.currentUser.id)
        .eq('token_symbol', 'TEOS');

      if (balanceError) throw balanceError;

      // Update referral bonus tracking
      const { error: referralError } = await this.supabase
        .from('referrals')
        .update({
          bonus_earned: this.supabase.sql`bonus_earned + ${bonusAmount}`
        })
        .eq('referrer_id', this.currentUser.id)
        .eq('referred_id', referredUserId);

      if (referralError) throw referralError;

      // Refresh stats
      this.loadReferralStats();
      
      // Show notification
      this.showToast(`🎉 Referral bonus earned: ${bonusAmount.toFixed(2)} TEOS!`, 'success');
      
    } catch (error) {
      console.error('Error awarding referral bonus:', error);
    }
  }

  // Update referral display
  async updateReferralDisplay() {
    if (!this.currentUser) {
      this.hideReferralSection();
      return;
    }

    this.showReferralSection();
    
    // Update referral code display
    const referralCodeDisplay = document.getElementById('referral-code-display');
    if (referralCodeDisplay && this.currentUser.referral_code) {
      referralCodeDisplay.value = this.currentUser.referral_code;
    }

    // Update referral link display
    const referralLinkDisplay = document.getElementById('referral-link-display');
    if (referralLinkDisplay && this.currentUser.referral_code) {
      const baseUrl = window.location.origin;
      const referralLink = `${baseUrl}?ref=${this.currentUser.referral_code}`;
      referralLinkDisplay.value = referralLink;
    }

    // Load and display stats
    await this.loadReferralStats();
  }

  // Load referral statistics
  async loadReferralStats() {
    if (!this.currentUser) return;

    try {
      // Get referral statistics
      const { data: referrals, error } = await this.supabase
        .from('referrals')
        .select(`
          *,
          referred:users!referrals_referred_id_fkey(email, created_at, last_mine_at)
        `)
        .eq('referrer_id', this.currentUser.id)
        .eq('status', 'active');

      if (error) throw error;

      // Calculate total bonus earned
      const totalBonusEarned = referrals.reduce((sum, referral) => {
        return sum + (parseFloat(referral.bonus_earned) || 0);
      }, 0);

      // Update stats object
      this.referralStats = {
        totalReferrals: referrals.length,
        bonusEarned: totalBonusEarned,
        activeReferrals: referrals
      };

      // Update UI
      this.updateReferralStatsDisplay();
      
    } catch (error) {
      console.error('Error loading referral stats:', error);
    }
  }

  // Update referral stats display
  updateReferralStatsDisplay() {
    const totalReferralsDisplay = document.getElementById('total-referrals-display');
    const referralBonusEarned = document.getElementById('referral-bonus-earned');

    if (totalReferralsDisplay) {
      totalReferralsDisplay.textContent = this.referralStats.totalReferrals;
    }

    if (referralBonusEarned) {
      referralBonusEarned.textContent = this.formatNumber(this.referralStats.bonusEarned);
    }
  }

  // Show referral section
  showReferralSection() {
    const referralSection = document.getElementById('referral-section');
    if (referralSection) {
      referralSection.style.display = 'block';
    }
  }

  // Hide referral section
  hideReferralSection() {
    const referralSection = document.getElementById('referral-section');
    if (referralSection) {
      referralSection.style.display = 'none';
    }
  }

  // Generate referral link with tracking parameters
  generateReferralLink(referralCode, campaign = 'default') {
    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
      ref: referralCode,
      utm_source: 'referral',
      utm_medium: 'link',
      utm_campaign: campaign
    });
    
    return `${baseUrl}?${params.toString()}`;
  }

  // Generate shareable referral message
  generateReferralMessage(referralCode) {
    const referralLink = this.generateReferralLink(referralCode);
    
    return `🪙 Join me on TEOS Egypt Mining Portal! 🇪🇬\n\n` +
           `Complete civic verification steps and start mining TEOS, TUT, and ERT tokens daily!\n\n` +
           `Use my referral code: ${referralCode}\n` +
           `Or click here: ${referralLink}\n\n` +
           `🎉 We both get +5% mining bonus when you join!\n\n` +
           `#TEOSEgypt #CryptoMining #DigitalCurrency`;
  }

  // Share referral link via Web Share API or fallback
  async shareReferralLink() {
    if (!this.currentUser || !this.currentUser.referral_code) {
      this.showToast('No referral code available', 'error');
      return;
    }

    const referralMessage = this.generateReferralMessage(this.currentUser.referral_code);
    const referralLink = this.generateReferralLink(this.currentUser.referral_code);

    try {
      // Try Web Share API first (mobile browsers)
      if (navigator.share) {
        await navigator.share({
          title: 'Join TEOS Egypt Mining Portal',
          text: referralMessage,
          url: referralLink
        });
        return;
      }

      // Fallback: Copy to clipboard
      await this.copyToClipboard(referralMessage);
      this.showToast('Referral message copied to clipboard!', 'success');
      
    } catch (error) {
      console.error('Error sharing referral link:', error);
      this.showToast('Error sharing referral link', 'error');
    }
  }

  // Copy text to clipboard
  async copyToClipboard(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      
      this.showToast('Copied to clipboard!', 'success');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      this.showToast('Failed to copy. Please copy manually.', 'error');
    }
  }

  // Get referral leaderboard
  async getReferralLeaderboard(limit = 10) {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('email, total_referrals, referral_code')
        .order('total_referrals', { ascending: false })
        .limit(limit)
        .gt('total_referrals', 0);

      if (error) throw error;
      return data || [];
      
    } catch (error) {
      console.error('Error fetching referral leaderboard:', error);
      return [];
    }
  }

  // Calculate potential earnings for referrals
  calculatePotentialEarnings(referralCount, tier = 'free') {
    const dailyMining = {
      free: 12,
      basic: 24,
      pro: 36
    };
    
    const dailyBonus = (dailyMining[tier] || dailyMining.free) * 0.05;
    const monthlyBonus = dailyBonus * 30;
    const yearlyBonus = dailyBonus * 365;
    
    return {
      daily: dailyBonus * referralCount,
      monthly: monthlyBonus * referralCount,
      yearly: yearlyBonus * referralCount
    };
  }

  // Generate referral performance report
  async generatePerformanceReport() {
    if (!this.currentUser) return null;

    try {
      const referrals = this.referralStats.activeReferrals;
      
      const report = {
        totalReferrals: referrals.length,
        totalBonusEarned: this.referralStats.bonusEarned,
        averageBonusPerReferral: referrals.length > 0 ? this.referralStats.bonusEarned / referrals.length : 0,
        activeMiners: referrals.filter(r => r.referred?.last_mine_at).length,
        recentSignups: referrals.filter(r => {
          const signupDate = new Date(r.referred?.created_at);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return signupDate > weekAgo;
        }).length,
        potentialEarnings: this.calculatePotentialEarnings(
          referrals.length, 
          this.currentUser.tier
        )
      };
      
      return report;
      
    } catch (error) {
      console.error('Error generating performance report:', error);
      return null;
    }
  }

  // Track referral conversion events
  async trackReferralEvent(eventType, referralCode, additionalData = {}) {
    try {
      // This could be sent to analytics service
      const eventData = {
        event: eventType,
        referral_code: referralCode,
        timestamp: new Date().toISOString(),
        ...additionalData
      };
      
      console.log('Referral event tracked:', eventData);
      
      // Could integrate with analytics services like Google Analytics, Mixpanel, etc.
      // Example: gtag('event', eventType, { referral_code: referralCode });
      
    } catch (error) {
      console.error('Error tracking referral event:', error);
    }
  }

  // Format number for display
  formatNumber(num) {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  }

  // Show toast notification
  showToast(message, type = 'info') {
    // Use mining app's toast function if available
    if (window.MiningApp && typeof window.MiningApp.showToast === 'function') {
      window.MiningApp.showToast(message, type);
      return;
    }

    // Fallback toast implementation
    console.log(`${type.toUpperCase()}: ${message}`);
    
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 5000);
  }
}

// Global referral system instance
window.ReferralSystem = new ReferralSystem();

// Auto-initialize when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.ReferralSystem.init();
  });
} else {
  window.ReferralSystem.init();
}