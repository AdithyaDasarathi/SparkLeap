// Rate limiting utility to prevent API abuse
interface UsageRecord {
  count: number;
  lastReset: Date;
}

class RateLimiter {
  private usage: Map<string, UsageRecord> = new Map();
  private readonly DAILY_LIMIT = 50; // requests per day per user
  private readonly HOURLY_LIMIT = 10; // requests per hour per user
  
  constructor() {
    // Clean up old records every hour
    setInterval(() => this.cleanup(), 60 * 60 * 1000);
  }

  private getUserKey(identifier: string, timeWindow: 'daily' | 'hourly'): string {
    const now = new Date();
    if (timeWindow === 'daily') {
      const day = now.toISOString().split('T')[0]; // YYYY-MM-DD
      return `${identifier}:${day}`;
    } else {
      const hour = now.toISOString().split('T')[0] + ':' + now.getHours();
      return `${identifier}:${hour}`;
    }
  }

  private getUsage(key: string): UsageRecord {
    const record = this.usage.get(key);
    if (!record) {
      return { count: 0, lastReset: new Date() };
    }
    return record;
  }

  private updateUsage(key: string): void {
    const record = this.getUsage(key);
    record.count += 1;
    record.lastReset = new Date();
    this.usage.set(key, record);
  }

  public checkLimit(userIdentifier: string): { allowed: boolean; remaining: number; resetTime: string } {
    // Generate user identifier from IP or session (for demo, using a simple identifier)
    const userId = userIdentifier || 'anonymous';
    
    // Check daily limit
    const dailyKey = this.getUserKey(userId, 'daily');
    const dailyUsage = this.getUsage(dailyKey);
    
    // Check hourly limit
    const hourlyKey = this.getUserKey(userId, 'hourly');
    const hourlyUsage = this.getUsage(hourlyKey);
    
    const dailyExceeded = dailyUsage.count >= this.DAILY_LIMIT;
    const hourlyExceeded = hourlyUsage.count >= this.HOURLY_LIMIT;
    
    if (dailyExceeded) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: tomorrow.toISOString()
      };
    }
    
    if (hourlyExceeded) {
      const nextHour = new Date();
      nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: nextHour.toISOString()
      };
    }
    
    // Update usage counters
    this.updateUsage(dailyKey);
    this.updateUsage(hourlyKey);
    
    return {
      allowed: true,
      remaining: Math.min(
        this.DAILY_LIMIT - (dailyUsage.count + 1),
        this.HOURLY_LIMIT - (hourlyUsage.count + 1)
      ),
      resetTime: ''
    };
  }

  private cleanup(): void {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    for (const [key, record] of this.usage.entries()) {
      if (record.lastReset < oneDayAgo) {
        this.usage.delete(key);
      }
    }
    
    console.log(`🧹 Rate limiter cleanup: ${this.usage.size} active usage records`);
  }

  public getStats(): { totalUsers: number; totalRequests: number } {
    const users = new Set();
    let totalRequests = 0;
    
    for (const [key, record] of this.usage.entries()) {
      const userId = key.split(':')[0];
      users.add(userId);
      totalRequests += record.count;
    }
    
    return {
      totalUsers: users.size,
      totalRequests
    };
  }
}

// Global rate limiter instance
const rateLimiter = new RateLimiter();

export { rateLimiter };
