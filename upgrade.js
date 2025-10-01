// TEOS Egypt Mining Portal - Upgrade System
// Handles payment processing and tier management

class UpgradeSystem {
  constructor() {
    this.supabase = null;
    this.currentUser = null;
    this.selectedTier = null;
    this.isInitialized = false;
    
    // Payment wallet addresses
    this.wallets = {
      solana: 'F1YLmukcxAyZj6zVpi2XaVctmYnuZQB5uHpd3uUpXxr6',
      pi: 'GDIW2DXDR3DU4CYTRHDS3WYDGHMUQZG7E5FJWWW6XSADOC5VHMYRYD6F'
    };
    
    // Tier pricing
    this.tierPricing = {
      basic: 5,
      pro: 10
    };
  }

  // Initialize upgrade system
  init() {
    if (this.isInitialized) return;
    
    try {
      // Get Supabase instance from mining app
      this.supabase = window.MiningApp?.supabase;
      if (!this.supabase) {
        console.warn('Supabase not available. Upgrade system will initialize when mining app is ready.');
        setTimeout(() => this.init(), 1000);
        return;
      }

      this.setupEventListeners();
      this.updateTierCards();
      
      this.isInitialized = true;
      console.log('Upgrade system initialized');
      
    } catch (error) {
      console.error('Failed to initialize upgrade system:', error);
    }
  }

