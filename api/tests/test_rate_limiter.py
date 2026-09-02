import time

from app.rate_limit import RateLimiter


def test_rate_limiter_allows_burst_then_blocks():
    rl = RateLimiter(3, window_seconds=1.0)
    assert rl.allow("ip1")
    assert rl.allow("ip1")
    assert rl.allow("ip1")
    assert not rl.allow("ip1")
    time.sleep(1.05)
    assert rl.allow("ip1")
