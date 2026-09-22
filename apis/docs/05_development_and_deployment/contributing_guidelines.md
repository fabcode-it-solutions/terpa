# Contributing Guidelines for Terpa Web

This document provides guidelines for developers contributing to the Terpa Web project. Adhering to these guidelines helps maintain code quality, consistency, and ensures a smooth collaboration process.

## 1. Code Style and Conventions

- **Language**: Primarily TypeScript. Ensure all new code is written in TypeScript and leverages its type-safety features.
- **Linting (ESLint)**:
  - The project uses ESLint for static code analysis and enforcing coding standards. The configuration is defined in `.eslintrc.json`.
  - **Run Linter**: Before committing code, always run the linter to catch any issues:
    ```bash
    npm run lint
    ```
  - Fix any linting errors or warnings reported. Many issues can be auto-fixed by ESLint.
- **Formatting**:
  - While not explicitly specified by a Prettier config file, consistent code formatting is expected. ESLint rules often cover many formatting aspects.
  - Follow the existing code style in the project regarding indentation, spacing, naming conventions, etc.
- **Naming Conventions**:
  - Use PascalCase for components, classes, types, and interfaces (e.g., `MachineComponent`, `interface UserProfile`).
  - Use camelCase for variables, functions, and object properties (e.g., `let machineData;`, `function getUserDetails() {}`).
  - File names for components and modules should generally be kebab-case (e.g., `user-profile-form.tsx`) or match the primary export if it's a single class/component. Follow existing patterns.
- **Comments**:
  - Write clear and concise comments for complex logic, non-obvious code sections, or to explain the purpose of functions and modules (e.g., JSDoc style for functions).
  - Avoid over-commenting simple code.
- **TypeScript Best Practices**:
  - Utilize strong typing. Avoid `any` where possible; prefer specific types or `unknown`.
  - Use interfaces or types for defining object shapes.
  - Leverage utility types (e.g., `Partial`, `Omit`, `Pick`) where appropriate.

## 2. Development Workflow

- **Branching Strategy (Suggested - if not formally defined)**:
  - **`main` / `master`**: This branch should always represent the stable, production-ready version of the code. Direct commits to this branch are typically restricted.
  - **`develop` (Optional)**: A common integration branch where features are merged before being promoted to `main`.
  - **Feature Branches**: Create a new branch for each new feature, bugfix, or task.
    - Branch off from `develop` (or `main` if `develop` isn't used).
    - Name branches descriptively, e.g., `feature/user-profile-editing`, `fix/login-page-bug`, `chore/update-dependencies`.
  - **Pull Requests (PRs)**: Once work on a feature branch is complete, submit a Pull Request to merge it into `develop` (or `main`).
- **Committing Code**:
  - Make small, logical commits with clear and descriptive commit messages.
  - Follow conventional commit message formats if adopted by the team (e.g., `feat: add user profile editing`, `fix: resolve issue with machine status update`).
  - Ensure your code is linted and builds successfully before committing.
- **Keeping Branch Updated**: Regularly pull changes from the upstream branch (`develop` or `main`) into your feature branch to avoid large merge conflicts:
  ```bash
  git pull origin develop # (or main)
  # or
  git rebase origin/develop
  ```

## 3. Pull Request (PR) Process

- **Create a PR**: When your feature or fix is complete and tested, create a Pull Request against the target branch (e.g., `develop` or `main`).
- **PR Description**:
  - Provide a clear title and a detailed description of the changes made.
  - Explain the "what" and "why" of the changes.
  - Link to any relevant issues or tasks (e.g., "Closes #123").
- **Code Review**:
  - At least one other team member should review the PR.
  - Reviewers should check for code quality, correctness, adherence to guidelines, potential bugs, and overall impact.
  - Address any feedback or comments from reviewers by making necessary changes and pushing updates to your feature branch.
- **Automated Checks**: Ensure all automated checks (CI builds, tests, linting) pass for the PR.
- **Merging**: Once the PR is approved and all checks pass, it can be merged by an authorized team member. Prefer squash merges or rebase merges for a cleaner Git history, depending on team policy.

## 4. Testing (General Guidance - if applicable)

- While specific testing frameworks or strategies are not explicitly detailed in the provided file list, good practice includes:
  - **Unit Tests**: For individual functions, components, or modules.
  - **Integration Tests**: To test interactions between different parts of the system.
  - **End-to-End (E2E) Tests**: To simulate user flows through the application.
- If tests exist, ensure your changes are covered by new or updated tests.
- All tests should pass before submitting a PR.

## 5. Environment Variables

- Do not commit the `.env` file. It contains sensitive information and local configurations.
- Use `.env.example` as a template for required environment variables.
- When adding new environment variables required by your changes, update `.env.example` with a placeholder and description.

## 6. Dependencies

- When adding or updating dependencies:
  - Consider the impact on bundle size and performance.
  - Ensure the license of the new dependency is compatible with the project.
  - Update `package.json` and `package-lock.json` accordingly.

By following these guidelines, contributors can help ensure that Terpa Web remains a high-quality, maintainable, and robust application.
