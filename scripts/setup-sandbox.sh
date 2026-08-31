#!/usr/bin/env bash
# Setup script for sandbox execution environment.
# Installs gVisor (runsc) and configures Docker to use it.
# Idempotent — safe to run multiple times.

set -euo pipefail

echo "=== Sandbox Setup ==="
echo ""

# Color helpers
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[SKIP]${NC} $1"; }
fail() { echo -e "${RED}[FAIL]${NC} $1"; }

# Step 1: Add user to kvm group (needed for Firecracker, optional for gVisor)
echo "Step 1: Checking KVM group membership..."
if groups "$USER" | grep -q '\bkvm\b'; then
    info "User '$USER' is already in kvm group"
else
    warn "User '$USER' is not in kvm group"
    echo "  To add: sudo usermod -aG kvm $USER"
    echo "  (Optional for gVisor; required for Firecracker)"
fi
echo ""

# Step 2: Check Docker is installed
echo "Step 2: Checking Docker installation..."
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version 2>/dev/null | head -1)
    info "Docker installed: $DOCKER_VERSION"
else
    fail "Docker is not installed"
    echo "  Install: https://docs.docker.com/engine/install/"
    exit 1
fi
echo ""

# Step 3: Check Docker daemon is running
echo "Step 3: Checking Docker daemon..."
if docker info &> /dev/null; then
    info "Docker daemon is running"
else
    fail "Docker daemon is not running"
    echo "  Start: sudo systemctl start docker"
    exit 1
fi
echo ""

# Step 4: Install gVisor (runsc)
echo "Step 4: Installing gVisor (runsc)..."
if command -v runsc &> /dev/null; then
    RUNSC_VERSION=$(runsc --version 2>/dev/null | head -1)
    info "gVisor already installed: $RUNSC_VERSION"
else
    echo "  Installing gVisor..."
    if [[ -f /etc/apt/sources.list.d/gvisor.list ]]; then
        info "gVisor apt source already configured"
    else
        # Add gVisor apt repository
        curl -fsSL https://gvisor.dev/archive.key | sudo gpg --dearmor -o /usr/share/keyrings/gvisor-archive-keyring.gpg 2>/dev/null || true
        echo "deb [signed-by=/usr/share/keyrings/gvisor-archive-keyring.gpg] https://storage.googleapis.com/gvisor/releases release main" | sudo tee /etc/apt/sources.list.d/gvisor.list > /dev/null
    fi
    sudo apt-get update -qq
    sudo apt-get install -y -qq runsc
    info "gVisor installed"
fi
echo ""

# Step 5: Register gVisor as Docker runtime
echo "Step 5: Registering gVisor as Docker runtime..."
if docker info --format '{{json .Runtimes}}' 2>/dev/null | grep -q "runsc"; then
    info "gVisor (runsc) is registered as Docker runtime"
else
    echo "  Registering runsc runtime..."
    sudo runsc install
    sudo systemctl restart docker
    info "gVisor registered and Docker restarted"
fi
echo ""

# Step 6: Verify gVisor works
echo "Step 6: Verifying gVisor execution..."
if docker run --rm --runtime=runsc --network=none alpine echo "gvisor-ok" 2>/dev/null | grep -q "gvisor-ok"; then
    info "gVisor container execution works"
else
    warn "gVisor verification failed — may need manual setup"
fi
echo ""

# Step 7: Pull default sandbox image
echo "Step 7: Pulling default sandbox image..."
if docker image inspect denoland/deno:latest &> /dev/null; then
    info "denoland/deno:latest image already present"
else
    echo "  Pulling denoland/deno:latest..."
    docker pull denoland/deno:latest
    info "Image pulled"
fi
echo ""

echo "=== Setup Complete ==="
echo ""
echo "Summary:"
echo "  - Docker: $(docker --version 2>/dev/null | head -1)"
echo "  - gVisor: $(runsc --version 2>/dev/null | head -1 || echo 'not installed')"
echo "  - Runtimes: $(docker info --format '{{range .Runtimes}}{{.Path}} {{end}}' 2>/dev/null || echo 'unknown')"
echo ""
echo "Run 'scripts/sandbox-health-check.sh' to verify everything works."
