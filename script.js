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
                                }>⭐️⭐️⭐️ - Poor</option>
                                <option value="1" ${
                                  review.rating === 1 ? "selected" : ""
                                }>⭐️⭐️⭐️ - Terrible</option>
                            </select>
                        </div>
                    </div>
                    <button class="btn btn-remove" onclick="removeReview(this)">Remove</button>
                `;
    container.appendChild(newReview);
  });

  alert('Sample data loaded! Click "Analyze Reviews" to see the results.');
}

async function analyzeReviews() {
  // 1. Collect reviews from the DOM
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

  // 2. Show loading state
  const resultsDiv = document.getElementById("results");
  resultsDiv.style.display = "block";
  resultsDiv.innerHTML = `
    <div class="summary-card" style="text-align: center;">
        <div class="loader" aria-hidden="true"></div>
        <h2 style="color: #2c3e50; margin-top: 15px;">🧠 Analyzing Reviews...</h2>
        <p style="color: #7f8c8d; font-size: 1.1em;">
            Please wait while the Python NLP model processes the data.
        </p>
    </div>
`;

  resultsDiv.scrollIntoView({ behavior: "smooth", block: "start" });

  // 3. Call the Python Flask API
  try {
    const response = await fetch("http://127.0.0.1:5000/summarize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reviews: reviews }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const summary = await response.json();

    // 4. Display the results from the Python backend
    displayResults(summary);
  } catch (error) {
    console.error("Error fetching analysis:", error);
    resultsDiv.innerHTML = `
            <div class="summary-card" style="background: #f8d7da; border-color: #f5c6cb;">
                <h2 style="color: #721c24;">❌ Connection Error</h2>
                <p style="color: #721c24;">Could not connect to the analysis server.</p>
                <p style="margin-top: 10px; color: #721c24; font-weight: 500;">
                    Please make sure the Python server is running in your terminal: <br><code>python3 app.py</code>
                </p>
            </div>
        `;
  }
}

/**
 * 💡 CHANGED: This function is updated to split the pro/con strings
 * and add the new executive summary.
 */
function displayResults(summary) {
  const resultsDiv = document.getElementById("results");
  const { positive, neutral, negative } = summary.sentiment_distribution;
  const total = positive + neutral + negative;

  // Use the sentiment_trend string directly from Python
  const sentimentTrend = summary.sentiment_trend;

  /**
   * 💡 NEW: Helper function to parse the pro/con string
   * e.g., "quality: The text..."
   */
  const formatProCon = (item) => {
    const parts = item[0].split(":", 2);
    const aspect = parts.length > 1 ? parts[0].trim() : "general";
    const text = parts.length > 1 ? parts[1].trim() : item[0];

    return `
      <li>
          <span class="item-text">
              <span class="aspect-tag">${aspect}</span>
              ${text}
          </span>
          <span class="frequency-badge">${item[1]}</span>
      </li>
    `;
  };

  resultsDiv.innerHTML = `
                <h2 class="section-title">Analysis Results</h2>

                <div class="summary-card">
                
                    <!-- 💡 NEW: Executive Summary Section 💡 -->
                    <div class="exec-summary-container" style="margin-bottom: 25px; border-bottom: 2px solid #e8eef3; padding-bottom: 20px;">
                        <h3 style="font-size: 1.4em; margin-bottom: 10px; color: #2c3e50;">Executive Summary</h3>
                        <p style="color: #34495e; font-size: 1.05em; line-height: 1.6;">
                            ${summary.executive_summary}
                        </p>
                    </div>
                    <!-- End of Executive Summary -->

                    <div class="summary-header">
                        <div>
                            <!-- 💡 Changed title to avoid "Summary" twice -->
                            <h3 style="font-size: 1.4em; margin-bottom: 10px; color: #2c3e50;">Overall Analysis</h3>
                            <p style="color: #7f8c8d; font-size: 1.05em;">${sentimentTrend} (${
    summary.total_reviews
  } reviews analyzed)</p>
                        </div>
                        <div class="score-circle">
                            <div class="score">${summary.overall_score.toFixed(
                              1
                            )}</div>
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
                                    .map(formatProCon) // 💡 CHANGED
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
                                    .map(formatProCon) // 💡 CHANGED
                                    .join("")
                                : '<li><span class="item-text">No significant concerns identified</span></li>'
                            }
                        </ul>
                    </div>
                </div>

                <div class="aspect-analysis">
                    <h3>Aspect-Level Analysis</h3>
                    ${
                      // Access data via summary.detailed_insights.aspect_analysis
                      Object.entries(summary.detailed_insights.aspect_analysis)
                        .filter(([_, data]) => data.mention_count > 0)
                        .sort((a, b) => b[1].mention_count - a[1].mention_count)
                        .map(([aspect, data]) => {
                          // Use avg_sentiment from Python
                          const sentimentScore = data.avg_sentiment;
                          const sentimentClass =
                            sentimentScore > 0.2
                              ? "positive"
                              : sentimentScore < -0.2
                              ? "negative"
                              : "neutral";
                          const indicator =
                            sentimentScore > 0.2
                              ? "Positive"
                              : sentimentScore < -0.2
                              ? "Negative"
                              : "Neutral";

                          // Convert sentiment score (-1 to 1) to a 0-100% range for the bar
                          const percentage = ((sentimentScore + 1) / 2) * 100;

                          return `
                                <div class="aspect-item">
                                    <div class="aspect-header">
                                        <span class="aspect-name">${
                                          // Simple title case for aspect key
                                          aspect
                                            .replace("_", " ")
                                            .charAt(0)
                                            .toUpperCase() +
                                          aspect.replace("_", " ").slice(1)
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
                                              data.mention_count
                                            } mentions</span>
                                        </span>
                                    </div>
                                    <div class="progress-bar">
                                        <div class="progress-fill progress-${sentimentClass}" style="width: ${percentage}%"></div>
                                    </div>
                                </div>
                            `;
                        })
                        .join("")
                    }
                </div>

                <div class="keywords-section">
                    <h3>Frequently Mentioned Keywords</h3>
                    <div class="keyword-cloud">
                        ${
                          // Use top_keywords from Python
                          summary.top_keywords
                            .map(
                              // Python returns [word, count]
                              (kw) => `
                            <span class="keyword-tag">${kw[0]} (${kw[1]})</span>
                        `
                            )
                            .join("")
                        }
                    </div>
                </div>
            `;

  resultsDiv.style.display = "block";
  resultsDiv.scrollIntoView({ behavior: "smooth", block: "start" });
}
