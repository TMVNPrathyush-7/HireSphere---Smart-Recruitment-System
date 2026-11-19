
import requests
import time
import statistics
import csv

URL = "http://localhost:8000/api/ai/mock-interview-questions"
RUNS = 10
TIMEOUT = 45

payload = {
    "role": "Software Engineer",
    "skills": ["Java", "Python", "SQL", "React", "Node.js"]
}

REQUIRED_FIELDS = [
    "question",
    "type",
    "difficulty",
    "sample_answer",
    "evaluation_criteria"
]

def validate_response(data):
    if not isinstance(data, dict):
        return False

    if data.get("role") != payload["role"]:
        return False

    questions = data.get("questions")

    if not isinstance(questions, list) or len(questions) == 0:
        return False

    for item in questions:
        if not isinstance(item, dict):
            return False

        for field in REQUIRED_FIELDS:
            value = item.get(field)
            if not isinstance(value, str) or not value.strip():
                return False

    return True


session = requests.Session()
results = []
latencies = []
http_successes = 0
valid_responses = 0

print("Starting HireSphere Mock Interview Benchmark...\n")

for i in range(RUNS):
    start = time.perf_counter()
    elapsed = None
    status = "ERROR"
    question_count = 0

    try:
        response = session.post(
            URL,
            json=payload,
            timeout=TIMEOUT
        )

        elapsed = (time.perf_counter() - start) * 1000

        if response.status_code == 200:
            http_successes += 1

            data = response.json()
            questions = data.get("questions", [])

            if isinstance(questions, list):
                question_count = len(questions)

            if validate_response(data):
                valid_responses += 1
                status = "PASS"
            else:
                status = "INVALID RESPONSE"

        else:
            status = f"HTTP {response.status_code}"

        latencies.append(elapsed)

    except (requests.RequestException, ValueError) as error:
        elapsed = (time.perf_counter() - start) * 1000
        status = f"ERROR: {str(error)[:80]}"

    results.append([
        i + 1,
        round(elapsed, 2),
        status,
        question_count
    ])

    print(
        f"Run {i+1:02d}: "
        f"{elapsed:.2f} ms | "
        f"{status} | "
        f"Questions: {question_count}"
    )

print("\n========== MOCK INTERVIEW BENCHMARK RESULTS ==========")
print(f"Total requests: {RUNS}")
print(f"HTTP 200 responses: {http_successes}")
print(f"Valid responses: {valid_responses}")
print(f"HTTP success rate: {http_successes / RUNS * 100:.2f}%")
print(f"Valid response rate: {valid_responses / RUNS * 100:.2f}%")

if latencies:
    print(f"Average latency: {statistics.mean(latencies):.2f} ms")
    print(f"Minimum latency: {min(latencies):.2f} ms")
    print(f"Maximum latency: {max(latencies):.2f} ms")
    print(f"Median latency: {statistics.median(latencies):.2f} ms")

    if len(latencies) > 1:
        print(
            f"Standard deviation: "
            f"{statistics.stdev(latencies):.2f} ms"
        )

with open(
    "mock_interview_benchmark_results.csv",
    "w",
    newline="",
    encoding="utf-8"
) as file:
    writer = csv.writer(file)
    writer.writerow([
        "Run",
        "Latency_ms",
        "Status",
        "Question_Count"
    ])
    writer.writerows(results)

print("\nResults saved to mock_interview_benchmark_results.csv")
