# Contributing to Disaster SIH

When working with multiple developers, please follow these guidelines to prevent merge conflicts and ensure a smooth workflow.

## 1. Branch Naming Conventions
Never commit directly to the `main` or `master` branch. Always create a new branch for your work.
Use the following prefixes:
- `feat/`: For new features (e.g., `feat/postgres-migration`)
- `fix/`: For bug fixes (e.g., `fix/map-rendering`)
- `docs/`: For documentation updates
- `refactor/`: For code structure changes that don't add features

## 2. Environment Variables (.env)
- **DO NOT** commit your local `.env` file. It is explicitly ignored in `.gitignore`.
- If you add a new environment variable to the project, add a placeholder for it in a `.env.example` file and commit the `.example` file so other developers know what variables they need to configure.

## 3. Package Managers
- The backend and frontend both use `npm`.
- When you add a new dependency, always commit the updated `package.json` and `package-lock.json` so that dependencies are locked to specific versions for everyone.

## 4. Handling Merge Conflicts
- Always pull the latest changes from the `main` branch before opening a Pull Request.
- Run `git pull origin main --rebase` on your local branch to place your changes on top of the latest main branch. This prevents messy merge commits.
- Resolve any conflicts locally before pushing.

## 5. Line Endings (CRLF vs LF)
- We use a `.gitattributes` file to enforce `LF` line endings across all platforms (Windows, Mac, Linux). Do not modify this file unless you are explicitly adding a new binary file format.
