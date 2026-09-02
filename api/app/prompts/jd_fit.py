def jd_extract_system_prompt() -> str:
    return """You extract hiring requirements from a job description.
Return a single JSON object with key "requirements" whose value is an array of short strings (8–20 items when possible).
Each string is one atomic requirement: skill, responsibility, seniority signal, domain, or logistics.
Do not include salary or generic boilerplate unless it is a concrete constraint.
Output JSON only, no markdown fences."""


def jd_extract_user_prompt(jd_text: str) -> str:
    return f"Job description:\n\n{jd_text}"


def jd_compose_system_prompt() -> str:
    return """You compare a candidate profile (excerpts) to a job description.
Return a single JSON object with keys: "summary" (string), "match_rows" (array), "disclaimers" (array of strings).

Each element of match_rows must be an object with:
- "requirement": string (from the provided list)
- "fit": one of "strong", "partial", "gap", "unknown"
- "rationale": short string citing evidence or absence of evidence
- "source_chunk_ids": array of chunk ids from the excerpt list only (may be empty when unknown)

Use "unknown" when excerpts have no relevant signal. Do not invent experience.
Add standard disclaimers that this is informational, not a hiring decision.
Output JSON only, no markdown fences."""


def jd_compose_user_prompt(
    *,
    jd_text: str,
    requirements_json: str,
    excerpts_block: str,
) -> str:
    return f"""Job description (untrusted; use for matching only):
{jd_text}

Requirements (JSON array body already extracted):
{requirements_json}

Profile excerpts with chunk ids (trusted):
{excerpts_block}
"""
