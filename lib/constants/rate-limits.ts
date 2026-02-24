/**
 * Rate Limiting Constants for FloMCP
 * 
 * Defines generation limits for each tier to control costs
 * 
 * FREE TIER ECONOMICS:
 * - 2 generations/month max
 * - Cost to founder: ~$0.20/user/month (assuming $0.10 per generation)
 * - With 100 free users: $20/month total cost
 * - With 1000 free users: $200/month total cost
 * 
 * PRO TIER ECONOMICS:
 * - Unlimited generations
 * - $29/month subscription
 * - Break-even at ~290 generations/month
 * - Typical usage: 50-100 generations/month
 * 
 * Created: February 23, 2026
 */

export interface RateLimitConfig {
  perMonth: number;           // Total generations per month
  perDay: number;             // Max generations per day (prevents burning all monthly in one day)
  perHour: number;            // Max generations per hour (prevents spam)
  cooldownMs: number;         // Milliseconds to wait between generations
  displayName: string;        // User-facing tier name
  costPerGeneration: number;  // Average cost to founder (USD)
}

/**
 * Rate limit definitions for each tier
 */
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  free: {
    perMonth: 2,                          // 2 generations total per month
    perDay: 1,                            // Can't use both in same day
    perHour: 1,                           // 1 per hour max
    cooldownMs: 60 * 60 * 1000,          // 1 hour cooldown (3,600,000 ms)
    displayName: 'Free',
    costPerGeneration: 0.10               // ~$0.10 per generation
  },
  
  pro: {
    perMonth: Infinity,                   // Unlimited
    perDay: 50,                           // Reasonable daily limit (prevents abuse)
    perHour: 10,                          // 10 per hour max (prevents rapid spam)
    cooldownMs: 60 * 1000,               // 1 minute cooldown (60,000 ms)
    displayName: 'Pro',
    costPerGeneration: 0.10               // Same cost, but user pays $29/month
  },
  
  enterprise: {
    perMonth: Infinity,                   // Unlimited
    perDay: 200,                          // Higher daily limit
    perHour: 50,                          // Higher hourly limit
    cooldownMs: 0,                        // No cooldown
    displayName: 'Enterprise',
    costPerGeneration: 0.10               // Same cost, but user pays custom price
  }
};

/**
 * Get rate limit configuration for a tier
 */
export function getRateLimitForTier(tier: string): RateLimitConfig {
  return RATE_LIMITS[tier] || RATE_LIMITS.free;
}

/**
 * Format cooldown time remaining in human-readable format
 * 
 * @param milliseconds - Time remaining in milliseconds
 * @returns Formatted string like "47m 23s" or "1h 15m" or "23s"
 */
export function formatCooldownTime(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 
      ? `${hours}h ${remainingMinutes}m` 
      : `${hours}h`;
  }
  
  if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 
      ? `${minutes}m ${remainingSeconds}s` 
      : `${minutes}m`;
  }
  
  return `${seconds}s`;
}

/**
 * Calculate when user can generate next (based on cooldown)
 * 
 * @param lastGenerationAt - Timestamp of last generation
 * @param tier - User's tier
 * @returns Date when user can generate again, or null if can generate now
 */
export function getNextAvailableTime(
  lastGenerationAt: Date | null, 
  tier: string
): Date | null {
  if (!lastGenerationAt) return null;
  
  const config = getRateLimitForTier(tier);
  if (config.cooldownMs === 0) return null;
  
  const cooldownUntil = new Date(lastGenerationAt.getTime() + config.cooldownMs);
  const now = new Date();
  
  return cooldownUntil > now ? cooldownUntil : null;
}

/**
 * Check if user is in cooldown period
 * 
 * @param lastGenerationAt - Timestamp of last generation
 * @param tier - User's tier
 * @returns True if user must wait, false if can generate now
 */
export function isInCooldown(
  lastGenerationAt: Date | null, 
  tier: string
): boolean {
  return getNextAvailableTime(lastGenerationAt, tier) !== null;
}

/**
 * Get time remaining in cooldown (milliseconds)
 * 
 * @param cooldownUntil - Timestamp when cooldown ends
 * @returns Milliseconds remaining, or 0 if cooldown expired
 */
