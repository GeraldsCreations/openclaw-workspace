#!/bin/bash
# agent-health-check-simple.sh - Simplified Agent Health Monitor
#
# This script runs every 30 minutes to check agent health.
# It reads ACTIVE_AGENTS.md to track agent status and alerts if needed.

WORKSPACE="/root/.openclaw/workspace"
ACTIVE_AGENTS_FILE="$WORKSPACE/ACTIVE_AGENTS.md"
MEMORY_DIR="$WORKSPACE/memory"
TODAY=$(date +%Y-%m-%d)
MEMORY_FILE="$MEMORY_DIR/$TODAY.md"
TIMESTAMP=$(date +%H:%M:%S)

# Ensure memory directory exists
mkdir -p "$MEMORY_DIR"

# Log function
log_to_memory() {
    echo "" >> "$MEMORY_FILE"
    echo "## [$TIMESTAMP] System: Agent Health Check" >> "$MEMORY_FILE"
    echo "$1" >> "$MEMORY_FILE"
}

echo "🏥 Agent Health Check - $(date)"

# Check if ACTIVE_AGENTS.md exists
if [ ! -f "$ACTIVE_AGENTS_FILE" ]; then
    echo "No ACTIVE_AGENTS.md found - no agents to monitor"
    log_to_memory "No active agents file found"
    exit 0
fi

# Count active agents (simple grep for "Status: Working")
ACTIVE_COUNT=$(grep -c "Status: Working" "$ACTIVE_AGENTS_FILE" || echo "0")
IDLE_COUNT=$(grep -c "Status: Idle" "$ACTIVE_AGENTS_FILE" || echo "0")

echo "Active agents: $ACTIVE_COUNT"
echo "Idle agents: $IDLE_COUNT"

# Log summary
log_to_memory "**Health Check Summary**
- Active agents: $ACTIVE_COUNT
- Idle agents: $IDLE_COUNT
- Timestamp: $(date --iso-8601=seconds)"

# TODO: Parse ACTIVE_AGENTS.md for last update times
# TODO: Alert if agent hasn't updated in >45 minutes
# TODO: Critical alert if >2 hours

echo "✅ Health check complete"
