# Contributing to Fitness & Muscles

Thank you for your interest in contributing!

## Development Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/stride-fitness-app.git`
3. Install dependencies: `npm install`
4. Create a branch: `git checkout -b feat/your-feature`
5. Make your changes
6. Run checks: `npm run lint && npm run type-check`
7. Commit using conventional commits: `git commit -m "feat: add feature"`
8. Push and create a Pull Request

## Branch Naming

- `feat/*` — New features
- `fix/*` — Bug fixes
- `chore/*` — Maintenance

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(auth): add social login buttons
fix(onboarding): step indicator not updating
docs(readme): update setup instructions
```

## Code Style

- TypeScript strict mode
- ESLint + Prettier (auto-formatted on commit)
- NativeWind for styling (Tailwind classes)
