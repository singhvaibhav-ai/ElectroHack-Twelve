const sampleReviews = [
  {
    rating: 5,
    text: "Absolutely love this product! The quality is excellent and it arrived quickly. Very comfortable and easy to use. Highly recommend to anyone looking for great value.",
  },
  {
    rating: 4,
    text: "Good product overall. The design is beautiful and build quality is solid. Only complaint is that it's a bit expensive, but you get what you pay for.",
  },
  {
    rating: 5,
    text: "Best purchase I've made in a long time! So happy with the performance. Fast, reliable, and the customer service was outstanding when I had questions.",
  },
  {
    rating: 2,
    text: "Disappointed with this purchase. The product broke after just two weeks. Poor durability and not worth the price. Customer service was slow to respond.",
  },
  {
    rating: 3,
    text: "It's okay. Does what it's supposed to do but nothing special. The material feels a bit cheap. Shipping was fast though.",
  },
  {
    rating: 5,
    text: "Excellent quality! Very durable and sturdy construction. Love the design and it's super comfortable. Worth every penny.",
  },
  {
    rating: 1,
    text: "Terrible product. Broke on first use. Cheap materials and poor construction. Complete waste of money. Would not recommend to anyone.",
  },
  {
    rating: 4,
    text: "Pretty good! The performance exceeded my expectations. Only minor issue is the packaging could be better. Otherwise very satisfied.",
  },
];

function addReviewInput() {
  const container = document.getElementById("reviewsContainer");
  const newReview = document.createElement("div");
  newReview.className = "review-input-container";
  newReview.innerHTML = `
                <div class="review-input">
                    <textarea placeholder="Enter review text..." class="review-text"></textarea>
                    <div class="rating-select">
                        <label>Rating:</label>
                        <select class="review-rating">
                            <option value="5" selected>
                      ⭐️⭐️⭐️⭐️⭐️ - Excellent
                    </option>
                    <option value="4">⭐️⭐️⭐️⭐️ - Good</option>
                    <option value="3">⭐️⭐️⭐️ - Average</option>
                    <option value="2">⭐️⭐️ - Poor</option>
                    <option value="1">⭐️ - Terrible</option>
                        </select>
                    </div>
                </div>
                <button class="btn btn-remove" onclick="removeReview(this)">Remove</button>
            `;
  container.appendChild(newReview);
}

function removeReview(button) {
  button.parentElement.remove();
}

function loadSampleData() {
  const container = document.getElementById("reviewsContainer");
  container.innerHTML = "";

  sampleReviews.forEach((review, index) => {
    const newReview = document.createElement("div");
    newReview.className = "review-input-container";
    newReview.innerHTML = `
                    <div class="review-input">
                        <textarea placeholder="Enter review text..." class="review-text">${
                          review.text
                        }</textarea>
                        <div class="rating-select">
                            <label>Rating:</label>
                            <select class="review-rating">
                                <option value="5" ${
                                  review.rating === 5 ? "selected" : ""
                                }>⭐️⭐️⭐️⭐️⭐️ - Excellent</option>
                                <option value="4" ${
                                  review.rating === 4 ? "selected" : ""
                                }>⭐️⭐️⭐️⭐️ - Good</option>
                                <option value="3" ${
                                  review.rating === 3 ? "selected" : ""
                                }>⭐️⭐️⭐️ - Average</option>
                                <option value="2" ${
                                  review.rating === 2 ? "selected" : ""
                                }>⭐️⭐️ - Poor</option>
                                <option value="1" ${
                                  review.rating === 1 ? "selected" : ""
                                }>⭐️ - Terrible</option>
                            </select>
                        </div>
                    </div>
                    <button class="btn btn-remove" onclick="removeReview(this)">Remove</button>
                `;
    container.appendChild(newReview);
  });

  alert('Sample data loaded! Click "Analyze Reviews" to see the results.');
}

