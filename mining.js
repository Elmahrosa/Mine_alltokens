// TEOS Egypt Mining Portal - Core Mining Logic
// Handles user authentication, civic verification, and tiered mining

class MiningApp {
  constructor() {
    this.supabase = null;
    this.currentUser = null;
    this.userBalances = {};
    this.miningTimer = null;
    this.isInitialized = false;
  }

  // Initialize the mining application
  async init() {
    if (this.isInitialized) return;
    
    try {
      // Initialize Supabase
      this.supabase = window.supabase.createClient(
        'YOUR_SUPABASE_URL', // Replace with your Supabase URL
        'YOUR_SUPABASE_ANON_KEY' // Replace with your Supabase anon key
      );

      // Check for existing session
      const { data: { session } } = await this.supabase.auth.getSession();
      if (session) {
        await this.handleUserSession(session.user);
      }

      // Listen for auth changes
      this.supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await this.handleUserSession(session.user);
        } else if (event === 'SIGNED_OUT') {
          this.handleSignOut();
        }
      });

      // Set up event listeners
      this.setupEventListeners();
      
      // Check for referral code in URL
      this.checkReferralCode();
      
      // Start mining timer
      this.startMiningTimer();
      
      this.isInitialized = true;
      console.log('TEOS Mining App initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize mining app:', error);
      this.showToast('Failed to initialize app. Please refresh the page.', 'error');
    }
  }

  // Set up event listeners
  setupEventListeners() {
    // Auth modal controls
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const closeAuthModal = document.getElementById('close-auth-modal');
    const authSwitchLink = document.getElementById('auth-switch-link');
    const authForm = document.getElementById('auth-form');
    const mineBtn = document.getElementById('mine-btn');

    if (loginBtn) loginBtn.addEventListener('click', () => this.showAuthModal('login'));
    if (signupBtn) signupBtn.addEventListener('click', () => this.showAuthModal('signup'));
    if (logoutBtn) logoutBtn.addEventListener('click', () => this.signOut());
    if (closeAuthModal) closeAuthModal.addEventListener('click', () => this.hideAuthModal());
    if (authSwitchLink) authSwitchLink.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggleAuthMode();
    });
    if (authForm) authForm.addEventListener('submit', (e) => this.handleAuthSubmit(e));
    if (mineBtn) mineBtn.addEventListener('click', () => this.executeMining());

    // Civic verification buttons
    const verifyButtons = document.querySelectorAll('.verify-btn');
    verifyButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const step = e.target.getAttribute('data-step');
        this.verifyCivicStep(step);
      });
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
      const modal = document.getElementById('auth-modal');
      if (e.target === modal) {
        this.hideAuthModal();
      }
    });
  }

  // Check for referral code in URL parameters
  checkReferralCode() {
    const urlParams = new URLSearchParams(window.location.search);
    const referralCode = urlParams.get('ref');
    if (referralCode) {
      localStorage.setItem('pendingReferralCode', referralCode);
      this.showToast(`Referral code ${referralCode} detected! Sign up to get your bonus.`, 'success');
    }
  }

  // Handle user session
  async handleUserSession(user) {
    try {
      this.currentUser = user;
      
      // Get user profile from database
      const { data: userProfile, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // If user profile doesn't exist, create it
      if (!userProfile) {
        await this.createUserProfile(user);
        return;
      }

      this.currentUser = { ...user, ...userProfile };
      
      // Update UI
      this.updateUserInterface();
      
      // Load user balances
      await this.loadUserBalances();
      
      // Update mining button state
      this.updateMiningButtonState();
      
    } catch (error) {
      console.error('Error handling user session:', error);
      this.showToast('Error loading user data. Please try refreshing.', 'error');
    }
  }

  // Create user profile
  async createUserProfile(user) {
    try {
      const pendingReferralCode = localStorage.getItem('pendingReferralCode');
      let referrerId = null;

      // Check if referral code is valid
      if (pendingReferralCode) {
        const { data: referrer } = await this.supabase
          .from('users')
          .select('id')
          .eq('referral_code', pendingReferralCode)
          .single();
        
        if (referrer) {
          referrerId = referrer.id;
          localStorage.removeItem('pendingReferralCode');
        }
      }

      // Generate unique referral code
      const referralCode = this.generateReferralCode();
      
      // Create user profile
      const { data, error } = await this.supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          referral_code: referralCode,
          referred_by: referrerId
        })
        .select()
        .single();

      if (error) throw error;

      // Create referral record if referred
      if (referrerId) {
        await this.supabase
          .from('referrals')
          .insert({
            referrer_id: referrerId,
            referred_id: user.id,
            status: 'active'
          });

        // Update referrer's total referrals
        await this.supabase.rpc('increment', {
          table_name: 'users',
          column_name: 'total_referrals',
          id: referrerId
        });
      }

      // Initialize user balances
      const tokens = ['TEOS', 'TUT', 'ERT'];
      const balanceInserts = tokens.map(token => ({
        user_id: user.id,
        token_symbol: token,
        balance: 0
      }));

      await this.supabase
        .from('user_balances')
        .insert(balanceInserts);

      this.currentUser = { ...user, ...data };
      this.updateUserInterface();
      await this.loadUserBalances();
      
      this.showToast('Welcome to TEOS Egypt! Complete civic verification to start mining.', 'success');
      
    } catch (error) {
      console.error('Error creating user profile:', error);
      this.showToast('Error creating user profile. Please try again.', 'error');
    }
  }

  // Generate referral code
  generateReferralCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'TEOS';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Update user interface based on login state
  updateUserInterface() {
    const userInfo = document.getElementById('user-info');
    const authButtons = document.getElementById('auth-buttons');
    const userEmail = document.getElementById('user-email');
    const userTier = document.getElementById('user-tier');
    const civicSection = document.getElementById('civic-section');
    const miningSection = document.getElementById('mining-section');
    const referralSection = document.getElementById('referral-section');

    if (this.currentUser) {
      // Show user info, hide auth buttons
      if (userInfo) userInfo.style.display = 'flex';
      if (authButtons) authButtons.style.display = 'none';
      
      // Update user info
      if (userEmail) userEmail.textContent = this.currentUser.email;
      if (userTier) {
        userTier.textContent = this.currentUser.tier?.toUpperCase() || 'FREE';
        userTier.className = `tier-badge tier-${this.currentUser.tier || 'free'}`;
      }

      // Show appropriate sections
      if (this.currentUser.civic_verified) {
        if (civicSection) civicSection.style.display = 'none';
        if (miningSection) miningSection.style.display = 'block';
        if (referralSection) referralSection.style.display = 'block';
        this.updateMiningRewards();
      } else {
        if (civicSection) civicSection.style.display = 'block';
        if (miningSection) miningSection.style.display = 'none';
        this.updateCivicProgress();
      }
    } else {
      // Show auth buttons, hide user info
      if (userInfo) userInfo.style.display = 'none';
      if (authButtons) authButtons.style.display = 'flex';
      
      // Hide user sections
      if (civicSection) civicSection.style.display = 'none';
      if (miningSection) miningSection.style.display = 'none';
      if (referralSection) referralSection.style.display = 'none';
    }
  }

  // Update civic verification progress
  updateCivicProgress() {
    if (!this.currentUser) return;

    const steps = ['petition_signed', 'telegram_joined', 'facebook_followed', 'x_followed'];
    let completedSteps = 0;

    steps.forEach(step => {
      const stepElement = document.querySelector(`[data-step="${step}"]`);
      const statusElement = stepElement?.querySelector('.step-status');
      const verifyBtn = stepElement?.querySelector('.verify-btn');
      
      if (this.currentUser[step]) {
        stepElement?.classList.add('completed');
        if (statusElement) statusElement.textContent = '✅';
        if (verifyBtn) verifyBtn.style.display = 'none';
        completedSteps++;
      } else {
        stepElement?.classList.remove('completed');
        if (statusElement) statusElement.textContent = '⏳';
        if (verifyBtn) verifyBtn.style.display = 'inline-block';
      }
    });

    // Show completion message if all steps done
    const civicComplete = document.getElementById('civic-complete');
    if (completedSteps === steps.length) {
      if (civicComplete) civicComplete.style.display = 'block';
      
      // Update civic_verified status
      this.updateCivicVerificationStatus();
    } else {
      if (civicComplete) civicComplete.style.display = 'none';
    }
  }

  // Update civic verification status in database
  async updateCivicVerificationStatus() {
    if (!this.currentUser) return;

    try {
      const { error } = await this.supabase
        .from('users')
        .update({
          civic_verified: true,
          civic_verified_at: new Date().toISOString()
        })
        .eq('id', this.currentUser.id);

      if (error) throw error;

      this.currentUser.civic_verified = true;
      this.currentUser.civic_verified_at = new Date().toISOString();
      
      this.showToast('🎉 Civic verification completed! You can now start mining!', 'success');
      
      // Update interface
      setTimeout(() => {
        this.updateUserInterface();
      }, 2000);
      
    } catch (error) {
      console.error('Error updating civic verification:', error);
    }
  }

  // Verify a civic step
  async verifyCivicStep(stepId) {
    if (!this.currentUser) return;

    try {
      const { error } = await this.supabase
        .from('users')
        .update({ [stepId]: true })
        .eq('id', this.currentUser.id);

      if (error) throw error;

      this.currentUser[stepId] = true;
      this.updateCivicProgress();
      
      this.showToast(`✅ Step verified! ${4 - Object.keys(this.currentUser).filter(key => 
        ['petition_signed', 'telegram_joined', 'facebook_followed', 'x_followed'].includes(key) && 
        this.currentUser[key]
      ).length} steps remaining.`, 'success');
      
    } catch (error) {
      console.error('Error verifying civic step:', error);
      this.showToast('Error verifying step. Please try again.', 'error');
    }
  }

  // Load user balances
  async loadUserBalances() {
    if (!this.currentUser) return;

    try {
      const { data, error } = await this.supabase
        .from('user_balances')
        .select('*')
        .eq('user_id', this.currentUser.id);

      if (error) throw error;

      // Convert to object for easy access
      this.userBalances = {};
      data.forEach(balance => {
        this.userBalances[balance.token_symbol] = balance.balance;
      });

      // Update UI
      this.updateBalanceDisplay();
      
    } catch (error) {
      console.error('Error loading user balances:', error);
    }
  }

  // Update balance display
  updateBalanceDisplay() {
    const teosBalance = document.getElementById('teos-balance');
    const tutBalance = document.getElementById('tut-balance');
    const ertBalance = document.getElementById('ert-balance');

    if (teosBalance) teosBalance.textContent = this.formatNumber(this.userBalances.TEOS || 0);
    if (tutBalance) tutBalance.textContent = this.formatNumber(this.userBalances.TUT || 0);
    if (ertBalance) ertBalance.textContent = this.formatNumber(this.userBalances.ERT || 0);
  }

  // Update mining rewards display
  updateMiningRewards() {
    if (!this.currentUser) return;

    const tier = this.currentUser.tier || 'free';
    const rewards = this.getMiningRewards(tier);
    
    const currentTierElement = document.getElementById('current-tier');
    const teosReward = document.getElementById('teos-reward');
    const tutReward = document.getElementById('tut-reward');
    const ertReward = document.getElementById('ert-reward');

    if (currentTierElement) currentTierElement.textContent = tier.charAt(0).toUpperCase() + tier.slice(1);
    if (teosReward) teosReward.textContent = rewards.TEOS;
    if (tutReward) tutReward.textContent = rewards.TUT;
    if (ertReward) ertReward.textContent = rewards.ERT;
  }

  // Get mining rewards based on tier
  getMiningRewards(tier) {
    const rewards = {
      free: { TEOS: 12, TUT: 6, ERT: 3 },
      basic: { TEOS: 24, TUT: 12, ERT: 6 },
      pro: { TEOS: 36, TUT: 18, ERT: 9 }
    };
    return rewards[tier] || rewards.free;
  }

  // Start mining timer
  startMiningTimer() {
    // Update mining button state every minute
    this.miningTimer = setInterval(() => {
      this.updateMiningButtonState();
    }, 60000); // 1 minute

    // Initial update
    this.updateMiningButtonState();
  }

  // Update mining button state
  async updateMiningButtonState() {
    if (!this.currentUser || !this.currentUser.civic_verified) return;

    const mineBtn = document.getElementById('mine-btn');
    const nextMineTime = document.getElementById('next-mine-time');
    
    if (!mineBtn || !nextMineTime) return;

    const canMine = await this.canUserMine();
    
    if (canMine) {
      mineBtn.disabled = false;
      mineBtn.querySelector('.mine-text').textContent = 'Mine Tokens';
      nextMineTime.textContent = 'Ready!';
    } else {
      mineBtn.disabled = true;
      mineBtn.querySelector('.mine-text').textContent = 'Mining Cooldown';
      
      const timeLeft = this.getTimeUntilNextMine();
      nextMineTime.textContent = timeLeft;
    }
  }

  // Check if user can mine
  async canUserMine() {
    if (!this.currentUser) return false;

    if (!this.currentUser.last_mine_at) return true;

    const lastMine = new Date(this.currentUser.last_mine_at);
    const now = new Date();
    const timeDiff = now.getTime() - lastMine.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    return hoursDiff >= 24;
  }

  // Get time until next mine
  getTimeUntilNextMine() {
    if (!this.currentUser || !this.currentUser.last_mine_at) return 'Ready!';

    const lastMine = new Date(this.currentUser.last_mine_at);
    const nextMine = new Date(lastMine.getTime() + (24 * 60 * 60 * 1000));
    const now = new Date();

    if (now >= nextMine) return 'Ready!';

    const timeLeft = nextMine.getTime() - now.getTime();
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  }

  // Execute mining
  async executeMining() {
    if (!this.currentUser || !this.currentUser.civic_verified) {
      this.showToast('Complete civic verification first!', 'error');
      return;
    }

    const canMine = await this.canUserMine();
    if (!canMine) {
      this.showToast('Mining cooldown active. Please wait.', 'warning');
      return;
    }

    try {
      // Show mining animation
      const mineBtn = document.getElementById('mine-btn');
      if (mineBtn) {
        mineBtn.disabled = true;
        mineBtn.querySelector('.mine-text').textContent = 'Mining...';
      }

      // Execute mining via database function
      const { data, error } = await this.supabase.rpc('execute_mining', {
        user_uuid: this.currentUser.id
      });

      if (error) throw error;

      if (data.success) {
        // Update user data
        this.currentUser.last_mine_at = new Date().toISOString();
        this.currentUser.total_mines = (this.currentUser.total_mines || 0) + 1;
        
        // Update balances
        this.userBalances.TEOS = (this.userBalances.TEOS || 0) + data.mined.TEOS;
        this.userBalances.TUT = (this.userBalances.TUT || 0) + data.mined.TUT;
        this.userBalances.ERT = (this.userBalances.ERT || 0) + data.mined.ERT;
        
        // Update UI
        this.updateBalanceDisplay();
        this.updateMiningButtonState();
        
        this.showToast(`🎉 Mining successful! Earned ${data.mined.TEOS} TEOS, ${data.mined.TUT} TUT, ${data.mined.ERT} ERT`, 'success');
      } else {
        throw new Error(data.error || 'Mining failed');
      }
      
    } catch (error) {
      console.error('Mining error:', error);
      this.showToast(error.message || 'Mining failed. Please try again.', 'error');
      
      // Reset button
      const mineBtn = document.getElementById('mine-btn');
      if (mineBtn) {
        mineBtn.disabled = false;
        mineBtn.querySelector('.mine-text').textContent = 'Mine Tokens';
      }
    }
  }

  // Show auth modal
  showAuthModal(mode = 'login') {
    const modal = document.getElementById('auth-modal');
    const title = document.getElementById('auth-modal-title');
    const submitBtn = document.getElementById('auth-submit');
    const switchText = document.getElementById('auth-switch-text');
    const switchLink = document.getElementById('auth-switch-link');
    const referralGroup = document.getElementById('referral-group');
    
    if (mode === 'login') {
      if (title) title.textContent = 'Welcome Back';
      if (submitBtn) submitBtn.textContent = 'Sign In';
      if (switchText) switchText.textContent = "Don't have an account?";
      if (switchLink) switchLink.textContent = 'Sign up here';
      if (referralGroup) referralGroup.style.display = 'none';
    } else {
      if (title) title.textContent = 'Join TEOS Egypt';
      if (submitBtn) submitBtn.textContent = 'Sign Up';
      if (switchText) switchText.textContent = 'Already have an account?';
      if (switchLink) switchLink.textContent = 'Sign in here';
      if (referralGroup) referralGroup.style.display = 'block';
      
      // Pre-fill referral code if available
      const referralCode = localStorage.getItem('pendingReferralCode');
      const referralInput = document.getElementById('referral-code');
      if (referralCode && referralInput) {
        referralInput.value = referralCode;
      }
    }
    
    if (modal) modal.style.display = 'flex';
    
    // Focus email input
    const emailInput = document.getElementById('email');
    if (emailInput) {
      setTimeout(() => emailInput.focus(), 100);
    }
  }

  // Hide auth modal
  hideAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.style.display = 'none';
    
    // Clear form
    const authForm = document.getElementById('auth-form');
    if (authForm) authForm.reset();
  }

  // Toggle auth mode
  toggleAuthMode() {
    const submitBtn = document.getElementById('auth-submit');
    const currentMode = submitBtn?.textContent === 'Sign In' ? 'login' : 'signup';
    const newMode = currentMode === 'login' ? 'signup' : 'login';
    this.showAuthModal(newMode);
  }

  // Handle auth form submission
  async handleAuthSubmit(e) {
    e.preventDefault();
    
    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;
    const referralCode = document.getElementById('referral-code')?.value;
    const submitBtn = document.getElementById('auth-submit');
    const isSignup = submitBtn?.textContent === 'Sign Up';
    
    if (!email || !password) {
      this.showToast('Please fill in all fields', 'error');
      return;
    }

    try {
      // Disable submit button
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = isSignup ? 'Signing Up...' : 'Signing In...';
      }

      if (isSignup) {
        // Store referral code for after signup
        if (referralCode) {
          localStorage.setItem('pendingReferralCode', referralCode);
        }
        
        const { error } = await this.supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        this.showToast('Account created! Please check your email to verify your account.', 'success');
        this.hideAuthModal();
      } else {
        const { error } = await this.supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        this.hideAuthModal();
      }
      
    } catch (error) {
      console.error('Auth error:', error);
      this.showToast(error.message || 'Authentication failed', 'error');
    } finally {
      // Re-enable submit button
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = isSignup ? 'Sign Up' : 'Sign In';
      }
    }
  }

  // Sign out
  async signOut() {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Sign out error:', error);
      this.showToast('Error signing out', 'error');
    }
  }

  // Handle sign out
  handleSignOut() {
    this.currentUser = null;
    this.userBalances = {};
    this.updateUserInterface();
    this.showToast('Signed out successfully', 'success');
  }

  // Show toast notification
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 5000);
  }

  // Format number for display
  formatNumber(num) {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  }

  // Cleanup
  destroy() {
    if (this.miningTimer) {
      clearInterval(this.miningTimer);
      this.miningTimer = null;
    }
    this.isInitialized = false;
  }
}

// Global mining app instance
window.MiningApp = new MiningApp();

// Auto-initialize when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.MiningApp.init();
  });
} else {
  window.MiningApp.init();
}