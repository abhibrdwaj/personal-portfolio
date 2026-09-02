import os
import subprocess
import sys
from pathlib import Path


def test_golden_retrieval_script_passes():
    api_root = Path(__file__).resolve().parents[1]
    script = api_root / "scripts" / "run_golden.py"
    env = os.environ.copy()
    env["EMBED_MODE"] = "mock"
    env["OPENAI_API_KEY"] = "sk-test"
    proc = subprocess.run(
        [sys.executable, str(script)],
        cwd=str(api_root),
        capture_output=True,
        text=True,
        check=False,
        env=env,
    )
    assert proc.returncode == 0, proc.stdout + proc.stderr
