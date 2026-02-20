// import React, { useState, useRef } from 'react';
// import { Upload, FileText, Brain, TrendingUp, CheckCircle, AlertCircle, Award, Target, Zap, Sparkles, BarChart3, Users, Clock, Star, ArrowRight, RefreshCw, Menu, X, Home, Info, Phone, FileQuestion, Shield, Github, Linkedin, Twitter, Mail, MapPin, ChevronRight, Book, Lightbulb } from 'lucide-react';
// import { startEmailAgent, getEmailStatus } from "./services/api";
// import CandidateDashboard from "./CandidateDashboard";

// const EmailAgentControl = () => {
//   const [status, setStatus] = useState(null);
//   const [loading, setLoading] = useState(false);

//   const handleStartAgent = async () => {
//     setLoading(true);
//     setStatus(null);
//     try {
//       const res = await startEmailAgent();
//       setStatus(res.data.message || "Email agent started!");
//     } catch (err) {
//       setStatus(
//         err.response?.data?.message ||
//         "Failed to start email agent. Is the backend running?"
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCheckStatus = async () => {
//     setLoading(true);
//     setStatus(null);
//     try {
//       const res = await getEmailStatus();
//       setStatus(
//         res.data.active
//           ? "Email agent is running."
//           : "Email agent is not running."
//       );
//     } catch {
//       setStatus("Could not check status.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="bg-white rounded-xl shadow p-6 my-6 max-w-md mx-auto">
//       <h2 className="text-lg font-bold mb-2">Email Agent Control</h2>
//       <button
//         onClick={handleStartAgent}
//         disabled={loading}
//         className="bg-indigo-600 text-white px-4 py-2 rounded mr-2"
//       >
//         {loading ? "Starting..." : "Start Email Agent"}
//       </button>
//       <button
//         onClick={handleCheckStatus}
//         disabled={loading}
//         className="bg-gray-200 text-gray-800 px-4 py-2 rounded"
//       >
//         Check Status
//       </button>
//       {status && <div className="mt-4 text-sm">{status}</div>}
//     </div>
     
//   )
// };

// const ResumeAnalyzer = () => {
//   const [file, setFile] = useState(null);
//   const [jobRole, setJobRole] = useState('software_engineer');
//   const [customJobDescription, setCustomJobDescription] = useState('');
//   const [useCustomJob, setUseCustomJob] = useState(false);
//   const [analyzing, setAnalyzing] = useState(false);
//   const [results, setResults] = useState(null);
//   const [error, setError] = useState(null);
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//   const [activeSection, setActiveSection] = useState('home');

//   const homeRef = useRef(null);
//   const featuresRef = useRef(null);
//   const agentRef = useRef(null);
//   const analyzerRef = useRef(null);
//   const guideRef = useRef(null);

//   const [emailAddress, setEmailAddress] = useState('');
//   const [sendingEmail, setSendingEmail] = useState(false);
//   const [emailSent, setEmailSent] = useState(false);

//   const jobRoles = {
//     software_engineer: {
//       name: 'Software Engineer',
//       skills: ['python', 'javascript', 'java', 'react', 'node.js', 'sql', 'git', 'api', 'docker', 'aws']
//     },
//     data_scientist: {
//       name: 'Data Scientist',
//       skills: ['python', 'machine learning', 'tensorflow', 'pandas', 'numpy', 'sql', 'statistics']
//     },
//     product_manager: {
//       name: 'Product Manager',
//       skills: ['product strategy', 'roadmap', 'agile', 'analytics', 'communication']
//     },
//     ui_ux_designer: {
//       name: 'UI/UX Designer',
//       skills: ['figma', 'sketch', 'prototyping', 'user research', 'design systems']
//     },
//     devops_engineer: {
//       name: 'DevOps Engineer',
//       skills: ['kubernetes', 'docker', 'jenkins', 'ci/cd', 'aws', 'terraform']
//     },
//     full_stack_developer: {
//       name: 'Full Stack Developer',
//       skills: ['react', 'node.js', 'mongodb', 'express', 'javascript', 'typescript']
//     }
//   };

//   const scrollToSection = (ref, section) => {
//     ref.current?.scrollIntoView({ behavior: 'smooth' });
//     setActiveSection(section);
//     setMobileMenuOpen(false);
//   };

//   const handleFileChange = (e) => {
//     const selectedFile = e.target.files[0];
//     if (selectedFile) {
//       const fileType = selectedFile.name.split('.').pop().toLowerCase();
//       if (fileType === 'pdf' || fileType === 'docx' || fileType === 'txt') {
//         setFile(selectedFile);
//         setError(null);
//       } else {
//         setError('Please upload a PDF, DOCX, or TXT file');
//         setFile(null);
//       }
//     }
//   };

//   const generateAISummary = () => {
//     return {
//       professional_summary: 'Experienced professional with strong technical capabilities and proven track record of successful project delivery. Demonstrates expertise in core technologies and methodologies with excellent problem-solving abilities.',
//       key_strengths: [
//         'Strong technical foundation with diverse skill set',
//         'Proven track record of successful project delivery',
//         'Excellent problem-solving and analytical abilities',
//         'Good communication and team collaboration skills'
//       ],
//       career_highlights: [
//         'Demonstrated expertise in core technologies',
//         'Successfully completed multiple projects',
//         'Continuous learning and skill development',
//         'Strong alignment with best practices'
//       ],
//       contact_info: {
//         name: 'Candidate',
//         email: 'Available in resume',
//         phone: 'Available in resume'
//       }
//     };
//   };

//   const analyzeResume = async () => {
//     if (!file) {
//       setError('Please upload a resume first');
//       return;
//     }

//     if (useCustomJob && !customJobDescription.trim()) {
//       setError('Please enter a job description');
//       return;
//     }

//     setAnalyzing(true);
//     setError(null);
//     setResults(null);

//     try {
//       const formData = new FormData();
//       formData.append('file', file);

//       if (useCustomJob) {
//         formData.append('job_description', customJobDescription);
//       } else {
//         formData.append('job_role', jobRole);
//       }

//       const response = await fetch('/api/analyze', {
//         method: 'POST',
//         body: formData,
//       });

//       let data;
//       if (!response.ok) {
//         // Try to parse error as JSON, otherwise use text
//         try {
//           const errorData = await response.json();
//           throw new Error(errorData.detail || 'Analysis failed');
//         } catch (jsonErr) {
//           const text = await response.text();
//           throw new Error(text || 'Analysis failed');
//         }
//       } else {
//         try {
//           data = await response.json();
//         } catch (jsonErr) {
//           setError('Received invalid response from server.');
//           setAnalyzing(false);
//           return;
//         }
//       }

//       const aiSummary = generateAISummary();
//       setResults({
//         ...data,
//         ai_summary: aiSummary
//       });

//       setTimeout(() => {
//         analyzerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
//       }, 500);
//     } catch (err) {
//       setError(err.message || 'Analysis failed. Please try again.');
//       console.error('Analysis error:', err);
//     } finally {
//       setAnalyzing(false);
//     }
//   };

//   const getScoreGrade = (score) => {
//     if (score >= 90) return { grade: 'A+', label: 'Excellent' };
//     if (score >= 80) return { grade: 'A', label: 'Very Good' };
//     if (score >= 70) return { grade: 'B', label: 'Good' };
//     if (score >= 60) return { grade: 'C', label: 'Average' };
//     return { grade: 'D', label: 'Needs Improvement' };
//   };

//   const handleSendEmail = async () => {
//     if (!emailAddress) {
//       setError('Please enter an email address');
//       return;
//     }

//     setSendingEmail(true);
//     try {
//       const response = await fetch('http://localhost:8000/send-report', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           email: emailAddress,
//           analysis_results: results,
//         }),
//       });

//       if (!response.ok) throw new Error('Failed to send email');

//       setEmailSent(true);
//       setTimeout(() => setEmailSent(false), 5000); // Reset success message after 5s
//     } catch (err) {
//       setError('Could not send the email. Is the backend running?');
//     } finally {
//       setSendingEmail(false);
//     }
//   };

//   const ScoreCard = ({ title, score, icon: Icon, gradient, description }) => (
//     <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:-translate-y-1">
//       <div className="flex items-center justify-between mb-4">
//         <div className="flex items-center gap-3">
//           <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
//             <Icon className="w-6 h-6 text-white" />
//           </div>
//           <div>
//             <h3 className="font-bold text-gray-800 text-lg">{title}</h3>
//             <p className="text-xs text-gray-500">{description}</p>
//           </div>
//         </div>
//         <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
//           {score}
//         </div>
//       </div>
//       <div className="w-full bg-gray-100 rounded-full h-3">
//         <div
//           className={`h-3 rounded-full bg-gradient-to-r ${gradient} transition-all duration-1000`}
//           style={{ width: `${score}%` }}
//         />
//       </div>
//     </div>
//   );

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
//       <div className="fixed inset-0 overflow-hidden pointer-events-none">
//         <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
//         <div className="absolute top-0 right-1/4 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
//         <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
//       </div>

//       <nav className=" bg-white/90 backdrop-blur-md shadow-lg sticky top-0 z-50">
//         <div className="container mx-auto px-4">
//           <div className="flex items-center justify-between h-20">
//             <div className="flex items-center gap-3 cursor-pointer" onClick={() => scrollToSection(homeRef, 'home')}>
//               <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl">
//                 <Brain className="w-8 h-8 text-white" />
//               </div>
//               <div>
//                 <h1 className="text-xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
//                   AI AgenticHire & Resume Analyzer
//                 </h1>
//                 <p className="text-xs text-gray-500">Powered by NLP and Agentic AI</p>
//               </div>
//             </div>

//             <div className="hidden md:flex items-center gap-8">
//               <button
//                 onClick={() => scrollToSection(homeRef, 'home')}
//                 className={`flex items-center gap-2 font-semibold transition-colors ${activeSection === 'home' ? 'text-indigo-600' : 'text-gray-600 hover:text-indigo-600'}`}
//               >
//                 <Home className="w-4 h-4" />
//                 Home
//               </button>
//               <button
//                 onClick={() => scrollToSection(featuresRef, 'features')}
//                 className={`flex items-center gap-2 font-semibold transition-colors ${activeSection === 'features' ? 'text-indigo-600' : 'text-gray-600 hover:text-indigo-600'}`}
//               >
//                 <Star className="w-4 h-4" />
//                 Features
//               </button>
//               <button
//                 onClick={() => scrollToSection(agentRef, 'agent')}
//                 className={`flex items-center gap-2 font-semibold transition-colors ${activeSection === 'agent' ? 'text-indigo-600' : 'text-gray-600 hover:text-indigo-600'}`}
//               >
//                 <Mail className="w-4 h-4" />
//                 Agent
//               </button>
//               <button
//                 onClick={() => scrollToSection(analyzerRef, 'analyzer')}
//                 className={`flex items-center gap-2 font-semibold transition-colors ${activeSection === 'analyzer' ? 'text-indigo-600' : 'text-gray-600 hover:text-indigo-600'
//                   }`}
//               >
//                 <Zap className="w-4 h-4" />
//                 Analyzer
//               </button>
//               <button
//                 onClick={() => scrollToSection(guideRef, 'guide')}
//                 className={`flex items-center gap-2 font-semibold transition-colors ${activeSection === 'guide' ? 'text-indigo-600' : 'text-gray-600 hover:text-indigo-600'
//                   }`}
//               >
//                 <Book className="w-4 h-4" />
//                 Guide
//               </button>
//               <button
//                 onClick={() => scrollToSection(analyzerRef, 'analyzer')}
//                 className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
//               >
//                 Get Started
//               </button>
//             </div>

//             <button
//               onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
//               className="md:hidden p-2 rounded-lg hover:bg-gray-100"
//             >
//               {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
//             </button>
//           </div>

//           {mobileMenuOpen && (
//             <div className="md:hidden py-4 border-t">
//               <div className="flex flex-col gap-4">
//                 <button onClick={() => scrollToSection(homeRef, 'home')} className="flex items-center gap-2 font-semibold text-gray-600">
//                   <Home className="w-4 h-4" /> Home
//                 </button>
//                 <button onClick={() => scrollToSection(featuresRef, 'features')} className="flex items-center gap-2 font-semibold text-gray-600">
//                   <Star className="w-4 h-4" /> Features
//                 </button>
//                 <button onClick={() => scrollToSection(agentRef, 'agent')} className="flex items-center gap-2 font-semibold text-gray-600">
//                   <Mail className="w-4 h-4" /> Agent
//                 </button>
//                 <button onClick={() => scrollToSection(analyzerRef, 'analyzer')} className="flex items-center gap-2 font-semibold text-gray-600">
//                   <Zap className="w-4 h-4" /> Analyzer
//                 </button>
//                 <button onClick={() => scrollToSection(guideRef, 'guide')} className="flex items-center gap-2 font-semibold text-gray-600">
//                   <Book className="w-4 h-4" /> Guide
//                 </button>
//               </div>
//             </div>
//           )}
//         </div>
//       </nav>

//       <div className="relative">
//         <section ref={homeRef} className="container mx-auto px-4 py-20">
//           <div className="text-center max-w-4xl mx-auto">
//             <div className="inline-block mb-6">
//               <div className="flex items-center gap-2 px-4 py-2 bg-indigo-100 rounded-full">
//                 <Sparkles className="w-4 h-4 text-indigo-600" />
//                 <span className="text-sm font-semibold text-indigo-600">AI-Powered Resume Analysis</span>
//               </div>
//             </div>

//             <h1 className="text-6xl md:text-7xl font-black mb-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
//               Transform Your Resume Into Your Dream Job
//             </h1>

//             <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
//               Get instant, AI-powered feedback on your resume with explainable scoring, personalized suggestions, and industry-leading NLP technology.
//             </p>

//             <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
//               <button
//                 onClick={() => scrollToSection(analyzerRef, 'analyzer')}
//                 className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:shadow-2xl transition-all flex items-center gap-2"
//               >
//                 Analyze Your Resume
//                 <ArrowRight className="w-5 h-5" />
//               </button>
//               <button
//                 onClick={() => scrollToSection(guideRef, 'guide')}
//                 className="px-8 py-4 bg-white text-gray-700 rounded-xl font-bold text-lg hover:shadow-lg transition-all border-2 border-gray-200"
//               >
//                 View Guide
//               </button>
//             </div>

//             <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
//               <div className="text-center">
//                 <div className="text-4xl font-black text-indigo-600 mb-2">5+</div>
//                 <div className="text-sm text-gray-600">Scoring Metrics</div>
//               </div>
//               <div className="text-center">
//                 <div className="text-4xl font-black text-purple-600 mb-2">6</div>
//                 <div className="text-sm text-gray-600">Job Roles</div>
//               </div>
//               <div className="text-center">
//                 <div className="text-4xl font-black text-pink-600 mb-2">AI</div>
//                 <div className="text-sm text-gray-600">Powered</div>
//               </div>
//               <div className="text-center">
//                 <div className="text-4xl font-black text-blue-600 mb-2">100%</div>
//                 <div className="text-sm text-gray-600">Free</div>
//               </div>
//             </div>
//           </div>
//         </section>

//         {/* Email Agent Control UI below Powerful Features */}
//         <div ref={agentRef} className="container mx-auto px-4">
//           <EmailAgentControl />
//         </div>

//         <section ref={featuresRef} className="container mx-auto px-4 py-20">
//           <div className="text-center mb-16">
//             <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
//               Powerful Features
//             </h2>
//             <p className="text-xl text-gray-600 max-w-2xl mx-auto">
//               Everything you need to create a winning resume
//             </p>
//           </div>

//           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
//             <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all">
//               <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl w-fit mb-6">
//                 <FileText className="w-8 h-8 text-white" />
//               </div>
//               <h3 className="text-2xl font-bold text-gray-900 mb-3">ATS Compatibility</h3>
//               <p className="text-gray-600">
//                 Ensure your resume passes Applicant Tracking Systems with our advanced compatibility scoring.
//               </p>
//             </div>

//             <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all">
//               <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl w-fit mb-6">
//                 <CheckCircle className="w-8 h-8 text-white" />
//               </div>
//               <h3 className="text-2xl font-bold text-gray-900 mb-3">Skills Matching</h3>
//               <p className="text-gray-600">
//                 Compare your skills against job requirements and identify gaps instantly.
//               </p>
//             </div>

//             <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all">
//               <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl w-fit mb-6">
//                 <Brain className="w-8 h-8 text-white" />
//               </div>
//               <h3 className="text-2xl font-bold text-gray-900 mb-3">AI Summary</h3>
//               <p className="text-gray-600">
//                 Get an intelligent summary of your resume with key strengths and highlights.
//               </p>
//             </div>

//             <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all">
//               <div className="p-4 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl w-fit mb-6">
//                 <TrendingUp className="w-8 h-8 text-white" />
//               </div>
//               <h3 className="text-2xl font-bold text-gray-900 mb-3">Experience Analysis</h3>
//               <p className="text-gray-600">
//                 Evaluate the strength and impact of your professional experience.
//               </p>
//             </div>

//             <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all">
//               <div className="p-4 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl w-fit mb-6">
//                 <Sparkles className="w-8 h-8 text-white" />
//               </div>
//               <h3 className="text-2xl font-bold text-gray-900 mb-3">Smart Suggestions</h3>
//               <p className="text-gray-600">
//                 Receive personalized recommendations to improve your resume effectiveness.
//               </p>
//             </div>

//             <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all">
//               <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl w-fit mb-6">
//                 <Target className="w-8 h-8 text-white" />
//               </div>
//               <h3 className="text-2xl font-bold text-gray-900 mb-3">AI agent automation</h3>
//               <p className="text-gray-600">
//                 Send your resume to <b>harshitshahaaai906@gmail.com</b>. it will automatically analyze your resume and send you the results.
//               </p>
//             </div>
//           </div>
//         </section>

//         <section ref={analyzerRef} className="container mx-auto px-4 py-20">
//           <div className="text-center mb-12">
//             <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
//               Analyze Your Resume
//             </h2>
//             <p className="text-xl text-gray-600">
//               Upload your resume and get instant AI-powered feedback
//             </p>
//           </div>

//           <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 mb-8 max-w-6xl mx-auto">
//             <div className="grid lg:grid-cols-2 gap-8">
//               <div>
//                 <label className=" text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
//                   <FileText className="w-5 h-5 text-indigo-600" />
//                   Upload Your Resume
//                 </label>
//                 <input
//                   type="file"
//                   onChange={handleFileChange}
//                   accept=".pdf,.docx,.txt"
//                   className="hidden"
//                   id="resume-upload"
//                 />
//                 <label
//                   htmlFor="resume-upload"
//                   className="flex flex-col items-center gap-4 p-8 border-2 border-dashed border-indigo-300 rounded-2xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all"
//                 >
//                   <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl">
//                     <Upload className="w-8 h-8 text-white" />
//                   </div>
//                   <div className="text-center">
//                     <span className="text-gray-700 font-semibold block mb-1">
//                       {file ? file.name : 'Click to upload'}
//                     </span>
//                     <span className="text-gray-500 text-sm">PDF, DOCX, or TXT</span>
//                   </div>
//                 </label>
//                 {file && (
//                   <div className="mt-4 flex items-center gap-3 p-4 bg-green-50 rounded-xl">
//                     <CheckCircle className="w-5 h-5 text-green-600" />
//                     <span className="text-sm font-semibold text-green-700">{file.name}</span>
//                   </div>
//                 )}
//               </div>

//               <div>
//                 <label className=" text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
//                   <Target className="w-5 h-5 text-purple-600" />
//                   Target Job Role
//                 </label>

//                 <div className="flex gap-3 mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
//                   <button
//                     onClick={() => setUseCustomJob(false)}
//                     className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${!useCustomJob ? 'bg-white shadow-md text-purple-700' : 'text-gray-600'
//                       }`}
//                   >
//                     Predefined Roles
//                   </button>
//                   <button
//                     onClick={() => setUseCustomJob(true)}
//                     className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${useCustomJob ? 'bg-white shadow-md text-purple-700' : 'text-gray-600'
//                       }`}
//                   >
//                     Custom Description
//                   </button>
//                 </div>

//                 {!useCustomJob ? (
//                   <select
//                     value={jobRole}
//                     onChange={(e) => setJobRole(e.target.value)}
//                     className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 bg-white font-medium text-gray-700"
//                   >
//                     {Object.entries(jobRoles).map(([key, role]) => (
//                       <option key={key} value={key}>{role.name}</option>
//                     ))}
//                   </select>
//                 ) : (
//                   <textarea
//                     value={customJobDescription}
//                     onChange={(e) => setCustomJobDescription(e.target.value)}
//                     placeholder="Paste job description here..."
//                     className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 font-medium text-gray-700 resize-none"
//                     rows="6"
//                   />
//                 )}
//               </div>
//             </div>

//             <button
//               onClick={analyzeResume}
//               disabled={!file || analyzing}
//               className="mt-8 w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-5 rounded-2xl font-bold text-lg hover:shadow-2xl disabled:opacity-50 transition-all flex items-center justify-center gap-3"
//             >
//               {analyzing ? (
//                 <>
//                   <RefreshCw className="w-6 h-6 animate-spin" />
//                   Analyzing...
//                 </>
//               ) : (
//                 <>
//                   <Zap className="w-6 h-6" />
//                   Analyze Resume
//                 </>
//               )}
//             </button>

//             {error && (
//               <div className="mt-6 p-5 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center gap-3 text-red-700">
//                 <AlertCircle className="w-6 h-6" />
//                 <span className="font-semibold">{error}</span>
//               </div>
//             )}
//           </div>

//           {results && (
//             <div className="space-y-8 max-w-6xl mx-auto">
//               {results.ai_summary && (
//                 <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl shadow-2xl p-8 text-white">
//                   <div className="flex items-center gap-3 mb-6">
//                     <Brain className="w-10 h-10" />
//                     <h2 className="text-3xl font-black">AI Resume Summary</h2>
//                   </div>

//                   <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6">
//                     <h3 className="text-xl font-bold mb-3">Professional Summary</h3>
//                     <p className="text-indigo-50">{results.ai_summary.professional_summary}</p>
//                   </div>

//                   <div className="grid md:grid-cols-2 gap-6">
//                     <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
//                       <h3 className="text-xl font-bold mb-4">Key Strengths</h3>
//                       <ul className="space-y-3">
//                         {results.ai_summary.key_strengths.map((strength, idx) => (
//                           <li key={idx} className="flex gap-2">
//                             <ChevronRight className="w-5 h-5 mt-0.5" />
//                             <span>{strength}</span>
//                           </li>
//                         ))}
//                       </ul>
//                     </div>

//                     <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
//                       <h3 className="text-xl font-bold mb-4">Career Highlights</h3>
//                       <ul className="space-y-3">
//                         {results.ai_summary.career_highlights.map((highlight, idx) => (
//                           <li key={idx} className="flex gap-2">
//                             <ChevronRight className="w-5 h-5 mt-0.5" />
//                             <span>{highlight}</span>
//                           </li>
//                         ))}
//                       </ul>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl shadow-2xl p-10 text-white">
//                 <div className="flex flex-col md:flex-row items-center justify-between gap-6">
//                   <div>
//                     <h2 className="text-3xl font-black mb-2">Overall Score</h2>
//                     <p className="text-indigo-100">Resume quality for {useCustomJob ? 'Custom Role' : jobRoles[jobRole].name}</p>
//                   </div>
//                   <div className="text-center">
//                     <div className="text-8xl font-black">{results.overall_score}</div>
//                     <div className="text-2xl font-bold">Grade: {getScoreGrade(results.overall_score).grade}</div>
//                   </div>
//                 </div>
//               </div>
//               <div className="bg-white rounded-3xl shadow-xl p-8 border-2 border-indigo-100 mb-8">
//                 <div className="flex flex-col md:flex-row items-center gap-6">
//                   <div className="p-4 bg-indigo-100 rounded-2xl">
//                     <Mail className="w-8 h-8 text-indigo-600" />
//                   </div>
//                   <div className="flex-1">
//                     <h3 className="text-xl font-bold text-gray-900">Email Your Report</h3>
//                     <p className="text-gray-600">Get a copy of this analysis sent to your inbox.</p>
//                   </div>
//                   <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
//                     <input
//                       type="email"
//                       placeholder="yourname@example.com"
//                       value={emailAddress}
//                       onChange={(e) => setEmailAddress(e.target.value)}
//                       className="px-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none min-w-[250px]"
//                     />
//                     <button
//                       onClick={handleSendEmail}
//                       disabled={sendingEmail}
//                       className={`px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${emailSent
//                           ? 'bg-green-500 text-white'
//                           : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-indigo-200'
//                         }`}
//                     >
//                       {sendingEmail ? <RefreshCw className="w-5 h-5 animate-spin" /> : null}
//                       {emailSent ? <><CheckCircle className="w-5 h-5" /> Sent!</> : 'Send Report'}
//                     </button>
//                   </div>
//                 </div>
//               </div>
//               <div>
//                 <h2 className="text-3xl font-black text-gray-900 mb-6">Detailed Analysis</h2>
//                 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
//                   <ScoreCard title="ATS Compatibility" score={results.scores.ats_compatibility} icon={FileText} gradient="from-blue-500 to-cyan-500" description="Pass screening" />
//                   <ScoreCard title="Skills Match" score={results.scores.skills_match} icon={CheckCircle} gradient="from-green-500 to-emerald-500" description="Skills coverage" />
//                   <ScoreCard title="Experience" score={results.scores.experience_strength} icon={Award} gradient="from-purple-500 to-pink-500" description="Quality" />
//                   <ScoreCard title="Formatting" score={results.scores.formatting_quality} icon={TrendingUp} gradient="from-orange-500 to-red-500" description="Structure" />
//                   <ScoreCard title="Keywords" score={results.scores.keyword_optimization} icon={Zap} gradient="from-pink-500 to-rose-500" description="Optimization" />
//                 </div>
//               </div>

//               <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white">
//                 <h2 className="text-3xl font-black text-gray-900 mb-6 flex items-center gap-3">
//                   <Target className="w-8 h-8 text-purple-600" />
//                   Skills Analysis
//                 </h2>
//                 <div className="grid md:grid-cols-2 gap-8">
//                   <div>
//                     <div className="flex items-center justify-between mb-4">
//                       <h3 className="font-bold text-green-700 text-xl flex items-center gap-2">
//                         <CheckCircle className="w-6 h-6" />
//                         Found Skills
//                       </h3>
//                       <span className="bg-green-100 text-green-700 px-4 py-1 rounded-full font-bold">
//                         {results.skills_analysis.found_skills.length}
//                       </span>
//                     </div>
//                     <div className="flex flex-wrap gap-2">
//                       {results.skills_analysis.found_skills.map((skill, idx) => (
//                         <span key={idx} className="px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-xl text-sm font-semibold border border-green-200">
//                           ✓ {skill}
//                         </span>
//                       ))}
//                     </div>
//                   </div>
//                   <div>
//                     <div className="flex items-center justify-between mb-4">
//                       <h3 className="font-bold text-red-700 text-xl flex items-center gap-2">
//                         <AlertCircle className="w-6 h-6" />
//                         Missing Skills
//                       </h3>
//                       <span className="bg-red-100 text-red-700 px-4 py-1 rounded-full font-bold">
//                         {results.skills_analysis.missing_skills.length}
//                       </span>
//                     </div>
//                     <div className="flex flex-wrap gap-2">
//                       {results.skills_analysis.missing_skills.map((skill, idx) => (
//                         <span key={idx} className="px-4 py-2 bg-gradient-to-r from-red-100 to-pink-100 text-red-800 rounded-xl text-sm font-semibold border border-red-200">
//                           ✗ {skill}
//                         </span>
//                       ))}
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl shadow-2xl p-8 border-2 border-indigo-200">
//                 <h2 className="text-3xl font-black text-gray-900 mb-6 flex items-center gap-3">
//                   <Sparkles className="w-8 h-8 text-yellow-500" />
//                   AI-Powered Suggestions
//                 </h2>
//                 <div className="space-y-4">
//                   {results.suggestions.map((suggestion, idx) => (
//                     <div key={idx} className="flex items-start gap-4 p-5 bg-white rounded-2xl border-2 border-indigo-100 hover:shadow-lg transition-all">
//                       <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-xl flex items-center justify-center text-lg font-black">
//                         {idx + 1}
//                       </div>
//                       <p className="text-gray-700 font-medium pt-1.5">{suggestion}</p>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white">
//                 <h2 className="text-3xl font-black text-gray-900 mb-6 flex items-center gap-3">
//                   <BarChart3 className="w-8 h-8 text-indigo-600" />
//                   Document Statistics
//                 </h2>
//                 <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
//                   <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200 text-center hover:shadow-lg transition-all">
//                     <FileText className="w-8 h-8 text-indigo-600 mx-auto mb-3" />
//                     <div className="text-4xl font-black text-indigo-600 mb-1">
//                       {results.extracted_info.total_words}
//                     </div>
//                     <div className="text-gray-600 font-semibold">Total Words</div>
//                   </div>
//                   <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-200 text-center hover:shadow-lg transition-all">
//                     <Clock className="w-8 h-8 text-purple-600 mx-auto mb-3" />
//                     <div className="text-4xl font-black text-purple-600 mb-1">
//                       {results.extracted_info.years_of_experience}
//                     </div>
//                     <div className="text-gray-600 font-semibold">Years Experience</div>
//                   </div>
//                   <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 text-center hover:shadow-lg transition-all">
//                     <Target className="w-8 h-8 text-green-600 mx-auto mb-3" />
//                     <div className="text-4xl font-black text-green-600 mb-1">
//                       {results.skills_analysis.total_skills_found}
//                     </div>
//                     <div className="text-gray-600 font-semibold">Skills Found</div>
//                   </div>
//                   <div className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200 text-center hover:shadow-lg transition-all">
//                     <Users className="w-8 h-8 text-yellow-600 mx-auto mb-3" />
//                     <div className="text-4xl font-black text-yellow-600 mb-1">
//                       {results.extracted_info.sections_found.length}
//                     </div>
//                     <div className="text-gray-600 font-semibold">Sections</div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}
//         </section>

//         <section ref={guideRef} className="container mx-auto px-4 py-20 bg-white/30">
//           <div className="max-w-5xl mx-auto">
//             <div className="text-center mb-12">
//               <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
//                 Quick Start Guide
//               </h2>
//               <p className="text-xl text-gray-600">
//                 Get started in 3 simple steps
//               </p>
//             </div>

//             <div className="grid md:grid-cols-3 gap-8 mb-12">
//               <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all border border-white">
//                 <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg mb-6 mx-auto">
//                   1
//                 </div>
//                 <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">Upload Resume</h3>
//                 <p className="text-gray-600 text-center">
//                   Select your resume file (PDF, DOCX, or TXT). Make sure it contains your experience, education, and skills.
//                 </p>
//               </div>

//               <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all border border-white">
//                 <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg mb-6 mx-auto">
//                   2
//                 </div>
//                 <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">Choose Role</h3>
//                 <p className="text-gray-600 text-center">
//                   Select from 6 predefined roles or paste a custom job description for personalized analysis.
//                 </p>
//               </div>

//               <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all border border-white">
//                 <div className="w-16 h-16 bg-gradient-to-br from-pink-600 to-red-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg mb-6 mx-auto">
//                   3
//                 </div>
//                 <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">Get Insights</h3>
//                 <p className="text-gray-600 text-center">
//                   Receive instant AI feedback with scores, skills analysis, and actionable improvement tips.
//                 </p>
//               </div>
//             </div>

//             <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
//               <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
//                 <Lightbulb className="w-7 h-7 text-yellow-300" />
//                 Pro Tips for Best Results
//               </h3>
//               <div className="grid md:grid-cols-2 gap-4">
//                 <div className="flex items-start gap-3">
//                   <ChevronRight className="w-5 h-5 flex-shrink-0 mt-1" />
//                   <span>Use clear section headings (Experience, Education, Skills)</span>
//                 </div>
//                 <div className="flex items-start gap-3">
//                   <ChevronRight className="w-5 h-5 flex-shrink-0 mt-1" />
//                   <span>Include quantifiable achievements with numbers</span>
//                 </div>
//                 <div className="flex items-start gap-3">
//                   <ChevronRight className="w-5 h-5 flex-shrink-0 mt-1" />
//                   <span>Match keywords from the job description</span>
//                 </div>
//                 <div className="flex items-start gap-3">
//                   <ChevronRight className="w-5 h-5 flex-shrink-0 mt-1" />
//                   <span>Keep resume between 400-700 words</span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </section>
//       </div>

//       <footer className="relative bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 text-white pt-16 pb-8">
//         <div className="container mx-auto px-4">
//           <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
//             <div>
//               <div className="flex items-center gap-3 mb-4">
//                 <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl">
//                   <Brain className="w-6 h-6 text-white" />
//                 </div>
//                 <div>
//                   <h3 className="text-xl font-black">AI Resume Analyzer</h3>
//                   <p className="text-xs text-gray-400">Powered by NLP</p>
//                 </div>
//               </div>
//               <p className="text-gray-300 text-sm leading-relaxed mb-4">
//                 Transform your resume with AI-powered insights and land your dream job faster.
//               </p>
//               <div className="flex gap-3">
//                 <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all">
//                   <Github className="w-5 h-5" />
//                 </a>
//                 <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all">
//                   <Linkedin className="w-5 h-5" />
//                 </a>
//                 <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all">
//                   <Twitter className="w-5 h-5" />
//                 </a>
//               </div>
//             </div>

//             <div>
//               <h4 className="text-lg font-bold mb-4">Quick Links</h4>
//               <ul className="space-y-2">
//                 <li>
//                   <button onClick={() => scrollToSection(homeRef, 'home')} className="text-gray-300 hover:text-white transition-colors flex items-center gap-2">
//                     <ChevronRight className="w-4 h-4" />
//                     Home
//                   </button>
//                 </li>
//                 <li>
//                   <button onClick={() => scrollToSection(featuresRef, 'features')} className="text-gray-300 hover:text-white transition-colors flex items-center gap-2">
//                     <ChevronRight className="w-4 h-4" />
//                     Features
//                   </button>
//                 </li>
//                 <li>
//                   <button onClick={() => scrollToSection(analyzerRef, 'analyzer')} className="text-gray-300 hover:text-white transition-colors flex items-center gap-2">
//                     <ChevronRight className="w-4 h-4" />
//                     Analyzer
//                   </button>
//                 </li>
//                 <li>
//                   <button onClick={() => scrollToSection(guideRef, 'guide')} className="text-gray-300 hover:text-white transition-colors flex items-center gap-2">
//                     <ChevronRight className="w-4 h-4" />
//                     User Guide
//                   </button>
//                 </li>
//               </ul>
//             </div>

//             <div>
//               <h4 className="text-lg font-bold mb-4">Legal</h4>
//               <ul className="space-y-2">
//                 <li>
//                   <a href="#" className="text-gray-300 hover:text-white transition-colors flex items-center gap-2">
//                     <Shield className="w-4 h-4" />
//                     Privacy Policy
//                   </a>
//                 </li>
//                 <li>
//                   <a href="#" className="text-gray-300 hover:text-white transition-colors flex items-center gap-2">
//                     <FileQuestion className="w-4 h-4" />
//                     Terms of Service
//                   </a>
//                 </li>
//                 <li>
//                   <a href="#" className="text-gray-300 hover:text-white transition-colors flex items-center gap-2">
//                     <Info className="w-4 h-4" />
//                     About Us
//                   </a>
//                 </li>
//                 <li>
//                   <a href="#" className="text-gray-300 hover:text-white transition-colors flex items-center gap-2">
//                     <Phone className="w-4 h-4" />
//                     Contact
//                   </a>
//                 </li>
//               </ul>
//             </div>

//             <div>
//               <h4 className="text-lg font-bold mb-4">Contact Us</h4>
//               <ul className="space-y-3">
//                 <li className="flex items-start gap-2 text-gray-300">
//                   <Mail className="w-5 h-5 flex-shrink-0 mt-0.5" />
//                   <div>
//                     <div className="text-sm text-gray-400">Email</div>
//                     <a href="mailto:contact@resumeanalyzer.ai" className="hover:text-white transition-colors">
//                       contact@resumeanalyzer.ai
//                     </a>
//                   </div>
//                 </li>
//                 <li className="flex items-start gap-2 text-gray-300">
//                   <Phone className="w-5 h-5 flex-shrink-0 mt-0.5" />
//                   <div>
//                     <div className="text-sm text-gray-400">Phone</div>
//                     <a href="tel:+1234567890" className="hover:text-white transition-colors">
//                       +1 (234) 567-890
//                     </a>
//                   </div>
//                 </li>
//                 <li className="flex items-start gap-2 text-gray-300">
//                   <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
//                   <div>
//                     <div className="text-sm text-gray-400">Location</div>
//                     <span>Bhubaneswar, Odisha, India</span>
//                   </div>
//                 </li>
//               </ul>
//             </div>
//           </div>

//           <div className="border-t border-white/10 pt-8">
//             <div className="flex flex-col md:flex-row items-center justify-between gap-4">
//               <p className="text-gray-400 text-sm text-center md:text-left">
//                 © 2026 AI Resume Analyzer. All rights reserved. Built with ❤️ using React, FastAPI & NLP.
//               </p>
//               <div className="flex items-center gap-6 text-sm text-gray-400">
//                 <a href="#" className="hover:text-white transition-colors">Privacy</a>
//                 <a href="#" className="hover:text-white transition-colors">Terms</a>
//                 <a href="#" className="hover:text-white transition-colors">Cookies</a>
//               </div>
//             </div>
//           </div>
//         </div>
//       </footer>

//       <style>{`
//         @keyframes blob {
//           0% { transform: translate(0px, 0px) scale(1); }
//           33% { transform: translate(30px, -50px) scale(1.1); }
//           66% { transform: translate(-20px, 20px) scale(0.9); }
//           100% { transform: translate(0px, 0px) scale(1); }
//         }
//         .animate-blob {
//           animation: blob 7s infinite;
//         }
//         .animate-fade-in {
//           animation: fadeIn 0.5s ease-in;
//         }
//         @keyframes fadeIn {
//           from { opacity: 0; transform: translateY(20px); }
//           to { opacity: 1; transform: translateY(0); }
//         }
//       `}</style>
//     </div>
//   );
// };


// const App = () => (
//   <>
//     {/* Main landing sections and features above */}
//     {/* ...existing code... */}
//     {/* ResumeAnalyzer now only after EmailAgentControl */}
//     <ResumeAnalyzer />
//   </>
// );

// export default App;

import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Brain, TrendingUp, CheckCircle, AlertCircle, Award, Target, Zap, Sparkles, BarChart3, Users, Clock, Star, ArrowRight, RefreshCw, Menu, X, Home, Info, Phone, FileQuestion, Shield, Github, Linkedin, Twitter, Mail, MapPin, ChevronRight, Book, Lightbulb } from 'lucide-react';
import { startEmailAgent, getEmailStatus, getAgentLog, sendReport } from "./services/api";
import CandidateDashboard from "./CandidateDashboard";

