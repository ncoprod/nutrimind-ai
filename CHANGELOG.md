# 📋 Changelog

All notable changes to **NutriMIND** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### ✨ Added
- **Complete Documentation Overhaul**
  - Professional README.md with comprehensive project overview
  - Detailed installation and setup instructions
  - Tech stack explanations accessible to all skill levels
  - API reference and architecture documentation
  - Contributing guidelines for open source development

- **Development Tools & Quality**
  - ESLint configuration for code quality assurance
  - Prettier configuration for consistent code formatting
  - TypeScript strict checking scripts
  - Enhanced npm scripts for development workflow

- **Project Structure Improvements**
  - CONTRIBUTING.md with detailed contribution guidelines
  - MIT License file for open source compliance
  - Professional project badges and shields
  - GitHub-ready documentation structure

### 🔧 Changed
- **Package.json Enhancements**
  - Added development scripts: `lint`, `lint:fix`, `type-check`, `format`, `format:check`
  - Added ESLint, Prettier, and TypeScript devDependencies
  - Enhanced development experience with modern tooling

- **Documentation Updates**
  - Replaced basic README with comprehensive professional documentation
  - Added table of contents and structured sections
  - Included feature descriptions, tech stack details, and usage guides
  - Added contribution guidelines and development standards

### 📚 Documentation
- Complete rewrite of README.md with:
  - Professional presentation with badges
  - Detailed feature descriptions
  - Step-by-step installation guide
  - Configuration instructions for all services
  - Architecture overview and data flow diagrams
  - API reference for key services
  - Contributing guidelines and development workflow

- New CONTRIBUTING.md covering:
  - Development setup instructions
  - Code standards and best practices
  - Pull request guidelines
  - Testing requirements
  - Issue reporting templates

### 🛠️ Technical Improvements
- Added ESLint configuration (.eslintrc.cjs) for code quality
- Added Prettier configuration for consistent formatting
- Added .prettierignore for appropriate file exclusions
- Enhanced package.json with comprehensive dev scripts

---

## [0.0.1] - 2025-11-05

### ✨ Added
- Initial release of NutriMIND AI-powered nutrition coach
- User authentication with Supabase
- AI-powered meal planning with Google Gemini
- Progress tracking (weight, body measurements, water intake)
- Multilingual support (French/English)
- Responsive web application built with React & TypeScript

### 🛠️ Built With
- **Frontend**: React 19.2.0, TypeScript 5.8.2, Vite 6.2.0, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **AI**: Google Gemini 1.28.0 for meal planning and image generation
- **Charts**: Recharts for progress visualization

---

## 📝 Types of Changes

- `✨ Added` for new features
- `🔧 Changed` for changes in existing functionality
- `🐛 Fixed` for any bug fixes
- `🗑️ Removed` for now removed features
- `📚 Documentation` for documentation updates
- `🛠️ Technical` for technical improvements
- `🎨 Style` for style/formatting changes

---

## 🤝 Contributing to Changelog

When contributing to this project, please update the changelog with your changes. Follow these guidelines:

1. **Add your changes** to the `[Unreleased]` section at the top
2. **Categorize changes** appropriately (Added, Changed, Fixed, etc.)
3. **Use descriptive commit messages** that will make sense in the changelog
4. **When releasing**, move items from `[Unreleased]` to a new version section

Example:
```markdown
### ✨ Added
- New feature description

### 🔧 Changed
- Modified existing functionality description
```

---

**Legend:**
- 🚀 Major new features or breaking changes
- ✨ New features
- 🔧 Changes and improvements
- 🐛 Bug fixes
- 📚 Documentation
- 🛠️ Technical improvements
- 🎨 Style and formatting
- 🗑️ Removals or deprecations
