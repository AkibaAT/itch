/**
 * Utility for parsing game information from URLs (itch.io and fvn.li)
 */

export interface GameIdentifiers {
  gameId?: number;
  itchGameId?: number;
  url?: string;
  slug?: string;
}

export class GameUrlParser {
  private static instance: GameUrlParser;

  private constructor() {}

  public static getInstance(): GameUrlParser {
    if (!GameUrlParser.instance) {
      GameUrlParser.instance = new GameUrlParser();
    }
    return GameUrlParser.instance;
  }

  /**
   * Extract game identifiers from the current page URL and DOM
   */
  public extractGameIdentifiers(): GameIdentifiers | null {
    const currentUrl = window.location.href;

    // Try to extract from itch.io URLs
    const itchInfo = this.parseItchioUrl(currentUrl);
    if (itchInfo) {
      return itchInfo;
    }

    // Try to extract from fvn.li URLs
    const fvnInfo = this.parseFvnliUrl(currentUrl);
    if (fvnInfo) {
      return fvnInfo;
    }

    // Try to extract from DOM meta tags (for itch.io pages)
    const domInfo = this.extractFromDom();
    if (domInfo) {
      return domInfo;
    }

    return null;
  }

  /**
   * Parse itch.io URLs to extract game information
   */
  private parseItchioUrl(url: string): GameIdentifiers | null {
    try {
      const parsedUrl = new URL(url);

      // Check if it's an itch.io domain
      if (
        !parsedUrl.hostname.endsWith(".itch.io") &&
        parsedUrl.hostname !== "itch.io"
      ) {
        return null;
      }

      // Pattern for game pages: https://creator.itch.io/game-name
      if (
        parsedUrl.hostname.endsWith(".itch.io") &&
        parsedUrl.hostname !== "itch.io"
      ) {
        const pathParts = parsedUrl.pathname
          .split("/")
          .filter((part) => part.length > 0);
        if (pathParts.length >= 1) {
          return {
            url: url,
            slug: pathParts[0],
          };
        }
      }

      // Pattern for direct game URLs: https://itch.io/games/...
      if (parsedUrl.hostname === "itch.io") {
        const pathParts = parsedUrl.pathname
          .split("/")
          .filter((part) => part.length > 0);
        if (pathParts.length >= 2 && pathParts[0] === "games") {
          return {
            url: url,
            slug: pathParts[1],
          };
        }
      }

      return null;
    } catch (error) {
      console.warn("Error parsing itch.io URL:", error);
      return null;
    }
  }

  /**
   * Parse fvn.li URLs to extract game information
   */
  private parseFvnliUrl(url: string): GameIdentifiers | null {
    try {
      const parsedUrl = new URL(url);

      // Check if it's fvn.li domain
      if (
        !parsedUrl.hostname.includes("fvn.li") &&
        !parsedUrl.hostname.includes("fvn-li")
      ) {
        return null;
      }

      // Pattern for game detail pages: https://fvn.li/games/game-slug
      const pathParts = parsedUrl.pathname
        .split("/")
        .filter((part) => part.length > 0);
      if (pathParts.length >= 2 && pathParts[0] === "games") {
        return {
          url: url,
          slug: pathParts[1],
        };
      }

      return null;
    } catch (error) {
      console.warn("Error parsing fvn.li URL:", error);
      return null;
    }
  }

  /**
   * Extract game information from DOM meta tags (primarily for itch.io)
   */
  private extractFromDom(): GameIdentifiers | null {
    try {
      // Look for itch.io meta tags
      const itchPathMeta = document.querySelector('meta[name="itch:path"]');
      if (itchPathMeta) {
        const content = itchPathMeta.getAttribute("content");
        if (content) {
          // Extract game ID from path like "/games/123456"
          const gameIdMatch = content.match(/\/games\/(\d+)/);
          if (gameIdMatch) {
            return {
              itchGameId: parseInt(gameIdMatch[1], 10),
              url: window.location.href,
            };
          }
        }
      }

      // Look for other potential identifiers in meta tags
      const gameIdMeta =
        document.querySelector('meta[name="game-id"]') ||
        document.querySelector('meta[property="game:id"]');
      if (gameIdMeta) {
        const gameId = gameIdMeta.getAttribute("content");
        if (gameId && !isNaN(parseInt(gameId, 10))) {
          return {
            gameId: parseInt(gameId, 10),
            url: window.location.href,
          };
        }
      }

      // Look for data attributes on body or main elements
      const bodyGameId = document.body.getAttribute("data-game-id");
      if (bodyGameId && !isNaN(parseInt(bodyGameId, 10))) {
        return {
          gameId: parseInt(bodyGameId, 10),
          url: window.location.href,
        };
      }

      return null;
    } catch (error) {
      console.warn("Error extracting game info from DOM:", error);
      return null;
    }
  }

  /**
   * Check if the current page is a game page that should show reviews
   */
  public isGamePage(): boolean {
    const identifiers = this.extractGameIdentifiers();
    return identifiers !== null;
  }

  /**
   * Get the best available identifier for API requests
   */
  public getBestIdentifier(): {
    type: "gameId" | "itchGameId" | "url";
    value: number | string;
  } | null {
    const identifiers = this.extractGameIdentifiers();
    if (!identifiers) {
      return null;
    }

    // Prefer internal game ID, then itch game ID, then URL
    if (identifiers.gameId) {
      return { type: "gameId", value: identifiers.gameId };
    }
    if (identifiers.itchGameId) {
      return { type: "itchGameId", value: identifiers.itchGameId };
    }
    if (identifiers.url) {
      return { type: "url", value: identifiers.url };
    }

    return null;
  }

  /**
   * Create API parameters object from identifiers
   */
  public createApiParams(
    identifiers?: GameIdentifiers
  ): Record<string, string> {
    const ids = identifiers || this.extractGameIdentifiers();
    if (!ids) {
      return {};
    }

    const params: Record<string, string> = {};

    if (ids.gameId) {
      params.game_id = ids.gameId.toString();
    }
    if (ids.itchGameId) {
      params.itch_game_id = ids.itchGameId.toString();
    }
    if (ids.url) {
      params.url = ids.url;
    }

    return params;
  }
}

// Export singleton instance
export const gameUrlParser = GameUrlParser.getInstance();
