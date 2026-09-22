# Terpa Web

This is the main repository for the Terpa Web application, a comprehensive platform built with Next.js 14.

## Quick Start Guide

Follow these steps to get a local development environment up and running:

1.  **Prerequisites**:

    - Node.js: Version 22.x
    - npm: Version 10.x
    - Git
    - Postgresql 16+
    - Redis 7+

2.  **Clone the Repository**:

    ```bash
    git clone git@github.com:terpa-solutions/terpa-web.git
    cd terpa-web
    ```

3.  **Install Dependencies**:

    ```bash
    npm install
    ```

4.  **Setup Environment Variables**:

    - Copy the example environment file:
      ```bash
      cp .env.example .env
      ```
    - Open the `.env` file and update the placeholder values with your local configuration (database connection string, API keys, JWT secret, etc.). Refer to `.env.example` for required variables.

5.  **Database Setup**:

    - Ensure your database server is running and accessible.
    - Apply database migrations:
      ```bash
      npx prisma migrate dev
      ```
    - Seed the database with initial data:

      ```bash
      npm run seed
      ```

    Any time you feel like resetting your local environment you can run

    ```bash
    npx prisma migrate
    ```

> Tip: You can use `npx prisma migrate reset --force` to do this quickly.

6.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    The application should now be running at `http://localhost:8080`.

## Full Documentation

For a comprehensive understanding of the project architecture, features, and development guidelines, please refer to the [**Full Documentation located in the `docs/` directory**](./docs/README.md).

This includes:

- Project Overview
- Detailed Setup and Installation
- System Architecture
- Core Feature Explanations
- Technical Details (APIs, UI, Integrations)
- Development and Deployment Guides
