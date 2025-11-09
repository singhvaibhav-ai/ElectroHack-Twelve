from flask import Flask, request, jsonify
from flask_cors import CORS
from review_summarizer import ReviewSummarizer, ReviewSummary
from dataclasses import asdict
import sys  # for printing errors

# Initialize Flask app and CORS
app = Flask(__name__)
# This allows your frontend (on a file:// URL) to talk to your backend
CORS(app)

# Create one instance of the summarizer
try:
    summarizer = ReviewSummarizer()
    print("✅ ReviewSummarizer loaded successfully.")
except Exception as e:
    print(f"❌ Error loading ReviewSummarizer: {e}", file=sys.stderr)
    summarizer = None


@app.route("/summarize", methods=["POST"])
def handle_summarize():
    if summarizer is None:
        return jsonify({"error": "Summarizer failed to initialize."}), 500

    data = request.get_json()
    if not data or "reviews" not in data:
        return jsonify({"error": "No reviews data provided"}), 400

    reviews = data.get("reviews")
    if not isinstance(reviews, list) or len(reviews) == 0:
        return jsonify({"error": "Reviews must be a non-empty list"}), 400

    print(f"Processing {len(reviews)} reviews...")

    try:
        # Run the summary using your existing class
        summary = summarizer.summarize_reviews(reviews)

        # Convert the Python dataclass object to a dictionary
        summary_dict = asdict(summary)

        print("✅ Analysis complete. Sending summary.")
        return jsonify(summary_dict)

    except ValueError as ve:
        print(f"❌ Value Error: {ve}", file=sys.stderr)
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        print(f"❌ An unexpected error occurred: {e}", file=sys.stderr)
        return jsonify({"error": "An internal server error occurred"}), 500


if __name__ == "__main__":
    print("Starting Flask server at http://127.0.0.1:5000")
    app.run(debug=True, port=5000)
