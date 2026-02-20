# """
# Unit tests for Resume Analyzer Backend
# Run with: pytest test_main.py -v
# """

# import pytest
# from fastapi.testclient import TestClient
# from backend.app.main import (
#     app, extract_email, extract_phone, extract_skills,
#     extract_experience_years, calculate_ats_score,
#     calculate_skills_match_score, JOB_ROLES
# )
# import io

# client = TestClient(app)

# # Sample resume text for testing
# SAMPLE_RESUME = """
# John Doe
# john.doe@email.com | +1-234-567-8900

# PROFESSIONAL SUMMARY
# Experienced Software Engineer with 5 years of expertise in Python, JavaScript, and React.
# Proven track record of developing scalable web applications and optimizing system performance.

# EXPERIENCE
# Senior Software Engineer | Tech Corp | 2020-Present
# - Developed and deployed 10+ microservices using Python and Docker
# - Improved application performance by 40% through optimization
# - Led a team of 5 developers in agile sprints
# - Implemented CI/CD pipelines using Jenkins and Git

# Software Engineer | StartupXYZ | 2018-2020
# - Built React-based frontend applications serving 100K+ users
# - Integrated REST APIs and GraphQL endpoints
# - Worked with SQL and MongoDB databases

# EDUCATION
# Bachelor of Technology in Computer Science
# XYZ University | 2014-2018

# SKILLS
# Programming: Python, JavaScript, Java, C++
# Web: React, Node.js, Django, Flask
# Database: SQL, PostgreSQL, MongoDB
# Tools: Git, Docker, Kubernetes, AWS
# Other: Data Structures, Algorithms, Agile, Scrum
# """

# class TestHealthEndpoints:
#     """Test basic API endpoints"""
    
#     def test_root_endpoint(self):
#         """Test health check endpoint"""
#         response = client.get("/")
#         assert response.status_code == 200
#         data = response.json()
#         assert "message" in data
#         assert data["status"] == "active"
    
#     def test_job_roles_endpoint(self):
#         """Test job roles listing endpoint"""
#         response = client.get("/job-roles")
#         assert response.status_code == 200
#         data = response.json()
#         assert "job_roles" in data
#         assert len(data["job_roles"]) > 0
#         assert all("id" in role and "name" in role for role in data["job_roles"])

# class TestTextExtraction:
#     """Test text extraction utilities"""
    
#     def test_extract_email(self):
#         """Test email extraction"""
#         text = "Contact me at john.doe@example.com for more info"
#         email = extract_email(text)
#         assert email == "john.doe@example.com"
    
#     def test_extract_email_no_match(self):
#         """Test email extraction with no email present"""
#         text = "No email in this text"
#         email = extract_email(text)
#         assert email is None
    
#     def test_extract_phone(self):
#         """Test phone number extraction"""
#         text = "Call me at +1-234-567-8900"
#         phone = extract_phone(text)
#         assert phone is not None
    
#     def test_extract_phone_formats(self):
#         """Test various phone number formats"""
#         test_cases = [
#             "123-456-7890",
#             "(123) 456-7890",
#             "+1-123-456-7890",
#             "123.456.7890"
#         ]
#         for phone_text in test_cases:
#             result = extract_phone(phone_text)
#             assert result is not None

# class TestSkillsExtraction:
#     """Test skills analysis functions"""
    
#     def test_extract_skills_all_found(self):
#         """Test when all skills are present"""
#         text = "I have experience with python, javascript, and react"
#         required = ["python", "javascript", "react"]
#         result = extract_skills(text, required)
        
#         assert len(result["found_skills"]) == 3
#         assert len(result["missing_skills"]) == 0
#         assert result["total_skills_found"] == 3
    
#     def test_extract_skills_partial_match(self):
#         """Test when some skills are missing"""
#         text = "I know python and javascript"
#         required = ["python", "javascript", "java", "react"]
#         result = extract_skills(text, required)
        
#         assert "python" in result["found_skills"]
#         assert "javascript" in result["found_skills"]
#         assert "java" in result["missing_skills"]
#         assert "react" in result["missing_skills"]
    
#     def test_extract_skills_case_insensitive(self):
#         """Test case-insensitive skill matching"""
#         text = "I have PYTHON, JavaScript, and ReAcT experience"
#         required = ["python", "javascript", "react"]
#         result = extract_skills(text, required)
        
#         assert len(result["found_skills"]) == 3