  // Set up event listeners
  setupEventListeners() {
    // Upgrade buttons
    const upgradeButtons = document.querySelectorAll('.upgrade-btn');
    upgradeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tier = e.target.getAttribute('data-tier');
        this.showPaymentModal(tier);
      });
    });

    // Payment modal controls
    const closePaymentModal = document.getElementById('close-payment-modal');
    const paymentForm = document.getElementById('payment-form');
    const copyButtons = document.querySelectorAll('.copy-btn');

    if (closePaymentModal) {
      closePaymentModal.addEventListener('click', () => this.hidePaymentModal());
    }

    if (paymentForm) {
      paymentForm.addEventListener('submit', (e) => this.handlePaymentSubmit(e));
    }

    // Copy wallet address buttons
    copyButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const textToCopy = e.target.getAttribute('data-copy');
        this.copyToClipboard(textToCopy);
      });
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
      const modal = document.getElementById('payment-modal');
      if (e.target === modal) {
        this.hidePaymentModal();
      }
    });

    // Listen for user changes from mining app
    document.addEventListener('userUpdated', (e) => {
      this.currentUser = e.detail;
      this.updateTierCards();
    });
  }

  // Update tier cards based on user status
  updateTierCards() {
    const tierCards = document.querySelectorAll('.tier-card');
    
    tierCards.forEach(card => {
      const tier = card.getAttribute('data-tier');
      const button = card.querySelector('.tier-btn');
      
      if (!button) return;

      // Get current user tier
      const currentTier = this.getCurrentUserTier();
      
      if (tier === currentTier) {
        // Current tier
        button.textContent = 'Current Tier';
        button.className = 'tier-btn current-tier';
        button.disabled = true;
      } else if (this.canUpgradeToTier(tier)) {
        // Available upgrade
        button.textContent = `Upgrade to ${tier.charAt(0).toUpperCase() + tier.slice(1)}`;
        button.className = 'tier-btn upgrade-btn';
        button.disabled = false;
        button.setAttribute('data-tier', tier);
      } else {
        // Not available (lower tier than current)
        button.textContent = 'Not Available';
        button.className = 'tier-btn current-tier';
        button.disabled = true;
      }
    });
  }

  // Get current user tier
  getCurrentUserTier() {
    if (!this.currentUser) return 'free';
    return this.currentUser.tier || 'free';
  }

  // Check if user can upgrade to specific tier
  canUpgradeToTier(tier) {
    const currentTier = this.getCurrentUserTier();
    const tierHierarchy = ['free', 'basic', 'pro'];
    const currentIndex = tierHierarchy.indexOf(currentTier);
    const targetIndex = tierHierarchy.indexOf(tier);
    
    return targetIndex > currentIndex;
  }

  // Show payment modal
  showPaymentModal(tier) {
    if (!this.canUpgradeToTier(tier)) {
      this.showToast('You cannot upgrade to this tier', 'error');
      return;
    }

    this.selectedTier = tier;
    const modal = document.getElementById('payment-modal');
    const tierInput = document.getElementById('payment-tier');
    const amountInput = document.getElementById('payment-amount');
    
    if (tierInput) {
      tierInput.value = tier.charAt(0).toUpperCase() + tier.slice(1);
    }
    
    if (amountInput) {
      amountInput.value = `$${this.tierPricing[tier]}`;
    }
    
    if (modal) {
      modal.style.display = 'flex';
    }

    // Clear previous form data
    const paymentForm = document.getElementById('payment-form');
    if (paymentForm) {
      const inputs = paymentForm.querySelectorAll('input:not([readonly]), select');
      inputs.forEach(input => {
        if (input.type !== 'hidden') {
          input.value = '';
        }
      });
    }
  }

  // Hide payment modal
  hidePaymentModal() {
    const modal = document.getElementById('payment-modal');
    if (modal) {
      modal.style.display = 'none';
    }
    this.selectedTier = null;
  }

  // Handle payment form submission
  async handlePaymentSubmit(e) {
    e.preventDefault();
    
    if (!this.selectedTier) {
      this.showToast('No tier selected', 'error');
      return;
    }

    const currency = document.getElementById('payment-currency')?.value;
    const transactionHash = document.getElementById('transaction-hash')?.value;
    const walletAddress = document.getElementById('sender-wallet')?.value;
    
    if (!currency || !transactionHash) {
      this.showToast('Please fill in all required fields', 'error');
      return;
    }

    // Validate transaction hash format
    if (!this.isValidTransactionHash(transactionHash, currency)) {
      this.showToast('Invalid transaction hash format', 'error');
      return;
    }

    try {
      // Get current user
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        this.showToast('Please sign in first', 'error');
        return;
      }

      // Disable submit button
      const submitBtn = e.target.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
      }

      // Submit payment for verification
      const paymentData = {
        tier: this.selectedTier,
        amount: this.tierPricing[this.selectedTier],
        currency: currency,
        transaction_hash: transactionHash,
        wallet_address: walletAddress || null,
        status: 'pending'
      };

      const { data, error } = await this.supabase
        .from('payments')
        .insert({
          user_id: user.id,
          ...paymentData
        })
        .select()
        .single();

      if (error) throw error;

      this.showToast('Payment submitted successfully! We will verify your transaction and upgrade your tier within 24 hours.', 'success');
      this.hidePaymentModal();
      
      // Send notification email (if configured)
      this.notifyPaymentSubmission(paymentData);
      
    } catch (error) {
      console.error('Payment submission error:', error);
      this.showToast(error.message || 'Failed to submit payment. Please try again.', 'error');
    } finally {
      // Re-enable submit button
      const submitBtn = e.target.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Payment';
      }
    }
  }

  // Validate transaction hash format
  isValidTransactionHash(hash, currency) {
    if (!hash || typeof hash !== 'string') return false;
    
    // Remove whitespace
    hash = hash.trim();
    
    // Basic validation based on currency
    switch (currency.toLowerCase()) {
      case 'sol':
      case 'teos':
      case 'usdt':
        // Solana transaction hashes are base58 encoded, typically 87-88 characters
        return /^[1-9A-HJ-NP-Za-km-z]{80,90}$/.test(hash);
      
      case 'pi':
        // Pi Network transaction hashes (adjust pattern as needed)
        return hash.length >= 32 && hash.length <= 128;
      
      default:
        // Generic validation - at least 32 characters, alphanumeric
        return /^[a-zA-Z0-9]{32,}$/.test(hash);
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
      
      this.showToast('Address copied to clipboard!', 'success');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      this.showToast('Failed to copy address. Please copy manually.', 'error');
    }
  }

  // Notify payment submission (placeholder for email/webhook integration)
  async notifyPaymentSubmission(paymentData) {
    try {
      // This could integrate with email service or webhook
      console.log('Payment submitted for verification:', paymentData);
      
      // Example: Send to webhook endpoint
      // fetch('/api/payment-notification', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(paymentData)
      // });
      
    } catch (error) {
      console.error('Failed to send payment notification:', error);
    }
  }

  // Verify payment and upgrade tier (admin function)
  async verifyPaymentAndUpgrade(paymentId, approved = true) {
    try {
      if (!approved) {
        // Reject payment
        const { error } = await this.supabase
          .from('payments')
          .update({
            status: 'failed',
            verified_at: new Date().toISOString()
          })
          .eq('id', paymentId);
        
        if (error) throw error;
        return { success: true, message: 'Payment rejected' };
      }

      // Get payment details
      const { data: payment, error: paymentError } = await this.supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (paymentError) throw paymentError;

      // Update payment status
      const { error: updatePaymentError } = await this.supabase
        .from('payments')
        .update({
          status: 'confirmed',
          verified_at: new Date().toISOString()
        })
        .eq('id', paymentId);

      if (updatePaymentError) throw updatePaymentError;

      // Calculate tier expiration (30 days from now)
      const tierExpiration = new Date();
      tierExpiration.setDate(tierExpiration.getDate() + 30);

      // Update user tier
      const { error: userUpdateError } = await this.supabase
        .from('users')
        .update({
          tier: payment.tier,
          tier_upgraded_at: new Date().toISOString(),
          tier_expires_at: tierExpiration.toISOString()
        })
        .eq('id', payment.user_id);

      if (userUpdateError) throw userUpdateError;

      return { 
        success: true, 
        message: `User upgraded to ${payment.tier} tier successfully` 
      };
      
    } catch (error) {
      console.error('Payment verification error:', error);
      return { 
        success: false, 
        message: error.message || 'Failed to verify payment' 
      };
    }
  }

  // Check for expired tiers (should be run periodically)
  async checkExpiredTiers() {
    try {
      const now = new Date().toISOString();
      
      // Find users with expired tiers
      const { data: expiredUsers, error } = await this.supabase
        .from('users')
        .select('id, tier, tier_expires_at')
        .not('tier', 'eq', 'free')
        .lt('tier_expires_at', now);

      if (error) throw error;

      if (expiredUsers && expiredUsers.length > 0) {
        // Downgrade expired users to free tier
        const userIds = expiredUsers.map(user => user.id);
        
        const { error: downgradeError } = await this.supabase
          .from('users')
          .update({
            tier: 'free',
            tier_expires_at: null
          })
          .in('id', userIds);

        if (downgradeError) throw downgradeError;

        console.log(`Downgraded ${expiredUsers.length} users to free tier`);
      }
      
    } catch (error) {
      console.error('Error checking expired tiers:', error);
    }
  }

  // Get user payment history
  async getUserPaymentHistory(userId) {
    try {
      const { data, error } = await this.supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
      
    } catch (error) {
      console.error('Error fetching payment history:', error);
      return [];
    }
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

// Global upgrade system instance
window.UpgradeSystem = new UpgradeSystem();

// Auto-initialize when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.UpgradeSystem.init();
  });
} else {
  window.UpgradeSystem.init();
}