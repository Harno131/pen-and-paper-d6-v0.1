#!/usr/bin/env node
/**
 * Vereinfachtes Committen und Pushen:
 *   npm run ship -- "Deine Commit-Nachricht"
 * Ohne Nachricht: "Update" wird verwendet.
 */
const { execSync } = require('child_process');
const msg = process.argv[2] || process.env.npm_config_message || 'Update';
const safe = msg.replace(/"/g, '\\"');
try {
  execSync('git add -A', { stdio: 'inherit' });
  execSync(`git commit -m "${safe}"`, { stdio: 'inherit' });
  execSync('git push', { stdio: 'inherit' });
} catch (e) {
  process.exit(e.status || 1);
}