# class TestExperienceExtraction:
#     """Test experience analysis"""
    
#     def test_extract_experience_years_explicit(self):
#         """Test explicit years of experience"""
#         text = "I have 5 years of experience in software development"
#         years = extract_experience_years(text)
#         assert years == 5
    
#     def test_extract_experience_years_plus(self):
#         """Test '5+ years' format"""
#         text = "5+ years of experience"
#         years = extract_experience_years(text)
#         assert years == 5
    
#     def test_extract_experience_years_date_range(self):
#         """Test date range calculation"""
#         text = "Worked from 2020-2023 at Company A"
#         years = extract_experience_years(text)
#         assert years >= 3
    
#     def test_extract_experience_years_multiple_ranges(self):
#         """Test multiple date ranges"""
#         text = "Company A: 2018-2020, Company B: 2020-2023"
#         years = extract_experience_years(text)
#         assert years >= 5

# class TestScoringFunctions:
#     """Test scoring calculation functions"""
    
#     def test_ats_score_complete_resume(self):
#         """Test ATS score with complete resume"""
#         score = calculate_ats_score(SAMPLE_RESUME)
#         assert 0 <= score <= 100
#         assert score >= 70  # Should score well with complete sections
    
#     def test_ats_score_minimal_resume(self):
#         """Test ATS score with minimal content"""
#         minimal_text = "Some random text without structure"
#         score = calculate_ats_score(minimal_text)
#         assert 0 <= score <= 100
#         assert score < 50  # Should score poorly
    
#     def test_skills_match_score_perfect(self):
#         """Test 100% skills match"""
#         found = ["python", "javascript", "react"]
#         required = ["python", "javascript", "react"]
#         score = calculate_skills_match_score(found, required)
#         assert score == 100
    
#     def test_skills_match_score_partial(self):
#         """Test partial skills match"""
#         found = ["python", "javascript"]
#         required = ["python", "javascript", "react", "java"]
#         score = calculate_skills_match_score(found, required)
#         assert score == 50
    
#     def test_skills_match_score_none(self):
#         """Test zero skills match"""
#         found = []
#         required = ["python", "javascript", "react"]
#         score = calculate_skills_match_score(found, required)
#         assert score == 0

# class TestAnalyzeEndpoint:
#     """Test the main analysis endpoint"""
    
#     def test_analyze_with_txt_file(self):
#         """Test analysis with TXT file"""
#         # Create a text file in memory
#         file_content = SAMPLE_RESUME.encode('utf-8')
#         files = {'file': ('resume.txt', io.BytesIO(file_content), 'text/plain')}
#         data = {'job_role': 'software_engineer'}
        
#         response = client.post("/analyze", files=files, data=data)
#         assert response.status_code == 200
        
#         result = response.json()
#         assert 'overall_score' in result
#         assert 'scores' in result
#         assert 'skills_analysis' in result
#         assert 'suggestions' in result
#         assert 'extracted_info' in result
    
#     def test_analyze_invalid_job_role(self):
#         """Test analysis with invalid job role"""
#         file_content = SAMPLE_RESUME.encode('utf-8')
#         files = {'file': ('resume.txt', io.BytesIO(file_content), 'text/plain')}
#         data = {'job_role': 'invalid_role'}
        
#         response = client.post("/analyze", files=files, data=data)
#         assert response.status_code == 400
    
#     def test_analyze_unsupported_file_type(self):
#         """Test analysis with unsupported file type"""
#         file_content = b"Some content"
#         files = {'file': ('resume.xyz', io.BytesIO(file_content), 'application/octet-stream')}
#         data = {'job_role': 'software_engineer'}
        
#         response = client.post("/analyze", files=files, data=data)
#         assert response.status_code == 400
    
#     def test_analyze_empty_file(self):
#         """Test analysis with empty file"""
#         file_content = b""
#         files = {'file': ('resume.txt', io.BytesIO(file_content), 'text/plain')}
#         data = {'job_role': 'software_engineer'}
        
#         response = client.post("/analyze", files=files, data=data)
#         assert response.status_code == 400

# class TestResponseStructure:
#     """Test response data structure and validation"""
    
#     def test_analysis_response_structure(self):
#         """Test that analysis response has correct structure"""
#         file_content = SAMPLE_RESUME.encode('utf-8')
#         files = {'file': ('resume.txt', io.BytesIO(file_content), 'text/plain')}
#         data = {'job_role': 'software_engineer'}
        
