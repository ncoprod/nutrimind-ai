# 🤝 Contributing to NutriMIND

Thank you for your interest in contributing to NutriMIND! We welcome contributions from developers of all skill levels. This document provides guidelines and information to help you get started.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Reporting Issues](#reporting-issues)
- [Feature Requests](#feature-requests)

## 📜 Code of Conduct

This project follows a code of conduct to ensure a welcoming environment for all contributors. By participating, you agree to:

- Be respectful and inclusive
- Focus on constructive feedback
- Accept responsibility for mistakes
- Show empathy towards other contributors
- Help create a positive community

## 🚀 Getting Started

### Prerequisites

- **Node.js 22+** - [Download here](https://nodejs.org/)
- **Git** - [Download here](https://git-scm.com/)
- **A code editor** (VS Code recommended)

### Setup

1. **Fork the repository** on GitHub
2. **Clone your fork**:
   ```bash
   git clone https://github.com/your-username/nutrimind.git
   cd nutrimind
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Set up environment variables**:
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your API keys
   ```
5. **Start the development server**:
   ```bash
   npm run dev
   ```

## 🔄 Development Workflow

### 1. Choose an Issue

- Check the [Issues](https://github.com/your-username/nutrimind/issues) page
- Look for issues labeled `good first issue` or `help wanted`
- Comment on the issue to indicate you're working on it

### 2. Create a Branch

```bash
# Create and switch to a new branch
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-number-description
```

### 3. Make Changes

- Write clear, focused commits
- Test your changes thoroughly
- Follow the coding standards below
- Update documentation if needed

### 4. Test Your Changes

```bash
# Run linting
npm run lint

# Run type checking
npm run type-check

# Build for production to check for errors
npm run build
```

### 5. Submit a Pull Request

- Push your branch to GitHub
- Create a Pull Request with a clear description
- Reference any related issues
- Wait for review and address feedback

## 🏗️ Project Structure

```
nutrimind/
├── public/                 # Static assets
├── src/
│   ├── components/         # React components
│   │   ├── ui/            # Reusable UI components (buttons, inputs, etc.)
│   │   └── [Feature]/     # Feature-specific components
│   ├── services/          # External API integrations
│   │   ├── authService.ts    # Authentication logic
│   │   ├── databaseService.ts # Supabase operations
│   │   └── geminiService.ts   # AI integration
│   ├── types.ts           # TypeScript type definitions
│   ├── locales/           # Internationalization files
│   ├── data/              # Static data (food items, etc.)
│   └── App.tsx           # Main application component
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite build configuration
└── tailwind.config.js    # Tailwind CSS configuration
```

### Key Directories

- **`components/`**: All React components, organized by feature
- **`services/`**: API calls and external service integrations
- **`types.ts`**: Shared TypeScript interfaces and types
- **`locales/`**: Translation files for internationalization

## 💻 Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define proper interfaces for data structures
- Use union types for restricted values
- Avoid `any` type - use proper types instead

```typescript
// ✅ Good
interface UserProfile {
  name: string;
  age: number;
  gender: 'male' | 'female';
}

// ❌ Avoid
interface UserProfile {
  name: any;
  age: any;
  gender: string;
}
```

### React Components

- Use functional components with hooks
- Prefer custom hooks for shared logic
- Use TypeScript for component props
- Follow the component naming convention

```typescript
// ✅ Good
interface MealCardProps {
  meal: Meal;
  isCompleted: boolean;
  onToggle: () => void;
}

const MealCard: React.FC<MealCardProps> = ({ meal, isCompleted, onToggle }) => {
  // Component logic
};
```

### File Naming

- Use PascalCase for component files: `MealCard.tsx`
- Use camelCase for utility files: `mealService.ts`
- Use kebab-case for directories: `meal-planning/`

### Code Style

- Use ESLint and Prettier for consistent formatting
- Follow the existing code patterns in the project
- Write self-documenting code with clear variable names
- Add comments for complex logic

## 🧪 Testing

### Manual Testing Checklist

Before submitting a PR, ensure:

- [ ] The app builds without errors (`npm run build`)
- [ ] TypeScript compilation passes (`npm run type-check`)
- [ ] Linting passes (`npm run lint`)
- [ ] App works in different browsers (Chrome, Firefox, Safari)
- [ ] App is responsive on mobile and desktop
- [ ] All user flows work as expected
- [ ] No console errors in the browser

### Testing Different Scenarios

- **Authentication**: Sign up, sign in, sign out
- **Onboarding**: Complete profile setup
- **Meal Planning**: Generate plans, regenerate meals
- **Tracking**: Log weight, meals, activities
- **Offline Mode**: Test without internet connection
- **Cross-device**: Test on multiple devices/browsers

## 📝 Submitting Changes

### Pull Request Guidelines

1. **Title**: Use a clear, descriptive title
   ```
   ✅ Add meal regeneration feature
   ✅ Fix weight tracking bug on mobile
   ❌ Update stuff
   ```

2. **Description**: Include:
   - What changes were made
   - Why the changes were needed
   - How to test the changes
   - Screenshots/videos if UI changes
   - Related issue numbers

3. **Branch**: Use descriptive branch names
   ```
   ✅ feature/meal-regeneration
   ✅ fix/mobile-responsive-design
   ✅ refactor/auth-service
   ```

4. **Commits**: Write clear commit messages
   ```
   ✅ feat: add meal regeneration functionality
   ✅ fix: resolve mobile layout issues
   ✅ refactor: simplify authentication service
   ```

### Review Process

1. A maintainer will review your PR
2. Address any feedback or requested changes
3. Once approved, your PR will be merged
4. Your contribution will be acknowledged

## 🐛 Reporting Issues

### Bug Reports

When reporting bugs, please include:

- **Description**: Clear description of the issue
- **Steps to reproduce**: Step-by-step instructions
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Environment**: Browser, OS, device
- **Screenshots**: If applicable
- **Console errors**: Any error messages

### Issue Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**
- Browser: [e.g. Chrome 91]
- OS: [e.g. Windows 10]
- Device: [e.g. Desktop, iPhone 12]

**Additional context**
Add any other context about the problem here.
```

## 💡 Feature Requests

### Feature Request Template

```markdown
**Is your feature request related to a problem? Please describe.**
A clear and concise description of what the problem is.

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request here.
```

### Feature Evaluation Criteria

New features are evaluated based on:

- **User Value**: How much does this help users?
- **Technical Feasibility**: Can we build this with current tech stack?
- **Business Impact**: Does this increase engagement/retention?
- **Development Cost**: Time, complexity, and maintenance requirements

## 📞 Getting Help

- **Documentation**: Check the [README.md](README.md) first
- **Issues**: Search existing issues for similar problems
- **Discussions**: Use GitHub Discussions for questions
- **Discord**: Join our community Discord (if available)

## 🎉 Recognition

Contributors will be:
- Listed in the contributors file
- Acknowledged in release notes
- Featured on our website (if applicable)
- Receive digital badges for significant contributions

---

Thank you for contributing to NutriMIND! Your help makes healthy eating more accessible to everyone. 🌱
