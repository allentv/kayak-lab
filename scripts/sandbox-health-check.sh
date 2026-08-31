#!/usr/bin/env bash
# Health check for sandbox execution environment.
# Verifies Docker, gVisor, and sandbox isolation are working correctly.

set -euo pipefail

echo "=== Sandbox Health Check ==="
echo ""

# Color helpers
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASSED=0
FAILED=0

pass() { echo -e "  ${GREEN}✓${NC} $1"; ((PASSED++)); }
fail() { echo -e "  ${RED}✗${NC} $1"; ((FAILED++)); }
warn() { echo -e "  ${YELLOW}!${NC} $1"; }

# Check 1: Docker installed
echo "1. Docker installation"
if command -v docker &> /dev/null; then
    pass "Docker is installed ($(docker --version 2>/dev/null | awk '{print $3}' | tr -d ','))"
else
    fail "Docker is not installed"
fi

# Check 2: Docker daemon running
echo "2. Docker daemon"
if docker info &> /dev/null; then
    pass "Docker daemon is running"
else
    fail "Docker daemon is not running"
fi

# Check 3: gVisor runtime registered
echo "3. gVisor (runsc) runtime"
if docker info --format '{{json .Runtimes}}' 2>/dev/null | grep -q "runsc"; then
    RUNSC_PATH=$(docker info --format '{{json .Runtimes}}' 2>/dev/null | grep -o '"runsc":{[^}]*}' | grep -o '"Path":"[^"]*"' | cut -d'"' -f4)
    pass "gVisor runtime registered (${RUNSC_PATH:-unknown})"
else
    warn "gVisor runtime not registered — using plain Docker"
fi

# Check 4: Test container execution
echo "4. Container execution"
OUTPUT=$(docker run --rm --network=none --read-only --cap-drop=ALL alpine echo "health-ok" 2>&1)
if echo "$OUTPUT" | grep -q "health-ok"; then
    pass "Test container executed successfully"
else
    fail "Test container execution failed: $OUTPUT"
fi

# Check 5: Network isolation
echo "5. Network isolation"
NET_OUTPUT=$(docker run --rm --network=none --read-only --cap-drop=ALL alpine sh -c "wget -q -T 2 http://example.com 2>&1 || echo 'blocked'" 2>&1)
if echo "$NET_OUTPUT" | grep -q "blocked\|refused\|timed out"; then
    pass "Network isolation working"
else
    fail "Network may not be properly isolated"
fi

# Check 6: Resource limits
echo "6. Resource limits"
MEM_OUTPUT=$(docker run --rm --network=none --read-only --cap-drop=ALL --memory=64m alpine sh -c "cat /sys/fs/cgroup/memory.max 2>/dev/null || cat /sys/fs/cgroup/memory/memory.limit_in_bytes 2>/dev/null || echo 'unknown'" 2>&1)
if [[ "$MEM_OUTPUT" != "unknown" && "$MEM_OUTPUT" != "" ]]; then
    pass "Memory limits configurable"
else
    warn "Could not verify memory limits"
fi

# Check 7: Writable /tmp
echo "7. Writable /tmp"
TMP_OUTPUT=$(docker run --rm --network=none --read-only --cap-drop=ALL --tmpfs /tmp:rw,nosuid,nodev alpine sh -c "touch /tmp/test && echo 'tmp-ok'" 2>&1)
if echo "$TMP_OUTPUT" | grep -q "tmp-ok"; then
    pass "Writable /tmp working"
else
    fail "Cannot write to /tmp: $TMP_OUTPUT"
fi

# Check 8: Non-root user
echo "8. Non-root user"
USER_OUTPUT=$(docker run --rm --network=none --read-only --cap-drop=ALL --user 65532:65532 alpine id 2>&1)
if echo "$USER_OUTPUT" | grep -q "65532"; then
    pass "Running as non-root user (65532)"
else
    fail "Not running as expected user: $USER_OUTPUT"
fi

# Check 9: PID limits
echo "9. PID limits"
PID_OUTPUT=$(docker run --rm --network=none --read-only --cap-drop=ALL --pids-limit=16 alpine sh -c "ulimit -u" 2>&1)
if [[ "$PID_OUTPUT" =~ ^[0-9]+$ ]] && [[ "$PID_OUTPUT" -le 16 ]]; then
    pass "PID limits enforced (max: $PID_OUTPUT)"
else
    warn "Could not verify PID limits: $PID_OUTPUT"
fi

# Check 10: gVisor-specific (if available)
if docker info --format '{{json .Runtimes}}' 2>/dev/null | grep -q "runsc"; then
    echo "10. gVisor isolation"
    GVISOR_OUTPUT=$(docker run --rm --runtime=runsc --network=none --read-only --cap-drop=ALL alpine echo "gvisor-ok" 2>&1)
    if echo "$GVISOR_OUTPUT" | grep -q "gvisor-ok"; then
        pass "gVisor container execution works"
    else
        fail "gVisor container execution failed: $GVISOR_OUTPUT"
    fi
else
    echo "10. gVisor isolation (skipped — runtime not registered)"
    warn "gVisor not available"
fi

echo ""
echo "=== Results ==="
echo -e "  ${GREEN}Passed: $PASSED${NC}"
if [[ $FAILED -gt 0 ]]; then
    echo -e "  ${RED}Failed: $FAILED${NC}"
    exit 1
else
    echo -e "  ${GREEN}All checks passed!${NC}"
    exit 0
fi
