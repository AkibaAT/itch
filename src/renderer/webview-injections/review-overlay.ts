/**
 * Webview injection script to add review information overlay to itch.io and fvn.li pages
 * This script is injected into the webview to display review data from fvn.li API
 */

// Import types (these will be bundled)
interface ReviewData {
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

interface GameIdentifiers {
  gameId?: number;
  itchGameId?: number;
  url?: string;
  slug?: string;
}

class ReviewOverlay {
  private overlay: HTMLElement | null = null;
  private cache: Map<string, { data: ReviewData; timestamp: number }> =
    new Map();
  private readonly CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours
  private readonly API_BASE_URL = "https://fvn.li/api";
  private currentUrl = "";
  private observer: MutationObserver | null = null;

  constructor() {
    this.init();
  }

  private init() {
    // Wait for DOM to be ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.setup());
    } else {
      this.setup();
    }
  }

  private setup() {
    this.currentUrl = window.location.href;
    this.checkAndDisplayReviews();

    // Set up URL change detection
    this.setupUrlChangeDetection();

    // Set up DOM mutation observer for dynamic content
    this.setupMutationObserver();
  }

  private setupUrlChangeDetection() {
    // Listen for popstate events (back/forward navigation)
    window.addEventListener("popstate", () => {
      setTimeout(() => this.handleUrlChange(), 100);
    });

    // Override pushState and replaceState to detect programmatic navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      originalPushState.apply(history, args);
      setTimeout(() => (window as any).reviewOverlay?.handleUrlChange(), 100);
    };

