import { Game } from "common/butlerd/messages";
import React from "react";
import styled from "renderer/styles";
import { T } from "renderer/t";
import ReviewDialog from "renderer/basics/ReviewDialog";

const ReviewLine = styled.div<{ hasReviews: boolean }>`
  cursor: ${(props) => (props.hasReviews ? "pointer" : "default")};
  color: ${(props) =>
    props.hasReviews ? props.theme.secondaryText : props.theme.ternaryText};

  &:hover {
    color: ${(props) =>
      props.hasReviews ? props.theme.accent : props.theme.ternaryText};
  }
`;

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

interface Props {
  game: Game;
}

interface State {
  reviewData: ReviewData | null;
  loading: boolean;
  error: string | null;
  dialogOpen: boolean;
}

class ReviewSummary extends React.PureComponent<Props, State> {
  private cache = new Map<string, { data: ReviewData; timestamp: number }>();
  private readonly CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours

  constructor(props: Props) {
    super(props);
    this.state = {
      reviewData: null,
      loading: false,
      error: null,
      dialogOpen: false,
    };
  }

  componentDidMount() {
    this.fetchReviews();
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.game.id !== this.props.game.id) {
      this.fetchReviews();
    }
  }

  getCacheKey = (gameId: number): string => {
    return `game_${gameId}`;
  };

  getCachedData = (gameId: number): ReviewData | null => {
    const cacheKey = this.getCacheKey(gameId);
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    return null;
  };

  setCachedData = (gameId: number, data: ReviewData): void => {
    const cacheKey = this.getCacheKey(gameId);
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
  };

  fetchReviews = async () => {
    const { game } = this.props;

    if (!game.id) {
      console.log("ReviewSummary: No game ID provided");
      return;
    }

    console.log("ReviewSummary: Fetching reviews for game ID:", game.id);

    // Check cache first
    const cachedData = this.getCachedData(game.id);
    if (cachedData) {
      console.log("ReviewSummary: Using cached data");
      this.setState({ reviewData: cachedData, loading: false, error: null });
      return;
    }

    this.setState({ loading: true, error: null });

    try {
      const params = new URLSearchParams();
      params.append("itch_game_id", game.id.toString());
      const apiUrl = `https://fvn.li/api/game-reviews?${params.toString()}`;

      console.log("ReviewSummary: Making API request to:", apiUrl);

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        mode: "cors",
      });

      console.log("ReviewSummary: API response status:", response.status);
      console.log(
        "ReviewSummary: API response headers:",
        Object.fromEntries(response.headers.entries())
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const apiResponse = await response.json();
      console.log("ReviewSummary: API response data:", apiResponse);

      if (
        apiResponse.success &&
        apiResponse.has_reviews &&
        apiResponse.review_data
      ) {
        console.log(
          "ReviewSummary: Setting review data:",
          apiResponse.review_data
        );
        this.setState({ reviewData: apiResponse.review_data, loading: false });
        this.setCachedData(game.id, apiResponse.review_data);
      } else {
        console.log("ReviewSummary: No reviews found");
        this.setState({ reviewData: null, loading: false });
      }
    } catch (err) {
      console.error("ReviewSummary: Error fetching review data:", err);
      this.setState({
        error: err instanceof Error ? err.message : "Failed to fetch reviews",
        loading: false,
      });
    }
  };

  handleClick = () => {
    if (this.state.reviewData && this.state.reviewData.total_reviews > 0) {
      this.setState({ dialogOpen: true });
    }
  };

  handleCloseDialog = () => {
    this.setState({ dialogOpen: false });
  };

  renderStars = (rating: number): string => {
    const roundedRating = Math.round(rating);
    let stars = "";

    for (let i = 1; i <= 5; i++) {
      if (i <= roundedRating) {
        stars += "★";
      } else {
        stars += "☆";
      }
    }

    return stars;
  };

  render() {
    const { reviewData, loading, error, dialogOpen } = this.state;
    const { game } = this.props;

    // Determine if we have reviews
    const hasReviews = reviewData && reviewData.total_reviews > 0;
    const showDialog = hasReviews && dialogOpen;

    // Always show the review line
    return (
      <>
        <div className="total-playtime--line">
          <ReviewLine hasReviews={hasReviews} onClick={this.handleClick}>
            {loading
              ? "Loading reviews..."
              : error
                ? `Reviews: ${error}`
                : hasReviews
                  ? `★★★★★ ${reviewData.average_rating?.toFixed(1)} (${reviewData.total_reviews} reviews)`
                  : "No reviews yet"}
          </ReviewLine>
        </div>
        {showDialog && (
          <ReviewDialog
            game={game}
            reviewData={reviewData}
            onClose={this.handleCloseDialog}
          />
        )}
      </>
    );
  }
}

export default ReviewSummary;
