#!/usr/bin/env node

import { spawnSync } from 'child_process'
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

function tryCmd(cmd, args = []) {
  const res = spawnSync(cmd, args, { stdio: 'ignore' })
  return res.status === 0
}

function resolvePython() {
  const candidates = isWindows
    ? [['py', '-3'], ['py'], ['python'], ['python3']]
    : [['python3'], ['python']]

  for (const candidate of candidates) {
    const [cmd, ...baseArgs] = candidate
    if (tryCmd(cmd, [...baseArgs, '-V'])) {
      return { cmd, args: baseArgs }
    }
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

function runOrExit(cmd, args, options = {}) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', ...options })
  if (res.error) throw res.error
  if (res.status !== 0) {
    const code = res.status ?? res.signal
    throw new Error(`Command failed: ${cmd} ${args.join(' ')} (code ${code})`)
  }
}

function removeIfExists(targetPath) {
  if (!existsSync(targetPath)) return true
  try {
    try {
      chmodSync(targetPath, 0o666)
    } catch (error_) {
      console.warn(
        `⚠️  Could not change permissions for ${targetPath}: ${error_.message}`
      )
    }
    unlinkSync(targetPath)
    return true
  } catch (err) {
    console.warn(`⚠️  Could not remove ${targetPath}: ${err.message}`)
    return false
  }
}

try {
  // Ensure local virtual environment
  const py = resolvePython()
  const venvPy = venvPythonPath()

  if (!existsSync(venvPy)) {
    console.log('📦 Creating virtual environment in back-end/.venv ...')
    runOrExit(py.cmd, [...py.args, '-m', 'venv', '.venv'], {
      cwd: backendDir,
    })
  }

  console.log('📥 Upgrading pip and installing requirements...')
  runOrExit(venvPy, ['-m', 'pip', 'install', '--upgrade', 'pip'])
  const reqFile = join(backendDir, 'requirements.txt')
  if (existsSync(reqFile)) {
    runOrExit(venvPy, ['-m', 'pip', 'install', '-r', reqFile])
  }
  // Ensure PyInstaller is available in venv
  runOrExit(venvPy, ['-m', 'pip', 'install', 'pyinstaller'])

  // Run PyInstaller with the venv interpreter
  console.log('🏗️  Running PyInstaller...')
  runOrExit(venvPy, ['-m', 'PyInstaller', 'back-end/run_backend.spec'], {
    cwd: projectRoot,
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
    removeIfExists(destPath)
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
      } catch (error_) {
        console.warn(`⚠️  Could not create ${altNoExt}: ${error_.message}`)
      }
      console.log(
        `✅ Copied backend to ${altPath}. The app will prefer this file if available.`
      )
    } catch (error_) {
      console.error('❌ Alternate copy failed:', error_.message)
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
