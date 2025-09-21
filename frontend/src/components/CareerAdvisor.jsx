import React, { useState } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const API_URL = "http://127.0.0.1:8000";

export default function CareerAdvisor() {
  const [skills, setSkills] = useState([]);
  const [analysis, setAnalysis] = useState([]);
  const [atsScore, setAtsScore] = useState(null);
  const [loading, setLoading] = useState(false);

  // Upload resume file
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    const res = await axios.post(`${API_URL}/upload-resume-file`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    setSkills(res.data.skills);
    setLoading(false);
  };

  // Run analysis
  const handleAnalysis = async () => {
    const res = await axios.get(`${API_URL}/analysis?skills=${skills.join(",")}`);
    setAnalysis(res.data.recommendations);
  };

  // ATS score
  const handleATSScore = async () => {
    const resume = { text: skills.join(" ") };
    const job = { text: "Looking for Python, SQL, Machine Learning, Data Analysis" };
    const res = await axios.post(`${API_URL}/ats-score`, { ...resume, ...job });
    setAtsScore(res.data);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-6">AI Career Advisor</h1>

      {/* Upload */}
      <Card className="mb-6">
        <CardContent>
          <h2 className="text-xl font-semibold mb-2">Upload Resume</h2>
          <input type="file" onChange={handleFileUpload} />
          {loading && <p className="text-sm text-gray-500">Extracting skills...</p>}
          {skills.length > 0 && (
            <div className="mt-3">
              <p className="font-semibold">Skills Detected:</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {skills.map((s, i) => (
                  <span key={i} className="px-2 py-1 bg-blue-100 rounded-md text-sm">{s}</span>
                ))}
              </div>
              <Button className="mt-4" onClick={handleAnalysis}>
                Get Career Analysis
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis */}
      {analysis.length > 0 && (
        <Card className="mb-6">
          <CardContent>
            <h2 className="text-xl font-semibold mb-2">Career Matches</h2>
            {analysis.map((rec, i) => (
              <div key={i} className="p-3 border rounded-lg mb-3">
                <h3 className="font-bold">
                  {rec.role} ({rec.match_score}% match)
                </h3>

                {/* Role Description */}
                {rec.role_description && (
                  <p className="text-sm text-gray-700 mt-1">
                    <strong>📝 Role Description: </strong>
                    {rec.role_description}
                  </p>
                )}

                {/* Advice */}
                {rec.advice && (
                  <p className="text-sm text-gray-600 mt-2">
                    <strong>💡 Advice:</strong> {rec.advice}
                  </p>
                )}

                {/* Skills */}
                <p className="text-sm mt-2">
                  <strong>✅ Have:</strong> {rec.have.join(", ") || "None"}
                </p>
                <p className="text-sm">
                  <strong>❌ Missing:</strong> {rec.missing.join(", ") || "None"}
                </p>

                {/* Learning Path */}
                {rec.learning_path && (
                  <div className="mt-2">
                    <p className="font-semibold">📚 Learning Path:</p>
                    <ul className="list-disc list-inside text-sm">
                      {Object.entries(rec.learning_path).map(([skill, resources], idx) => (
                        <li key={idx}>
                          {skill}: {resources.join(", ")}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
            <Button onClick={handleATSScore}>Check ATS Score</Button>
          </CardContent>
        </Card>
      )}

      {/* ATS Score */}
      {atsScore && (
        <Card>
          <CardContent>
            <h2 className="text-xl font-semibold mb-2">ATS Resume Score</h2>
            <Progress value={atsScore.ats_score} className="mb-2" />
            <p className="text-sm">Score: {atsScore.ats_score}%</p>
            <p className="text-sm">Matched Keywords: {atsScore.matched_keywords.join(", ")}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
