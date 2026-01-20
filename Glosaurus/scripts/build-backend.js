#!/usr/bin/env node

import { execSync, spawnSync } from 'child_process'
import { copyFileSync, existsSync, mkdirSync, unlinkSync, chmodSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')
const backendDir = join(projectRoot, 'back-end')

const isWindows = process.platform === 'win32'
const backendName = isWindows ? 'backend.exe' : 'backend'

console.log('🔨 Building backend with PyInstaller (using local venv)...')

function tryCmd(cmd) {
  try {
    execSync(cmd, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function resolvePython() {
  if (process.platform === 'win32') {
    if (tryCmd('py -3 -V')) return 'py -3'
    if (tryCmd('py -V')) return 'py'
    if (tryCmd('python -V')) return 'python'
    if (tryCmd('python3 -V')) return 'python3'
  } else {
    if (tryCmd('python3 --version')) return 'python3'
    if (tryCmd('python --version')) return 'python'
  }
  console.error(
    '❌ No Python interpreter found. Please install Python 3.10+ and ensure it is on PATH.'
  )
  process.exit(1)
}

function venvPythonPath() {
  return isWindows
    ? join(backendDir, '.venv', 'Scripts', 'python.exe')
    : join(backendDir, '.venv', 'bin', 'python')
}

try {
  // Ensure local virtual environment
  const py = resolvePython()
  const venvPy = venvPythonPath()

  if (!existsSync(venvPy)) {
    console.log('📦 Creating virtual environment in back-end/.venv ...')
    execSync(`${py} -m venv .venv`, { cwd: backendDir, stdio: 'inherit' })
  }

  console.log('📥 Upgrading pip and installing requirements...')
  execSync(`${venvPy} -m pip install --upgrade pip`, { stdio: 'inherit' })
  const reqFile = join(backendDir, 'requirements.txt')
  if (existsSync(reqFile)) {
    execSync(`${venvPy} -m pip install -r "${reqFile}"`, { stdio: 'inherit' })
  }
  // Ensure PyInstaller is available in venv
  execSync(`${venvPy} -m pip install pyinstaller`, { stdio: 'inherit' })

  // Run PyInstaller with the venv interpreter
  console.log('🏗️  Running PyInstaller...')
  execSync(`${venvPy} -m PyInstaller back-end/run_backend.spec`, {
    cwd: projectRoot,
    stdio: 'inherit',
  })

  // Source and destination paths
  // Try common PyInstaller output locations (onefile vs onedir)
  const candidates = [
    join(projectRoot, 'dist', backendName),
    join(projectRoot, 'dist', 'backend', backendName),
    join(backendDir, 'dist', backendName),
    join(backendDir, 'dist', 'backend', backendName),
  ]
  const sourcePath = candidates.find((p) => existsSync(p))
  const destDir = join(projectRoot, 'src-tauri', 'bin')
  const destPath = join(destDir, backendName)

  // Ensure destination directory exists
  if (!existsSync(destDir)) {
    mkdirSync(destDir, { recursive: true })
  }

  // Check if the compiled backend exists
  if (!sourcePath) {
    console.error(
      '❌ Error: Compiled backend not found in expected dist paths. Tried:'
    )
    for (const p of candidates) console.error(` - ${p}`)
    process.exit(1)
  }

  // Copy the compiled backend
  console.log(`📦 Copying ${backendName} to src-tauri/bin/...`)
  try {
    if (existsSync(destPath)) {
      try {
        chmodSync(destPath, 0o666)
      } catch {}
      try {
        unlinkSync(destPath)
      } catch {}
    }
    copyFileSync(sourcePath, destPath)
  } catch (e) {
    console.error('⚠️  Backend copy failed:', e.message)
    const altName = isWindows ? 'backend-new.exe' : 'backend-new'
    const altPath = join(destDir, altName)
    console.log(`➡️  Retrying copy to alternate file ${altName} ...`)
    try {
      copyFileSync(sourcePath, altPath)
      const altNoExt = join(destDir, 'backend-new')
      try {
        if (existsSync(altNoExt)) unlinkSync(altNoExt)
        copyFileSync(sourcePath, altNoExt)
      } catch (copyNoExtErr) {
        console.warn(
          `⚠️  Could not create ${altNoExt}: ${copyNoExtErr.message}`
        )
      }
      console.log(
        `✅ Copied backend to ${altPath}. The app will prefer this file if available.`
      )
    } catch (e2) {
      console.error('❌ Alternate copy failed:', e2.message)
      console.error(
        'Hint: Close any running app locking backend.exe, then retry.'
      )
      process.exit(1)
    }
  }

  console.log('✅ Backend build completed successfully!')
} catch (error) {
  console.error('❌ Backend build failed:', error.message)
  process.exit(1)
}
