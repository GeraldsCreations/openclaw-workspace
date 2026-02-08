#!/usr/bin/env tsx
/**
 * agent-health-check.ts - Agent Health Monitoring System
 * 
 * Monitors isolated agent sessions for activity and alerts if agents
 * become unresponsive.
 * 
 * Run as cron job every 30 minutes:
 * crontab -e
 * */30 * * * * cd /root/.openclaw/workspace && npx tsx utils/agent-health-check.ts
 * 
 * @module utils/agent-health-check
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

interface Session {
  id: string;
  label: string;
  kind: string;
  created: string;
  lastActivity?: string;
}

interface HealthState {
  lastCheck: string;
  alerts: Array<{
    sessionId: string;
    sessionLabel: string;
    silentDuration: number;
    timestamp: string;
    action: 'pinged' | 'alerted';
  }>;
}

const WORKSPACE = '/root/.openclaw/workspace';
const STATE_FILE = join(WORKSPACE, 'memory', 'agent-health-state.json');
const PING_THRESHOLD_MS = 45 * 60 * 1000; // 45 minutes
const ALERT_THRESHOLD_MS = 2 * 60 * 60 * 1000; // 2 hours

/**
 * Load health check state from disk
 */
function loadState(): HealthState {
  if (existsSync(STATE_FILE)) {
    try {
      const data = readFileSync(STATE_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.warn('Failed to load state, starting fresh:', error);
    }
  }
  
  return {
    lastCheck: new Date().toISOString(),
    alerts: []
  };
}

/**
 * Save health check state to disk
 */
function saveState(state: HealthState): void {
  try {
    // Ensure memory directory exists
    const memoryDir = join(WORKSPACE, 'memory');
    if (!existsSync(memoryDir)) {
      execSync(`mkdir -p ${memoryDir}`);
    }
    
    writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save state:', error);
  }
}

/**
 * List all isolated sessions
 */
async function listSessions(): Promise<Session[]> {
  try {
    // Use sessions_list to get isolated sessions
    const { stdout } = await execAsync('sessions_list kinds=isolated');
    
    // Parse session list output
    // This is a simplified parser - adjust based on actual output format
    const sessions: Session[] = [];
    const lines = stdout.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      // Parse session info - adjust regex based on actual format
      const match = line.match(/(\S+)\s+label:(\S+)\s+kind:(\S+)\s+created:(\S+)/);
      if (match) {
        sessions.push({
          id: match[1],
          label: match[2],
          kind: match[3],
          created: match[4]
        });
      }
    }
    
    return sessions;
  } catch (error) {
    console.error('Failed to list sessions:', error);
    return [];
  }
}

/**
 * Get last activity time for a session
 */
async function getLastActivity(sessionId: string): Promise<Date | null> {
  try {
    // Use sessions_history to get last message time
    const { stdout } = await execAsync(`sessions_history --session ${sessionId} --limit 1`);
    
    // Parse timestamp from last message
    // This is a simplified parser - adjust based on actual output format
    const timestampMatch = stdout.match(/timestamp:(\S+)/);
    if (timestampMatch) {
      return new Date(timestampMatch[1]);
    }
    
    return null;
  } catch (error) {
    console.warn(`Failed to get activity for session ${sessionId}:`, error);
    return null;
  }
}

/**
 * Ping an agent session
 */
async function pingAgent(sessionId: string, sessionLabel: string): Promise<void> {
  try {
    await execAsync(`sessions_send --session ${sessionId} "HEALTH_CHECK_PING: Are you still working? Reply with status update."`);
    console.log(`📍 Pinged agent: ${sessionLabel} (${sessionId})`);
  } catch (error) {
    console.error(`Failed to ping agent ${sessionLabel}:`, error);
  }
}

/**
 * Alert main session about unresponsive agent
 */
async function alertMainSession(sessionLabel: string, silentHours: number): Promise<void> {
  try {
    const message = `🚨 AGENT HEALTH ALERT: Agent "${sessionLabel}" has been silent for ${silentHours.toFixed(1)} hours. Possible issues: crashed, stuck, or completed work without reporting. Please investigate.`;
    
    await execAsync(`sessions_send --label main "${message}"`);
    console.log(`🚨 Alerted main session about: ${sessionLabel}`);
  } catch (error) {
    console.error(`Failed to alert about ${sessionLabel}:`, error);
  }
}

/**
 * Update dashboard with health status
 */
