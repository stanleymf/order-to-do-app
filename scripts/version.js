#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const VERSION_FILE = 'VERSION';
const PACKAGE_FILE = 'package.json';

function readVersion() {
  try {
    return fs.readFileSync(VERSION_FILE, 'utf8').trim();
  } catch (error) {
    console.error('Error reading VERSION file:', error.message);
    process.exit(1);
  }
}

function writeVersion(version) {
  try {
    fs.writeFileSync(VERSION_FILE, version + '\n');
    console.log(`✅ Updated ${VERSION_FILE} to ${version}`);
  } catch (error) {
    console.error('Error writing VERSION file:', error.message);
    process.exit(1);
  }
}

function updatePackageJson(version) {
  try {
    const packagePath = path.resolve(PACKAGE_FILE);
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    packageJson.version = version;
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log(`✅ Updated ${PACKAGE_FILE} to version ${version}`);
  } catch (error) {
    console.error('Error updating package.json:', error.message);
    process.exit(1);
  }
}

function incrementVersion(currentVersion, type = 'patch') {
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'current':
      const currentVersion = readVersion();
      console.log(`📦 Order To-Do App Version: ${currentVersion}`);
      break;
      
    case 'patch':
    case 'minor':
    case 'major':
      const current = readVersion();
      const newVersion = incrementVersion(current, command);
      writeVersion(newVersion);
      updatePackageJson(newVersion);
      console.log(`🚀 Version bumped from ${current} to ${newVersion} (${command})`);
      break;
      
    case 'set':
      const version = args[1];
      if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
        console.error('❌ Please provide a valid version number (e.g., 1.0.0)');
        process.exit(1);
      }
      writeVersion(version);
      updatePackageJson(version);
      console.log(`🎯 Version set to ${version}`);
      break;
      
    default:
      console.log(`
📦 Order To-Do App Version Manager

Usage:
  node scripts/version.js current          - Show current version
  node scripts/version.js patch            - Increment patch version (1.0.0 → 1.0.1)
  node scripts/version.js minor            - Increment minor version (1.0.0 → 1.1.0)
  node scripts/version.js major            - Increment major version (1.0.0 → 2.0.0)
  node scripts/version.js set <version>    - Set specific version (e.g., 1.2.3)

Examples:
  node scripts/version.js current
  node scripts/version.js patch
  node scripts/version.js set 1.5.0
      `);
  }
}

main(); 