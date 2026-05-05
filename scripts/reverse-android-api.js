const { existsSync } = require('fs');
const { join } = require('path');
const { spawnSync } = require('child_process');

const candidates = [
  process.env.ANDROID_HOME && join(process.env.ANDROID_HOME, 'platform-tools', 'adb.exe'),
  process.env.ANDROID_SDK_ROOT && join(process.env.ANDROID_SDK_ROOT, 'platform-tools', 'adb.exe'),
  join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk', 'platform-tools', 'adb.exe'),
  join(process.env['ProgramFiles(x86)'] || '', 'UltData for Android', 'TS_Android', 'adb', 'adb.exe'),
  'adb',
].filter(Boolean);

const adb = candidates.find(candidate => candidate === 'adb' || existsSync(candidate));

if (!adb) {
  console.warn('[android] adb not found. Skipping API port reverse.');
  process.exit(0);
}

const devices = spawnSync(adb, ['devices'], { encoding: 'utf8' });
const hasDevice = /\tdevice\b/.test(devices.stdout || '');

if (!hasDevice) {
  console.warn('[android] No connected Android device. Skipping API port reverse.');
  process.exit(0);
}

const result = spawnSync(adb, ['reverse', 'tcp:5000', 'tcp:5000'], {
  encoding: 'utf8',
  stdio: 'pipe',
});

if (result.status === 0) {
  console.log('[android] Reversed tcp:5000 for backend API access.');
  process.exit(0);
}

console.warn(`[android] Could not reverse tcp:5000: ${result.stderr || result.stdout}`);
process.exit(0);
