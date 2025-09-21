import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import axios from "axios";
import ResultsCard from "./components/ResultsCard";
import "./index.css";

function App() {
  const [skills, setSkills] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ Upload resume file
  const handleUpload = async (e) => {
    setLoading(true);
    setError("");
    setSkills([]);
    setRecommendations([]);

    const file = e.target.files[0];
    if (!file) {
      setError("Please select a file.");
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      console.log("Uploading file:", file.name, file.type);

      const res = await axios.post(
        "http://127.0.0.1:8000/upload-resume-file",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      console.log("Backend response:", res.data);
      setSkills(res.data.skills || []);
    } catch (err) {
      console.error("Upload error:", err.response || err);
      setError("Failed to process file or connect to backend.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch recommendations from backend
  const getRecommendations = async () => {
    if (skills.length === 0) return;
    setLoading(true);
    setError("");
    try {
      const res = await axios.get("http://127.0.0.1:8000/analysis", {
        params: { skills: skills.join(",") },
      });
      setRecommendations(res.data.recommendations || []);
    } catch (err) {
      console.error("Recommendation error:", err.response || err);
      setError("Failed to fetch recommendations. Ensure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-purple-50 p-6">
      <h1 className="text-3xl font-bold text-center text-purple-700 mb-6">
        AI Career Advisor
      </h1>

      {/* Upload Section */}
      <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <input
            type="file"
            onChange={handleUpload}
            className="border p-2 rounded flex-1"
            accept=".txt,.pdf,.jpg,.jpeg,.png"
          />
          <button
            onClick={getRecommendations}
            className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 transition"
            disabled={skills.length === 0 || loading}
          >
            Analyze Resume
          </button>
        </div>

        {loading && <p className="text-center text-gray-500">Processing file...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}

        {/* Skills Display */}
        <div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Detected Skills:</h2>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, idx) => (
              <span
                key={idx}
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium shadow-sm"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="max-w-4xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {recommendations.length > 0 ? (
          recommendations.map((rec, idx) => <ResultsCard key={idx} data={rec} />)
        ) : (
          <p className="text-center text-gray-500">
            No recommendations available. Upload a resume with skills to get started.
          </p>
        )}
      </div>
    </div>
  );
}

// ✅ React 18 rendering
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
