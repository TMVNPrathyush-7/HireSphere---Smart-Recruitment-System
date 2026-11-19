
import requests
import time
import statistics
import concurrent.futures
import threading

BASE_URL = "http://127.0.0.1:8000"
TOTAL_REQUESTS = 100
CONCURRENCY_LEVELS = [5, 10, 20]

ats_payload = {
    "candidate": {
        "name": "Test Candidate",
        "email": "test@example.com",
        "phone": "9876543210",
        "headline": "Full Stack Developer",
        "summary": "Developed web applications.",
        "skills": ["Java", "Python", "React", "Node.js", "SQL"],
        "education": [{"degree": "B.Tech", "institution": "Test University"}],
        "work_experience": [{"title": "Developer", "description": "Built APIs."}],
        "projects": [],
        "linkedin_url": "https://linkedin.com/in/test",
        "github_url": "https://github.com/test"
    },
    "job": {
        "required_skills": ["Java", "Python", "React", "Docker"]
    }
}

ranking_payload = {
    "applications": [
        {"candidate_id": "A", "ats_score": 95, "skill_match_score": 80},
        {"candidate_id": "B", "ats_score": 85, "skill_match_score": 75},
        {"candidate_id": "C", "ats_score": 90, "skill_match_score": 95},
        {"candidate_id": "D", "ats_score": 80, "skill_match_score": 60},
        {"candidate_id": "E", "ats_score": 70, "skill_match_score": 90}
    ],
    "ats_weight": 0.4,
    "skill_weight": 0.6
}

expected_ranking = [
    ("C", 93.0),
    ("A", 86.0),
    ("E", 82.0),
    ("B", 79.0),
    ("D", 68.0)
]

def valid_ranking(data):
    if isinstance(data, dict):
        data = data.get("ranked_applications",
               data.get("rankings", data.get("applications")))

    if not isinstance(data, list) or len(data) != 5:
        return False

    return all(
        item.get("candidate_id") == cid
        and abs(float(item.get("composite_score", -1)) - score) < 0.01
        and item.get("rank_position") == i + 1
        for i, (item, (cid, score)) in
        enumerate(zip(data, expected_ranking))
    )
thread_local = threading.local()

def get_session():
    if not hasattr(thread_local, "session"):
        session = requests.Session()
        session.trust_env = False
        thread_local.session = session
    return thread_local.session

def send_request(api_name, endpoint, payload):
    start = time.perf_counter()

    try:
        response = get_session().post(
            BASE_URL + endpoint,
            json=payload,
            timeout=15
        )
        latency = (time.perf_counter() - start) * 1000

        if response.status_code != 200:
            return latency, False

        data = response.json()

        if api_name == "Ranking":
            return latency, valid_ranking(data)

        return latency, isinstance(data.get("ats_score"), (int, float))

    except (requests.RequestException, ValueError, TypeError):
        latency = (time.perf_counter() - start) * 1000
        return latency, False

def percentile(values, p):
    values = sorted(values)
    index = (len(values) - 1) * p / 100
    lower = int(index)
    upper = min(lower + 1, len(values) - 1)
    return values[lower] + (values[upper] - values[lower]) * (index - lower)

def run_load_test(api_name, endpoint, payload, workers):
 with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as pool:
    list(pool.map(
        lambda _: send_request(api_name, endpoint, payload),
        range(workers * 2)
    ))
    start = time.perf_counter()

    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as pool:
        results = list(pool.map(
            lambda _: send_request(api_name, endpoint, payload),
            range(TOTAL_REQUESTS)
        ))

    duration = time.perf_counter() - start
    latencies = [latency for latency, _ in results]
    successes = sum(success for _, success in results)

    print(f"\n{api_name} | Concurrent workers: {workers}")
    print(f"Total requests: {TOTAL_REQUESTS}")
    print(f"Successful valid responses: {successes}")
    print(f"Success rate: {successes / TOTAL_REQUESTS * 100:.2f}%")
    print(f"Average latency: {statistics.mean(latencies):.2f} ms")
    print(f"Median latency: {statistics.median(latencies):.2f} ms")
    print(f"P95 latency: {percentile(latencies, 95):.2f} ms")
    print(f"Maximum latency: {max(latencies):.2f} ms")
    print(f"Throughput: {TOTAL_REQUESTS / duration:.2f} requests/sec")

print("Starting HireSphere Concurrent Load Testing...")

for name, endpoint, payload in [
    ("ATS", "/api/ai/ats-score", ats_payload),
    ("Ranking", "/api/ai/rank-candidates", ranking_payload)
]:
    for workers in CONCURRENCY_LEVELS:
        run_load_test(name, endpoint, payload, workers)

print("\nAll load tests completed.")
