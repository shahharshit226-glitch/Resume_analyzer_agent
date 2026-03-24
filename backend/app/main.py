"""
AI-Powered Resume Analyzer Backend
FastAPI application with NLP-based resume parsing and analysis
"""

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import PyPDF2
import docx
import io
import re
from typing import Dict, List, Optional, Any
from pydantic import BaseModel

# Initialize FastAPI app
app = FastAPI(
    title="AI Resume Analyzer",
    description="NLP-powered resume analysis system",
    version="2.1.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Response Models
class AnalysisResult(BaseModel):
    overall_score: int
    scores: Dict[str, int]
    skills_analysis: Dict
    suggestions: List[str]
    extracted_info: Dict
    resume_summary: Dict

class EmailRequest(BaseModel):
    email: str
    analysis_results: Dict[str, Any]

# Job Role Configurations
JOB_ROLES = {
    "software_engineer": {
        "name": "Software Engineer",
        "required_skills": [
            "python", "javascript", "java", "react", "node.js",
            "sql", "git", "api", "docker", "aws"
        ],
        "keywords": [
            "developed", "implemented", "designed", "built", "created",
            "optimized", "deployed", "maintained", "scaled", "integrated"
        ],
        "experience_keywords": ["experience", "years", "worked", "developed"]
    },
    "data_scientist": {
        "name": "Data Scientist",
        "required_skills": [
            "python", "machine learning", "sql", "pandas", "numpy",
            "tensorflow", "statistics", "data analysis", "jupyter", "visualization"
        ],
        "keywords": [
            "analyzed", "modeled", "predicted", "optimized",
            "discovered", "insights", "accuracy", "trained"
        ],
        "experience_keywords": ["analysis", "modeling", "research", "projects"]
    },
    "product_manager": {
        "name": "Product Manager",
        "required_skills": [
            "product strategy", "roadmap", "agile", "analytics",
            "user research", "prioritization", "communication", "jira",
            "stakeholder management", "scrum"
        ],
        "keywords": [
            "managed", "launched", "delivered", "defined", "prioritized",
            "collaborated", "coordinated", "analyzed", "drove"
        ],
        "experience_keywords": ["managed", "launched", "led", "coordinated"]
    },
    "ui_ux_designer": {
        "name": "UI/UX Designer",
        "required_skills": [
            "figma", "sketch", "wireframing", "prototyping", "user research",
            "design systems", "user testing", "adobe xd", "responsive design", "accessibility"
        ],
        "keywords": [
            "designed", "created", "developed", "improved", "researched",
            "tested", "iterated", "collaborated", "enhanced"
        ],
        "experience_keywords": ["designed", "created", "research", "projects"]
    },
    "devops_engineer": {
        "name": "DevOps Engineer",
        "required_skills": [
            "kubernetes", "docker", "jenkins", "ci/cd", "aws",
            "terraform", "ansible", "linux", "git", "monitoring"
        ],
        "keywords": [
            "automated", "deployed", "configured", "managed", "monitored",
            "optimized", "implemented", "maintained", "scaled"
        ],
        "experience_keywords": ["infrastructure", "deployment", "automation"]
    },
    "full_stack_developer": {
        "name": "Full Stack Developer",
        "required_skills": [
            "react", "node.js", "mongodb", "express", "javascript",
            "html", "css", "rest api", "git", "sql"
        ],
        "keywords": [
            "developed", "built", "implemented", "designed", "created",
            "integrated", "deployed", "optimized", "tested"
        ],
        "experience_keywords": ["full stack", "frontend", "backend", "developed"]
    }
}

COMMON_TECHNICAL_SKILLS = [
    "python", "javascript", "java", "c++", "react", "angular", "vue",
    "node.js", "django", "flask", "sql", "mongodb", "postgresql",
    "git", "docker", "kubernetes", "aws", "azure", "machine learning",
    "tensorflow", "pandas", "numpy", "agile", "scrum", "figma"
]

ATS_POSITIVE_INDICATORS = [
    "experience", "education", "skills", "projects", "achievements",
    "certifications", "professional", "summary"
]

COMMON_GRAMMAR_ISSUES = {
    "recieve": "receive", "teh": "the", "thier": "their",
    "seperate": "separate", "definately": "definitely",
    "occured": "occurred", "recomend": "recommend",
    "responsable": "responsible", "acheivement": "achievement",
    "sucessful": "successful", "managment": "management",
    "experiance": "experience", "developement": "development"
}


# ─── Text Extraction ───────────────────────────────────────────────────────────

def extract_text_from_pdf(file_content: bytes) -> str:
    try:
        try:
            import pdfplumber
            with pdfplumber.open(io.BytesIO(file_content)) as pdf:
                text = "\n".join(page.extract_text() or "" for page in pdf.pages)
            if text.strip():
                return text
        except ImportError:
            pass
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
        text = ""
        for page in pdf_reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading PDF: {str(e)}")

def extract_text_from_docx(file_content: bytes) -> str:
    try:
        doc = docx.Document(io.BytesIO(file_content))
        return "\n".join([paragraph.text for paragraph in doc.paragraphs])
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading DOCX: {str(e)}")

def extract_text_from_txt(file_content: bytes) -> str:
    try:
        if isinstance(file_content, bytes):
            return file_content.decode('utf-8')
        return str(file_content)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading TXT: {str(e)}")


# ─── Extraction Helpers ────────────────────────────────────────────────────────

def extract_name(text: str) -> str:
    lines = text.split('\n')
    for line in lines[:10]:
        line = line.strip()
        if 2 < len(line) < 50 and '@' not in line and not line[0].isdigit():
            if line.lower() not in ['resume', 'curriculum vitae', 'cv', 'profile', 'summary']:
                return line
    return "Not found"

def extract_email(text: str) -> Optional[str]:
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    emails = re.findall(email_pattern, text)
    return emails[0] if emails else None

def extract_phone(text: str) -> Optional[str]:
    phone_pattern = r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
    phones = re.findall(phone_pattern, text)
    return phones[0] if phones else None

def extract_experience_years(text: str) -> int:
    pattern = r'(\d+)\+?\s*years?'
    matches = re.findall(pattern, text.lower())
    if matches:
        return max([int(year) for year in matches])
    year_ranges = re.findall(r'(20\d{2})\s*[-–]\s*(20\d{2}|present)', text.lower())
    if year_ranges:
        total_years = sum([
            (2025 if end == 'present' else int(end)) - int(start)
            for start, end in year_ranges
        ])
        return total_years
    return 2

def extract_skills(text: str, required_skills: List[str]) -> Dict[str, List[str]]:
    text_lower = text.lower()
    found_skills = []
    for skill in required_skills:
        skill_lower = skill.lower()
        if skill_lower in text_lower:
            found_skills.append(skill)
            continue
        if any(variation in text_lower for variation in [
            skill_lower.replace('.', ''),
            skill_lower.replace(' ', ''),
            skill_lower + 'js',
            skill_lower.replace('-', '')
        ]):
            found_skills.append(skill)
    missing_skills = [skill for skill in required_skills if skill not in found_skills]
    return {
        "found_skills": found_skills,
        "missing_skills": missing_skills,
        "total_skills_found": len(found_skills)
    }

def extract_achievements(text: str) -> List[str]:
    achievements = []
    percentage_matches = re.findall(r'([^.\n]*(?:\d+%|\d+\s*percent)[^.\n]*)', text, re.IGNORECASE)
    achievements.extend([m.strip() for m in percentage_matches if len(m.strip()) > 20][:3])
    dollar_matches = re.findall(r'([^.\n]*\$[\d,]+[^.\n]*)', text)
    achievements.extend([m.strip() for m in dollar_matches if len(m.strip()) > 20][:2])
    achievement_verbs = ['achieved', 'improved', 'increased', 'reduced', 'led', 'managed', 'launched']
    for line in text.split('\n'):
        line_lower = line.strip().lower()
        if any(line_lower.startswith(verb) for verb in achievement_verbs):
            if 15 < len(line.strip()) < 150:
                achievements.append(line.strip())
                if len(achievements) >= 5:
                    break
    return achievements[:5] if achievements else ["No specific achievements highlighted"]

def check_grammar_issues(text: str) -> List[str]:
    issues = []
    text_lower = text.lower()
    for wrong, correct in COMMON_GRAMMAR_ISSUES.items():
        if wrong in text_lower:
            issues.append(f"Spelling: '{wrong}' should be '{correct}'")
    words = text.split()
    for i in range(len(words) - 1):
        if words[i].lower() == words[i + 1].lower() and len(words[i]) > 3:
            issues.append(f"Repeated word: '{words[i]}'")
            if len(issues) >= 3:
                break
    if '  ' in text:
        issues.append("Multiple consecutive spaces found")
    return issues[:5] if issues else ["No major grammar issues detected"]

def extract_all_skills(text: str) -> List[str]:
    text_lower = text.lower()
    found_skills = []
    for skill in COMMON_TECHNICAL_SKILLS:
        if skill.lower() in text_lower:
            found_skills.append(skill)
    skills_section_match = re.search(
        r'(?:skills|technical skills)[:\s]+(.*?)(?:\n\n|education|experience|$)',
        text_lower, re.DOTALL | re.IGNORECASE
    )
    if skills_section_match:
        skills_text = skills_section_match.group(1)
        for skill in re.split(r'[,;•\n\-]', skills_text):
            skill = skill.strip()
            if 2 < len(skill) < 30 and skill not in found_skills:
                found_skills.append(skill)
    return found_skills[:15]

def extract_position(text: str, job_config: Dict) -> str:
    text_lower = text.lower()
    for pattern in [
        r'(?:position|role|title):\s*([^\n]+)',
        r'(?:seeking|looking for|applying for):\s*([^\n]+)',
    ]:
        match = re.search(pattern, text_lower)
        if match:
            return match.group(1).strip().title()
    job_name = job_config.get('name', '')
    return f"Applying for {job_name}"

def extract_skills_from_job_description(job_description: str) -> List[str]:
    jd_lower = job_description.lower()
    return [skill for skill in COMMON_TECHNICAL_SKILLS if skill.lower() in jd_lower][:10]

def extract_keywords_from_job_description(job_description: str) -> List[str]:
    common_action_verbs = [
        "develop", "design", "implement", "manage", "lead",
        "build", "optimize", "analyze", "collaborate", "drive"
    ]
    jd_lower = job_description.lower()
    return [verb + "ed" for verb in common_action_verbs if verb in jd_lower]


# ─── Scoring Functions ─────────────────────────────────────────────────────────

def calculate_ats_score(text: str) -> int:
    score = 40
    text_lower = text.lower()
    sections_found = sum(1 for s in ATS_POSITIVE_INDICATORS if s in text_lower)
    score += min(sections_found * 4, 30)
    if '•' in text or '-' in text or '\n' in text:
        score += 15
    if any(c.isupper() for c in text):
        score += 5
    if extract_email(text):
        score += 5
    if extract_phone(text):
        score += 5
    return min(score, 100)

def calculate_skills_match_score(found_skills: List[str], required_skills: List[str]) -> int:
    if not required_skills:
        return 100
    match_percentage = (len(found_skills) / len(required_skills)) * 100
    if len(found_skills) >= 3:
        match_percentage += 10
    elif len(found_skills) >= 1:
        match_percentage += 5
    return int(min(match_percentage, 100))

def calculate_experience_score(text: str, keywords: List[str]) -> int:
    score = 30
    text_lower = text.lower()
    years = extract_experience_years(text)
    if years >= 5:
        score += 30
    elif years >= 3:
        score += 25
    elif years >= 1:
        score += 20
    else:
        score += 15
    keyword_count = sum(1 for kw in keywords if kw.lower() in text_lower)
    score += min(keyword_count * 4, 40)
    return min(score, 100)

def calculate_formatting_score(text: str) -> int:
    score = 50
    sections = ['education', 'experience', 'skills', 'projects']
    score += sum(5 for s in sections if s in text.lower())
    non_empty_lines = [l for l in text.split('\n') if l.strip()]
    if len(non_empty_lines) > 5:
        score += 15
    if '\n' in text:
        score += 10
    if not re.search(r'[!@#$%^&*()]{3,}', text):
        score += 5
    return int(min(score, 100))

def calculate_keyword_optimization_score(text: str, required_skills: List[str], keywords: List[str]) -> int:
    text_lower = text.lower()
    score = 40
    skills_found = sum(1 for skill in required_skills if skill.lower() in text_lower)
    if required_skills:
        score += min((skills_found / len(required_skills)) * 35, 35)
    actions_found = sum(1 for kw in keywords if kw.lower() in text_lower)
    if keywords:
        score += min((actions_found / len(keywords)) * 15, 15)
    if skills_found > 0 or actions_found > 0:
        score += 10
    return int(min(score, 100))

def calculate_completeness(name: str, email: Optional[str], phone: Optional[str], skills: List[str], achievements: List[str]) -> int:
    score = 0
    if name != "Not found":
        score += 20
    if email:
        score += 20
    if phone:
        score += 20
    if len(skills) >= 5:
        score += 20
    elif len(skills) >= 3:
        score += 10
    if len(achievements) >= 3 and achievements[0] != "No specific achievements highlighted":
        score += 20
    elif len(achievements) >= 1:
        score += 10
    return min(score, 100)


# ─── Summary & Suggestions ────────────────────────────────────────────────────

def generate_resume_summary(text: str, job_config: Dict, skills_analysis: Dict) -> Dict:
    name = extract_name(text)
    email = extract_email(text)
    phone = extract_phone(text)
    position = extract_position(text, job_config)
    all_skills = extract_all_skills(text)
    achievements = extract_achievements(text)
    grammar_issues = check_grammar_issues(text)
    return {
        "name": name,
        "email": email or "Not found",
        "contact": phone or "Not found",
        "position": position,
        "skills_available": all_skills,
        "key_achievements": achievements,
        "grammar_issues": grammar_issues,
        "completeness_score": calculate_completeness(name, email, phone, all_skills, achievements)
    }

def generate_suggestions(text: str, skills_analysis: Dict, scores: Dict, overall_score: int, job_name: str, resume_summary: Dict) -> List[str]:
    suggestions = []
    if resume_summary['email'] == "Not found":
        suggestions.append(" CRITICAL: Add a professional email address to your resume")
    if resume_summary['contact'] == "Not found":
        suggestions.append(" Add a contact phone number for recruiters to reach you")
    if resume_summary['grammar_issues'][0] != "No major grammar issues detected":
        issues_text = '; '.join(resume_summary['grammar_issues'][:2])
        suggestions.append(f" GRAMMAR: Fix these issues - {issues_text}")
    if len(skills_analysis['missing_skills']) > 0:
        critical_missing = skills_analysis['missing_skills'][:3]
        suggestions.append(f" HIGH PRIORITY: Add these in-demand skills: {', '.join(critical_missing)}")
    if scores['skills_match'] < 50:
        suggestions.append(f" Your skills match is {scores['skills_match']}%. Create a dedicated 'Technical Skills' section to improve visibility")
    if resume_summary['key_achievements'][0] == "No specific achievements highlighted":
        suggestions.append(" Add quantifiable achievements (e.g., 'Increased sales by 30%', 'Managed team of 5')")
    if scores['ats_compatibility'] < 70:
        suggestions.append(f" ATS Score is {scores['ats_compatibility']}%. Use standard headings: 'Professional Experience', 'Education', 'Technical Skills'")
    if scores['experience_strength'] < 65:
        suggestions.append(" Strengthen experience bullets with action verbs: developed, implemented, designed, optimized, led, managed")
    if scores['formatting_quality'] < 70:
        suggestions.append(" Improve formatting: Use bullet points (•), consistent fonts, clear sections, and adequate white space")
    if scores['keyword_optimization'] < 65:
        suggestions.append(f" Optimize for '{job_name}': Include role-specific keywords from the job description throughout your resume")
    word_count = len(text.split())
    if word_count < 250:
        suggestions.append(f"  Resume is too short ({word_count} words). Aim for 400-700 words")
    elif word_count > 900:
        suggestions.append(f" Resume is too long ({word_count} words). Condense to 400-700 words")
    if overall_score >= 75:
        suggestions.append(f" Great work! Your resume scores {overall_score}/100. Keep refining based on above suggestions")
    return suggestions[:8]


# ─── Core Analysis ────────────────────────────────────────────────────────────

def analyze_resume_text(text: str, job_config: Dict) -> Dict:
    skills_analysis = extract_skills(text, job_config['required_skills'])
    ats_score = calculate_ats_score(text)
    skills_match_score = calculate_skills_match_score(skills_analysis['found_skills'], job_config['required_skills'])
    experience_score = calculate_experience_score(text, job_config['keywords'])
    formatting_score = calculate_formatting_score(text)
    keyword_score = calculate_keyword_optimization_score(text, job_config['required_skills'], job_config['keywords'])

    scores = {
        'ats_compatibility': ats_score,
        'skills_match': skills_match_score,
        'experience_strength': experience_score,
        'formatting_quality': formatting_score,
        'keyword_optimization': keyword_score
    }

    overall_score = int(
        (ats_score * 0.20) + (skills_match_score * 0.30) +
        (experience_score * 0.25) + (formatting_score * 0.15) + (keyword_score * 0.10)
    )

    resume_summary = generate_resume_summary(text, job_config, skills_analysis)
    suggestions = generate_suggestions(text, skills_analysis, scores, overall_score, job_config['name'], resume_summary)

    extracted_info = {
        'total_words': len(text.split()),
        'total_characters': len(text),
        'email': resume_summary['email'],
        'phone': resume_summary['contact'],
        'years_of_experience': extract_experience_years(text),
        'sections_found': [
            section for section in ['Professional Summary', 'Experience', 'Education', 'Skills', 'Projects']
            if section.lower() in text.lower()
        ],
        'contact_info_complete': (resume_summary['email'] != "Not found" and resume_summary['contact'] != "Not found")
    }

    return {
        'overall_score': overall_score,
        'scores': scores,
        'skills_analysis': skills_analysis,
        'suggestions': suggestions,
        'extracted_info': extracted_info,
        'resume_summary': resume_summary
    }


# ─── API Endpoints ────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "message": "AI Resume Analyzer API v2.1",
        "version": "2.1.0",
        "status": "active",
        "features": ["Detailed resume extraction", "Grammar checking", "Achievement highlighting", "Smart suggestions"]
    }

