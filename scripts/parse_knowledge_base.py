"""
Parse IELTS viewpoint text into structured JSON for Prisma seed.

Usage:
  python scripts/parse_knowledge_base.py [input_txt] [output_json]

Defaults:
  input_txt: data/raw/观点库.txt
  output_json: data/knowledge_chunks.json
"""

import json
import re
import sys
from pathlib import Path


def detect_stance(subtopic: str) -> str:
    name = subtopic.lower()
    pro_keywords = [
        "positives",
        "benefits",
        "advantage",
        "arguments for",
        "why",
        "support",
        "reasons for",
        "importance",
    ]
    con_keywords = [
        "negatives",
        "disadvantage",
        "arguments against",
        "against",
        "drawback",
        "problems",
        "negative effects",
    ]

    if any(k in name for k in pro_keywords):
        return "pro"
    if any(k in name for k in con_keywords):
        return "con"
    return "neutral"


def slugify(value: str) -> str:
    value = value.lower().strip()
    value = re.sub(r"[^a-z0-9\s]", "", value)
    value = re.sub(r"\s+", "_", value)
    return value[:40]


def make_id(topic: str, subtopic: str) -> str:
    return f"{slugify(topic)}__{slugify(subtopic)}"


def parse_knowledge_base(filepath: Path) -> dict:
    content = filepath.read_text(encoding="utf-8-sig")
    content = content.replace("\r\n", "\n").replace("\r", "\n")
    lines = content.split("\n")

    chunks = []
    current_topic = None
    current_subtopic = None
    current_points = []

    def flush():
        nonlocal current_points
        if current_topic and current_subtopic and current_points:
            chunk_id = make_id(current_topic, current_subtopic)
            full_text = (
                f"Topic: {current_topic}\n"
                f"Aspect: {current_subtopic}\n"
                + "\n".join(f"- {point}" for point in current_points)
            )
            chunks.append(
                {
                    "id": chunk_id,
                    "topic": current_topic,
                    "subtopic": current_subtopic,
                    "stance": detect_stance(current_subtopic),
                    "points": current_points.copy(),
                    "full_text": full_text,
                    "point_count": len(current_points),
                }
            )
        current_points = []

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        if stripped == "---":
            flush()
            current_subtopic = None
            continue

        if stripped.startswith("# ") and not stripped.startswith("## "):
            flush()
            current_topic = stripped[2:].strip()
            current_subtopic = None
            continue

        if stripped.startswith("## "):
            flush()
            current_subtopic = stripped[3:].strip()
            continue

        if stripped.startswith("- "):
            point = stripped[2:].strip()
            if point:
                current_points.append(point)

    flush()

    seen = set()
    deduped = []
    for chunk in chunks:
        if chunk["id"] in seen:
            continue
        seen.add(chunk["id"])
        deduped.append(chunk)

    topics = sorted({chunk["topic"] for chunk in deduped})
    total_points = sum(chunk["point_count"] for chunk in deduped)

    return {
        "meta": {
            "topic_count": len(topics),
            "chunk_count": len(deduped),
            "point_count": total_points,
            "topics": topics,
        },
        "chunks": deduped,
    }


def main():
    default_input = Path("data/raw/观点库.txt")
    default_output = Path("data/knowledge_chunks.json")

    input_file = Path(sys.argv[1]) if len(sys.argv) > 1 else default_input
    output_file = Path(sys.argv[2]) if len(sys.argv) > 2 else default_output

    if not input_file.exists():
        print(f"[ERROR] Input file not found: {input_file}")
        sys.exit(1)

    data = parse_knowledge_base(input_file)
    output_file.parent.mkdir(parents=True, exist_ok=True)
    output_file.write_text(
        json.dumps(data, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print("=== Parse Summary ===")
    print(f"topic_count: {data['meta']['topic_count']}")
    print(f"chunk_count: {data['meta']['chunk_count']}")
    print(f"point_count: {data['meta']['point_count']}")
    print(f"saved_to: {output_file}")


if __name__ == "__main__":
    main()