#         response = client.post("/analyze", files=files, data=data)
#         result = response.json()
        
#         # Check overall score
#         assert isinstance(result['overall_score'], int)
#         assert 0 <= result['overall_score'] <= 100
        
#         # Check individual scores
#         assert 'ats_compatibility' in result['scores']
#         assert 'skills_match' in result['scores']
#         assert 'experience_strength' in result['scores']
#         assert 'formatting_quality' in result['scores']
#         assert 'keyword_optimization' in result['scores']
        
#         # Check skills analysis
#         assert 'found_skills' in result['skills_analysis']
#         assert 'missing_skills' in result['skills_analysis']
#         assert isinstance(result['skills_analysis']['found_skills'], list)
        
#         # Check suggestions
#         assert isinstance(result['suggestions'], list)
#         assert len(result['suggestions']) > 0
        
#         # Check extracted info
#         assert 'total_words' in result['extracted_info']
#         assert 'years_of_experience' in result['extracted_info']

# class TestDifferentJobRoles:
#     """Test analysis with different job roles"""
    
#     @pytest.mark.parametrize("job_role", [
#         "software_engineer",
#         "data_scientist",
#         "product_manager",
#         "ui_ux_designer"
#     ])
#     def test_analyze_all_job_roles(self, job_role):
#         """Test analysis works for all defined job roles"""
#         file_content = SAMPLE_RESUME.encode('utf-8')
#         files = {'file': ('resume.txt', io.BytesIO(file_content), 'text/plain')}
#         data = {'job_role': job_role}
        
#         response = client.post("/analyze", files=files, data=data)
#         assert response.status_code == 200
#         result = response.json()
#         assert result['overall_score'] >= 0

# class TestEdgeCases:
#     """Test edge cases and error handling"""
    
#     def test_very_short_resume(self):
#         """Test with very short resume text"""
#         short_resume = "Name: John. Skills: Python."
#         file_content = short_resume.encode('utf-8')
#         files = {'file': ('resume.txt', io.BytesIO(file_content), 'text/plain')}
#         data = {'job_role': 'software_engineer'}
        
#         response = client.post("/analyze", files=files, data=data)
#         # Should fail due to insufficient content
#         assert response.status_code == 400
    
#     def test_very_long_resume(self):
#         """Test with very long resume text"""
#         long_resume = SAMPLE_RESUME * 20  # Repeat resume 20 times
#         file_content = long_resume.encode('utf-8')
#         files = {'file': ('resume.txt', io.BytesIO(file_content), 'text/plain')}
#         data = {'job_role': 'software_engineer'}
        
#         response = client.post("/analyze", files=files, data=data)
#         assert response.status_code == 200
    
#     def test_special_characters_in_resume(self):
#         """Test resume with special characters"""
#         special_resume = SAMPLE_RESUME + "\n★ ● ◆ ▪ → ✓ 😀"
#         file_content = special_resume.encode('utf-8')
#         files = {'file': ('resume.txt', io.BytesIO(file_content), 'text/plain')}
#         data = {'job_role': 'software_engineer'}
        
#         response = client.post("/analyze", files=files, data=data)
#         assert response.status_code == 200

# if __name__ == "__main__":
#     pytest.main([__file__, "-v", "--tb=short"])



"""
Unit tests for Resume Analyzer Backend
Run with: pytest test_main.py -v
"""

import pytest
from fastapi.testclient import TestClient
from main import (
    app, extract_email, extract_phone, extract_skills,
    extract_experience_years, calculate_ats_score,
    calculate_skills_match_score, JOB_ROLES
)
import io

client = TestClient(app)

# Sample resume text for testing
SAMPLE_RESUME = """
John Doe
john.doe@email.com | +1-234-567-8900

PROFESSIONAL SUMMARY
Experienced Software Engineer with 5 years of expertise in Python, JavaScript, and React.
Proven track record of developing scalable web applications and optimizing system performance.

EXPERIENCE
Senior Software Engineer | Tech Corp | 2020-Present
- Developed and deployed 10+ microservices using Python and Docker
- Improved application performance by 40% through optimization
- Led a team of 5 developers in agile sprints
- Implemented CI/CD pipelines using Jenkins and Git

Software Engineer | StartupXYZ | 2018-2020
- Built React-based frontend applications serving 100K+ users
- Integrated REST APIs and GraphQL endpoints
- Worked with SQL and MongoDB databases

EDUCATION
Bachelor of Technology in Computer Science
XYZ University | 2014-2018

SKILLS
Programming: Python, JavaScript, Java, C++
Web: React, Node.js, Django, Flask
Database: SQL, PostgreSQL, MongoDB
Tools: Git, Docker, Kubernetes, AWS
Other: Data Structures, Algorithms, Agile, Scrum
"""


