#!/bin/bash
# setup-health-check-cron.sh - Install Agent Health Check Cron Job
#
# This script installs a cron job that runs every 30 minutes to monitor
# agent health and alert if agents become unresponsive.

set -e

WORKSPACE="/root/.openclaw/workspace"
CRON_SCHEDULE="*/30 * * * *"
CRON_COMMAND="$WORKSPACE/utils/agent-health-check-simple.sh >> /tmp/agent-health-check.log 2>&1"

echo "🔧 Setting up Agent Health Check Cron Job..."
echo ""

# Check if cron is installed
if ! command -v crontab &> /dev/null; then
    echo "❌ Error: crontab command not found. Please install cron."
    exit 1
fi

# Backup existing crontab
echo "📋 Backing up existing crontab..."
crontab -l > /tmp/crontab-backup-$(date +%Y%m%d-%H%M%S).txt 2>/dev/null || true

# Check if job already exists
if crontab -l 2>/dev/null | grep -q "agent-health-check.ts"; then
    echo "⚠️  Health check cron job already exists"
    echo "Would you like to replace it? (y/n)"
    read -r response
    if [[ "$response" != "y" ]]; then
        echo "Aborting."
        exit 0
    fi
    
    # Remove existing job
    echo "🗑️  Removing existing health check cron job..."
    crontab -l 2>/dev/null | grep -v "agent-health-check.ts" | crontab -
fi

# Add new cron job
echo "➕ Adding new cron job..."
(crontab -l 2>/dev/null; echo "$CRON_SCHEDULE $CRON_COMMAND") | crontab -

# Verify installation
echo ""
echo "✅ Cron job installed successfully!"
echo ""
echo "📅 Schedule: Every 30 minutes"
echo "📝 Log file: /tmp/agent-health-check.log"
echo ""
echo "Current crontab:"
echo "─────────────────────────────────────────────"
crontab -l | grep -A1 -B1 "agent-health-check" || crontab -l
echo "─────────────────────────────────────────────"
echo ""
echo "To verify cron is running: systemctl status cron"
echo "To view logs: tail -f /tmp/agent-health-check.log"
echo "To remove: crontab -e (delete the agent-health-check line)"
echo ""

# Test run
echo "🧪 Running test health check..."
bash "$WORKSPACE/utils/agent-health-check-simple.sh"

echo ""
echo "🎉 Setup complete! Health checks will run every 30 minutes."
