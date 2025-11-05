# 🍎 NutriMIND - AI-Powered Nutrition Coach

<div align="center">
  <img src="https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react" alt="React"/>
  <img src="https://img.shields.io/badge/TypeScript-5.8.2-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Vite-6.2.0-646CFF?style=for-the-badge&logo=vite" alt="Vite"/>
  <img src="https://img.shields.io/badge/Supabase-2.79.0-3ECF8E?style=for-the-badge&logo=supabase" alt="Supabase"/>
  <img src="https://img.shields.io/badge/Google%20Gemini-1.28.0-4285F4?style=for-the-badge&logo=google" alt="Google Gemini"/>
  <br/>
  <img src="https://img.shields.io/badge/Node.js-22+-339933?style=for-the-badge&logo=node.js" alt="Node.js"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.3.0-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS"/>
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License"/>
</div>

<div align="center">
  <h3>🤖 Your Personal AI Nutrition Coach</h3>
  <p><strong>Personalized meal planning, progress tracking, and intelligent nutrition guidance powered by AI</strong></p>
</div>

---

## 📋 Table of Contents

- [✨ Overview](#-overview)
- [🚀 Key Features](#-key-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [📦 Installation](#-installation)
- [⚙️ Configuration](#️-configuration)
- [🏃‍♂️ Usage](#️-usage)
- [🏗️ Architecture](#️-architecture)
- [🔧 Development](#-development)
- [📱 API Reference](#-api-reference)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## ✨ Overview

**NutriMIND** is an intelligent nutrition coaching application that combines cutting-edge AI with comprehensive health tracking. Built with modern web technologies, it provides personalized meal plans, progress monitoring, and smart nutrition guidance to help users achieve their health goals.

### 🎯 What Makes NutriMIND Special?

- **🤖 AI-Powered Planning**: Google Gemini generates personalized meal plans based on your profile
- **📸 Visual Recipes**: Photorealistic food images for every meal
- **📊 Comprehensive Tracking**: Weight, body measurements, water intake, and activities
- **🛒 Smart Shopping**: AI-consolidated shopping lists organized by supermarket aisles
- **🔄 Cross-Device Sync**: Your data everywhere, always up-to-date
- **🌍 Multilingual**: Full French and English support

---

## 🚀 Key Features

### 🎯 **Smart Meal Planning**
- Personalized weekly meal plans tailored to your goals
- Precise macronutrient calculations (calories, protein, carbs, fats)
- Budget-aware recipes with Paris market pricing
- Photorealistic AI-generated food images
- Flexible prep time constraints (weekdays vs weekends)

### 📊 **Progress Tracking**
- Weight and body measurement tracking with trend charts
- Daily water intake monitoring with personalized goals
- Activity logging (running, gym, yoga, etc.) with calorie burn calculations
- Visual progress charts and analytics

### 🧠 **AI Intelligence**
- Interactive food preference learning via swipe interface
- Smart meal regeneration with custom instructions
- Intelligent shopping list consolidation
- Context-aware recipe suggestions

### 🔐 **User Experience**
- Secure authentication (Email/Password + Google OAuth)
- Offline-first functionality
- Responsive design (desktop, tablet, mobile)
- Real-time synchronization across devices

---

## 🛠️ Tech Stack

### **Frontend**
- **React 19.2.0** - Modern UI framework with hooks and concurrent features
- **TypeScript 5.8.2** - Type-safe JavaScript for better development experience
- **Vite 6.2.0** - Lightning-fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework for rapid UI development
- **Recharts 3.3.0** - Composable charting library for data visualization

### **Backend & Database**
- **Supabase 2.79.0** - Open-source Firebase alternative
  - PostgreSQL database with Row Level Security
  - Built-in authentication and real-time subscriptions
  - RESTful API with automatic TypeScript types

### **AI & APIs**
- **Google Gemini 1.28.0** - Advanced AI for meal planning and image generation
  - Text generation for personalized recipes
  - Image generation for photorealistic food photos
  - Structured JSON output for reliable data parsing

### **Storage & Caching**
- **IndexedDB** - Browser-based database for image caching
- **localStorage** - Preference and session data storage
- **Supabase Storage** - Cloud file storage for user data

### **Development Tools**
- **ESLint** - Code linting and quality assurance
- **npm** - Package management and scripts
- **Git** - Version control and collaboration

---

## 📦 Installation

### Prerequisites

- **Node.js 22+** - Latest LTS version recommended
- **npm** or **yarn** - Package manager
- **Git** - Version control system

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/ncoprod/nutrimind-ai.git
   cd nutrimind-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your API keys:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   ```
   http://localhost:5173
   ```

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Google Gemini AI API Key (required)
GEMINI_API_KEY=your_gemini_api_key_here

# Supabase Configuration (required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Custom port for development
PORT=5173
```

### Supabase Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com)
2. **Get your project URL and anon key** from the project settings
3. **Set up the database tables** (see `database/schema.sql` for table definitions)
4. **Configure Row Level Security** policies for data privacy

### API Keys

- **Google Gemini**: Get your API key from [Google AI Studio](https://ai.google.dev)
- **Supabase**: Automatically generated when you create a project

---

## 🏃‍♂️ Usage

### First Time Setup

1. **Language Selection**: Choose between French and English
2. **Authentication**: Sign up with email/password or Google OAuth
3. **Onboarding**: Complete your health profile
   - Personal information (age, gender, height, weight)
   - Health goals (lose/maintain/gain weight)
   - Dietary preferences and restrictions
   - Cooking skill level and budget
   - Time constraints for meal preparation

4. **Food Preferences**: Swipe through foods to teach the AI your tastes

### Daily Workflow

1. **View Your Plan**: See your personalized weekly meal plan
2. **Track Meals**: Mark meals as completed as you eat
3. **Log Progress**: Record weight, measurements, water intake, and activities
4. **Generate New Plans**: Request new meal variations or complete days
5. **Shopping Lists**: Generate and organize shopping lists by supermarket aisles

### Advanced Features

- **Meal Regeneration**: Replace meals with custom instructions ("make it vegetarian")
- **Add Extra Meals**: Generate additional snacks to meet calorie targets
- **Progress Analytics**: View charts and trends over time
- **Offline Mode**: Continue using the app without internet connection

---

## 🏗️ Architecture

### Application Structure

```
nutrimind/
├── public/                 # Static assets
├── src/
│   ├── components/         # React components
│   │   ├── ui/            # Reusable UI components
│   │   └── [Feature]/     # Feature-specific components
│   ├── services/          # API and external service integrations
│   │   ├── authService.ts    # Authentication logic
│   │   ├── databaseService.ts # Supabase operations
│   │   └── geminiService.ts   # AI integration
│   ├── types.ts           # TypeScript type definitions
│   ├── locales/           # Internationalization
│   └── data/              # Static data and food items
├── dist/                  # Production build output
└── package.json          # Dependencies and scripts
```

### Data Flow

```
User Action → React Component → Service Layer → External API → Database → UI Update
```

### Key Design Patterns

- **Component Composition**: Reusable, modular React components
- **Custom Hooks**: Encapsulated stateful logic
- **Service Layer**: Centralized API communication
- **Type Safety**: Comprehensive TypeScript coverage
- **Error Boundaries**: Graceful error handling

---

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run type-check   # Run TypeScript type checking
npm run lint         # Run ESLint
```

### Development Workflow

1. **Branching**: Create feature branches from `main`
2. **Development**: Use `npm run dev` for hot reloading
3. **Testing**: Test features across different devices/browsers
4. **Code Quality**: Run linting and type checking before commits
5. **Pull Requests**: Create PRs with detailed descriptions

### Code Style

- **TypeScript**: Strict type checking enabled
- **ESLint**: Airbnb config with React and TypeScript rules
- **Prettier**: Consistent code formatting
- **Conventional Commits**: Structured commit messages

---

## 📱 API Reference

### Google Gemini Integration

```typescript
// Generate a personalized meal plan
const plan = await generateMealPlan(userProfile, language, onProgress, weekNumber);

// Regenerate a specific meal
const newMeal = await regenerateMeal(userProfile, language, currentDay, mealToReplace, options);

// Generate shopping list
const shoppingList = await generateShoppingList(plan, language);
```

### Supabase Database Operations

```typescript
// User authentication
const { user, error } = await signInWithEmail(email, password);

// Data synchronization
const { error } = await syncAllDataToSupabase(userId, profile, mealPlans, trackingData);

// Load user data
const { profile, mealPlans, error } = await loadAllDataFromSupabase(userId);
```

### Key Services

- **`geminiService.ts`** - AI meal planning and image generation
- **`databaseService.ts`** - Supabase CRUD operations
- **`authService.ts`** - Authentication and user management

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and test thoroughly
4. **Commit your changes**: `git commit -m 'Add amazing feature'`
5. **Push to the branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style and patterns
- Write clear, concise commit messages
- Add TypeScript types for new features
- Test your changes across different devices
- Update documentation for new features

### Areas for Contribution

- **UI/UX Improvements**: Enhanced user interface and experience
- **New Features**: Additional tracking capabilities or AI features
- **Performance**: Optimization and performance improvements
- **Internationalization**: Support for additional languages
- **Testing**: Unit and integration tests

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Google Gemini** for AI-powered meal planning and image generation
- **Supabase** for the robust backend infrastructure
- **React & TypeScript** communities for excellent documentation and support
- **Open source contributors** who make projects like this possible

---

<div align="center">
  <p><strong>Built with ❤️ for healthier lifestyles</strong></p>
  <p>
    <a href="#installation">Get Started</a> •
    <a href="#key-features">Features</a> •
    <a href="https://github.com/ncoprod/nutrimind-ai/issues">Report Issues</a>
  </p>
</div>