function analyzeReviews() {
  // Collect reviews
  const reviewInputs = document.querySelectorAll(".review-input-container");
  const reviews = [];

  reviewInputs.forEach((input) => {
    const text = input.querySelector(".review-text").value.trim();
    const rating = parseInt(input.querySelector(".review-rating").value);
    if (text) {
      reviews.push({ text, rating });
    }
  });

  if (reviews.length === 0) {
    alert("Please add at least one review!");
    return;
  }

  // Analyze reviews (simplified version)
  const summary = analyzeReviewsData(reviews);
  displayResults(summary);
}

function analyzeReviewsData(reviews) {
  // Calculate basic metrics
  const totalReviews = reviews.length;
  const avgRating =
    reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

  // Count sentiment
  let positive = 0,
    neutral = 0,
    negative = 0;
  reviews.forEach((r) => {
    if (r.rating >= 4) positive++;
    else if (r.rating <= 2) negative++;
    else neutral++;
  });

  // Extract keywords
  const allText = reviews.map((r) => r.text.toLowerCase()).join(" ");
  const words = allText.match(/\b\w{4,}\b/g) || [];
  const wordCount = {};
  const stopwords = [
    "this",
    "that",
    "with",
    "have",
    "from",
    "they",
    "been",
    "were",
    "just",
    "very",
    "about",
  ];

  words.forEach((word) => {
    if (!stopwords.includes(word)) {
      wordCount[word] = (wordCount[word] || 0) + 1;
    }
  });

  const topKeywords = Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word, count]) => ({ word, count }));

  // Extract pros and cons
  const pros = extractProsCons(reviews, true);
  const cons = extractProsCons(reviews, false);

  // Aspect analysis
  const aspects = analyzeAspects(reviews);

  return {
    totalReviews,
    overallScore: avgRating.toFixed(2),
    sentimentDistribution: { positive, neutral, negative },
    pros,
    cons,
    keywords: topKeywords,
    aspects,
  };
}

function extractProsCons(reviews, isPositive) {
  const phrases = {};
  const targetRatings = isPositive ? [4, 5] : [1, 2];

  reviews.forEach((review) => {
    if (targetRatings.includes(review.rating)) {
      const sentences = review.text
        .split(/[.!?]+/)
        .filter((s) => s.trim().length > 20);
      sentences.forEach((sentence) => {
        const key = sentence.trim().substring(0, 60) + "...";
        phrases[key] = (phrases[key] || 0) + 1;
      });
    }
  });

  return Object.entries(phrases)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([text, count]) => ({ text, count }));
}

function analyzeAspects(reviews) {
  const aspects = {
    quality: {
      mentions: 0,
      sentiment: 0,
      keywords: ["quality", "build", "material"],
    },
    price: {
      mentions: 0,
      sentiment: 0,
      keywords: ["price", "value", "expensive", "cheap", "cost"],
    },
    design: {
      mentions: 0,
      sentiment: 0,
      keywords: ["design", "look", "beautiful", "style"],
    },
    performance: {
      mentions: 0,
      sentiment: 0,
      keywords: ["performance", "work", "fast", "reliable"],
    },
    comfort: {
      mentions: 0,
      sentiment: 0,
      keywords: ["comfort", "comfortable", "easy"],
    },
  };

  reviews.forEach((review) => {
    const text = review.text.toLowerCase();
    Object.keys(aspects).forEach((aspect) => {
      const found = aspects[aspect].keywords.some((keyword) =>
        text.includes(keyword)
      );
      if (found) {
        aspects[aspect].mentions++;
        aspects[aspect].sentiment += review.rating - 3;
      }
    });
  });

  return aspects;
}