async function updateDashboard(sessionLabel: string, status: 'warning' | 'critical'): Promise<void> {
  try {
    const dashboardDir = join(WORKSPACE, 'gereld-project-manager');
    
    if (!existsSync(dashboardDir)) {
      console.warn('Dashboard directory not found, skipping dashboard update');
      return;
    }
    
    const statusText = status === 'warning' ? 'Silent >45min' : 'Silent >2hrs';
    await execAsync(
      `cd ${dashboardDir} && node update-dashboard.js update-agent-by-label "${sessionLabel}" --status blocked --task "${statusText}"`
    );
    
    console.log(`📊 Updated dashboard for ${sessionLabel}: ${statusText}`);
  } catch (error) {
    console.warn(`Failed to update dashboard for ${sessionLabel}:`, error);
  }
}

/**
 * Log health check to daily memory file
 */
function logToMemory(message: string): void {
  try {
    const today = new Date().toISOString().split('T')[0];
    const memoryFile = join(WORKSPACE, 'memory', `${today}.md`);
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    
    const logEntry = `\n## [${timestamp}] System: Agent Health Check\n${message}\n`;
    
    if (existsSync(memoryFile)) {
      const existing = readFileSync(memoryFile, 'utf-8');
      writeFileSync(memoryFile, existing + logEntry, 'utf-8');
    } else {
      const header = `# ${today} - Agent Activity Log\n`;
      writeFileSync(memoryFile, header + logEntry, 'utf-8');
    }
  } catch (error) {
    console.error('Failed to log to memory:', error);
  }
}

/**
 * Main health check execution
 */
async function runHealthCheck(): Promise<void> {
  console.log('🏥 Starting Agent Health Check...');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  
  const state = loadState();
  const now = new Date();
  
  // Get all isolated sessions
  const sessions = await listSessions();
  console.log(`Found ${sessions.length} isolated session(s)`);
  
  if (sessions.length === 0) {
    console.log('No isolated sessions to monitor');
    logToMemory('No isolated sessions active');
    state.lastCheck = now.toISOString();
    saveState(state);
    return;
  }
  
  const healthReport: string[] = [];
  
  // Check each session
  for (const session of sessions) {
    const lastActivity = await getLastActivity(session.id);
    
    if (!lastActivity) {
      console.log(`⚠️  Could not determine last activity for ${session.label}`);
      continue;
    }
    
    const silentMs = now.getTime() - lastActivity.getTime();
    const silentMinutes = Math.floor(silentMs / 60000);
    const silentHours = silentMs / 3600000;
    
    console.log(`📊 ${session.label}: Last activity ${silentMinutes} minutes ago`);
    
    // Check if needs alert (>2 hours)
    if (silentMs > ALERT_THRESHOLD_MS) {
      console.log(`🚨 CRITICAL: ${session.label} silent for ${silentHours.toFixed(1)} hours`);
      
      await alertMainSession(session.label, silentHours);
      await updateDashboard(session.label, 'critical');
      
      state.alerts.push({
        sessionId: session.id,
        sessionLabel: session.label,
        silentDuration: silentMs,
        timestamp: now.toISOString(),
        action: 'alerted'
      });
      
      healthReport.push(`🚨 ${session.label}: CRITICAL - ${silentHours.toFixed(1)}h silent`);
    }
    // Check if needs ping (>45 minutes)
    else if (silentMs > PING_THRESHOLD_MS) {
      console.log(`⚠️  WARNING: ${session.label} silent for ${silentMinutes} minutes`);
      
      await pingAgent(session.id, session.label);
      await updateDashboard(session.label, 'warning');
      
      state.alerts.push({
        sessionId: session.id,
        sessionLabel: session.label,
        silentDuration: silentMs,
        timestamp: now.toISOString(),
        action: 'pinged'
      });
      
      healthReport.push(`⚠️  ${session.label}: WARNING - ${silentMinutes}min silent`);
    } else {
      healthReport.push(`✅ ${session.label}: Healthy - ${silentMinutes}min since last activity`);
    }
  }
  
  // Log summary
  const summary = `**Health Check Summary**\n- Sessions checked: ${sessions.length}\n${healthReport.map(r => `- ${r}`).join('\n')}`;
  logToMemory(summary);
  
  // Keep only last 100 alerts to prevent unbounded growth
  if (state.alerts.length > 100) {
    state.alerts = state.alerts.slice(-100);
  }
  
  state.lastCheck = now.toISOString();
  saveState(state);
  
  console.log('\n✅ Health check complete');
}

// Execute if run directly
if (require.main === module) {
  runHealthCheck()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Health check failed:', error);
      process.exit(1);
    });
}

// For require() compatibility
function execSync(command: string): void {
  require('child_process').execSync(command);
}

export { runHealthCheck };