class TestHealthEndpoints:
    """Test basic API endpoints"""

    def test_root_endpoint(self):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["status"] == "active"

    def test_job_roles_endpoint(self):
        response = client.get("/job-roles")
        assert response.status_code == 200
        data = response.json()
        assert "job_roles" in data
        assert len(data["job_roles"]) > 0
        assert all("id" in role and "name" in role for role in data["job_roles"])


class TestTextExtraction:
    """Test text extraction utilities"""

    def test_extract_email(self):
        text = "Contact me at john.doe@example.com for more info"
        email = extract_email(text)
        assert email == "john.doe@example.com"

    def test_extract_email_no_match(self):
        text = "No email in this text"
        email = extract_email(text)
        assert email is None

    def test_extract_phone(self):
        text = "Call me at +1-234-567-8900"
        phone = extract_phone(text)
        assert phone is not None

    def test_extract_phone_formats(self):
        test_cases = [
            "123-456-7890",
            "(123) 456-7890",
            "+1-123-456-7890",
            "123.456.7890"
        ]
        for phone_text in test_cases:
            result = extract_phone(phone_text)
            assert result is not None


class TestSkillsExtraction:
    """Test skills analysis functions"""

    def test_extract_skills_all_found(self):
        text = "I have experience with python, javascript, and react"
        required = ["python", "javascript", "react"]
        result = extract_skills(text, required)
        assert len(result["found_skills"]) == 3
        assert len(result["missing_skills"]) == 0
        assert result["total_skills_found"] == 3

    def test_extract_skills_partial_match(self):
        text = "I know python and javascript"
        required = ["python", "javascript", "java", "react"]
        result = extract_skills(text, required)
        assert "python" in result["found_skills"]
        assert "javascript" in result["found_skills"]
        assert "java" in result["missing_skills"]
        assert "react" in result["missing_skills"]

    def test_extract_skills_case_insensitive(self):
        text = "I have PYTHON, JavaScript, and ReAcT experience"
        required = ["python", "javascript", "react"]
        result = extract_skills(text, required)
        assert len(result["found_skills"]) == 3


class TestExperienceExtraction:
    """Test experience analysis"""

    def test_extract_experience_years_explicit(self):
        text = "I have 5 years of experience in software development"
        years = extract_experience_years(text)
        assert years == 5

    def test_extract_experience_years_plus(self):
        text = "5+ years of experience"
        years = extract_experience_years(text)
        assert years == 5

    def test_extract_experience_years_date_range(self):
        text = "Worked from 2020-2023 at Company A"
        years = extract_experience_years(text)
        assert years >= 3

    def test_extract_experience_years_multiple_ranges(self):
        text = "Company A: 2018-2020, Company B: 2020-2023"
        years = extract_experience_years(text)
        assert years >= 5


class TestScoringFunctions:
    """Test scoring calculation functions"""

    def test_ats_score_complete_resume(self):
        score = calculate_ats_score(SAMPLE_RESUME)
        assert 0 <= score <= 100
        assert score >= 70

    def test_ats_score_minimal_resume(self):
        minimal_text = "Some random text without structure"
        score = calculate_ats_score(minimal_text)
        assert 0 <= score <= 100
        assert score < 50

    def test_skills_match_score_perfect(self):
        found = ["python", "javascript", "react"]
        required = ["python", "javascript", "react"]
        score = calculate_skills_match_score(found, required)
        assert score == 100

    def test_skills_match_score_partial(self):
        found = ["python", "javascript"]
        required = ["python", "javascript", "react", "java"]
        score = calculate_skills_match_score(found, required)
        assert score == 60  # 2/4 * 100 + 10 bonus = 60

    def test_skills_match_score_none(self):
        found = []
        required = ["python", "javascript", "react"]
        score = calculate_skills_match_score(found, required)
        assert score == 0