function displayResults(summary) {
  const resultsDiv = document.getElementById("results");
  const { positive, neutral, negative } = summary.sentimentDistribution;
  const total = positive + neutral + negative;

  const sentimentTrend =
    positive / total > 0.6
      ? "Mostly Positive"
      : negative / total > 0.3
      ? "Mixed with Concerns"
      : "Balanced";

  resultsDiv.innerHTML = `
                <h2 class="section-title">Analysis Results</h2>

                <div class="summary-card">
                    <div class="summary-header">
                        <div>
                            <h3 style="font-size: 1.4em; margin-bottom: 10px; color: #2c3e50;">Overall Summary</h3>
                            <p style="color: #7f8c8d; font-size: 1.05em;">${sentimentTrend} (${
    summary.totalReviews
  } reviews analyzed)</p>
                        </div>
                        <div class="score-circle">
                            <div class="score">${summary.overallScore}</div>
                            <div class="label">out of 5.0</div>
                        </div>
                    </div>

                    <div class="sentiment-badges">
                        <div class="badge badge-positive">
                            <strong>Positive:</strong> ${positive} (${(
    (positive / total) *
    100
  ).toFixed(1)}%)
                        </div>
                        <div class="badge badge-neutral">
                            <strong>Neutral:</strong> ${neutral} (${(
    (neutral / total) *
    100
  ).toFixed(1)}%)
                        </div>
                        <div class="badge badge-negative">
                            <strong>Negative:</strong> ${negative} (${(
    (negative / total) *
    100
  ).toFixed(1)}%)
                        </div>
                    </div>
                </div>

                <div class="grid-2">
                    <div class="pros-cons-card">
                        <h3>Top Strengths</h3>
                        <ul class="pros-cons-list">
                            ${
                              summary.pros.length > 0
                                ? summary.pros
                                    .map(
                                      (pro) => `
                                <li>
                                    <span class="item-text">${pro.text}</span>
                                    <span class="frequency-badge">${pro.count}</span>
                                </li>
                            `
                                    )
                                    .join("")
                                : '<li><span class="item-text">No specific strengths identified</span></li>'
                            }
                        </ul>
                    </div>

                    <div class="pros-cons-card">
                        <h3>Key Concerns</h3>
                        <ul class="pros-cons-list">
                            ${
                              summary.cons.length > 0
                                ? summary.cons
                                    .map(
                                      (con) => `
                                <li>
                                    <span class="item-text">${con.text}</span>
                                    <span class="frequency-badge">${con.count}</span>
                                </li>
                            `
                                    )
                                    .join("")
                                : '<li><span class="item-text">No significant concerns identified</span></li>'
                            }
                        </ul>
                    </div>
                </div>

                <div class="aspect-analysis">
                    <h3>Aspect-Level Analysis</h3>
                    ${Object.entries(summary.aspects)
                      .filter(([_, data]) => data.mentions > 0)
                      .sort((a, b) => b[1].mentions - a[1].mentions)
                      .map(([aspect, data]) => {
                        const sentimentScore = data.sentiment / data.mentions;
                        const sentimentClass =
                          sentimentScore > 0.5
                            ? "positive"
                            : sentimentScore < -0.5
                            ? "negative"
                            : "neutral";
                        const indicator =
                          sentimentScore > 0.5
                            ? "Positive"
                            : sentimentScore < -0.5
                            ? "Negative"
                            : "Neutral";
                        const percentage = (
                          ((sentimentScore + 3) / 6) *
                          100
                        ).toFixed(0);

                        return `
                                <div class="aspect-item">
                                    <div class="aspect-header">
                                        <span class="aspect-name">${
                                          aspect.charAt(0).toUpperCase() +
                                          aspect.slice(1)
                                        }</span>
                                        <span>
                                            <span class="sentiment-indicator" style="color: ${
                                              sentimentClass === "positive"
                                                ? "#27ae60"
                                                : sentimentClass === "negative"
                                                ? "#e74c3c"
                                                : "#f39c12"
                                            }">${indicator}</span>
                                            <span style="color: #7f8c8d; font-size: 0.9em; margin-left: 8px;">${
                                              data.mentions
                                            } mentions</span>
                                        </span>
                                    </div>
                                    <div class="progress-bar">
                                        <div class="progress-fill progress-${sentimentClass}" style="width: ${percentage}%"></div>
                                    </div>
                                </div>
                            `;
                      })
                      .join("")}
                </div>

                <div class="keywords-section">
                    <h3>Frequently Mentioned Keywords</h3>
                    <div class="keyword-cloud">
                        ${summary.keywords
                          .map(
                            (kw) => `
                            <span class="keyword-tag">${kw.word} (${kw.count})</span>
                        `
                          )
                          .join("")}
                    </div>
                </div>
            `;

  resultsDiv.style.display = "block";
  resultsDiv.scrollIntoView({ behavior: "smooth", block: "start" });
}
