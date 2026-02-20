// import axios from "axios";

// const API = axios.create({
//   baseURL: "http://127.0.0.1:8000",
// });

// export const startEmailAgent = () => API.post("/start-email-agent");

// export const getEmailStatus = () => API.get("/email-agent-status");

// export const updateATSThreshold = (value) =>
//   API.post(`/update-ats-threshold/${value}`);

import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

export const analyzeResume = (formData) => API.post("/analyze", formData);

export const startEmailAgent = () => API.post("/start-email-agent");

export const getEmailStatus = () => API.get("/email-agent-status");

export const updateATSThreshold = (value) =>
  API.post(`/update-ats-threshold/${value}`);

export const getAgentLog = () => API.get("/agent-log");

export const getCandidates = () => API.get("/candidates");

export const sendReport = (email, analysisResults) =>
  API.post("/send-report", { email, analysis_results: analysisResults });

export default API;