// src/api.js
export const API_BASE = "http://localhost:8000/api"; // change if needed

export async function fetchData(endpoint) {
  const res = await fetch(`${API_BASE}/${endpoint}/`);
  if (!res.ok) throw new Error("Failed to fetch data");
  return res.json();
}

export async function postData(endpoint, data) {
  const res = await fetch(`${API_BASE}/${endpoint}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Failed to create record");
  }
  return res.json();
}
