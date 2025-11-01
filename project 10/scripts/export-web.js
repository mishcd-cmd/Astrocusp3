// scripts/export-web.js
// Purpose: run "expo export --platform web" and *show* the underlying error output.
// This makes Netlify (and local) logs actually useful when Metro fails.

const { spawnSync } = require('child_process');

const args = [
  'exec',
  'expo',
  'export',
  '--',
  '--platform',
  'web',
  '--output-dir',
  'dist',
];

// On Windows shells, set shell: true for compatibility.
// stdio: 'inherit' streams Expo/Metro output directly to the console/Netlify log.
const result = spawnSync('npm', args, {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: {
    ...process.env,
    // Helpful flags to get more verbose Expo logs during CI
    EXPO_DEBUG: process.env.EXPO_DEBUG ?? '1',
    EXPO_NO_TELEMETRY: process.env.EXPO_NO_TELEMETRY ?? '1',
    // Make CI non-interactive
    CI: process.env.CI ?? 'true',
  },
});

if (typeof result.status === 'number' && result.status !== 0) {
  // Propagate the same exit code so Netlify marks the build as failed.
  process.exit(result.status);
}

// If status is null, something prevented the child from spawning
if (result.error) {
  console.error('[export-web] Failed to spawn Expo:', result.error);
  process.exit(1);
}
