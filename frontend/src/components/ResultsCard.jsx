import React from "react";

export default function ResultsCard({ data }) {
  const progress = Math.round(
    (data.have.length / (data.have.length + data.missing.length)) * 100
  );

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300">
      <h3 className="text-xl font-bold text-purple-700 mb-2">{data.role}</h3>
      <div className="mb-2">
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-green-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <span className="text-sm text-gray-600">
          {progress}% skills matched
        </span>
      </div>

      <div className="mb-2">
        <strong className="text-gray-700">Have Skills:</strong>
        <div className="flex flex-wrap gap-2 mt-1">
          {data.have.map((s, i) => (
            <span
              key={i}
              className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium"
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      <div>
        <strong className="text-gray-700">Missing Skills:</strong>
        <div className="flex flex-wrap gap-2 mt-1">
          {data.missing.map((s, i) => (
            <span
              key={i}
              className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium"
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
