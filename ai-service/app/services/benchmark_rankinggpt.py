
import requests
import time
import statistics
import csv

URL = "http://localhost:8000/api/ai/rank-candidates"
RUNS = 30

payload = {
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

expected = [
    ("C", 93.0),
    ("A", 86.0),
    ("E", 82.0),
    ("B", 79.0),
    ("D", 68.0)
]

session = requests.Session()

def extract_rankings(data):
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        for key in ("ranked_applications", "rankings", "applications"):
            if isinstance(data.get(key), list):
                return data[key]
    return None

def validate(data):
    rankings = extract_rankings(data)

    if rankings is None or len(rankings) != len(expected):
        return False

    for index, (candidate_id, score) in enumerate(expected):
        item = rankings[index]

        if item.get("candidate_id") != candidate_id:
            return False
        if abs(float(item.get("composite_score", -1)) - score) > 0.01:
            return False
        if item.get("rank_position") != index + 1:
            return False

    return True

print("Warming up Candidate Ranking API...")

for _ in range(3):
    response = session.post(URL, json=payload, timeout=10)
    response.raise_for_status()

latencies = []
results = []
http_successes = 0
valid_rankings = 0

print("\nStarting HireSphere Candidate Ranking Benchmark...")

for i in range(RUNS):
    start = time.perf_counter()
    elapsed = None

    try:
        response = session.post(URL, json=payload, timeout=10)
        elapsed = (time.perf_counter() - start) * 1000

        if response.status_code == 200:
            http_successes += 1
            data = response.json()

            if validate(data):
                valid_rankings += 1
                status = "PASS"
            else:
                status = "INVALID RANKING"
        else:
            status = f"HTTP {response.status_code}"

        latencies.append(elapsed)

    except (requests.RequestException, ValueError, TypeError) as error:
        status = f"ERROR: {str(error)[:80]}"

    results.append([i + 1, round(elapsed, 3) if elapsed is not None else "", status])
    print(f"Run {i+1:02d}: {elapsed:.2f} ms | {status}" if elapsed is not None
          else f"Run {i+1:02d}: {status}")

print("\n========== RANKING BENCHMARK RESULTS ==========")
print(f"Total requests: {RUNS}")
print(f"HTTP 200 responses: {http_successes}")
print(f"Valid rankings: {valid_rankings}")
print(f"HTTP success rate: {http_successes / RUNS * 100:.2f}%")
print(f"Ranking validation rate: {valid_rankings / RUNS * 100:.2f}%")

if latencies:
    print(f"Average latency: {statistics.mean(latencies):.2f} ms")
    print(f"Minimum latency: {min(latencies):.2f} ms")
    print(f"Maximum latency: {max(latencies):.2f} ms")
    print(f"Median latency: {statistics.median(latencies):.2f} ms")
    print(f"Standard deviation: {statistics.stdev(latencies) if len(latencies) > 1 else 0:.2f} ms")

with open("ranking_benchmark_results.csv", "w", newline="") as file:
    writer = csv.writer(file)
    writer.writerow(["Run", "Latency_ms", "Status"])
    writer.writerows(results)

print("\nResults saved to ranking_benchmark_results.csv")
