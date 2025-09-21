from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn, webbrowser, os
from typing import List
from io import BytesIO
from PyPDF2 import PdfReader
from PIL import Image
import pytesseract
from rapidfuzz import fuzz

# Optional: OpenAI for GenAI advice
try:
    import openai
    OPENAI_KEY = os.getenv("OPENAI_API_KEY", None)
    if OPENAI_KEY:
        openai.api_key = OPENAI_KEY
except:
    OPENAI_KEY = None

# -----------------------------
# Tesseract Path (Windows fix)
# -----------------------------
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# -----------------------------
# Models
# -----------------------------
class ResumeText(BaseModel):
    text: str

class JobDescription(BaseModel):
    text: str

# -----------------------------
# App & CORS
# -----------------------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Skills Catalog (shortened)
# -----------------------------
skills_catalog = [
    "Python","Java","C++","SQL","React","Machine Learning","Data Analysis","AWS","Azure",
    "Cloud Computing","Cybersecurity","Project Management","Leadership","Marketing",
    "Financial Modelling","Accounting","Medical Knowledge","Patient Care",
    "Graphic Design","UI Design","Creativity","Teaching","Entrepreneurship"
]

# -----------------------------
# Career Paths + Advice
# -----------------------------
career_paths = {
    "Software Engineer": ["Python","Java","C++","Problem Solving","Data Structures"],
    "Data Scientist": ["Python","Machine Learning","Statistics","SQL","Data Analysis"],
    "Cloud Engineer": ["AWS","Azure","Linux","Networking"],
    "Cybersecurity Specialist": ["Cybersecurity","Linux","Ethical Hacking","Cryptography"],
    "Product Manager": ["Agile","Market Research","Leadership"],
    "Financial Analyst": ["Excel","Accounting","Financial Modelling"],
    "Nurse": ["Medical Knowledge","Patient Care","Communication"],
    "Graphic Designer": ["Adobe Photoshop","Creativity","UI Design"],
    "Teacher": ["Subject Knowledge","Communication","Creativity"],
    "Entrepreneur": ["Business Strategy","Networking","Leadership"]
}

career_advice = {
    "Software Engineer": "Practice coding on LeetCode, build projects, and contribute to GitHub.",
    "Data Scientist": "Work on Kaggle datasets, learn ML libraries, and publish notebooks.",
    "Cloud Engineer": "Get AWS/Azure certifications, deploy apps on cloud.",
    "Cybersecurity Specialist": "Learn penetration testing, earn CEH certification.",
    "Product Manager": "Master agile methods, talk to users, and improve leadership.",
    "Financial Analyst": "Learn Excel, valuation modeling, and stay updated with market news.",
    "Nurse": "Gain hospital experience and pursue nursing certifications.",
    "Graphic Designer": "Build a portfolio and master Adobe tools.",
    "Teacher": "Use modern pedagogy methods and keep students engaged.",
    "Entrepreneur": "Learn business strategy, take risks, and grow leadership."
}

learning_resources = {
    "Python": ["FreeCodeCamp Python", "Automate the Boring Stuff"],
    "Machine Learning": ["Andrew Ng ML Course", "Kaggle Projects"],
    "Cloud": ["AWS Cloud Practitioner", "Deploy app on AWS"],
    "Finance": ["CFA Level 1", "Financial Modeling Prep"],
    "Marketing": ["Google Digital Garage", "SEO projects"]
}

role_descriptions = {
    "Software Engineer": "Designs, develops, and maintains software applications.",
    "Data Scientist": "Analyzes data to extract insights and build predictive models.",
    "Web Developer": "Builds and maintains responsive websites and web apps.",
    "Cloud Engineer": "Manages and deploys applications on cloud platforms.",
    "Cybersecurity Specialist": "Protects systems and networks from cyber threats.",
    "AI Researcher": "Explores and develops new artificial intelligence techniques.",
    "Mobile App Developer": "Builds applications for Android and iOS platforms.",
    "Data Engineer": "Designs and manages large-scale data pipelines and storage.",
    "Business Analyst": "Identifies business needs and proposes technical solutions.",
    "Product Manager": "Defines product vision, strategy, and ensures delivery.",
    "Marketing Specialist": "Drives campaigns to promote products and services.",
    "Financial Analyst": "Analyzes financial data to support decision-making.",
    "Nurse": "Provides patient care and medical support in healthcare settings.",
    "Graphic Designer": "Creates visual concepts for branding and communication.",
    "Teacher": "Educates students and creates engaging learning experiences.",
    "Entrepreneur": "Builds and manages new business ventures."
}