const EmailAgentControl = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [agentLog, setAgentLog] = useState([]);

  const handleStartAgent = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await startEmailAgent();
      setStatus(res.data.message || "Email agent started!");
    } catch (err) {
      setStatus(
        err.response?.data?.message ||
        "Failed to start email agent. Is the backend running?"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await getEmailStatus();
      setStatus(
        res.data.active
          ? "Email agent is running."
          : "Email agent is not running."
      );
    } catch {
      setStatus("Could not check status.");
    } finally {
      setLoading(false);
    }
  };

  // Poll agent log from backend every 3 seconds
  useEffect(() => {
    let interval = setInterval(async () => {
      try {
        const res = await getAgentLog();
        setAgentLog(res.data || []);
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-xl shadow p-6 my-6 max-w-md mx-auto">
      <h2 className="text-lg font-bold mb-2">Email Agent Control</h2>
      <button
        onClick={handleStartAgent}
        disabled={loading}
        className="bg-indigo-600 text-white px-4 py-2 rounded mr-2"
      >
        {loading ? "Starting..." : "Start Email Agent"}
      </button>
      <button
        onClick={handleCheckStatus}
        disabled={loading}
        className="bg-gray-200 text-gray-800 px-4 py-2 rounded"
      >
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

const ResumeAnalyzer = () => {
  const [file, setFile] = useState(null);
  const [jobRole, setJobRole] = useState('software_engineer');
  const [customJobDescription, setCustomJobDescription] = useState('');
  const [useCustomJob, setUseCustomJob] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  const homeRef = useRef(null);
  const featuresRef = useRef(null);
  const agentRef = useRef(null);
  const analyzerRef = useRef(null);
  const guideRef = useRef(null);

  const [emailAddress, setEmailAddress] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const jobRoles = {
    software_engineer: {
      name: 'Software Engineer',
      skills: ['python', 'javascript', 'java', 'react', 'node.js', 'sql', 'git', 'api', 'docker', 'aws']
    },
    data_scientist: {
      name: 'Data Scientist',
      skills: ['python', 'machine learning', 'tensorflow', 'pandas', 'numpy', 'sql', 'statistics']
    },
    product_manager: {
      name: 'Product Manager',
      skills: ['product strategy', 'roadmap', 'agile', 'analytics', 'communication']
    },
    ui_ux_designer: {
      name: 'UI/UX Designer',
      skills: ['figma', 'sketch', 'prototyping', 'user research', 'design systems']
    },
    devops_engineer: {
      name: 'DevOps Engineer',
      skills: ['kubernetes', 'docker', 'jenkins', 'ci/cd', 'aws', 'terraform']
    },
    full_stack_developer: {
      name: 'Full Stack Developer',
      skills: ['react', 'node.js', 'mongodb', 'express', 'javascript', 'typescript']
    }
  };

  const scrollToSection = (ref, section) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
    setActiveSection(section);
    setMobileMenuOpen(false);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const fileType = selectedFile.name.split('.').pop().toLowerCase();
      if (['pdf', 'docx', 'txt'].includes(fileType)) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please upload a PDF, DOCX, or TXT file');
        setFile(null);
      }
    }
  };

  const generateAISummary = () => ({
    professional_summary: 'Experienced professional with strong technical capabilities and proven track record of successful project delivery.',
    key_strengths: [
      'Strong technical foundation with diverse skill set',
      'Proven track record of successful project delivery',
      'Excellent problem-solving and analytical abilities',
      'Good communication and team collaboration skills'
    ],
    career_highlights: [
      'Demonstrated expertise in core technologies',
      'Successfully completed multiple projects',
      'Continuous learning and skill development',
      'Strong alignment with best practices'
    ],
    contact_info: { name: 'Candidate', email: 'Available in resume', phone: 'Available in resume' }
  });

  const analyzeResume = async () => {
    if (!file) { setError('Please upload a resume first'); return; }
    if (useCustomJob && !customJobDescription.trim()) { setError('Please enter a job description'); return; }

    setAnalyzing(true);
    setError(null);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (useCustomJob) {
        formData.append('job_description', customJobDescription);
      } else {
        formData.append('job_role', jobRole);
      }

      // Use relative path - works with Vite proxy or direct backend
      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errMsg = 'Analysis failed';
        try {
          const errorData = await response.json();
          errMsg = errorData.detail || errMsg;
        } catch {
          errMsg = await response.text() || errMsg;
        }
        throw new Error(errMsg);
      }

      const data = await response.json();
      setResults({ ...data, ai_summary: generateAISummary() });

      setTimeout(() => {
        analyzerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 500);
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const getScoreGrade = (score) => {
    if (score >= 90) return { grade: 'A+', label: 'Excellent' };
    if (score >= 80) return { grade: 'A', label: 'Very Good' };
    if (score >= 70) return { grade: 'B', label: 'Good' };
    if (score >= 60) return { grade: 'C', label: 'Average' };
    return { grade: 'D', label: 'Needs Improvement' };
  };

  const handleSendEmail = async () => {
    if (!emailAddress) { setError('Please enter an email address'); return; }
    setSendingEmail(true);
    try {
      const response = await fetch('http://localhost:8000/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailAddress, analysis_results: results }),
      });
      if (!response.ok) throw new Error('Failed to send email');
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 5000);
    } catch (err) {
      setError('Could not send the email. Is the backend running?');
    } finally {
      setSendingEmail(false);
    }
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
        <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          {score}
        </div>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-3">
        <div
          className={`h-3 rounded-full bg-gradient-to-r ${gradient} transition-all duration-1000`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      </div>

      <nav className="bg-white/90 backdrop-blur-md shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => scrollToSection(homeRef, 'home')}>
              <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  AI AgenticHire & Resume Analyzer
                </h1>
                <p className="text-xs text-gray-500">Powered by NLP and Agentic AI</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-8">
              {[
                { ref: homeRef, section: 'home', icon: Home, label: 'Home' },
                { ref: featuresRef, section: 'features', icon: Star, label: 'Features' },
                { ref: agentRef, section: 'agent', icon: Mail, label: 'Agent' },
                { ref: analyzerRef, section: 'analyzer', icon: Zap, label: 'Analyzer' },
                { ref: guideRef, section: 'guide', icon: Book, label: 'Guide' },
              ].map(({ ref, section, icon: Icon, label }) => (
                <button
                  key={section}
                  onClick={() => scrollToSection(ref, section)}
                  className={`flex items-center gap-2 font-semibold transition-colors ${activeSection === section ? 'text-indigo-600' : 'text-gray-600 hover:text-indigo-600'}`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
              <button
                onClick={() => scrollToSection(analyzerRef, 'analyzer')}
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Get Started
              </button>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t">
              <div className="flex flex-col gap-4">
                {[
                  { ref: homeRef, section: 'home', icon: Home, label: 'Home' },
                  { ref: featuresRef, section: 'features', icon: Star, label: 'Features' },
                  { ref: agentRef, section: 'agent', icon: Mail, label: 'Agent' },
                  { ref: analyzerRef, section: 'analyzer', icon: Zap, label: 'Analyzer' },
                  { ref: guideRef, section: 'guide', icon: Book, label: 'Guide' },
                ].map(({ ref, section, icon: Icon, label }) => (
                  <button key={section} onClick={() => scrollToSection(ref, section)} className="flex items-center gap-2 font-semibold text-gray-600">
                    <Icon className="w-4 h-4" /> {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="relative">
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
              Get instant, AI-powered feedback on your resume with explainable scoring, personalized suggestions, and industry-leading NLP technology.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <button
                onClick={() => scrollToSection(analyzerRef, 'analyzer')}
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:shadow-2xl transition-all flex items-center gap-2"
              >
                Analyze Your Resume <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => scrollToSection(guideRef, 'guide')}
                className="px-8 py-4 bg-white text-gray-700 rounded-xl font-bold text-lg hover:shadow-lg transition-all border-2 border-gray-200"
              >
                View Guide
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

        {/* Email Agent Control */}
        <div ref={agentRef} className="container mx-auto px-4">
          <EmailAgentControl />
          <CandidateDashboard />
        </div>

        <section ref={featuresRef} className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Everything you need to create a winning resume</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: FileText, gradient: 'from-blue-500 to-cyan-500', title: 'ATS Compatibility', desc: 'Ensure your resume passes Applicant Tracking Systems with our advanced compatibility scoring.' },
              { icon: CheckCircle, gradient: 'from-green-500 to-emerald-500', title: 'Skills Matching', desc: 'Compare your skills against job requirements and identify gaps instantly.' },
              { icon: Brain, gradient: 'from-purple-500 to-pink-500', title: 'AI Summary', desc: 'Get an intelligent summary of your resume with key strengths and highlights.' },
              { icon: TrendingUp, gradient: 'from-orange-500 to-red-500', title: 'Experience Analysis', desc: 'Evaluate the strength and impact of your professional experience.' },
              { icon: Sparkles, gradient: 'from-pink-500 to-rose-500', title: 'Smart Suggestions', desc: 'Receive personalized recommendations to improve your resume effectiveness.' },
              { icon: Target, gradient: 'from-indigo-500 to-purple-500', title: 'AI Agent Automation', desc: 'Send your resume via email and get automatic analysis and results.' },
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

        <section ref={analyzerRef} className="container mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Analyze Your Resume</h2>
            <p className="text-xl text-gray-600">Upload your resume and get instant AI-powered feedback</p>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 mb-8 max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8">
              <div>
                <label className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  Upload Your Resume
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
                  <Target className="w-5 h-5 text-purple-600" />
                  Target Job Role
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
                    onChange={(e) => setJobRole(e.target.value)}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 bg-white font-medium text-gray-700"
                  >
                    {Object.entries(jobRoles).map(([key, role]) => (
                      <option key={key} value={key}>{role.name}</option>
                    ))}
                  </select>
                ) : (
                  <textarea
                    value={customJobDescription}
                    onChange={(e) => setCustomJobDescription(e.target.value)}
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
              {analyzing ? (
                <><RefreshCw className="w-6 h-6 animate-spin" />Analyzing...</>
              ) : (
                <><Zap className="w-6 h-6" />Analyze Resume</>
              )}
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

              <div className="bg-white rounded-3xl shadow-xl p-8 border-2 border-indigo-100 mb-8">
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
                      onChange={(e) => setEmailAddress(e.target.value)}
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

              <div>
                <h2 className="text-3xl font-black text-gray-900 mb-6">Detailed Analysis</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <ScoreCard title="ATS Compatibility" score={results.scores.ats_compatibility} icon={FileText} gradient="from-blue-500 to-cyan-500" description="Pass screening" />
                  <ScoreCard title="Skills Match" score={results.scores.skills_match} icon={CheckCircle} gradient="from-green-500 to-emerald-500" description="Skills coverage" />
                  <ScoreCard title="Experience" score={results.scores.experience_strength} icon={Award} gradient="from-purple-500 to-pink-500" description="Quality" />
                  <ScoreCard title="Formatting" score={results.scores.formatting_quality} icon={TrendingUp} gradient="from-orange-500 to-red-500" description="Structure" />
                  <ScoreCard title="Keywords" score={results.scores.keyword_optimization} icon={Zap} gradient="from-pink-500 to-rose-500" description="Optimization" />
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white">
                <h2 className="text-3xl font-black text-gray-900 mb-6 flex items-center gap-3">
                  <Target className="w-8 h-8 text-purple-600" />Skills Analysis
                </h2>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-green-700 text-xl flex items-center gap-2">
                        <CheckCircle className="w-6 h-6" />Found Skills
                      </h3>
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
                      <h3 className="font-bold text-red-700 text-xl flex items-center gap-2">
                        <AlertCircle className="w-6 h-6" />Missing Skills
                      </h3>
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

              <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white">
                <h2 className="text-3xl font-black text-gray-900 mb-6 flex items-center gap-3">
                  <BarChart3 className="w-8 h-8 text-indigo-600" />Document Statistics
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[
                    { icon: FileText, color: 'indigo', value: results.extracted_info.total_words, label: 'Total Words' },
                    { icon: Clock, color: 'purple', value: results.extracted_info.years_of_experience, label: 'Years Experience' },
                    { icon: Target, color: 'green', value: results.skills_analysis.total_skills_found, label: 'Skills Found' },
                    { icon: Users, color: 'yellow', value: results.extracted_info.sections_found.length, label: 'Sections' },
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

        <section ref={guideRef} className="container mx-auto px-4 py-20 bg-white/30">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Quick Start Guide</h2>
              <p className="text-xl text-gray-600">Get started in 3 simple steps</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {[
                { num: 1, gradient: 'from-indigo-600 to-purple-600', title: 'Upload Resume', desc: 'Select your resume file (PDF, DOCX, or TXT). Make sure it contains your experience, education, and skills.' },
                { num: 2, gradient: 'from-purple-600 to-pink-600', title: 'Choose Role', desc: 'Select from 6 predefined roles or paste a custom job description for personalized analysis.' },
                { num: 3, gradient: 'from-pink-600 to-red-600', title: 'Get Insights', desc: 'Receive instant AI feedback with scores, skills analysis, and actionable improvement tips.' },
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
                ].map((tip) => (
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

      <footer className="relative bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 text-white pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black">AI Resume Analyzer</h3>
                  <p className="text-xs text-gray-400">Powered by NLP</p>
                </div>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed mb-4">
                Transform your resume with AI-powered insights and land your dream job faster.
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
                  { ref: homeRef, section: 'home', label: 'Home' },
                  { ref: featuresRef, section: 'features', label: 'Features' },
                  { ref: analyzerRef, section: 'analyzer', label: 'Analyzer' },
                  { ref: guideRef, section: 'guide', label: 'User Guide' },
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
                  { icon: Shield, label: 'Privacy Policy' },
                  { icon: FileQuestion, label: 'Terms of Service' },
                  { icon: Info, label: 'About Us' },
                  { icon: Phone, label: 'Contact' },
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
                  <div><div className="text-sm text-gray-400">Email</div><a href="mailto:harshitshahaaai906@gmail.com" className="hover:text-white transition-colors">harshitshahaaai906@gmail.com</a></div>
                </li>
                <li className="flex items-start gap-2 text-gray-300">
                  <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div><div className="text-sm text-gray-400">Location</div><span>Bhubaneswar, Odisha, India</span></div>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8">
            <p className="text-gray-400 text-sm text-center">
              © 2026 AI Resume Analyzer. All rights reserved. Built with ❤️ using React, FastAPI & NLP.
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 7s infinite; }
      `}</style>
    </div>
  );
};

const App = () => <ResumeAnalyzer />;

export default App;