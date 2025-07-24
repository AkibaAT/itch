import { Game } from "common/butlerd/messages";
import React from "react";
import styled from "renderer/styles";
import { T } from "renderer/t";
import IconButton from "renderer/basics/IconButton";

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const DialogContent = styled.div`
  background: ${(props) => props.theme.sidebarBackground};
  border-radius: 8px;
  padding: 20px;
  max-width: 700px;
  max-height: 80vh;
  position: relative;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const CloseButton = styled(IconButton)`
  position: absolute;
  top: 10px;
  right: 10px;
`;

const DialogHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 4px;
  font-size: ${(props) => props.theme.fontSizes.smaller};
  font-weight: 500;
  color: ${(props) => props.theme.baseText};
`;

const RatingSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 0;
  padding: 6px 12px;
  background: ${(props) => props.theme.breadBackground};
  border-radius: 6px;
`;

const StarRating = styled.div`
  font-size: 20px;
  color: #ffd700;
`;

const RatingText = styled.div`
  font-size: ${(props) => props.theme.fontSizes.large};
  font-weight: 600;
  color: ${(props) => props.theme.baseText};
`;

const ReviewCount = styled.div`
  color: ${(props) => props.theme.secondaryText};
  font-size: ${(props) => props.theme.fontSizes.baseText};
`;

const ReviewsSection = styled.div`
  margin-top: 20px;
`;

const ReviewItem = styled.div`
  margin-bottom: 16px;
  padding: 16px;
  background: ${(props) => props.theme.sidebarBackground};
  border-radius: 8px;
  border-left: 3px solid ${(props) => props.theme.accent};
`;

const ReviewHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
`;

const ReviewerName = styled.div`
  font-weight: 500;
  color: ${(props) => props.theme.baseText};
  font-size: ${(props) => props.theme.fontSizes.baseText};
`;

const ReviewStars = styled.div`
  color: #ffd700;
  font-size: 14px;
`;

const ReviewDate = styled.div`
  color: ${(props) => props.theme.secondaryText};
  font-size: ${(props) => props.theme.fontSizes.smaller};
  margin-left: auto;
`;

const ReviewText = styled.div`
  color: ${(props) => props.theme.secondaryText};
  line-height: 1.5;
  font-size: ${(props) => props.theme.fontSizes.baseText};
`;

const FilterSection = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 4px;
  padding: 4px 12px;
  background: ${(props) => props.theme.breadBackground};
  border-radius: 4px;
  flex-wrap: wrap;
`;

const FilterLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 6px;
  color: ${(props) => props.theme.baseText};
  font-size: ${(props) => props.theme.fontSizes.smaller};
  cursor: pointer;
`;

const FilterCheckbox = styled.input`
  margin: 0;
`;

const FilterSelect = styled.select`
  background: ${(props) => props.theme.sidebarBackground};
  color: ${(props) => props.theme.baseText};
  border: 1px solid ${(props) => props.theme.breadBackground};
  border-radius: 3px;
  padding: 4px 6px;
  font-size: ${(props) => props.theme.fontSizes.smaller};
`;

const ReviewsContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  margin-top: 10px;
  min-height: 300px;
  transition: all 0.2s ease-in-out;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 20px;
  color: ${(props) => props.theme.secondaryText};
  font-style: italic;
  transition: opacity 0.2s ease-in-out;
`;

const ContentWrapper = styled.div<{ isLoading: boolean }>`
  transition: opacity 0.2s ease-in-out;
  opacity: ${(props) => (props.isLoading ? 0.6 : 1)};
  pointer-events: ${(props) => (props.isLoading ? "none" : "auto")};
`;

const LoadingOverlay = styled.div<{ visible: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${(props) => (props.visible ? 1 : 0)};
  visibility: ${(props) => (props.visible ? "visible" : "hidden")};
  transition:
    opacity 0.2s ease-in-out,
    visibility 0.2s ease-in-out;
  border-radius: 8px;
  color: ${(props) => props.theme.baseText};
  font-weight: 500;
`;

