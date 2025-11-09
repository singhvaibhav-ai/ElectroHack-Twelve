import re
import json
from collections import Counter, defaultdict
from dataclasses import dataclass, asdict
import sys
from typing import List, Dict, Tuple
import numpy as np


@dataclass
class ReviewSummary:
    """Data class for storing review summary results"""

    overall_score: float
    total_reviews: int
    sentiment_distribution: Dict[str, int]
    pros: List[Tuple[str, int]]  # (pro, frequency)
    cons: List[Tuple[str, int]]  # (con, frequency)
    top_keywords: List[Tuple[str, int]]  # (keyword, frequency)
    sentiment_trend: str
    detailed_insights: Dict[str, any]
    executive_summary: str  # <-- 💡 ADDED THIS FIELD


class ReviewSummarizer:
    """
    NLP-based Product Review Summarizer
    Extracts pros, cons, keywords, and sentiment from product reviews
    """

    def __init__(self):
        # Positive and negative indicator words
        self.positive_words = {
            "excellent",
            "great",
            "amazing",
            "wonderful",
            "fantastic",
            "perfect",
            "love",
            "best",
            "awesome",
            "brilliant",
            "outstanding",
            "superb",
            "good",
            "nice",
            "happy",
            "pleased",
            "satisfied",
            "recommend",
            "quality",
            "durable",
            "reliable",
            "comfortable",
            "easy",
            "fast",
            "beautiful",
            "sturdy",
            "worth",
            "impressed",
            "exceeded",
        }

        self.negative_words = {
            "bad",
            "terrible",
            "horrible",
            "awful",
            "poor",
            "worst",
            "hate",
            "disappointing",
            "disappointed",
            "waste",
            "useless",
            "broken",
            "defective",
            "cheap",
            "flimsy",
            "uncomfortable",
            "difficult",
            "slow",
            "unreliable",
            "fragile",
            "overpriced",
            "regret",
            "avoid",
            "never",
            "problem",
            "issue",
            "fail",
        }

        # Common stopwords to filter out
        self.stopwords = {
            "the",
            "a",
            "an",
            "and",
            "or",
            "but",
            "in",
            "on",
            "at",
            "to",
            "for",
            "of",
            "with",
            "is",
            "was",
            "are",
            "were",
            "been",
            "be",
            "have",
            "has",
            "had",
            "do",
            "does",
            "did",
            "will",
            "would",
            "could",
            "should",
            "may",
            "might",
            "must",
            "can",
            "this",
            "that",
            "these",
            "those",
            "i",
            "you",
            "he",
            "she",
            "it",
            "we",
            "they",
            "my",
            "your",
            "his",
            "her",
            "its",
            "our",
            "their",
            "am",
            "get",
            "got",
            "just",
            "very",
            "really",
            "so",
        }

        # Aspect keywords for categorization
        self.aspect_keywords = {
            "quality": ["quality", "build", "material", "construction", "made"],
            "price": ["price", "cost", "expensive", "cheap", "value", "worth"],
            "durability": ["durable", "last", "lasting", "sturdy", "strong", "break"],
            "design": [
                "design",
                "look",
                "appearance",
                "style",
                "aesthetic",
                "beautiful",
            ],
            "performance": [
                "performance",
                "work",
                "fast",
                "slow",
                "efficient",
                "speed",
            ],
            "comfort": ["comfort", "comfortable", "soft", "easy", "ergonomic"],
            "delivery": ["delivery", "shipping", "arrive", "package", "received"],
            "customer_service": ["service", "support", "customer", "help", "response"],
        }

    def preprocess_text(self, text: str) -> List[str]:
        """Preprocess and tokenize text"""
        # Convert to lowercase and remove special characters
        text = text.lower()
        text = re.sub(r"[^a-z0-9\s]", " ", text)
        # Tokenize
        tokens = text.split()
        # Remove stopwords
        tokens = [t for t in tokens if t not in self.stopwords and len(t) > 2]
        return tokens

    def calculate_sentiment_score(self, text: str) -> float:
        """
        Calculate sentiment score for a review
        Returns: float between -1 (negative) and 1 (positive)
        """
        tokens = self.preprocess_text(text)
        positive_count = sum(1 for token in tokens if token in self.positive_words)
        negative_count = sum(1 for token in tokens if token in self.negative_words)

        total = positive_count + negative_count
        if total == 0:
            return 0.0

        sentiment_score = (positive_count - negative_count) / total
        return sentiment_score

    def classify_sentiment(self, score: float) -> str:
        """Classify sentiment based on score"""
        if score > 0.2:
            return "positive"
        elif score < -0.2:
            return "negative"
        else:
            return "neutral"

    def extract_sentences(self, text: str) -> List[str]:
        """Extract sentences from text"""
        # Simple sentence splitting
        sentences = re.split(r"[.!?]+", text)
        sentences = [s.strip() for s in sentences if len(s.strip()) > 10]
        return sentences

    def identify_aspect(self, sentence: str) -> str:
        """Identify the aspect being discussed in a sentence"""
        sentence_lower = sentence.lower()
        for aspect, keywords in self.aspect_keywords.items():
            if any(keyword in sentence_lower for keyword in keywords):
                return aspect
        return "general"

    def extract_pros_cons(
        self, reviews: List[Dict[str, any]]
    ) -> Tuple[List[Tuple[str, int]], List[Tuple[str, int]]]:
        """
        Extract common pros and cons from reviews
        Returns: (pros, cons) as lists of (phrase, frequency) tuples
        """
        positive_phrases = defaultdict(int)
        negative_phrases = defaultdict(int)

        for review in reviews:
            text = review.get("text", "")
            rating = review.get("rating", 3)
            sentences = self.extract_sentences(text)

            for sentence in sentences:
                sentiment_score = self.calculate_sentiment_score(sentence)
                aspect = self.identify_aspect(sentence)

                # Create a simplified phrase representation
                tokens = self.preprocess_text(sentence)
                if len(tokens) < 3:
                    continue

                # Extract meaningful phrases (2-4 words)
                phrase_candidates = []
                for i in range(len(tokens) - 1):
                    phrase = " ".join(tokens[i : min(i + 3, len(tokens))])
                    phrase_candidates.append(phrase)

                # Categorize based on sentiment and rating
                is_positive = sentiment_score > 0.1 or rating >= 4
                is_negative = sentiment_score < -0.1 or rating <= 2

                for phrase in phrase_candidates:
                    if is_positive and any(
                        word in phrase for word in self.positive_words
                    ):
                        positive_phrases[f"{aspect}: {sentence[:50]}..."] += 1
                        break
                    elif is_negative and any(
                        word in phrase for word in self.negative_words
                    ):
                        negative_phrases[f"{aspect}: {sentence[:50]}..."] += 1
                        break

        # Get top pros and cons
        pros = sorted(positive_phrases.items(), key=lambda x: x[1], reverse=True)[:10]
        cons = sorted(negative_phrases.items(), key=lambda x: x[1], reverse=True)[:10]

        return pros, cons

    def extract_keywords(
        self, reviews: List[Dict[str, any]], top_n: int = 20
    ) -> List[Tuple[str, int]]:
        """Extract top keywords from all reviews"""
        word_freq = Counter()

        for review in reviews:
            text = review.get("text", "")
            tokens = self.preprocess_text(text)
            word_freq.update(tokens)

        # Filter out very common words and return top keywords
        keywords = [
            (word, count)
            for word, count in word_freq.most_common(top_n * 2)
            if count > 1 and word not in self.stopwords
        ]

        return keywords[:top_n]

    def calculate_overall_score(self, reviews: List[Dict[str, any]]) -> float:
        """
        Calculate overall score based on ratings and sentiment
        Returns: float between 0 and 5
        """
        if not reviews:
            return 0.0

        # Calculate average rating
        ratings = [r.get("rating", 3) for r in reviews]
        avg_rating = np.mean(ratings)

        # Calculate average sentiment
        sentiments = [
            self.calculate_sentiment_score(r.get("text", "")) for r in reviews
        ]
        avg_sentiment = np.mean(sentiments)

        # Combine rating and sentiment (weighted)
        # Rating is more reliable, so give it 70% weight
        overall_score = (avg_rating * 0.7) + ((avg_sentiment + 1) * 2.5 * 0.3)

        return round(overall_score, 2)

    def analyze_sentiment_distribution(
        self, reviews: List[Dict[str, any]]
    ) -> Dict[str, int]:
        """Analyze sentiment distribution across reviews"""
        distribution = {"positive": 0, "neutral": 0, "negative": 0}

        for review in reviews:
            text = review.get("text", "")
            sentiment_score = self.calculate_sentiment_score(text)
            sentiment_class = self.classify_sentiment(sentiment_score)
            distribution[sentiment_class] += 1

        return distribution

    def identify_sentiment_trend(self, reviews: List[Dict[str, any]]) -> str:
        """
        Identify overall sentiment trend
        Returns: string describing the trend
        """
        distribution = self.analyze_sentiment_distribution(reviews)
        total = sum(distribution.values())

        if total == 0:
            return "No reviews available"

        pos_pct = (distribution["positive"] / total) * 100
        neg_pct = (distribution["negative"] / total) * 100

        if pos_pct > 70:
            return f"Overwhelmingly Positive ({pos_pct:.1f}% positive)"
        elif pos_pct > 50:
            return f"Mostly Positive ({pos_pct:.1f}% positive)"
        elif neg_pct > 50:
            return f"Mostly Negative ({neg_pct:.1f}% negative)"
        elif neg_pct > 30:
            return f"Mixed with Negative Lean ({neg_pct:.1f}% negative)"
        else:
            return f"Balanced/Mixed ({pos_pct:.1f}% positive, {neg_pct:.1f}% negative)"

    def analyze_aspects(
        self, reviews: List[Dict[str, any]]
    ) -> Dict[str, Dict[str, float]]:
        """Analyze sentiment for different product aspects"""
        aspect_sentiments = defaultdict(list)

        for review in reviews:
            text = review.get("text", "")
            sentences = self.extract_sentences(text)

            for sentence in sentences:
                aspect = self.identify_aspect(sentence)
                sentiment = self.calculate_sentiment_score(sentence)
                aspect_sentiments[aspect].append(sentiment)

        # Calculate average sentiment per aspect
        aspect_summary = {}
        for aspect, sentiments in aspect_sentiments.items():
            aspect_summary[aspect] = {
                "avg_sentiment": round(np.mean(sentiments), 2),
                "mention_count": len(sentiments),
            }

        return aspect_summary

    # --- 💡 NEW FUNCTION 💡 ---
    def _generate_executive_summary(self, summary_data: ReviewSummary) -> str:
        """Generates a 2-3 line executive summary. Uses <b> tags for HTML bolding."""

        # Start with the main sentiment trend
        summary_text = (
            f"The {summary_data.total_reviews} reviews show a "
            f"<b>{summary_data.sentiment_trend.lower()}</b> sentiment, "
            f"with an average score of <b>{summary_data.overall_score:.1f}/5.0</b>. "
        )

        # Find the most-mentioned positive and negative aspects
        try:
            aspects = summary_data.detailed_insights.get("aspect_analysis", {})

            if aspects:
                # Sort aspects by mention count
                sorted_aspects = sorted(
                    aspects.items(),
                    key=lambda item: item[1]["mention_count"],
                    reverse=True,
                )

                # Find top positive aspect (sentiment > 0.2)
                top_positive_aspect = "general praise"  # default
                for aspect, data in sorted_aspects:
                    if data["avg_sentiment"] > 0.2:
                        top_positive_aspect = aspect.replace("_", " ")
                        break

                # Find top negative aspect (sentiment < -0.2)
                top_negative_aspect = ""  # default
                for aspect, data in sorted_aspects:
                    if data["avg_sentiment"] < -0.2:
                        top_negative_aspect = aspect.replace("_", " ")
                        break

                # Build the second sentence
                summary_text += (
                    f"Customers frequently praised the <b>{top_positive_aspect}</b>. "
                )
                if top_negative_aspect:
                    summary_text += f"However, some concerns were raised about <b>{top_negative_aspect}</b>."

            elif summary_data.pros:
                # Fallback if aspect analysis is empty but pros exist
                top_pro_text = summary_data.pros[0][0].split(":", 1)[0]
                summary_text += (
                    f"Customers particularly loved the <b>{top_pro_text}</b>."
                )

        except (KeyError, IndexError, TypeError, RuntimeError) as e:
            # Fallback in case aspect analysis fails
            print(f"Error generating aspect part of summary: {e}", file=sys.stderr)
            if summary_data.pros:
                top_pro_text = summary_data.pros[0][0].split(":", 1)[0]
                summary_text += (
                    f"Customers particularly loved the <b>{top_pro_text}</b>."
                )

        return summary_text.strip()

    # --- 💡 MODIFIED FUNCTION 💡 ---
    def summarize_reviews(self, reviews: List[Dict[str, any]]) -> ReviewSummary:
        """
        Main method to summarize reviews

        Args:
            reviews: List of review dicts with 'text' and 'rating' keys

        Returns:
            ReviewSummary object with all analysis results
        """
        if not reviews:
            raise ValueError("No reviews provided")

        print(f"Analyzing {len(reviews)} reviews...")

        # Extract pros and cons
        print("Extracting pros and cons...")
        pros, cons = self.extract_pros_cons(reviews)

        # Extract keywords
        print("Extracting keywords...")
        keywords = self.extract_keywords(reviews)

        # Calculate scores and distributions
        print("Calculating sentiment scores...")
        overall_score = self.calculate_overall_score(reviews)
        sentiment_distribution = self.analyze_sentiment_distribution(reviews)
        sentiment_trend = self.identify_sentiment_trend(reviews)

        # Analyze aspects
        print("Analyzing product aspects...")
        aspect_analysis = self.analyze_aspects(reviews)

        # Create detailed insights
        detailed_insights = {
            "aspect_analysis": aspect_analysis,
            "rating_distribution": self._get_rating_distribution(reviews),
            "average_review_length": np.mean([len(r.get("text", "")) for r in reviews]),
        }

        print("Summary complete! Generating executive summary...")

        # Create the initial summary object (with a temporary value)
        summary = ReviewSummary(
            overall_score=overall_score,
            total_reviews=len(reviews),
            sentiment_distribution=sentiment_distribution,
            pros=pros,
            cons=cons,
            top_keywords=keywords,
            sentiment_trend=sentiment_trend,
            detailed_insights=detailed_insights,
            executive_summary="",  # <-- Set as empty for now
        )

        # Now, generate the exec summary using the data we just created
        summary.executive_summary = self._generate_executive_summary(summary)

        return summary  # This summary object now includes the executive_summary string

    def _get_rating_distribution(self, reviews: List[Dict[str, any]]) -> Dict[int, int]:
        """Get distribution of star ratings"""
        distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        for review in reviews:
            rating = review.get("rating", 3)
            if 1 <= rating <= 5:
                distribution[rating] += 1
        return distribution

    def generate_summary_report(self, summary: ReviewSummary) -> str:
        """Generate a human-readable summary report"""
        report = []
        report.append("=" * 80)
        report.append("PRODUCT REVIEW SUMMARY")
        report.append("=" * 80)

        # 💡 ADDED Exec Summary to report
        report.append("\nEXECUTIVE SUMMARY:")
        report.append(
            re.sub(r"<b>|</b>", "", summary.executive_summary)
        )  # Remove HTML tags for text report

        report.append(f"\nTotal Reviews Analyzed: {summary.total_reviews}")
        report.append(f"Overall Score: {summary.overall_score}/5.0 ⭐")
        report.append(f"Sentiment Trend: {summary.sentiment_trend}")
        report.append("\n" + "-" * 80)

        # Sentiment Distribution
        report.append("\nSENTIMENT DISTRIBUTION:")
        total = sum(summary.sentiment_distribution.values())
        for sentiment, count in summary.sentiment_distribution.items():
            pct = (count / total * 100) if total > 0 else 0
            report.append(f"  {sentiment.capitalize()}: {count} ({pct:.1f}%)")

        # Top Pros
        report.append("\n" + "-" * 80)
        report.append("\nTOP PROS (What customers love):")
        for i, (pro, count) in enumerate(summary.pros[:5], 1):
            report.append(f"  {i}. {pro} (mentioned {count} times)")

        # Top Cons
        report.append("\n" + "-" * 80)
        report.append("\nTOP CONS (Common complaints):")
        for i, (con, count) in enumerate(summary.cons[:5], 1):
            report.append(f"  {i}. {con} (mentioned {count} times)")

        # Top Keywords
        report.append("\n" + "-" * 80)
        report.append("\nTOP KEYWORDS:")
        keywords_str = ", ".join(
            [f"{kw} ({count})" for kw, count in summary.top_keywords[:15]]
        )
        report.append(f"  {keywords_str}")

        # Aspect Analysis
        report.append("\n" + "-" * 80)
        report.append("\nASPECT ANALYSIS:")
        aspect_analysis = summary.detailed_insights.get("aspect_analysis", {})
        for aspect, data in sorted(
            aspect_analysis.items(), key=lambda x: x[1]["mention_count"], reverse=True
        ):
            sentiment = data["avg_sentiment"]
            count = data["mention_count"]
            sentiment_icon = (
                "✅" if sentiment > 0.2 else "⚠️" if sentiment < -0.2 else "➖"
            )
            report.append(
                f"  {sentiment_icon} {aspect.replace('_', ' ').title()}: "
                f"{sentiment:.2f} sentiment ({count} mentions)"
            )

        # Rating Distribution
        report.append("\n" + "-" * 80)
        report.append("\nRATING DISTRIBUTION:")
        rating_dist = summary.detailed_insights.get("rating_distribution", {})
        for rating in range(5, 0, -1):
            count = rating_dist.get(rating, 0)
            bar = "★" * rating + "☆" * (5 - rating)
            pct = (
                (count / summary.total_reviews * 100)
                if summary.total_reviews > 0
                else 0
            )
            report.append(f"  {bar}: {count} ({pct:.1f}%)")

        report.append("\n" + "=" * 80)

        return "\n".join(report)


