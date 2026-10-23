# AZUBUDDY — Unofficial AZ-900 Study Buddy

AZUBUDDY is an AI-powered study buddy that helps learners prepare for the Microsoft Azure Fundamentals (AZ-900) exam. It explains Azure concepts in plain English, uses practical African examples, corrects common misconceptions, and suggests follow-up questions to support learning.

> **Disclaimer:** AZUBUDDY is an unofficial educational project. It is not affiliated with or endorsed by Microsoft and does not contain real exam questions. Its learning content is based on the publicly available Azure Fundamentals skills outline.

## Live Demo

**Status:** Run locally using the instructions below.

A deployed demo link can be added here when the team makes the application available online.

## Features

- Explains Azure concepts in plain English.
- Uses practical examples relevant to African contexts.
- Clarifies common misconceptions.
- Provides follow-up questions to reinforce learning.
- Uses the Anthropic Claude API to generate AI-powered explanations.

## Concepts Covered

1. **Region Pairs** — Understanding Azure region pairs and their role in disaster recovery.
2. **Availability Zones** — Understanding infrastructure separation and high availability.
3. **Storage Redundancy** — Understanding how Azure protects data through replicated copies.
4. **Conditional Access** — Understanding how access policies use conditions and signals to make access decisions.
5. **CapEx vs OpEx** — Comparing upfront capital expenditure with ongoing operational expenditure.

## Technology Stack

- **Runtime:** Node.js
- **Backend:** Express.js
- **AI integration:** Anthropic Claude API
- **Frontend:** HTML, CSS, and JavaScript
- **Testing:** Node.js built-in test runner

## Prerequisites

Before running the project, ensure you have:

- Node.js 18 or later.
- npm, which is included with Node.js.
- An Anthropic API key, available from the [Anthropic Console](https://console.anthropic.com/).

## Setup and Installation

### 1. Clone the repository

Open a terminal and run:

```bash
git clone https://github.com/PLP-Group-41/azubuddy.git
cd azubuddy
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a local `.env` file from the example file.

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env
```

**macOS/Linux:**

```bash
cp .env.example .env
```

Open `.env` and add your Anthropic API key using the variable name defined in `.env.example`.

**Security note:** Never commit your API key or share it publicly. Keep `.env` out of version control.

### 4. Start the application

If the repository defines a `dev` script in `package.json`, start the development server with:

```bash
npm run dev
```

Open the local URL configured by the application in your browser. If the server uses port 3000, the URL will be:

`http://localhost:3000`

## Running Tests

Run the project's configured test suite with:

```bash
npm test
```

The concept validation tests check that concept files follow the expected structure and contain the required fields. The test suite should be run against all five concept files before the project is considered fully validated.

If the `test` script is not configured in `package.json`, use the test command documented by the project maintainers.

## Project Structure

The project is organized around the following components:

- `concepts/` — Azure concept reference files.
- `concepts/_schema.json` — Expected structure for concept files.
- `tests/` — Concept validation tests.
- `prompts/` — AI persona, response rules, and prompt assembly.
- `data/` — Azure Fundamentals skills outline.
- `frontend/` — User interface and concept list.
- `api/` — Chat API endpoint.
- `lib/` — Anthropic Claude API integration.
- `server.js` — Application server.

## Architecture Overview

The application combines a web-based learning interface with a backend chat endpoint. The backend assembles the relevant learning context and sends a request to the Anthropic Claude API to generate an explanation.

The concept reference files provide structured information that helps the assistant explain Azure topics consistently.

## Contributors

AZUBUDDY is being developed collaboratively by Dev A, Dev B, and Dev C for the **#1MillionDevs Vibe Coding Hackathon**.

## License

MIT