    history.replaceState = function (...args) {
      originalReplaceState.apply(history, args);
      setTimeout(() => (window as any).reviewOverlay?.handleUrlChange(), 100);
    };
  }

  private setupMutationObserver() {
    this.observer = new MutationObserver((mutations) => {
      let shouldCheck = false;

      mutations.forEach((mutation) => {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          // Check if significant content was added
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (
                element.classList.contains("game_frame") ||
                element.classList.contains("game-page") ||
                element.querySelector(".game_frame, .game-page")
              ) {
                shouldCheck = true;
                break;
              }
            }
          }
        }
      });

      if (shouldCheck) {
        setTimeout(() => this.checkAndDisplayReviews(), 500);
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  private handleUrlChange() {
    const newUrl = window.location.href;
    if (newUrl !== this.currentUrl) {
      this.currentUrl = newUrl;
      this.removeOverlay();
      this.checkAndDisplayReviews();
    }
  }

  private extractGameIdentifiers(): GameIdentifiers | null {
    const url = window.location.href;

    // Try itch.io URLs
    const itchInfo = this.parseItchioUrl(url);
    if (itchInfo) return itchInfo;

    // Try fvn.li URLs
    const fvnInfo = this.parseFvnliUrl(url);
    if (fvnInfo) return fvnInfo;

    // Try DOM extraction
    const domInfo = this.extractFromDom();
    if (domInfo) return domInfo;

    return null;
  }

  private parseItchioUrl(url: string): GameIdentifiers | null {
    try {
      const parsedUrl = new URL(url);

      if (
        !parsedUrl.hostname.endsWith(".itch.io") &&
        parsedUrl.hostname !== "itch.io"
      ) {
        return null;
      }

      if (
        parsedUrl.hostname.endsWith(".itch.io") &&
        parsedUrl.hostname !== "itch.io"
      ) {
        const pathParts = parsedUrl.pathname
          .split("/")
          .filter((part) => part.length > 0);
        if (pathParts.length >= 1) {
          return { url, slug: pathParts[0] };
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  private parseFvnliUrl(url: string): GameIdentifiers | null {
    try {
      const parsedUrl = new URL(url);

      if (
        !parsedUrl.hostname.includes("fvn.li") &&
        !parsedUrl.hostname.includes("fvn-li")
      ) {
        return null;
      }

      const pathParts = parsedUrl.pathname
        .split("/")
        .filter((part) => part.length > 0);
      if (pathParts.length >= 2 && pathParts[0] === "games") {
        return { url, slug: pathParts[1] };
      }

      return null;
    } catch {
      return null;
    }
  }

  private extractFromDom(): GameIdentifiers | null {
    try {
      const itchPathMeta = document.querySelector('meta[name="itch:path"]');
      if (itchPathMeta) {
        const content = itchPathMeta.getAttribute("content");
        if (content) {
          const gameIdMatch = content.match(/\/games\/(\d+)/);
          if (gameIdMatch) {
            return {
              itchGameId: parseInt(gameIdMatch[1], 10),
              url: window.location.href,
            };
          }
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  private getCacheKey(identifiers: GameIdentifiers): string {
    if (identifiers.gameId) return `game_${identifiers.gameId}`;
    if (identifiers.itchGameId) return `itch_${identifiers.itchGameId}`;
    if (identifiers.url) {
      const normalized = identifiers.url
        .toLowerCase()
        .replace(/^https?:\/\/(www\.)?/, "")
        .replace(/\/$/, "");
      return `url_${btoa(normalized)}`;
    }
    return "unknown";
  }

  private async fetchReviewData(
    identifiers: GameIdentifiers
  ): Promise<ReviewData | null> {
    try {
      const params = new URLSearchParams();

      if (identifiers.gameId)
        params.append("game_id", identifiers.gameId.toString());
      if (identifiers.url) params.append("url", identifiers.url);
      if (identifiers.itchGameId)
        params.append("itch_game_id", identifiers.itchGameId.toString());

      const response = await fetch(
        `${this.API_BASE_URL}/game-reviews?${params.toString()}`
      );

      if (!response.ok) return null;

      const apiResponse = await response.json();

      if (
        !apiResponse.success ||
        !apiResponse.has_reviews ||
        !apiResponse.review_data
      ) {
        return null;
      }

      return apiResponse.review_data;
    } catch (error) {
      console.warn("Error fetching review data:", error);
      return null;
    }
  }

  private async getReviewData(
    identifiers: GameIdentifiers
  ): Promise<ReviewData | null> {
    const cacheKey = this.getCacheKey(identifiers);
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    const data = await this.fetchReviewData(identifiers);
    if (data) {
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
    }

    return data;
  }

  private async checkAndDisplayReviews() {
    const identifiers = this.extractGameIdentifiers();
    if (!identifiers) return;

    const reviewData = await this.getReviewData(identifiers);
    if (reviewData && reviewData.total_reviews > 0) {
      this.displayReviewOverlay(reviewData);
    }
  }

  private findInsertionPoint(): HTMLElement | null {
    // Try to find a good insertion point on the page
    const selectors = [
      ".game_frame .purchase_banner_row",
      ".game_frame .download_btn",
      ".game-page .purchase-banner",
      ".game-page .download-section",
      ".purchase_banner",
      ".download_btn",
      ".game_frame",
      ".game-page",
      "main",
      "body",
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) return element as HTMLElement;
    }

    return document.body;
  }

  private displayReviewOverlay(reviewData: ReviewData) {
    this.removeOverlay();

    const insertionPoint = this.findInsertionPoint();
    if (!insertionPoint) return;

    this.overlay = this.createOverlayElement(reviewData);

    // Insert after the insertion point or as first child
    if (insertionPoint.nextSibling) {
      insertionPoint.parentNode?.insertBefore(
        this.overlay,
        insertionPoint.nextSibling
      );
    } else {
      insertionPoint.appendChild(this.overlay);
    }
  }

  private createOverlayElement(reviewData: ReviewData): HTMLElement {
    const overlay = document.createElement("div");
    overlay.id = "fvn-review-overlay";
    overlay.style.cssText = `
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
      color: #e0e0e0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      max-width: 600px;
      z-index: 1000;
      position: relative;
    `;

    const header = document.createElement("div");
    header.style.cssText = `
      display: flex;
      align-items: center;
      margin-bottom: 12px;
      font-weight: 600;
      color: #fff;
      gap: 8px;
    `;
    header.innerHTML = `
      <span style="color: #ffd700;">★</span>
      <span>Reviews from fvn.li</span>
    `;

    const rating = document.createElement("div");
    rating.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    `;

    const stars = this.createStarRating(reviewData.average_rating || 0);
    const ratingText = document.createElement("span");
    ratingText.style.cssText = "font-weight: 600; color: #fff;";
    ratingText.textContent = `${reviewData.average_rating?.toFixed(1) || "N/A"}`;

    const count = document.createElement("span");
    count.style.cssText = "color: #aaa; font-size: 12px;";
    count.textContent = `(${reviewData.total_reviews} review${reviewData.total_reviews !== 1 ? "s" : ""})`;

    rating.appendChild(stars);
    rating.appendChild(ratingText);
    rating.appendChild(count);

    overlay.appendChild(header);
    overlay.appendChild(rating);

    // Add recent reviews if available
    if (reviewData.recent_reviews && reviewData.recent_reviews.length > 0) {
      const recentSection = this.createRecentReviewsSection(
        reviewData.recent_reviews.slice(0, 2)
      );
      overlay.appendChild(recentSection);
    }

    return overlay;
  }

  private createStarRating(rating: number): HTMLElement {
    const container = document.createElement("div");
    container.style.cssText = "display: flex; gap: 2px;";

    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      const star = document.createElement("span");
      star.style.cssText = `color: ${i <= fullStars ? "#ffd700" : "#555"}; font-size: 16px;`;
      star.textContent =
        i <= fullStars || (i === fullStars + 1 && hasHalfStar) ? "★" : "☆";
      container.appendChild(star);
    }

    return container;
  }

  private createRecentReviewsSection(reviews: any[]): HTMLElement {
    const section = document.createElement("div");
    section.style.cssText =
      "margin-top: 12px; border-top: 1px solid #333; padding-top: 12px;";

    reviews.forEach((review, index) => {
      const reviewEl = document.createElement("div");
      reviewEl.style.cssText = `
        margin-bottom: ${index < reviews.length - 1 ? "8px" : "0"};
        padding-bottom: ${index < reviews.length - 1 ? "8px" : "0"};
        border-bottom: ${index < reviews.length - 1 ? "1px solid #2a2a2a" : "none"};
      `;

      const header = document.createElement("div");
      header.style.cssText =
        "display: flex; align-items: center; gap: 8px; margin-bottom: 4px;";

      const name = document.createElement("span");
      name.style.cssText = "font-weight: 500; color: #fff; font-size: 12px;";
      name.textContent = review.rater.name;

      const reviewStars = this.createStarRating(review.rating);
      reviewStars.style.cssText += " transform: scale(0.8);";

      header.appendChild(name);
      header.appendChild(reviewStars);

      const text = document.createElement("div");
      text.style.cssText = `
        color: #ccc;
        font-size: 12px;
        line-height: 1.4;
        max-height: 40px;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      `;
      text.textContent = this.stripHtml(review.review);

      reviewEl.appendChild(header);
      reviewEl.appendChild(text);
      section.appendChild(reviewEl);
    });

    return section;
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .trim();
  }

  private removeOverlay() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }

  public destroy() {
    this.removeOverlay();
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

// Initialize the overlay when script loads
if (typeof window !== "undefined") {
  (window as any).reviewOverlay = new ReviewOverlay();
}
