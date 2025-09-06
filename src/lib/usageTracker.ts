/**
 * UsageTracker - Core freemium system usage tracking with anti-circumvention
 * 
 * This class implements multi-layered usage tracking to prevent users from
 * bypassing the 5 lessons per month limit through various methods.
 */

export interface UsageData {
  userId?: string;
  lessonCount: number;
  remainingLessons: number;
  isOverLimit: boolean;
  subscriptionStatus: 'free' | 'premium';
  canAccess: boolean;
  resetDate: Date;
}

export interface BrowserFingerprint {
  canvas: string;
  screen: string;
  timezone: string;
  language: string;
  platform: string;
  cookieEnabled: boolean;
  localStorage: boolean;
  sessionStorage: boolean;
  webGL: string;
  fonts: string[];
}

export interface TrackingContext {
  fingerprint: BrowserFingerprint;
  fingerprintHash: string;
  ipHash: string;
  userAgent: string;
  sessionId: string;
  timestamp: Date;
}

export class UsageTracker {
  private static instance: UsageTracker;
  private context: TrackingContext | null = null;
  private readonly FREE_LIMIT = 5;
  private readonly ACCOUNT_PROMPT_THRESHOLD = 3; // Show account creation at 3rd lesson
  private readonly PAYWALL_THRESHOLD = 5; // Show paywall at 6th lesson (after limit)

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): UsageTracker {
    if (!UsageTracker.instance) {
      UsageTracker.instance = new UsageTracker();
    }
    return UsageTracker.instance;
  }

  /**
   * Initialize tracking context - call this once per session
   */
  async initialize(): Promise<void> {
    try {
      const fingerprint = await this.getBrowserFingerprint();
      const fingerprintHash = await this.hashString(JSON.stringify(fingerprint));
      const ipHash = await this.getIPHash();
      const sessionId = this.getOrCreateSessionId();

      this.context = {
        fingerprint,
        fingerprintHash,
        ipHash,
        userAgent: navigator.userAgent,
        sessionId,
        timestamp: new Date()
      };

      console.log('🔍 UsageTracker initialized with fingerprint:', fingerprintHash.substring(0, 8));
    } catch (error) {
      console.error('❌ Failed to initialize UsageTracker:', error);
      // Create fallback context
      this.context = {
        fingerprint: this.getBasicFingerprint(),
        fingerprintHash: await this.hashString(Math.random().toString()),
        ipHash: await this.hashString('unknown'),
        userAgent: navigator.userAgent || 'unknown',
        sessionId: this.getOrCreateSessionId(),
        timestamp: new Date()
      };
    }
  }

  /**
   * Generate comprehensive browser fingerprint
   */
  private async getBrowserFingerprint(): Promise<BrowserFingerprint> {
    const canvas = await this.getCanvasFingerprint();
    const webGL = this.getWebGLFingerprint();
    const fonts = await this.getFontFingerprint();

    return {
      canvas,
      screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      localStorage: this.checkLocalStorage(),
      sessionStorage: this.checkSessionStorage(),
      webGL,
      fonts
    };
  }

  /**
   * Generate canvas fingerprint for uniqueness
   */
  private async getCanvasFingerprint(): Promise<string> {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return 'no-canvas';

      canvas.width = 200;
      canvas.height = 50;

      // Draw some complex shapes and text
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('Peabody 🎓 123', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('Lesson Builder', 4, 35);

      // Add some mathematical curves
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = 'rgb(255,0,255)';
      ctx.beginPath();
      ctx.arc(50, 25, 20, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fill();

      return canvas.toDataURL();
    } catch (error) {
      return 'canvas-error';
    }
  }

  /**
   * Generate WebGL fingerprint
   */
  private getWebGLFingerprint(): string {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return 'no-webgl';

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown';
      const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'unknown';

      return `${renderer}_${vendor}`;
    } catch (error) {
      return 'webgl-error';
    }
  }

  /**
   * Detect available fonts for fingerprinting
   */
  private async getFontFingerprint(): Promise<string[]> {
    const testFonts = [
      'Arial', 'Arial Black', 'Arial Narrow', 'Arial Rounded MT Bold',
      'Calibri', 'Cambria', 'Georgia', 'Helvetica', 'Impact', 'Lucida Console',
      'Tahoma', 'Times New Roman', 'Trebuchet MS', 'Verdana', 'Comic Sans MS',
      'Courier New', 'Garamond', 'Palatino', 'Times', 'serif', 'sans-serif', 'monospace'
    ];

    const availableFonts: string[] = [];
    const testString = 'mmmmmmmmmmlli';
    const testSize = '72px';
    const baseFonts = ['monospace', 'sans-serif', 'serif'];

    // Create test elements
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return ['no-fonts'];

    // Test each font
    for (const font of testFonts) {
      let detected = false;
      for (const baseFont of baseFonts) {
        ctx.font = `${testSize} ${baseFont}`;
        const baseWidth = ctx.measureText(testString).width;

        ctx.font = `${testSize} ${font}, ${baseFont}`;
        const testWidth = ctx.measureText(testString).width;

        if (baseWidth !== testWidth) {
          detected = true;
          break;
        }
      }
      if (detected) {
        availableFonts.push(font);
      }
    }

    return availableFonts.slice(0, 10); // Limit to prevent excessive data
  }

  /**
   * Basic fallback fingerprint if advanced methods fail
   */
  private getBasicFingerprint(): BrowserFingerprint {
    return {
      canvas: 'basic',
      screen: `${screen.width}x${screen.height}`,
      timezone: new Date().getTimezoneOffset().toString(),
      language: navigator.language || 'unknown',
      platform: navigator.platform || 'unknown',
      cookieEnabled: navigator.cookieEnabled,
      localStorage: this.checkLocalStorage(),
      sessionStorage: this.checkSessionStorage(),
      webGL: 'basic',
      fonts: ['Arial', 'Times']
    };
  }

  /**
   * Check localStorage availability
   */
  private checkLocalStorage(): boolean {
    try {
      const testKey = '__peabody_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check sessionStorage availability
   */
  private checkSessionStorage(): boolean {
    try {
      const testKey = '__peabody_test__';
      sessionStorage.setItem(testKey, 'test');
      sessionStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get or create session ID for anonymous user tracking
   */
  private getOrCreateSessionId(): string {
    try {
      let sessionId = sessionStorage.getItem('peabody_session_id');
      if (!sessionId) {
        sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('peabody_session_id', sessionId);
      }
      return sessionId;
    } catch {
      return `sess_fallback_${Date.now()}`;
    }
  }

  /**
   * Hash IP address on server side (this is a placeholder)
   * In real implementation, IP hashing happens server-side for privacy
   */
  private async getIPHash(): Promise<string> {
    // This will be handled server-side in the API endpoints
    // Client sends request, server hashes IP
    return 'client_side_placeholder';
  }

  /**
   * SHA-256 hash function
   */
  private async hashString(input: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(input);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback for older browsers
      let hash = 0;
      for (let i = 0; i < input.length; i++) {
        const char = input.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return Math.abs(hash).toString(16);
    }
  }

  /**
   * Check remaining lessons for current user/context
   */
  async getRemainingLessons(userId?: string): Promise<UsageData> {
    if (!this.context) {
      await this.initialize();
    }

    try {
      const response = await fetch('/api/usage/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          fingerprintHash: this.context!.fingerprintHash,
          sessionId: this.context!.sessionId,
          userAgent: this.context!.userAgent
        })
      });

      if (!response.ok) {
        throw new Error(`Usage check failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        userId: data.userId,
        lessonCount: data.lessonCount || 0,
        remainingLessons: Math.max(0, this.FREE_LIMIT - (data.lessonCount || 0)),
        isOverLimit: (data.lessonCount || 0) >= this.FREE_LIMIT,
        subscriptionStatus: data.subscriptionStatus || 'free',
        canAccess: data.canAccess || false,
        resetDate: new Date(data.resetDate || this.getNextMonthStart())
      };
    } catch (error) {
      console.error('❌ Failed to check usage:', error);
      // Return conservative default
      return {
        userId,
        lessonCount: this.FREE_LIMIT,
        remainingLessons: 0,
        isOverLimit: true,
        subscriptionStatus: 'free',
        canAccess: false,
        resetDate: new Date(this.getNextMonthStart())
      };
    }
  }

  /**
   * Track a lesson generation attempt
   */
  async trackLessonGeneration(
    userId?: string, 
    lessonData?: any
  ): Promise<{ success: boolean; shouldShowModal: 'account' | 'paywall' | null; usageData: UsageData }> {
    if (!this.context) {
      await this.initialize();
    }

    try {
      const response = await fetch('/api/usage/increment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          fingerprintHash: this.context!.fingerprintHash,
          sessionId: this.context!.sessionId,
          userAgent: this.context!.userAgent,
          lessonData: lessonData || {},
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = `Failed to read error response: ${e}`;
        }
        console.error('Usage tracking error details:', errorText || `HTTP ${response.status} ${response.statusText}`);
        throw new Error(`Usage tracking failed: ${response.status}${errorText ? ` - ${errorText}` : ''}`);
      }

      const data = await response.json();
      const usageData: UsageData = {
        userId: data.userId,
        lessonCount: data.lessonCount,
        remainingLessons: Math.max(0, this.FREE_LIMIT - data.lessonCount),
        isOverLimit: data.lessonCount >= this.FREE_LIMIT,
        subscriptionStatus: data.subscriptionStatus || 'free',
        canAccess: data.canAccess,
        resetDate: new Date(data.resetDate || this.getNextMonthStart())
      };

      // Determine what modal to show
      let shouldShowModal: 'account' | 'paywall' | null = null;
      
      if (!userId && data.lessonCount >= this.ACCOUNT_PROMPT_THRESHOLD) {
        shouldShowModal = 'account';
      } else if (data.lessonCount > this.FREE_LIMIT && data.subscriptionStatus === 'free') {
        shouldShowModal = 'paywall';
      }

      return {
        success: data.success || false,
        shouldShowModal,
        usageData
      };
    } catch (error) {
      console.error('❌ Failed to track lesson generation:', error);
      
      // Fallback to localStorage for demo/development
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const fallbackKey = `peabody_usage_${currentYear}_${currentMonth}`;
      
      let fallbackCount = parseInt(localStorage.getItem(fallbackKey) || '0');
      fallbackCount = Math.min(fallbackCount + 1, 6); // Cap at 6
      localStorage.setItem(fallbackKey, fallbackCount.toString());
      
      const usageData: UsageData = {
        userId,
        lessonCount: fallbackCount,
        remainingLessons: Math.max(0, this.FREE_LIMIT - fallbackCount),
        isOverLimit: fallbackCount > this.FREE_LIMIT,
        subscriptionStatus: 'free',
        canAccess: fallbackCount <= this.FREE_LIMIT,
        resetDate: new Date(this.getNextMonthStart())
      };

      let shouldShowModal: 'account' | 'paywall' | null = null;
      if (!userId && fallbackCount >= this.ACCOUNT_PROMPT_THRESHOLD) {
        shouldShowModal = 'account';
      } else if (fallbackCount > this.FREE_LIMIT) {
        shouldShowModal = 'paywall';
      }

      // CRITICAL FIX: Fallback should be restrictive to prevent bypass
      // Only allow generation if clearly under limit, otherwise block to be safe
      const allowGeneration = fallbackCount < this.FREE_LIMIT;
      
      return {
        success: allowGeneration,
        shouldShowModal: !allowGeneration ? 'paywall' : shouldShowModal,
        usageData
      };
    }
  }

  /**
   * Check if user should see account creation prompt
   */
  shouldPromptForAccount(usageData: UsageData): boolean {
    return !usageData.userId && usageData.lessonCount >= this.ACCOUNT_PROMPT_THRESHOLD;
  }

  /**
   * Check if user has hit the paywall
   */
  shouldShowPaywall(usageData: UsageData): boolean {
    return usageData.subscriptionStatus === 'free' && usageData.isOverLimit;
  }

  /**
   * Get the start of next month for reset date
   */
  private getNextMonthStart(): number {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.getTime();
  }

  /**
   * Reset monthly usage (typically called by server cron job)
   */
  async resetMonthlyCounts(): Promise<boolean> {
    try {
      const response = await fetch('/api/usage/reset-monthly', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      return response.ok;
    } catch (error) {
      console.error('❌ Failed to reset monthly counts:', error);
      return false;
    }
  }

  /**
   * Get analytics data for admin dashboard
   */
  async getAnalytics(adminToken?: string): Promise<any> {
    try {
      const response = await fetch('/api/admin/analytics', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Failed to get analytics:', error);
      return null;
    }
  }

  /**
   * Clear tracking data (for testing/development)
   */
  clearTrackingData(): void {
    try {
      sessionStorage.removeItem('peabody_session_id');
      localStorage.removeItem('peabody_usage_cache');
      this.context = null;
    } catch (error) {
      console.warn('Failed to clear tracking data:', error);
    }
  }

  /**
   * Get current tracking context (for debugging)
   */
  getTrackingContext(): TrackingContext | null {
    return this.context;
  }
}

// Export singleton instance
export const usageTracker = UsageTracker.getInstance();

// Analytics events helper
export const trackAnalyticsEvent = async (
  eventName: string,
  properties: Record<string, any> = {},
  userId?: string
): Promise<void> => {
  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventName,
        properties,
        userId,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        referrer: document.referrer
      })
    });
  } catch (error) {
    console.warn('Analytics tracking failed:', error);
  }
};