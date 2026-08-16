import json
import os

from dotenv import load_dotenv
from groq import Groq


load_dotenv()


API_KEY = os.getenv("GROQ_API_KEY")
MODEL = os.getenv(
    "GROQ_MODEL",
    "openai/gpt-oss-120b",
)


if not API_KEY:
    raise RuntimeError(
        "GROQ_API_KEY is missing."
    )


client = Groq(
    api_key=API_KEY
)


SYSTEM_PROMPT = """
You are a professional CV writing and optimization assistant.

Your task is to transform raw candidate information into a
professional, ATS-friendly CV structure.

STRICT FACTUALITY RULES:

1. NEVER invent information.
2. NEVER infer facts that are not explicitly supported.
3. NEVER assume the candidate is a student, graduate,
   experienced professional, senior, junior, or unemployed
   unless the input explicitly supports that claim.
4. NEVER invent years of experience.
5. NEVER invent companies, job titles, degrees,
   certifications, technologies, achievements, metrics,
   responsibilities, awards, or dates.
6. NEVER upgrade a language proficiency level.
7. NEVER describe someone as fluent unless the input explicitly
   says they are fluent or native.
8. NEVER create numerical achievements or metrics.
9. NEVER add skills that are not present in the input.
10. NEVER remove factual information that is useful.
11. You may improve grammar, wording, clarity, and structure.
12. You may convert informal descriptions into professional
    wording ONLY when the meaning remains factually equivalent.
13. Preserve all dates exactly as provided.
14. Preserve company names, institutions, job titles,
    certifications, and technologies exactly unless there
    is a clear grammatical formatting improvement.
15. If information is missing, leave the field empty.
16. Do not fill missing information using assumptions.

SUMMARY RULES:

- Write a concise professional summary.
- Base every claim on explicit candidate information.
- Do not call the candidate a student or graduate unless
  explicitly supported.
- Do not claim years of experience unless provided.
- Do not claim leadership unless provided.
- Do not claim expertise unless supported by the input.
- Do not claim fluency unless supported by the input.

EXPERIENCE RULES:

- Improve grammar and professional wording.
- Preserve the original meaning.
- Do not invent responsibilities.
- Do not invent metrics.

PROJECT RULES:

- Improve clarity and professional wording.
- Do not invent technologies, results, users, revenue,
  performance improvements, or business impact.

SKILLS RULES:

- Preserve the candidate's existing skills.
- Do not add related skills automatically.
- For example, having Python does NOT mean the candidate
  automatically has Pandas, NumPy, Django, or Machine Learning.

OUTPUT RULE:

Return ONLY valid JSON.
No markdown.
No explanations.
No text before or after the JSON.
"""


def generate_cv(raw_data):
    prompt = f"""
Transform the following candidate data into a professional CV.

Candidate data:

{json.dumps(
    raw_data,
    ensure_ascii=False,
    indent=2
)}

Return a JSON object using exactly this structure:

{{
  "personal": {{
    "fullName": "",
    "email": "",
    "phone": "",
    "location": "",
    "targetTitle": "",
    "linkedin": "",
    "portfolio": ""
  }},

  "summary": "",

  "experience": [],

  "education": [],

  "internships": [],

  "courses": [],

  "skills": {{
    "technical": [],
    "tools": [],
    "soft": []
  }},

  "languages": [],

  "achievements": [],

  "projects": [],

  "accreditations": []
}}

For the summary:
- Write a concise professional summary.
- Use only information supported by the candidate data.
- Do not invent years of experience.
- Do not invent achievements.

For experience:
- Rewrite responsibilities professionally.
- Convert vague wording into clearer professional wording
  when the meaning is supported by the original information.
- Do not invent metrics.

For projects:
- Improve descriptions while preserving the original facts.

For skills:
- Preserve the candidate's skills.
- Do not add technologies that are not present.

Return JSON only.
"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": SYSTEM_PROMPT,
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
        temperature=0.2,
    )

    content = response.choices[0].message.content

    return json.loads(content)


if __name__ == "__main__":

    test_candidate = {
        "personal": {
            "fullName": "Abulhamid Safwat",
            "email": "example@gmail.com",
            "phone": "01000000000",
            "location": "Cairo, Egypt",
            "targetTitle": "Data Analyst",
            "linkedin": "",
            "portfolio": "",
            "summary": "",
        },

        "education": [
            {
                "degree": "Bachelor's Degree",
                "institution": "Kafr El Sheikh University",
                "fieldOfStudy": "Business Administration",
                "startDate": "September-2022",
                "endDate": "June-2026",
                "grade": "",
            }
        ],

        "experience": [],

        "internships": [],

        "courses": [],

        "skills": {
            "technical": [
                "SQL",
                "Python",
            ],
            "tools": [
                "Power BI",
                "Excel",
            ],
            "soft": [
                "Communication",
            ],
        },

        "languages": [
            {
                "language": "Arabic",
                "level": "Native",
            },
            {
                "language": "English",
                "level": "Upper-Intermediate",
            },
        ],

        "achievements": [],

        "projects": [
            {
                "name": "Sales Dashboard",
                "description": "Created a dashboard using Power BI.",
                "technologies": "Power BI, Excel",
                "link": "",
            }
        ],

        "accreditations": [],
    }

    result = generate_cv(test_candidate)

    print(
        json.dumps(
            result,
            ensure_ascii=False,
            indent=2,
        )
    )