const LoadMoreButton = styled.button`
  width: 100%;
  padding: 12px;
  margin-top: 16px;
  background: ${(props) => props.theme.accent};
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: ${(props) => props.theme.fontSizes.baseText};

  &:hover {
    background: ${(props) => props.theme.accentSecondary};
  }

  &:disabled {
    background: ${(props) => props.theme.breadBackground};
    cursor: not-allowed;
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

interface Review {
  id: number;
  rating: number;
  review: string;
  is_reviewed: boolean;
  published_at: string;
  rater: {
    id: number;
    name: string;
  };
}

interface Props {
  game: Game;
  reviewData: ReviewData;
  onClose: () => void;
}

interface State {
  reviews: Review[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  currentPage: number;
  showAllRatings: boolean;
  ratingFilter: number | null;
  error: string | null;
}

class ReviewDialog extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      reviews: props.reviewData.recent_reviews || [],
      loading: false,
      loadingMore: false,
      hasMore: true,
      currentPage: 1,
      showAllRatings: false,
      ratingFilter: null,
      error: null,
    };
  }

  componentDidMount() {
    // Load the first page of reviews with current filters
    this.loadReviews(true);
  }

  loadReviews = async (reset: boolean = false) => {
    const { game } = this.props;
    const { currentPage, showAllRatings, ratingFilter } = this.state;

    if (reset) {
      this.setState({ loading: true, error: null });
    } else {
      this.setState({ loadingMore: true });
    }

    try {
      const params = new URLSearchParams();
      params.append("itch_game_id", game.id.toString());
      params.append("page", reset ? "1" : (currentPage + 1).toString());
      params.append("per_page", "20");
      params.append("show_all_ratings", showAllRatings ? "1" : "0");

      if (ratingFilter !== null) {
        params.append("rating_filter", ratingFilter.toString());
      }

      const response = await fetch(
        `https://fvn.li/api/game-reviews/paginated?${params.toString()}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          mode: "cors",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const newReviews = data.reviews || [];

        this.setState({
          reviews: reset ? newReviews : [...this.state.reviews, ...newReviews],
          hasMore: data.pagination.has_more,
          currentPage: data.pagination.current_page,
          loading: false,
          loadingMore: false,
          error: null,
        });
      } else {
        throw new Error("Failed to load reviews");
      }
    } catch (err) {
      console.error("Error loading reviews:", err);
      this.setState({
        error: err instanceof Error ? err.message : "Failed to load reviews",
        loading: false,
        loadingMore: false,
      });
    }
  };

  handleFilterChange = (
    newShowAllRatings: boolean,
    newRatingFilter: number | null
  ) => {
    this.setState(
      {
        showAllRatings: newShowAllRatings,
        ratingFilter: newRatingFilter,
        currentPage: 1,
      },
      () => {
        this.loadReviews(true);
      }
    );
  };

  handleLoadMore = () => {
    if (!this.state.loadingMore && this.state.hasMore) {
      this.loadReviews(false);
    }
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

  stripHtml = (html: string): string => {
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .trim();
  };

  formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  render() {
    const { game, reviewData, onClose } = this.props;
    const {
      reviews,
      loading,
      loadingMore,
      hasMore,
      showAllRatings,
      ratingFilter,
      error,
    } = this.state;

    return (
      <Overlay onClick={onClose}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <CloseButton icon="cross" onClick={onClose} />

          <DialogHeader>Reviews</DialogHeader>

          <RatingSection>
            <StarRating>
              {this.renderStars(reviewData.average_rating || 0)}
            </StarRating>
            <RatingText>
              {reviewData.average_rating?.toFixed(1) || "N/A"}
            </RatingText>
            <ReviewCount>
              {reviewData.total_reviews} review
              {reviewData.total_reviews !== 1 ? "s" : ""}
            </ReviewCount>
          </RatingSection>

          <FilterSection>
            <FilterLabel>
              <FilterCheckbox
                type="checkbox"
                checked={showAllRatings}
                onChange={(e) =>
                  this.handleFilterChange(e.target.checked, ratingFilter)
                }
              />
              Show all ratings
            </FilterLabel>

            <FilterLabel>
              Filter by stars:
              <FilterSelect
                value={ratingFilter || ""}
                onChange={(e) =>
                  this.handleFilterChange(
                    showAllRatings,
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
              >
                <option value="">All ratings</option>
                <option value="5">★★★★★ (5 stars)</option>
                <option value="4">★★★★☆ (4 stars)</option>
                <option value="3">★★★☆☆ (3 stars)</option>
                <option value="2">★★☆☆☆ (2 stars)</option>
                <option value="1">★☆☆☆☆ (1 star)</option>
              </FilterSelect>
            </FilterLabel>
          </FilterSection>

          <ReviewsContainer>
            <ContentWrapper isLoading={loading && reviews.length === 0}>
              {loading && reviews.length === 0 ? (
                <LoadingMessage>Loading reviews...</LoadingMessage>
              ) : error ? (
                <LoadingMessage>Error: {error}</LoadingMessage>
              ) : reviews.length === 0 ? (
                <LoadingMessage>
                  No reviews found with current filters.
                </LoadingMessage>
              ) : (
                <>
                  {reviews.map((review) => (
                    <ReviewItem key={review.id}>
                      <ReviewHeader>
                        <ReviewerName>{review.rater.name}</ReviewerName>
                        <ReviewStars>
                          {this.renderStars(review.rating)}
                        </ReviewStars>
                        <ReviewDate>
                          {this.formatDate(review.published_at)}
                        </ReviewDate>
                      </ReviewHeader>
                      {review.is_reviewed && review.review && (
                        <ReviewText>{this.stripHtml(review.review)}</ReviewText>
                      )}
                    </ReviewItem>
                  ))}

                  {hasMore && (
                    <LoadMoreButton
                      onClick={this.handleLoadMore}
                      disabled={loadingMore}
                    >
                      {loadingMore ? "Loading more..." : "Load more reviews"}
                    </LoadMoreButton>
                  )}
                </>
              )}
            </ContentWrapper>
            <LoadingOverlay visible={loading && reviews.length > 0}>
              Updating reviews...
            </LoadingOverlay>
          </ReviewsContainer>
        </DialogContent>
      </Overlay>
    );
  }
}

export default ReviewDialog;