# -----------------------------
# Helper Functions
# -----------------------------
def extract_text_from_image(file_bytes: bytes) -> str:
    try:
        image = Image.open(BytesIO(file_bytes))
        gray = image.convert("L")
        bw = gray.point(lambda x: 0 if x < 140 else 255, "1")
        return pytesseract.image_to_string(bw)
    except Exception:
        return ""

def extract_text_from_file(file: UploadFile, content: bytes) -> str:
    if file.content_type == "application/pdf":
        pdf = PdfReader(BytesIO(content))
        return "".join([page.extract_text() or "" for page in pdf.pages])
    elif file.content_type.startswith("image/"):
        return extract_text_from_image(content)
    else:
        return content.decode("utf-8", errors="ignore")

def match_skills(text: str):
    return [s for s in skills_catalog if fuzz.partial_ratio(s.lower(), text.lower()) > 80]

def generate_learning_path(missing_skills):
    roadmap = {}
    for skill in missing_skills:
        roadmap[skill] = learning_resources.get(skill, ["Search online resources."])
    return roadmap

def generate_ai_advice(role, skills, missing):
    if not OPENAI_KEY:
        return career_advice.get(role, "Keep improving your skills to stay competitive.")
    prompt = f"I have these skills: {skills}. I want to be a {role}. Missing: {missing}. Give me a 6-month roadmap."
    resp = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )
    return resp["choices"][0]["message"]["content"]

# -----------------------------
# Endpoints
# -----------------------------
@app.post("/upload-resume-file")
async def upload_resume_file(file: UploadFile = File(...)):
    try:
        content = await file.read()
        text = extract_text_from_file(file, content)
        found_skills = match_skills(text)
        return {"skills": found_skills, "raw_text": text[:500]}
    except Exception as e:
        return {"error": str(e)}

@app.post("/upload-resume-text")
async def upload_resume_text(resume: ResumeText):
    found_skills = match_skills(resume.text)
    return {"skills": found_skills, "raw_text": resume.text[:500]}

@app.get("/analysis")
async def analysis(skills: str):
    user_skills = [s.strip() for s in skills.split(",") if s.strip()]
    recommendations = []
    for role, needed in career_paths.items():
        have = [s for s in user_skills if s in needed]
        missing = [s for s in needed if s not in user_skills]
        if have:
            score = round((len(have) / len(needed)) * 100, 2)
            recommendations.append({
                "role": role,
                "role_description": role_descriptions.get(role, "No description available."),
                "have": have,
                "missing": missing,
                "match_score": score,
                "advice": generate_ai_advice(role, have, missing),
                "learning_path": generate_learning_path(missing)
            })
    recommendations.sort(key=lambda x: x["match_score"], reverse=True)
    return {"recommendations": recommendations}


@app.post("/ats-score")
async def ats_score(resume: ResumeText, job: JobDescription):
    resume_text = resume.text.lower()
    jd_text = job.text.lower()
    jd_keywords = [w for w in jd_text.split() if len(w) > 3]
    matched = [k for k in jd_keywords if k in resume_text]
    score = (len(matched) / len(set(jd_keywords))) * 100
    return {"ats_score": round(score, 2), "matched_keywords": matched}

# -----------------------------
# Main
# -----------------------------
if __name__ == "__main__":
    # Detect if running locally (Render sets special env vars)
    if os.getenv("RENDER") is None:
        try:
            webbrowser.open("http://127.0.0.1:8000/docs")
        except Exception:
            pass
        uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
    else:
        port = int(os.environ.get
