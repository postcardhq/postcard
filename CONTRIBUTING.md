# Postcard contributor notes

This document provides technical context and setup instructions for developers and contributors to the **Postcard** project.

## Quick start

To set up the development environment, perform the following steps:

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/EthanThatOneKid/postcard.git
    cd postcard
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Configure environment variables:**
    Copy the template to create your local environment file:

    ```bash
    cp .env.example .env
    ```

    Edit `.env` to include your `GOOGLE_GENERATIVE_AI_API_KEY` if you plan to use the live pipeline.

4.  **Initialize the database:**
    Sync the schema to your local SQLite file:

    ```bash
    npm run db:push
    ```

5.  **Verify the environment:**

    ```bash
    npm run check  # Run linting and type-checks
    ```

6.  **Start the development server:**
    ```bash
    npm run dev
    ```

## Environment configuration

Postcard supports two primary development modes, toggled via the `NEXT_PUBLIC_FAKE_PIPELINE` environment variable in your `.env` file.

- **Fake Mode (`true`):** Uses mock data for all forensic stages. No Gemini API key or external scraping is required. This is the default for rapid UI/UX development.
- **Live Mode (`false`):** Executes the full forensic pipeline (OCR, Navigator, Auditor, Corroborator). Requires a valid `GOOGLE_GENERATIVE_AI_API_KEY` from **[Google AI Studio](https://aistudio.google.com/app/apikey)**.

## Database management

Postcard uses **Drizzle ORM** with **SQLite** for local development.

- **Sync Schema:** Use `npm run db:push` to apply schema changes from `src/db/schema.ts` to `local.db` without migrations.
- **Inspect Data:** Use `npm run db:studio` to open the Drizzle Studio GUI for browsing cached analyses and forensic logs.

## Technical stack

Postcard utilizes a modern, type-safe stack designed for forensic performance and developer velocity.

| Layer             | Choice                   | Why                                                              |
| ----------------- | ------------------------ | ---------------------------------------------------------------- |
| **Frontend**      | Next.js 16               | Provides a responsive dashboard and high-performance API routes. |
| **AI / Vision**   | Google Gemini            | Enables native multimodal vision and search grounding.           |
| **Orchestration** | Vercel AI SDK v6         | Supports robust tool calling and typed stream iteration.         |
| **Storage**       | Drizzle + libSQL (Turso) | Ensures type-safe libSQL persistence for forensic logs.          |
| **Automation**    | Playwright / sharp       | Handles headless scraping and image preprocessing.               |

## AI developer experience

The Postcard pipeline relies heavily on the **[Vercel AI SDK v6](https://sdk.vercel.ai/)** for complex agentic orchestration.

### AI SDK Skills

The project uses **AI SDK Skills** to enforce industry-standard best practices. These localized intelligence configurations guide agentic assistants to follow idiomatic patterns for:

- `streamText` iteration
- `toolCall` payload handling
- Multi-step search grounding

This approach ensures 100% type-safety throughout the forensic pipeline.

## Style guide

To maintain a professional and consistent technical narrative, all documentation must follow these standards:

### Sentence case titles

Use sentence case for all headings and titles (e.g., "What it does" instead of "What It Does"). Only capitalize proper nouns like "Postcard", "Next.js", or "Vercel".

### Active voice

Prioritize active voice in all technical descriptions. Identify the actor and the action clearly.

- **Good:** "The preprocessor enhances the image."
- **Bad:** "The image is enhanced by the preprocessor."
