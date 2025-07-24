import React from "react";
import styled from "renderer/styles";
import Icon from "renderer/basics/Icon";
import { ReviewData } from "renderer/util/review-cache";

const ReviewsContainer = styled.div`
  display: flex;
  flex-direction: column;
  font-size: ${(props) => props.theme.fontSizes.smaller};
  color: ${(props) => props.theme.secondaryText};
  margin-top: 8px;
  padding: 8px 0;
  border-top: 1px solid ${(props) => props.theme.sidebarBorder};
`;

const ReviewHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 6px;
  font-weight: 600;
  color: ${(props) => props.theme.baseText};
`;

const RatingDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
`;

const StarRating = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
`;

const Star = styled.span<{ filled: boolean }>`
  color: ${(props) => (props.filled ? "#ffd700" : props.theme.ternaryText)};
  font-size: 14px;
`;

const RatingText = styled.span`
  font-weight: 600;
  color: ${(props) => props.theme.baseText};
`;

const ReviewCount = styled.span`
  color: ${(props) => props.theme.secondaryText};
  font-size: ${(props) => props.theme.fontSizes.small};
`;

const RecentReviewsSection = styled.div`
  margin-top: 8px;
`;

const RecentReviewItem = styled.div`
  margin-bottom: 6px;
  padding: 4px 0;
  border-bottom: 1px solid ${(props) => props.theme.sidebarBorder};

  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
  }
`;

const ReviewItemHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
`;

const ReviewerName = styled.span`
  font-weight: 500;
  color: ${(props) => props.theme.baseText};
  font-size: ${(props) => props.theme.fontSizes.small};
`;

const ReviewRating = styled.div`
  display: flex;
  align-items: center;
  gap: 1px;
`;

const ReviewText = styled.div`
  color: ${(props) => props.theme.secondaryText};
  font-size: ${(props) => props.theme.fontSizes.small};
  line-height: 1.3;
  max-height: 40px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const LoadingText = styled.div`
  color: ${(props) => props.theme.ternaryText};
  font-style: italic;
  text-align: center;
  padding: 8px 0;
`;

const ErrorText = styled.div`
  color: ${(props) => props.theme.error};
  font-size: ${(props) => props.theme.fontSizes.small};
  text-align: center;
  padding: 4px 0;
`;

interface Props {
  reviewData?: ReviewData | null;
  loading?: boolean;
  error?: string | null;
}

class GameReviews extends React.PureComponent<Props> {
  render() {
    const { reviewData, loading, error } = this.props;

    if (loading) {
      return (
        <ReviewsContainer>
          <ReviewHeader>
            <Icon icon="star" />
            Reviews
          </ReviewHeader>
          <LoadingText>Loading reviews...</LoadingText>
        </ReviewsContainer>
      );
    }

    if (error) {
      return (
        <ReviewsContainer>
          <ReviewHeader>
            <Icon icon="star" />
            Reviews
          </ReviewHeader>
          <ErrorText>Failed to load reviews</ErrorText>
        </ReviewsContainer>
      );
    }

    if (!reviewData || reviewData.total_reviews === 0) {
      return (
        <ReviewsContainer>
          <ReviewHeader>
            <Icon icon="star" />
            Reviews
          </ReviewHeader>
          <LoadingText>No reviews available</LoadingText>
        </ReviewsContainer>
      );
    }

    return (
      <ReviewsContainer>
        <ReviewHeader>
          <Icon icon="star" />
          Reviews
        </ReviewHeader>

        <RatingDisplay>
          <StarRating>
            {this.renderStars(reviewData.average_rating || 0)}
          </StarRating>
          <RatingText>
            {reviewData.average_rating?.toFixed(1) || "N/A"}
          </RatingText>
          <ReviewCount>
            ({reviewData.total_reviews} review
            {reviewData.total_reviews !== 1 ? "s" : ""})
          </ReviewCount>
        </RatingDisplay>

        {reviewData.recent_reviews && reviewData.recent_reviews.length > 0 && (
          <RecentReviewsSection>
            {reviewData.recent_reviews.slice(0, 3).map((review) => (
              <RecentReviewItem key={review.id}>
                <ReviewItemHeader>
                  <ReviewerName>{review.rater.name}</ReviewerName>
                  <ReviewRating>
                    {this.renderStars(review.rating, true)}
                  </ReviewRating>
                </ReviewItemHeader>
                <ReviewText>{this.stripHtml(review.review)}</ReviewText>
              </RecentReviewItem>
            ))}
          </RecentReviewsSection>
        )}
      </ReviewsContainer>
    );
  }

  private renderStars(rating: number, small: boolean = false): React.ReactNode {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <Star
            key={i}
            filled={true}
            style={{ fontSize: small ? "12px" : "14px" }}
          >
            ★
          </Star>
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <Star
            key={i}
            filled={true}
            style={{ fontSize: small ? "12px" : "14px" }}
          >
            ☆
          </Star>
        );
      } else {
        stars.push(
          <Star
            key={i}
            filled={false}
            style={{ fontSize: small ? "12px" : "14px" }}
          >
            ☆
          </Star>
        );
      }
    }

    return stars;
  }

  private stripHtml(html: string): string {
    // Simple HTML stripping for review text
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .trim();
  }
}

export default GameReviews;
