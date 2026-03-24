import React, { useState, useRef, useEffect } from 'react';
import {
  Upload, FileText, Brain, TrendingUp, CheckCircle, AlertCircle, Award,
  Target, Zap, Sparkles, BarChart3, Users, Clock, Star, ArrowRight,
  RefreshCw, Menu, X, Home, Info, Phone, FileQuestion, Shield,
  Github, Linkedin, Twitter, Mail, MapPin, ChevronRight, Book, Lightbulb,
  LogOut, Search,
} from 'lucide-react';
import { startEmailAgent, getEmailStatus, getAgentLog, sendReport } from "./services/api";
import CandidateDashboard from "./CandidateDashboard";
import BusinessMailCenter from "./BusinessMailCenter";
import { AuthProvider, useAuth } from "./AuthContext";
import LoginPage from "./LoginPage";
import NotificationBell from "./NotificationBell";
import AnalyticsDashboard from "./AnalyticsDashboard";
import SearchFilter from "./SearchFilter";

// ── Email Agent Control ────────────────────────────────────────────────────────
const EmailAgentControl = () => {
  const [status,   setStatus]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [agentLog, setAgentLog] = useState([]);

  const handleStartAgent = async () => {
    setLoading(true); setStatus(null);
    try {
      const res = await startEmailAgent();
      setStatus(res.data.message || "Email agent started!");
    } catch (err) {
      setStatus(err.response?.data?.message || "Failed to start email agent. Is the backend running?");
    } finally { setLoading(false); }
  };

  const handleCheckStatus = async () => {
    setLoading(true); setStatus(null);
    try {
      const res = await getEmailStatus();
      setStatus(res.data.active ? "Email agent is running." : "Email agent is not running.");
    } catch { setStatus("Could not check status."); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const id = setInterval(async () => {
      try { const res = await getAgentLog(); setAgentLog(res.data || []); } catch {}
    }, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bg-white rounded-xl shadow p-6 my-6 max-w-md mx-auto">
      <h2 className="text-lg font-bold mb-2">Email Agent Control</h2>
      <button onClick={handleStartAgent} disabled={loading} className="bg-indigo-600 text-white px-4 py-2 rounded mr-2">
        {loading ? "Starting..." : "Start Email Agent"}
      </button>
      <button onClick={handleCheckStatus} disabled={loading} className="bg-gray-200 text-gray-800 px-4 py-2 rounded">
        Check Status
      </button>
      {status && <div className="mt-4 text-sm">{status}</div>}
      {agentLog.length > 0 && (
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded p-3 text-xs text-gray-700">
          <div className="font-semibold mb-2 text-indigo-700">Recent Agent Activity</div>
          <ul className="space-y-1">
            {agentLog.map((log, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="text-green-600">•</span> {log}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// ── Main App (requires auth) ───────────────────────────────────────────────────
const ResumeAnalyzer = () => {
  const { user, token, logout } = useAuth();

  const [file,                setFile]                = useState(null);
  const [jobRole,             setJobRole]             = useState('software_engineer');
  const [customJobDescription,setCustomJobDescription]= useState('');
  const [useCustomJob,        setUseCustomJob]        = useState(false);
  const [analyzing,           setAnalyzing]           = useState(false);
  const [results,             setResults]             = useState(null);
  const [error,               setError]               = useState(null);
  const [mobileMenuOpen,      setMobileMenuOpen]      = useState(false);
  const [activeSection,       setActiveSection]       = useState('home');
  const [emailAddress,        setEmailAddress]        = useState('');
  const [sendingEmail,        setSendingEmail]        = useState(false);
  const [emailSent,           setEmailSent]           = useState(false);

  // Refs for all sections
  const homeRef      = useRef(null);
  const featuresRef  = useRef(null);
  const agentRef     = useRef(null);
  const analyzerRef  = useRef(null);
  const guideRef     = useRef(null);
  const businessRef  = useRef(null);
  const analyticsRef = useRef(null);
  const searchRef    = useRef(null);

  const jobRoles = {
    software_engineer:   { name: 'Software Engineer',   skills: ['python','javascript','react','node.js','sql','git','docker'] },
    data_scientist:      { name: 'Data Scientist',       skills: ['python','machine learning','tensorflow','pandas','sql'] },
    product_manager:     { name: 'Product Manager',      skills: ['product strategy','roadmap','agile','analytics'] },
    ui_ux_designer:      { name: 'UI/UX Designer',       skills: ['figma','sketch','prototyping','user research'] },
    devops_engineer:     { name: 'DevOps Engineer',      skills: ['kubernetes','docker','jenkins','ci/cd','aws'] },
    full_stack_developer:{ name: 'Full Stack Developer', skills: ['react','node.js','mongodb','express','typescript'] },
  };

  const scrollToSection = (ref, section) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
    setActiveSection(section);
    setMobileMenuOpen(false);
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const ext = f.name.split('.').pop().toLowerCase();
    if (['pdf','docx','txt'].includes(ext)) { setFile(f); setError(null); }
    else { setError('Please upload a PDF, DOCX, or TXT file'); setFile(null); }
  };

  const generateAISummary = () => ({
    professional_summary: 'Experienced professional with strong technical capabilities and proven track record of successful project delivery.',
    key_strengths: [
      'Strong technical foundation with diverse skill set',
      'Proven track record of successful project delivery',
      'Excellent problem-solving and analytical abilities',
      'Good communication and team collaboration skills',
    ],
    career_highlights: [
      'Demonstrated expertise in core technologies',
      'Successfully completed multiple projects',
      'Continuous learning and skill development',
      'Strong alignment with best practices',
    ],
    contact_info: { name: 'Candidate', email: 'Available in resume', phone: 'Available in resume' },
  });

  const analyzeResume = async () => {
    if (!file) { setError('Please upload a resume first'); return; }
    if (useCustomJob && !customJobDescription.trim()) { setError('Please enter a job description'); return; }
    setAnalyzing(true); setError(null); setResults(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (useCustomJob) formData.append('job_description', customJobDescription);
      else              formData.append('job_role', jobRole);

      const response = await fetch('http://localhost:8000/analyze', { method: 'POST', body: formData });
      if (!response.ok) {
        let msg = 'Analysis failed';
        try { const d = await response.json(); msg = d.detail || msg; } catch {}
        throw new Error(msg);
      }
      const data = await response.json();
      setResults({ ...data, ai_summary: generateAISummary() });
      setTimeout(() => analyzerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 500);
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const getScoreGrade = (score) => {
    if (score >= 90) return { grade: 'A+', label: 'Excellent' };
    if (score >= 80) return { grade: 'A',  label: 'Very Good' };
    if (score >= 70) return { grade: 'B',  label: 'Good' };
    if (score >= 60) return { grade: 'C',  label: 'Average' };
    return { grade: 'D', label: 'Needs Improvement' };
  };

  const handleSendEmail = async () => {
    if (!emailAddress) { setError('Please enter an email address'); return; }
    setSendingEmail(true);
    try {
      const res = await fetch('http://localhost:8000/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailAddress, analysis_results: results }),
      });
      if (!res.ok) throw new Error('Failed');
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 5000);
    } catch { setError('Could not send email. Is the backend running?'); }
    finally { setSendingEmail(false); }
  };

  const ScoreCard = ({ title, score, icon: Icon, gradient, description }) => (
    <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:-translate-y-1">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-lg">{title}</h3>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
        </div>
        <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{score}</div>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-3">
        <div className={`h-3 rounded-full bg-gradient-to-r ${gradient} transition-all duration-1000`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );

  // Nav items — all sections
  const NAV = [
    { ref: homeRef,      section: 'home',      icon: Home,     label: 'Home'       },
    { ref: featuresRef,  section: 'features',  icon: Star,     label: 'Features'   },
    { ref: agentRef,     section: 'agent',     icon: Mail,     label: 'Agent'      },
    { ref: analyzerRef,  section: 'analyzer',  icon: Zap,      label: 'Analyzer'   },
    { ref: businessRef,  section: 'business',  icon: Users,    label: 'Mail Center'},
    { ref: analyticsRef, section: 'analytics', icon: BarChart3,label: 'Analytics'  },
    { ref: searchRef,    section: 'search',    icon: Search,   label: 'Search'     },
    { ref: guideRef,     section: 'guide',     icon: Book,     label: 'Guide'      },
  ];

  const ROLE_BADGE = {
    admin:   "bg-indigo-600 text-white",
    hr:      "bg-green-600 text-white",
    finance: "bg-amber-600 text-white",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
      </div>

      {/* ── Navbar ── */}
      <nav className="bg-white/90 backdrop-blur-md shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => scrollToSection(homeRef, 'home')}>
              <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  AI AgenticHire
                </h1>
                <p className="text-xs text-gray-500">Powered by NLP & Agentic AI</p>
              </div>
            </div>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-5">
              {NAV.map(({ ref, section, icon: Icon, label }) => (
                <button
                  key={section}
                  onClick={() => scrollToSection(ref, section)}
                  className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${
                    activeSection === section ? 'text-indigo-600' : 'text-gray-600 hover:text-indigo-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* Right side: user info + notifications + logout */}
            <div className="hidden lg:flex items-center gap-3">
              {user && (
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${ROLE_BADGE[user.role] || "bg-gray-200 text-gray-700"}`}>
                    {user.role.toUpperCase()}
                  </span>
                  <span className="text-sm font-semibold text-gray-700">{user.name}</span>
                </div>
              )}
              <NotificationBell token={token} />
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl font-semibold text-sm transition-all"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>

            {/* Mobile hamburger */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-4 border-t">
              <div className="flex flex-col gap-3">
                {NAV.map(({ ref, section, icon: Icon, label }) => (
                  <button
                    key={section}
                    onClick={() => scrollToSection(ref, section)}
                    className="flex items-center gap-2 font-semibold text-gray-600 hover:text-indigo-600 py-1"
                  >
                    <Icon className="w-4 h-4" /> {label}
                  </button>
                ))}
                <button onClick={logout} className="flex items-center gap-2 text-red-600 font-semibold mt-2">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="relative">
        {/* ── Hero ── */}
        <section ref={homeRef} className="container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-block mb-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-indigo-100 rounded-full">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-semibold text-indigo-600">AI-Powered Resume Analysis</span>
              </div>
            </div>
            <h1 className="text-6xl md:text-7xl font-black mb-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
              Transform Your Resume Into Your Dream Job
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Get instant, AI-powered feedback with explainable scoring, personalized suggestions, and industry-leading NLP technology.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <button
                onClick={() => scrollToSection(analyzerRef, 'analyzer')}
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:shadow-2xl transition-all flex items-center gap-2"
              >
                Analyze Your Resume <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => scrollToSection(analyticsRef, 'analytics')}
                className="px-8 py-4 bg-white text-gray-700 rounded-xl font-bold text-lg hover:shadow-lg transition-all border-2 border-gray-200"
              >
                View Analytics
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
              <div className="text-center"><div className="text-4xl font-black text-indigo-600 mb-2">5+</div><div className="text-sm text-gray-600">Scoring Metrics</div></div>
              <div className="text-center"><div className="text-4xl font-black text-purple-600 mb-2">6</div><div className="text-sm text-gray-600">Job Roles</div></div>
              <div className="text-center"><div className="text-4xl font-black text-pink-600 mb-2">AI</div><div className="text-sm text-gray-600">Powered</div></div>
              <div className="text-center"><div className="text-4xl font-black text-blue-600 mb-2">100%</div><div className="text-sm text-gray-600">Free</div></div>
            </div>
          </div>
        </section>

        {/* ── Email Agent + Candidate Dashboard ── */}
        <div ref={agentRef} className="container mx-auto px-4">
          <EmailAgentControl />
          <CandidateDashboard />
        </div>

        {/* ── Features ── */}
        <section ref={featuresRef} className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Everything you need to create a winning resume</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: FileText, gradient: 'from-blue-500 to-cyan-500',    title: 'ATS Compatibility',    desc: 'Ensure your resume passes Applicant Tracking Systems with our advanced compatibility scoring.' },
              { icon: CheckCircle, gradient: 'from-green-500 to-emerald-500', title: 'Skills Matching', desc: 'Compare your skills against job requirements and identify gaps instantly.' },
              { icon: Brain, gradient: 'from-purple-500 to-pink-500',     title: 'AI Summary',           desc: 'Get an intelligent summary of your resume with key strengths and highlights.' },
              { icon: TrendingUp, gradient: 'from-orange-500 to-red-500', title: 'Experience Analysis',  desc: 'Evaluate the strength and impact of your professional experience.' },
              { icon: Sparkles, gradient: 'from-pink-500 to-rose-500',    title: 'Smart Suggestions',    desc: 'Receive personalized recommendations to improve your resume effectiveness.' },
              { icon: Target, gradient: 'from-indigo-500 to-purple-500',  title: 'AI Agent Automation',  desc: 'Send your resume via email and get automatic analysis and results.' },
            ].map(({ icon: Icon, gradient, title, desc }) => (
              <div key={title} className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all">
                <div className={`p-4 bg-gradient-to-br ${gradient} rounded-xl w-fit mb-6`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{title}</h3>
                <p className="text-gray-600">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Resume Analyzer ── */}
        <section ref={analyzerRef} className="container mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Analyze Your Resume</h2>
            <p className="text-xl text-gray-600">Upload your resume and get instant AI-powered feedback</p>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 mb-8 max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8">
              <div>
                <label className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" /> Upload Your Resume
                </label>
                <input type="file" onChange={handleFileChange} accept=".pdf,.docx,.txt" className="hidden" id="resume-upload" />
                <label htmlFor="resume-upload" className="flex flex-col items-center gap-4 p-8 border-2 border-dashed border-indigo-300 rounded-2xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all">
                  <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl">
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-center">
                    <span className="text-gray-700 font-semibold block mb-1">{file ? file.name : 'Click to upload'}</span>
                    <span className="text-gray-500 text-sm">PDF, DOCX, or TXT</span>
                  </div>
                </label>
                {file && (
                  <div className="mt-4 flex items-center gap-3 p-4 bg-green-50 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-semibold text-green-700">{file.name}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600" /> Target Job Role
                </label>
                <div className="flex gap-3 mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                  <button
                    onClick={() => setUseCustomJob(false)}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${!useCustomJob ? 'bg-white shadow-md text-purple-700' : 'text-gray-600'}`}
                  >
                    Predefined Roles
                  </button>
                  <button
                    onClick={() => setUseCustomJob(true)}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${useCustomJob ? 'bg-white shadow-md text-purple-700' : 'text-gray-600'}`}
                  >
                    Custom Description
                  </button>
                </div>
                {!useCustomJob ? (
                  <select
                    value={jobRole}
                    onChange={e => setJobRole(e.target.value)}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 bg-white font-medium text-gray-700"
                  >
                    {Object.entries(jobRoles).map(([key, role]) => (
                      <option key={key} value={key}>{role.name}</option>
                    ))}
                  </select>
                ) : (
                  <textarea
                    value={customJobDescription}
                    onChange={e => setCustomJobDescription(e.target.value)}
                    placeholder="Paste job description here..."
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 font-medium text-gray-700 resize-none"
                    rows="6"
                  />
                )}
              </div>
            </div>

            <button
              onClick={analyzeResume}
              disabled={!file || analyzing}
              className="mt-8 w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-5 rounded-2xl font-bold text-lg hover:shadow-2xl disabled:opacity-50 transition-all flex items-center justify-center gap-3"
            >
              {analyzing ? <><RefreshCw className="w-6 h-6 animate-spin" />Analyzing…</> : <><Zap className="w-6 h-6" />Analyze Resume</>}
            </button>

            {error && (
              <div className="mt-6 p-5 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center gap-3 text-red-700">
                <AlertCircle className="w-6 h-6" />
                <span className="font-semibold">{error}</span>
              </div>
            )}
          </div>

          {results && (
            <div className="space-y-8 max-w-6xl mx-auto">
              {results.ai_summary && (
                <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl shadow-2xl p-8 text-white">
                  <div className="flex items-center gap-3 mb-6">
                    <Brain className="w-10 h-10" />
                    <h2 className="text-3xl font-black">AI Resume Summary</h2>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6">
                    <h3 className="text-xl font-bold mb-3">Professional Summary</h3>
                    <p className="text-indigo-50">{results.ai_summary.professional_summary}</p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                      <h3 className="text-xl font-bold mb-4">Key Strengths</h3>
                      <ul className="space-y-3">
                        {results.ai_summary.key_strengths.map((s, i) => (
                          <li key={i} className="flex gap-2"><ChevronRight className="w-5 h-5 mt-0.5" /><span>{s}</span></li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                      <h3 className="text-xl font-bold mb-4">Career Highlights</h3>
                      <ul className="space-y-3">
                        {results.ai_summary.career_highlights.map((h, i) => (
                          <li key={i} className="flex gap-2"><ChevronRight className="w-5 h-5 mt-0.5" /><span>{h}</span></li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl shadow-2xl p-10 text-white">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div>
                    <h2 className="text-3xl font-black mb-2">Overall Score</h2>
                    <p className="text-indigo-100">Resume quality for {useCustomJob ? 'Custom Role' : jobRoles[jobRole]?.name}</p>
                  </div>
                  <div className="text-center">
                    <div className="text-8xl font-black">{results.overall_score}</div>
                    <div className="text-2xl font-bold">Grade: {getScoreGrade(results.overall_score).grade}</div>
                  </div>
                </div>
              </div>

              {/* Email report */}
              <div className="bg-white rounded-3xl shadow-xl p-8 border-2 border-indigo-100">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="p-4 bg-indigo-100 rounded-2xl">
                    <Mail className="w-8 h-8 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">Email Your Report</h3>
                    <p className="text-gray-600">Get a copy of this analysis sent to your inbox.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
                    <input
                      type="email"
                      placeholder="yourname@example.com"
                      value={emailAddress}
                      onChange={e => setEmailAddress(e.target.value)}
                      className="px-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none min-w-[250px]"
                    />
                    <button
                      onClick={handleSendEmail}
                      disabled={sendingEmail}
                      className={`px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${emailSent ? 'bg-green-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg'}`}
                    >
                      {sendingEmail ? <RefreshCw className="w-5 h-5 animate-spin" /> : null}
                      {emailSent ? <><CheckCircle className="w-5 h-5" /> Sent!</> : 'Send Report'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Detailed scores */}
              <div>
                <h2 className="text-3xl font-black text-gray-900 mb-6">Detailed Analysis</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <ScoreCard title="ATS Compatibility" score={results.scores.ats_compatibility}  icon={FileText}    gradient="from-blue-500 to-cyan-500"    description="Pass screening" />
                  <ScoreCard title="Skills Match"       score={results.scores.skills_match}       icon={CheckCircle} gradient="from-green-500 to-emerald-500"  description="Skills coverage" />
                  <ScoreCard title="Experience"         score={results.scores.experience_strength}icon={Award}       gradient="from-purple-500 to-pink-500"    description="Quality" />
                  <ScoreCard title="Formatting"         score={results.scores.formatting_quality} icon={TrendingUp}  gradient="from-orange-500 to-red-500"    description="Structure" />
                  <ScoreCard title="Keywords"           score={results.scores.keyword_optimization}icon={Zap}        gradient="from-pink-500 to-rose-500"     description="Optimization" />
                </div>
              </div>

              {/* Skills */}
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white">
                <h2 className="text-3xl font-black text-gray-900 mb-6 flex items-center gap-3">
                  <Target className="w-8 h-8 text-purple-600" />Skills Analysis
                </h2>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-green-700 text-xl flex items-center gap-2"><CheckCircle className="w-6 h-6" />Found Skills</h3>
                      <span className="bg-green-100 text-green-700 px-4 py-1 rounded-full font-bold">{results.skills_analysis.found_skills.length}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {results.skills_analysis.found_skills.map((skill, idx) => (
                        <span key={idx} className="px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-xl text-sm font-semibold border border-green-200">✓ {skill}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-red-700 text-xl flex items-center gap-2"><AlertCircle className="w-6 h-6" />Missing Skills</h3>
                      <span className="bg-red-100 text-red-700 px-4 py-1 rounded-full font-bold">{results.skills_analysis.missing_skills.length}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {results.skills_analysis.missing_skills.map((skill, idx) => (
                        <span key={idx} className="px-4 py-2 bg-gradient-to-r from-red-100 to-pink-100 text-red-800 rounded-xl text-sm font-semibold border border-red-200">✗ {skill}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Suggestions */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl shadow-2xl p-8 border-2 border-indigo-200">
                <h2 className="text-3xl font-black text-gray-900 mb-6 flex items-center gap-3">
                  <Sparkles className="w-8 h-8 text-yellow-500" />AI-Powered Suggestions
                </h2>
                <div className="space-y-4">
                  {results.suggestions.map((suggestion, idx) => (
                    <div key={idx} className="flex items-start gap-4 p-5 bg-white rounded-2xl border-2 border-indigo-100 hover:shadow-lg transition-all">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-xl flex items-center justify-center text-lg font-black">
                        {idx + 1}
                      </div>
                      <p className="text-gray-700 font-medium pt-1.5">{suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Document stats */}
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white">
                <h2 className="text-3xl font-black text-gray-900 mb-6 flex items-center gap-3">
                  <BarChart3 className="w-8 h-8 text-indigo-600" />Document Statistics
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[
                    { icon: FileText, color: 'indigo',  value: results.extracted_info.total_words,                  label: 'Total Words' },
                    { icon: Clock,    color: 'purple',  value: results.extracted_info.years_of_experience,           label: 'Years Experience' },
                    { icon: Target,   color: 'green',   value: results.skills_analysis.total_skills_found,           label: 'Skills Found' },
                    { icon: Users,    color: 'yellow',  value: results.extracted_info.sections_found.length,         label: 'Sections' },
                  ].map(({ icon: Icon, color, value, label }) => (
                    <div key={label} className={`p-6 bg-gradient-to-br from-${color}-50 to-${color}-100 rounded-2xl border border-${color}-200 text-center hover:shadow-lg transition-all`}>
                      <Icon className={`w-8 h-8 text-${color}-600 mx-auto mb-3`} />
                      <div className={`text-4xl font-black text-${color}-600 mb-1`}>{value}</div>
                      <div className="text-gray-600 font-semibold">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ── Business Mail Center ── */}
        <div ref={businessRef} className="container mx-auto px-4 py-10">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-black text-gray-900 mb-2">🏢 Business Mail Center</h2>
            <p className="text-gray-500">Smart categorisation · Auto-replies · Draft follow-ups</p>
          </div>
          <BusinessMailCenter />
        </div>

        {/* ── Analytics ── */}
        <div ref={analyticsRef} className="bg-white/40">
          <AnalyticsDashboard token={token} />
        </div>

        {/* ── Search & Filter ── */}
        <div ref={searchRef}>
          <SearchFilter token={token} />
        </div>

        {/* ── Guide ── */}
        <section ref={guideRef} className="container mx-auto px-4 py-20 bg-white/30">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Quick Start Guide</h2>
              <p className="text-xl text-gray-600">Get started in 3 simple steps</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {[
                { num: 1, gradient: 'from-indigo-600 to-purple-600', title: 'Upload Resume',  desc: 'Select your resume file (PDF, DOCX, or TXT). Make sure it contains your experience, education, and skills.' },
                { num: 2, gradient: 'from-purple-600 to-pink-600',   title: 'Choose Role',    desc: 'Select from 6 predefined roles or paste a custom job description for personalised analysis.' },
                { num: 3, gradient: 'from-pink-600 to-red-600',      title: 'Get Insights',   desc: 'Receive instant AI feedback with scores, skills analysis, and actionable improvement tips.' },
              ].map(({ num, gradient, title, desc }) => (
                <div key={num} className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all border border-white">
                  <div className={`w-16 h-16 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg mb-6 mx-auto`}>{num}</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">{title}</h3>
                  <p className="text-gray-600 text-center">{desc}</p>
                </div>
              ))}
            </div>
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Lightbulb className="w-7 h-7 text-yellow-300" />Pro Tips for Best Results
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  'Use clear section headings (Experience, Education, Skills)',
                  'Include quantifiable achievements with numbers',
                  'Match keywords from the job description',
                  'Keep resume between 400-700 words',
                ].map(tip => (
                  <div key={tip} className="flex items-start gap-3">
                    <ChevronRight className="w-5 h-5 flex-shrink-0 mt-1" />
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ── Footer ── */}
      <footer className="relative bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 text-white pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black">AI AgenticHire</h3>
                  <p className="text-xs text-gray-400">Enterprise HR Intelligence</p>
                </div>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed mb-4">
                Transform your HR pipeline with AI-powered insights and enterprise automation.
              </p>
              <div className="flex gap-3">
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"><Github className="w-5 h-5" /></a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"><Linkedin className="w-5 h-5" /></a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"><Twitter className="w-5 h-5" /></a>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                {[
                  { ref: homeRef,      section: 'home',      label: 'Home'          },
                  { ref: analyzerRef,  section: 'analyzer',  label: 'Analyzer'      },
                  { ref: analyticsRef, section: 'analytics', label: 'Analytics'     },
                  { ref: guideRef,     section: 'guide',     label: 'User Guide'    },
                ].map(({ ref, section, label }) => (
                  <li key={section}>
                    <button onClick={() => scrollToSection(ref, section)} className="text-gray-300 hover:text-white transition-colors flex items-center gap-2">
                      <ChevronRight className="w-4 h-4" />{label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">Legal</h4>
              <ul className="space-y-2">
                {[
                  { icon: Shield,       label: 'Privacy Policy' },
                  { icon: FileQuestion, label: 'Terms of Service' },
                  { icon: Info,         label: 'About Us' },
                  { icon: Phone,        label: 'Contact' },
                ].map(({ icon: Icon, label }) => (
                  <li key={label}>
                    <a href="#" className="text-gray-300 hover:text-white transition-colors flex items-center gap-2">
                      <Icon className="w-4 h-4" />{label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">Contact Us</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-gray-300">
                  <Mail className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-400">Email</div>
                    <a href="mailto:harshitshahaaai906@gmail.com" className="hover:text-white transition-colors">harshitshahaaai906@gmail.com</a>
                  </div>
                </li>
                <li className="flex items-start gap-2 text-gray-300">
                  <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-400">Location</div>
                    <span>Bhubaneswar, Odisha, India</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8">
            <p className="text-gray-400 text-sm text-center">
              © 2026 AI AgenticHire. All rights reserved. Built with ❤️ using React, FastAPI & NLP.
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes blob {
          0%   { transform: translate(0px, 0px) scale(1); }
          33%  { transform: translate(30px, -50px) scale(1.1); }
          66%  { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 7s infinite; }
      `}</style>
    </div>
  );
};

// ── Auth gate ──────────────────────────────────────────────────────────────────
const AppContent = () => {
  const { user, loading } = useAuth();
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem("agh_token"));

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="text-5xl mb-4">⚙️</div>
        <p className="font-semibold text-lg">Loading AI AgenticHire…</p>
      </div>
    </div>
  );

  if (!loggedIn || !user) return <LoginPage onLogin={() => setLoggedIn(true)} />;
  return <ResumeAnalyzer />;
};

const App = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;