@app.get("/job-roles")
async def get_job_roles():
    return {
        "job_roles": [
            {"id": key, "name": value["name"], "skills_count": len(value["required_skills"])}
            for key, value in JOB_ROLES.items()
        ]
    }

@app.post("/analyze", response_model=AnalysisResult)
async def analyze_resume(
    file: UploadFile = File(...),
    job_role: Optional[str] = Form(None),
    job_description: Optional[str] = Form(None)
):
    if not job_role and not job_description:
        raise HTTPException(status_code=400, detail="Either 'job_role' or 'job_description' must be provided")

    content = await file.read()
    filename = file.filename.lower()

    if filename.endswith('.pdf'):
        text = extract_text_from_pdf(content)
    elif filename.endswith('.docx'):
        text = extract_text_from_docx(content)
    elif filename.endswith('.txt'):
        text = extract_text_from_txt(content)
    else:
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload PDF, DOCX, or TXT.")

    if not text or len(text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Could not extract sufficient text from the resume.")

    if job_description:
        extracted_skills = extract_skills_from_job_description(job_description)
        extracted_keywords = extract_keywords_from_job_description(job_description)
        job_config = {
            "name": "Custom Role",
            "required_skills": extracted_skills if extracted_skills else ["communication", "teamwork", "problem solving"],
            "keywords": extracted_keywords if extracted_keywords else ["developed", "managed"],
            "experience_keywords": ["experience", "worked"]
        }
    else:
        job_config = JOB_ROLES.get(job_role)
        if not job_config:
            raise HTTPException(status_code=400, detail="Invalid job role")

    return analyze_resume_text(text, job_config)

@app.post("/send-report")
async def send_report(data: EmailRequest):
    """Send resume analysis report via email"""
    try:
        from email_agent import EMAIL_CONFIG
        import aiosmtplib
        from email.mime.multipart import MIMEMultipart
        from email.mime.text import MIMEText

        results = data.analysis_results
        score = results.get("overall_score", "N/A")
        skills = results.get("skills_analysis", {}).get("found_skills", [])
        missing = results.get("skills_analysis", {}).get("missing_skills", [])
        suggestions = results.get("suggestions", [])

        html = f"""
        <html><body style="font-family: Arial; line-height:1.6;">
            <h2>📄 AI Resume Analysis Report</h2>
            <p><b>Overall ATS Score:</b> {score}/100</p>
            <h3>✅ Matched Skills</h3>
            <ul>{''.join(f'<li>{s}</li>' for s in skills)}</ul>
            <h3>❌ Missing Skills</h3>
            <ul>{''.join(f'<li>{s}</li>' for s in missing)}</ul>
            <h3>💡 Suggestions</h3>
            <ul>{''.join(f'<li>{s}</li>' for s in suggestions[:5])}</ul>
            <hr/><p style="color:gray;">Generated by AI Resume Analyzer</p>
        </body></html>
        """

        message = MIMEMultipart("alternative")
        message["From"] = EMAIL_CONFIG["EMAIL_ADDRESS"]
        message["To"] = data.email
        message["Subject"] = "Your AI Resume Analysis Report"
        message.attach(MIMEText(html, "html"))

        await aiosmtplib.send(
            message,
            hostname=EMAIL_CONFIG["SMTP_SERVER"],
            port=EMAIL_CONFIG["SMTP_PORT"],
            start_tls=True,
            username=EMAIL_CONFIG["EMAIL_ADDRESS"],
            password=EMAIL_CONFIG["EMAIL_PASSWORD"],
        )
        return {"status": "success", "message": "Email sent successfully"}
    except Exception as e:
        print("Email Error:", e)
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting AI Resume Analyzer API v2.1...")
    print("🌐 Server: http://localhost:8000")
    print("📚 API docs: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000)

    # uvicorn main_with_email_agent:app --reload
    # uvicorn main_with_email_agent:app --reload --port 8000