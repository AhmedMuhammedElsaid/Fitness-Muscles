# Fitness & Muscles

Single-coach fitness coaching mobile app built with React Native (Expo), NativeWind, and Supabase.

## Tech Stack

| Layer            | Technology              |
|------------------|-------------------------|
| Framework        | React Native + Expo 55  |
| Navigation       | Expo Router (file-based)|
| Client State     | TanStack Store          |
| Server State     | TanStack Query          |
| Reactive data    | TanStack DB             |
| Auth             | Supabase Auth           |
| Forms            | TanStack Form + Zod     |
| Animations       | React Native Reanimated |
| Styling          | NativeWind (Tailwind)   |

## Getting Started

### Prerequisites

- Node.js 20+
- Expo CLI (`npx expo`)
- iOS Simulator or Android Emulator (or Expo Go)

### Setup

```bash
# Clone
git clone https://github.com/rayyanshaheer/stride-fitness-app.git
cd stride-fitness-app

# Install
npm install

# Environment
cp .env.example .env
# Edit .env with your Supabase credentials

# Start
npx expo start
```

## Project Structure

```
app/                    # Expo Router screens
├── _layout.tsx         # Root layout
├── index.tsx           # Entry point / splash
├── auth/               # Login, signup, forgot password
├── role-select.tsx     # Client/Coach role selection
├── onboarding-form/    # 8-step onboarding
├── (client)/           # Client tab group
└── (coach)/            # Coach tab group

src/
├── components/ui/      # Design system components
├── config/             # API, Supabase, QueryClient
├── stores/             # TanStack Store client state
└── theme/              # Design tokens
```

## Design System

- **Dark theme** with `#1A1A1A` background
- **Primary**: `#E8DEB5` (cream/gold)
- **Typography**: Inter (sans-serif) + Playfair Display (serif)
- Components: PrimaryButton, SecondaryButton, TextInput, Card, ProgressBar, StepIndicator, ChipSelector, ToggleOption

## Scripts

| Script        | Description              |
|---------------|--------------------------|
| `npm start`   | Start Expo dev server    |
| `npm run lint` | Run ESLint              |
| `npm run type-check` | TypeScript check  |
| `npm run format` | Format with Prettier  |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
