# Setup and Installation Guide for Terpa Web

This guide provides step-by-step instructions to set up your local development environment for the Terpa Web project.

## 1. Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js**: Version 22.x (as specified in `package.json` under `engines`). You can use a version manager like [nvm](https://github.com/nvm-sh/nvm) to manage Node.js versions.
- **npm**: Version 10.x (comes bundled with Node.js v22).
- **Git**: For cloning the repository.
- **Database**: A running instance of a database compatible with Prisma (e.g., PostgreSQL, MySQL, SQLite). The specific database type and connection details will be configured via environment variables. For local development, PostgreSQL or SQLite are common choices.

## 2. Clone the Repository

Open your terminal and clone the Terpa Web repository to your local machine:

```bash
git clone <repository-url>
cd terpa-web
```

Replace `<repository-url>` with the actual URL of the Git repository.

## 3. Install Dependencies

Once you are in the project's root directory (`terpa-web`), install the project dependencies using npm:

```bash
npm install
```

This command reads the `package.json` file and installs all the necessary packages listed in `dependencies` and `devDependencies`.

## 4. Configure Environment Variables

The application requires environment variables for configuration (e.g., database connection strings, API keys, JWT secrets).

1.  Copy the example environment file:
    ```bash
    cp .env.example .env
    ```
2.  Open the newly created `.env` file in a text editor.
3.  Update the placeholder values with your actual local configuration. Key variables to configure typically include:

    - `DATABASE_URL`: The connection string for your database.
      - Example for PostgreSQL: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE_NAME`
      - Example for SQLite: `file:./dev.db` (Prisma will create this file)
    - `JWT_SECRET`: A strong, random string for signing JSON Web Tokens.
    - `REDIS_URL`: Connection string for your Redis instance (if BullMQ is actively used).
    - API keys for external services like AWS S3, MercadoPago, Sentry, etc.

    **Note**: The `.env` file is included in `.gitignore` and should never be committed to the repository.

## 5. Database Setup

Terpa Web uses Prisma for database management.

1.  **Apply Migrations**:
    This command applies all pending database migrations to bring your database schema up to date with the `prisma/schema.prisma` definition.

    ```bash
    npx prisma migrate deploy
    ```

    If you are setting up for the first time or making schema changes during development, you might use `npx prisma migrate dev` which also generates SQL migration files.

2.  **Generate Prisma Client**:
    Although often run automatically by other Prisma commands or npm scripts, you can explicitly generate the Prisma Client if needed:

    ```bash
    npx prisma generate
    ```

3.  **Seed the Database (Optional but Recommended)**:
    The project includes a seed script (`prisma/seed.ts`) to populate the database with initial or test data.
    ```bash
    npm run seed
    ```
    This script is defined in `package.json` (`"prisma": { "seed": "tsx prisma/seed.ts" }`).

## 6. Run the Development Server

Once the setup is complete, you can start the Next.js development server:

```bash
npm run dev
```

This command (defined in `package.json` scripts: `"dev": "TZ='UTC' next dev -p 8080"`) will typically start the application on `http://localhost:8080`. The `TZ='UTC'` part ensures the server runs in the UTC timezone, which is good practice for consistency.

You should now be able to access the Terpa Web application in your web browser.

## 7. Other Useful Commands

- **Linting**:
  To check the code for linting errors and style issues according to the project's ESLint configuration:

  ```bash
  npm run lint
  ```

- **Building for Production**:
  To create an optimized production build of the application:

  ```bash
  npm run build
  ```

  The full build process, including Prisma generation and migrations for deployment, is often encapsulated in a command like `do-build`:

  ```bash
  npm run do-build
  ```

  (This script is: `"do-build": "npx prisma generate && npm run build && npx prisma migrate deploy"`)

- **Starting in Production Mode**:
  After building, to start the application in production mode:
  ```bash
  npm run start
  ```

You are now ready to start developing on Terpa Web! If you encounter any issues, review the steps above and ensure all prerequisites and configurations are correctly set.