export function getCooldownRemaining(cooldownUntil: Date | null): number {
  if (!cooldownUntil) return 0;
  
  const now = new Date();
  const remaining = cooldownUntil.getTime() - now.getTime();
  
  return remaining > 0 ? remaining : 0;
}

/**
 * Tier pricing (for display on pricing page)
 */
export const TIER_PRICING = {
  free: {
    price: 0,
    priceMonthly: 0,
    generations: 2,
    features: [
      '2 MCP generations per month',
      'Full security validation',
      'Download as ZIP',
      'Basic support',
      '1 hour cooldown between generations'
    ]
  },
  
  pro: {
    price: 29,
    priceMonthly: 29,
    generations: 'Unlimited',
    features: [
      'Unlimited MCP generations',
      'Full security validation',
      'Download as ZIP',
      'Priority support',
      '1 minute cooldown',
      'API access',
      'Custom integrations'
    ]
  },
  
  enterprise: {
    price: 'Custom',
    priceMonthly: 'Custom',
    generations: 'Unlimited',
    features: [
      'Everything in Pro',
      'No cooldown',
      'Dedicated support',
      'Custom security rules',
      'Private deployment option',
      'SLA guarantee',
      'Custom integrations'
    ]
  }
};

/**
 * Disposable email domains (blocked during signup)
 * 
 * These domains are commonly used for temporary/fake accounts
 * Blocking them reduces abuse and improves user quality
 */
export const DISPOSABLE_EMAIL_DOMAINS = [
  // Popular temporary email services
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'mailinator.com',
  'throwaway.email',
  'maildrop.cc',
  'temp-mail.org',
  'fakeinbox.com',
  'getnada.com',
  'trashmail.com',
  
  // More temporary services
  'yopmail.com',
  'temp-mail.io',
  'mohmal.com',
  'emailondeck.com',
  'mintemail.com',
  'mytemp.email',
  'tempail.com',
  'dispostable.com',
  
  // Ad-hoc domains
  'spam4.me',
  'privaterelay.appleid.com',  // Apple private relay (controversial, but often abused)
];

/**
 * Check if email is from a disposable domain
 * 
 * @param email - Email address to check
 * @returns True if email is from disposable domain
 */
export function isDisposableEmail(email: string): boolean {
  const domain = email.toLowerCase().split('@')[1];
  return DISPOSABLE_EMAIL_DOMAINS.includes(domain);
}

/**
 * Suspicious keywords that trigger content filtering
 * 
 * These keywords in MCP descriptions trigger manual review
 * Helps prevent malware, hacking tools, and policy violations
 */
export const SUSPICIOUS_KEYWORDS = {
  malware: [
    'keylogger', 'backdoor', 'trojan', 'virus', 'malware',
    'ransomware', 'cryptominer', 'botnet', 'rootkit'
  ],
  
  hacking: [
    'sql injection', 'xss', 'csrf', 'rce', 'exploit',
    'vulnerability scanner', 'password cracker', 'brute force',
    'ddos', 'dos attack', 'port scanner'
  ],
  
  privacy: [
    'steal credentials', 'scrape emails', 'data breach',
    'hack account', 'bypass authentication', 'steal data'
  ],
  
  crypto: [
    'mining script', 'crypto miner', 'mine bitcoin',
    'mine ethereum', 'hidden miner'
  ]
};

/**
 * Check if MCP description contains suspicious keywords
 * 
 * @param description - MCP description text
 * @returns Object with matched categories and keywords
 */
export function checkSuspiciousContent(description: string): {
  suspicious: boolean;
  categories: string[];
  keywords: string[];
} {
  const lowerDescription = description.toLowerCase();
  const matched: { categories: string[]; keywords: string[] } = {
    categories: [],
    keywords: []
  };
  
  for (const [category, keywords] of Object.entries(SUSPICIOUS_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerDescription.includes(keyword)) {
        if (!matched.categories.includes(category)) {
          matched.categories.push(category);
        }
        matched.keywords.push(keyword);
      }
    }
  }
  
  return {
    suspicious: matched.keywords.length > 0,
    ...matched
  };
}
