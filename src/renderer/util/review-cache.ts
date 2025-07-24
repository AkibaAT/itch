/**
 * Review data caching utility for the desktop client.
 * This handles caching of review data from fvn.li API with 6+ hour expiration.
 */

export interface ReviewData {
  total_reviews: number;
  average_rating: number | null;
  rating_distribution: {
    [key: string]: {
      count: number;
      percentage: number;
    };
  };
  recent_reviews: Array<{
    id: number;
    rating: number;
    review: string;
    published_at: string;
    rater: {
      id: number;
      name: string;
    };
  }>;
}

export interface CachedReviewData {
  data: ReviewData;
  timestamp: number;
  gameId?: number;
  url?: string;
}

export interface ReviewApiResponse {
  success: boolean;
  has_reviews: boolean;
  review_data: ReviewData | null;
  game: {
    id: number;
    name: string;
    url: string;
    slug: string;
  };
}

const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
const CACHE_KEY_PREFIX = "fvn_reviews_";
const API_BASE_URL = "https://fvn.li/api";

export class ReviewCache {
  private static instance: ReviewCache;

  private constructor() {}

  public static getInstance(): ReviewCache {
    if (!ReviewCache.instance) {
      ReviewCache.instance = new ReviewCache();
    }
    return ReviewCache.instance;
  }

  /**
   * Get a cache key for a game based on available identifiers
   */
  private getCacheKey(
    gameId?: number,
    url?: string,
    itchGameId?: number
  ): string {
    if (gameId) {
      return `${CACHE_KEY_PREFIX}game_${gameId}`;
    }
    if (itchGameId) {
      return `${CACHE_KEY_PREFIX}itch_${itchGameId}`;
    }
    if (url) {
      // Normalize URL for consistent caching
      const normalizedUrl = url
        .toLowerCase()
        .replace(/^https?:\/\/(www\.)?/, "")
        .replace(/\/$/, "");
      return `${CACHE_KEY_PREFIX}url_${btoa(normalizedUrl)}`;
    }
    throw new Error(
      "At least one identifier (gameId, url, or itchGameId) must be provided"
    );
  }

  /**
   * Check if cached data is still valid
   */
  private isValidCache(cachedData: CachedReviewData): boolean {
    const now = Date.now();
    return now - cachedData.timestamp < CACHE_DURATION;
  }

  /**
   * Get cached review data if available and valid
   */
  public getCachedReviews(
    gameId?: number,
    url?: string,
    itchGameId?: number
  ): ReviewData | null {
    try {
      const cacheKey = this.getCacheKey(gameId, url, itchGameId);
      const cachedJson = localStorage.getItem(cacheKey);

      if (!cachedJson) {
        return null;
      }

      const cachedData: CachedReviewData = JSON.parse(cachedJson);

      if (!this.isValidCache(cachedData)) {
        // Remove expired cache
        localStorage.removeItem(cacheKey);
        return null;
      }

      return cachedData.data;
    } catch (error) {
      console.warn("Error reading review cache:", error);
      return null;
    }
  }

  /**
   * Store review data in cache
   */
  public setCachedReviews(
    data: ReviewData,
    gameId?: number,
    url?: string,
    itchGameId?: number
  ): void {
    try {
      const cacheKey = this.getCacheKey(gameId, url, itchGameId);
      const cachedData: CachedReviewData = {
        data,
        timestamp: Date.now(),
        gameId,
        url,
      };

      localStorage.setItem(cacheKey, JSON.stringify(cachedData));
    } catch (error) {
      console.warn("Error storing review cache:", error);
    }
  }

  /**
   * Fetch review data from API
   */
  public async fetchReviewData(
    gameId?: number,
    url?: string,
    itchGameId?: number
  ): Promise<ReviewData | null> {
    try {
      const params = new URLSearchParams();

      if (gameId) {
        params.append("game_id", gameId.toString());
      }
      if (url) {
        params.append("url", url);
      }
      if (itchGameId) {
        params.append("itch_game_id", itchGameId.toString());
      }

      const response = await fetch(
        `${API_BASE_URL}/game-reviews?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const apiResponse: ReviewApiResponse = await response.json();

      if (
        !apiResponse.success ||
        !apiResponse.has_reviews ||
        !apiResponse.review_data
      ) {
        return null;
      }

      // Cache the successful response
      this.setCachedReviews(
        apiResponse.review_data,
        apiResponse.game.id,
        apiResponse.game.url,
        itchGameId
      );

      return apiResponse.review_data;
    } catch (error) {
      console.error("Error fetching review data:", error);
      return null;
    }
  }

  /**
   * Get review data with caching - checks cache first, then fetches if needed
   */
  public async getReviewData(
    gameId?: number,
    url?: string,
    itchGameId?: number
  ): Promise<ReviewData | null> {
    // Try cache first
    const cachedData = this.getCachedReviews(gameId, url, itchGameId);
    if (cachedData) {
      return cachedData;
    }

    // Fetch from API if not in cache or expired
    return await this.fetchReviewData(gameId, url, itchGameId);
  }

  /**
   * Clear all cached review data
   */
  public clearCache(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(CACHE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn("Error clearing review cache:", error);
    }
  }

  /**
   * Clear expired cache entries
   */
  public clearExpiredCache(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(CACHE_KEY_PREFIX)) {
          try {
            const cachedJson = localStorage.getItem(key);
            if (cachedJson) {
              const cachedData: CachedReviewData = JSON.parse(cachedJson);
              if (!this.isValidCache(cachedData)) {
                localStorage.removeItem(key);
              }
            }
          } catch (error) {
            // Remove corrupted cache entries
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.warn("Error clearing expired cache:", error);
    }
  }
}

// Export singleton instance
export const reviewCache = ReviewCache.getInstance();
