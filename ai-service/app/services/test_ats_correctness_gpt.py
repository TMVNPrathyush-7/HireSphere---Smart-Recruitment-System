
import requests
import copy
import json

URL = "http://localhost:8000/api/ai/ats-score"

base = {
    "candidate": {
        "name": "Test Candidate",
        "email": "test@example.com",
        "phone": "9876543210",
        "headline": "Full Stack Developer",
        "summary": "Developed and implemented web applications using modern technologies.",
        "skills": [
            "Java", "Python", "JavaScript", "React",
            "Node.js", "Express", "MongoDB", "SQL",
            "HTML", "CSS"
        ],
        "education": [
            {
                "degree": "B.Tech",
                "institution": "Test University",
                "cgpa": "9.0"
            }
        ],
        "work_experience": [
            {
                "title": "Software Developer",
                "description": "Developed and optimized web applications."
            }
        ],
        "projects": [],
        "linkedin_url": "https://linkedin.com/in/test",
        "github_url": "https://github.com/test"
    },
    "job": {
        "required_skills": [
            "Java", "Python", "React",
            "Node.js", "Docker"
        ]
    }
}

tests = []

# T1: Original baseline
tests.append(("T1 - Baseline", copy.deepcopy(base)))

# T2: Remove summary
t2 = copy.deepcopy(base)
t2["candidate"]["summary"] = ""
tests.append(("T2 - No summary", t2))

# T3: Remove education and experience
t3 = copy.deepcopy(base)
t3["candidate"]["education"] = []
t3["candidate"]["work_experience"] = []
tests.append(("T3 - Missing sections", t3))

# T4: Remove job-relevant skills
t4 = copy.deepcopy(base)
t4["candidate"]["skills"] = [
    "HTML", "CSS", "MongoDB"
]
tests.append(("T4 - Low skill alignment", t4))

# T5: Add missing skill and a project
t5 = copy.deepcopy(base)
t5["candidate"]["skills"].append("Docker")
t5["candidate"]["projects"] = [
    {
        "name": "Full Stack Application",
        "description": "Built and deployed a React and Node.js application using Docker."
    }
]
tests.append(("T5 - Improved profile", t5))

print("\n========== ATS CORRECTNESS TEST ==========\n")

scores = {}

for name, payload in tests:
    try:
        response = requests.post(
            URL,
            json=payload,
            timeout=15
        )

        response.raise_for_status()
        data = response.json()

        print(f"{name}")
        print(json.dumps(data, indent=2))
        print("-" * 55)

        # Preserve full response for inspection
        scores[name] = data

    except Exception as error:
        print(f"{name}: ERROR - {error}")

with open("ats_correctness_results.json", "w") as file:
    json.dump(scores, file, indent=2)

print("\nResults saved to ats_correctness_results.json")