class TestAnalyzeEndpoint:
    """Test the main analysis endpoint"""

    def test_analyze_with_txt_file(self):
        file_content = SAMPLE_RESUME.encode('utf-8')
        files = {'file': ('resume.txt', io.BytesIO(file_content), 'text/plain')}
        data = {'job_role': 'software_engineer'}
        response = client.post("/analyze", files=files, data=data)
        assert response.status_code == 200
        result = response.json()
        assert 'overall_score' in result
        assert 'scores' in result
        assert 'skills_analysis' in result
        assert 'suggestions' in result
        assert 'extracted_info' in result

    def test_analyze_invalid_job_role(self):
        file_content = SAMPLE_RESUME.encode('utf-8')
        files = {'file': ('resume.txt', io.BytesIO(file_content), 'text/plain')}
        data = {'job_role': 'invalid_role'}
        response = client.post("/analyze", files=files, data=data)
        assert response.status_code == 400

    def test_analyze_unsupported_file_type(self):
        file_content = b"Some content"
        files = {'file': ('resume.xyz', io.BytesIO(file_content), 'application/octet-stream')}
        data = {'job_role': 'software_engineer'}
        response = client.post("/analyze", files=files, data=data)
        assert response.status_code == 400

    def test_analyze_empty_file(self):
        file_content = b""
        files = {'file': ('resume.txt', io.BytesIO(file_content), 'text/plain')}
        data = {'job_role': 'software_engineer'}
        response = client.post("/analyze", files=files, data=data)
        assert response.status_code == 400

    def test_analyze_no_role_or_description(self):
        file_content = SAMPLE_RESUME.encode('utf-8')
        files = {'file': ('resume.txt', io.BytesIO(file_content), 'text/plain')}
        response = client.post("/analyze", files=files)
        assert response.status_code == 400


class TestResponseStructure:
    """Test response data structure and validation"""

    def test_analysis_response_structure(self):
        file_content = SAMPLE_RESUME.encode('utf-8')
        files = {'file': ('resume.txt', io.BytesIO(file_content), 'text/plain')}
        data = {'job_role': 'software_engineer'}
        response = client.post("/analyze", files=files, data=data)
        result = response.json()

        assert isinstance(result['overall_score'], int)
        assert 0 <= result['overall_score'] <= 100
        assert 'ats_compatibility' in result['scores']
        assert 'skills_match' in result['scores']
        assert 'experience_strength' in result['scores']
        assert 'formatting_quality' in result['scores']
        assert 'keyword_optimization' in result['scores']
        assert 'found_skills' in result['skills_analysis']
        assert 'missing_skills' in result['skills_analysis']
        assert isinstance(result['skills_analysis']['found_skills'], list)
        assert isinstance(result['suggestions'], list)
        assert len(result['suggestions']) > 0
        assert 'total_words' in result['extracted_info']
        assert 'years_of_experience' in result['extracted_info']


class TestDifferentJobRoles:
    """Test analysis with different job roles"""

    @pytest.mark.parametrize("job_role", [
        "software_engineer",
        "data_scientist",
        "product_manager",
        "ui_ux_designer"
    ])
    def test_analyze_all_job_roles(self, job_role):
        file_content = SAMPLE_RESUME.encode('utf-8')
        files = {'file': ('resume.txt', io.BytesIO(file_content), 'text/plain')}
        data = {'job_role': job_role}
        response = client.post("/analyze", files=files, data=data)
        assert response.status_code == 200
        result = response.json()
        assert result['overall_score'] >= 0


class TestEdgeCases:
    """Test edge cases and error handling"""

    def test_very_short_resume(self):
        short_resume = "Name: John. Skills: Python."
        file_content = short_resume.encode('utf-8')
        files = {'file': ('resume.txt', io.BytesIO(file_content), 'text/plain')}
        data = {'job_role': 'software_engineer'}
        response = client.post("/analyze", files=files, data=data)
        assert response.status_code == 400

    def test_very_long_resume(self):
        long_resume = SAMPLE_RESUME * 20
        file_content = long_resume.encode('utf-8')
        files = {'file': ('resume.txt', io.BytesIO(file_content), 'text/plain')}
        data = {'job_role': 'software_engineer'}
        response = client.post("/analyze", files=files, data=data)
        assert response.status_code == 200

    def test_special_characters_in_resume(self):
        special_resume = SAMPLE_RESUME + "\n★ ● ◆ ▪ → ✔"
        file_content = special_resume.encode('utf-8')
        files = {'file': ('resume.txt', io.BytesIO(file_content), 'text/plain')}
        data = {'job_role': 'software_engineer'}
        response = client.post("/analyze", files=files, data=data)
        assert response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])