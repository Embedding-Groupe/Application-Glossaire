# 🦕 Glosaurus

[![Latest Release](https://img.shields.io/github/v/release/Embedding-Groupe/Application-Glossaire?color=blue&label=Latest%20Release)](https://github.com/Embedding-Groupe/Application-Glossaire/releases/latest)
![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)
![CI/CD](https://github.com/Embedding-Groupe/Application-Glossaire/actions/workflows/release.yml/badge.svg)
[![Documentation](https://img.shields.io/badge/Documentation-mkdocs-blue)](https://embedding-groupe.github.io/synthese-de-recherche-mkdocs/)

A modern desktop glossary management application built with Tauri, Preact, and TypeScript.

## ✨ Features

- 📚 **Multi-Glossary Management** - Organize words into themed glossaries
- 📝 **Word Definitions** - Add words with detailed definitions and synonyms
- 🤖 **AI Synonym Suggestions** - Get intelligent synonym recommendations
- 💾 **Import/Export** - Support for JSON and Markdown (table format) with preview buttons
- 🔍 **Search & Filter** - Quickly find glossaries and words
- 🎨 **Modern UI** - Clean and intuitive interface
- 🚀 **Fast & Native** - Built with Tauri for optimal performance

## 📦 Download & Installation

### Quick Download

**Choose your platform:**

| Platform | Download |
|----------|----------|
| 🪟 Windows | [Setup.exe](https://github.com/Embedding-Groupe/Application-Glossaire/releases/download/v1.0.9/Glosaurus_1.0.9_x64-setup.exe)
| 🍎 macOS (Apple Silicon) | [DMG](https://github.com/Embedding-Groupe/Application-Glossaire/releases/download/v1.0.9/Glosaurus_1.0.9_aarch64.dmg)
| Linux | [DEB](https://github.com/Embedding-Groupe/Application-Glossaire/releases/download/v1.0.9/Glosaurus_1.0.9_amd64.deb)

### Detailed Installation Instructions

Please see the latest release note for complete installation instructions for your platform.

## 🚀 Quick Start

1. **Create a Glossary**
   - Click "Create New Glossary"
   - Enter name and description

2. **Add Words**
   - Open your glossary
   - Click "Add New Word"
   - Fill in word, definition, and synonyms

3. **Use AI Suggestions**
   - While adding a word, AI will suggest synonyms
   - Click any suggestion to add it instantly

4. **Export & Share**
   - Click "Export" button
   - Choose JSON or Markdown format (preview can be display)
   - Save and share your glossary

## 📝 File Formats

### Markdown (Table Format)
```markdown
# My Glossary
### Description

| Word | Definition | Synonyms |
| --- | --- | --- |
| Example | A representative form | sample, illustration |
```

### JSON Format
```json
{
  "name": "My Glossary",
  "description": "Description",
  "words": [
    {
      "word": "Example",
      "definition": "A representative form",
      "synonyms": ["sample", "illustration"]
    }
  ]
}
```

## 🛠️ Development

### Prerequisites Installation Guide

Follow the steps below for your operating system. Make sure to install all prerequisites in order.

#### 1️⃣ Git

**Download & Installation :**
- Visit [https://git-scm.com/download](https://git-scm.com/download) and select your platform
- After installation, verify it worked:
  ```bash
  git --version
  ```

#### 2️⃣ Node.js (LTS)

**Download & Installation :**
- Visit [https://nodejs.org](https://nodejs.org) and download the LTS version
- Install Node.js (npm will be included automatically)
- After installation, verify it worked:
  ```bash
  node --version
  npm --version
  ```

#### 3️⃣ Rust

**Download & Installation :**
- Visit [https://www.rust-lang.org/tools/install](https://www.rust-lang.org/tools/install)
- Follow the installation instructions for your platform
- After installation, verify it worked:
  ```bash
  rustc --version
  cargo --version
  ```

#### 4️⃣ Ollama (For AI Synonym Suggestions)

**About Ollama :**
- Ollama is an AI framework used for intelligent synonym suggestions in the application
- It must be running in the background for the AI features to work
- By running the app in dev or with the actual build, Ollama will pull automatically the used model

**Download & Installation :**
- Visit [https://ollama.ai](https://ollama.ai) and download for your platform
- After installation, start Ollama:
  ```bash
  # On Windows & macOS : Ollama will start automatically as a service
  # On Linux: Run in terminal
  ollama serve
  ```
- After installation, verify it worked:
  ```bash
  ollama --version
  ```

**Verification :**
```bash
# Check if Ollama is running (should return a response)
curl http://localhost:11434/api/tags
```

#### 5️⃣ Platform-Specific Dependencies

Choose your operating system below and follow the corresponding instructions:

<details>
<summary><b>🪟 Windows</b></summary>

**Requirements :**
- Visual Studio Build Tools 2019 or 2022

**Installation Steps :**
1. Download Visual Studio Build Tools from: [https://visualstudio.microsoft.com/downloads/](https://visualstudio.microsoft.com/downloads/)
   - Look for "Build Tools for Visual Studio"
2. Run the installer
3. Select "Desktop development with C++" workload during installation
4. Complete the installation and restart your computer if prompted

**Verification :**
```powershell
# Test if build tools are correctly installed by running:
npm run tauri build
```

</details>

<details>
<summary><b>🍎 macOS</b></summary>

**Requirements :**
- Xcode Command Line Tools

**Installation Steps :**
```bash
# Install Xcode Command Line Tools (this may take 10-20 minutes)
xcode-select --install
```

**Verification :**
```bash
# Test if Xcode tools are installed
xcode-select -p
# Should output: /Applications/Xcode.app/Contents/Developer
```

</details>

<details>
<summary><b>🐧 Linux (Ubuntu/Debian)</b></summary>

**Requirements :**
System libraries and development tools for WebKit2GTK

**Installation Steps :**
```bash
# Update package manager
sudo apt-get update

# Install all required dependencies
sudo apt-get install -y \
  libwebkit2gtk-4.0-dev \
  libwebkit2gtk-4.1-dev \
  libappindicator3-dev \
  librsvg2-dev \
  patchelf
```

**Verification :**
```bash
# Test if packages are installed
pkg-config --modversion webkit2gtk-4.0
```

</details>

---

### Setup & Run Development Environment

Once all prerequisites are installed, follow these steps:

```bash
# 1️⃣ Clone the repository
git clone https://github.com/Embedding-Groupe/Application-Glossaire.git
cd Glosaurus

# 2️⃣ Install Node.js dependencies
npm install

# Install backend dependencies
python -m venv .venv
source .venv/bin/activate
pip install -r back-end/requirements.txt

# Run in development mode
npm run tauri dev

# 4️⃣ (Optional) Build for production
# This creates a distributable version for your platform
npm run tauri build
```

### Troubleshooting

**Problem :** `npm install` fails
- Solution: Delete `node_modules` folder and `package-lock.json`, then run `npm install` again

**Problem :** Tauri dev won't start
- Solution: Make sure all prerequisites are installed by verifying versions from step 4️⃣ above
- Windows users: Check that Visual Studio Build Tools is correctly installed

**Problem :** `rustc` or `cargo` command not found
- Solution: Restart your terminal/IDE after installing Rust, or reinstall Rust from [https://www.rust-lang.org/tools/install](https://www.rust-lang.org/tools/install)

## 🙏 Acknowledgments

- Built with [Tauri](https://tauri.app/)
- UI framework: [Preact](https://preactjs.com/)
- Icons: [Lucide](https://lucide.dev/)
- Build tool: [Vite](https://vitejs.dev/)

## 📧 Support

For issues and feature requests, please use the [GitHub Issues](https://github.com/Embedding-Groupe/Application-Glossaire/issues) page.

---

**Made with ❤️ by Embedding-Groupe**
