import { useEffect, useState } from "react";
import { reviewCache, ReviewData } from "renderer/util/review-cache";
import { gameUrlParser, GameIdentifiers } from "renderer/util/game-url-parser";

interface UseGameReviewsResult {
  reviewData: ReviewData | null;
  loading: boolean;
  error: string | null;
  hasReviews: boolean;
}

/**
 * Hook to fetch and manage game review data with caching
 */
export function useGameReviews(
  gameId?: number,
  url?: string,
  itchGameId?: number
): UseGameReviewsResult {
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchReviews = async () => {
      // If no identifiers provided, try to extract from current page
      let identifiers: GameIdentifiers | null = null;

      if (!gameId && !url && !itchGameId) {
        identifiers = gameUrlParser.extractGameIdentifiers();
        if (!identifiers) {
          // Not a game page, don't fetch reviews
          setReviewData(null);
          setLoading(false);
          setError(null);
          return;
        }
      }

      const finalGameId = gameId || identifiers?.gameId;
      const finalUrl = url || identifiers?.url;
      const finalItchGameId = itchGameId || identifiers?.itchGameId;

      // Need at least one identifier
      if (!finalGameId && !finalUrl && !finalItchGameId) {
        setReviewData(null);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await reviewCache.getReviewData(
          finalGameId,
          finalUrl,
          finalItchGameId
        );

        if (isMounted) {
          setReviewData(data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Failed to fetch reviews"
          );
          setLoading(false);
        }
      }
    };

    fetchReviews();

    return () => {
      isMounted = false;
    };
  }, [gameId, url, itchGameId]);

  return {
    reviewData,
    loading,
    error,
    hasReviews: reviewData ? reviewData.total_reviews > 0 : false,
  };
}

/**
 * Hook to automatically fetch reviews for the current page
 */
export function useCurrentPageReviews(): UseGameReviewsResult {
  const [urlChanged, setUrlChanged] = useState(0);

  useEffect(() => {
    // Listen for URL changes in the webview
    const handleUrlChange = () => {
      setUrlChanged((prev) => prev + 1);
    };

    // Listen for navigation events
    window.addEventListener("popstate", handleUrlChange);

    // Also check periodically for URL changes (for SPA navigation)
    const interval = setInterval(() => {
      handleUrlChange();
    }, 1000);

    return () => {
      window.removeEventListener("popstate", handleUrlChange);
      clearInterval(interval);
    };
  }, []);

  return useGameReviews();
}

/**
 * Hook to manage review cache cleanup
 */
export function useReviewCacheCleanup() {
  useEffect(() => {
    // Clean up expired cache entries on mount
    reviewCache.clearExpiredCache();

    // Set up periodic cleanup (every hour)
    const interval = setInterval(
      () => {
        reviewCache.clearExpiredCache();
      },
      60 * 60 * 1000
    );

    return () => {
      clearInterval(interval);
    };
  }, []);
}