# Example usage and demo
def create_sample_reviews():
    """Create sample product reviews for demonstration"""
    return [
        {
            "rating": 5,
            "text": "Absolutely love this product! The quality is excellent and it arrived quickly. Very comfortable and easy to use. Highly recommend to anyone looking for great value.",
        },
        {
            "rating": 4,
            "text": "Good product overall. The design is beautiful and build quality is solid. Only complaint is that it's a bit expensive, but you get what you pay for.",
        },
        {
            "rating": 5,
            "text": "Best purchase I've made in a long time! So happy with the performance. Fast, reliable, and the customer service was outstanding when I had questions.",
        },
        {
            "rating": 2,
            "text": "Disappointed with this purchase. The product broke after just two weeks. Poor durability and not worth the price. Customer service was slow to respond.",
        },
        {
            "rating": 3,
            "text": "It's okay. Does what it's supposed to do but nothing special. The material feels a bit cheap. Shipping was fast though.",
        },
        {
            "rating": 5,
            "text": "Excellent quality! Very durable and sturdy construction. Love the design and it's super comfortable. Worth every penny.",
        },
        {
            "rating": 1,
            "text": "Terrible product. Broke on first use. Cheap materials and poor construction. Complete waste of money. Would not recommend to anyone.",
        },
        {
            "rating": 4,
            "text": "Pretty good! The performance exceeded my expectations. Only minor issue is the packaging could be better. Otherwise very satisfied.",
        },
        {
            "rating": 5,
            "text": "Amazing! The build quality is superb and it looks beautiful. Very easy to set up and use. Customer service helped me quickly when I had a question.",
        },
        {
            "rating": 3,
            "text": "Average product. It works fine but nothing impressive. The price is reasonable but I expected better quality for the cost.",
        },
        {
            "rating": 4,
            "text": "Very pleased with this purchase. Good value for money. The design is nice and it's quite comfortable. Delivery was on time.",
        },
        {
            "rating": 2,
            "text": "Not happy with this. The quality is poor and it feels flimsy. Had issues with delivery being delayed. Customer support wasn't helpful.",
        },
    ]


if __name__ == "__main__":
    # Create summarizer instance
    summarizer = ReviewSummarizer()

    # Load sample reviews
    reviews = create_sample_reviews()

    # Analyze reviews
    summary = summarizer.summarize_reviews(reviews)

    # Generate and print report
    report = summarizer.generate_summary_report(summary)
    print(report)

    # Export to JSON
    print("\n\nExporting summary to JSON...")
    summary_dict = asdict(summary)
    # <-- MODIFIED: Changed file path to be local
    with open("review_summary.json", "w") as f:
        json.dump(summary_dict, f, indent=2)
    print("Summary exported to review_summary.json")
