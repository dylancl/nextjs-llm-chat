# Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a NextJS application for interacting with LLMs using TypeScript, Tailwind CSS, and shadcn/ui components.

## Project Guidelines

- Use TypeScript for all code
- Follow App Router patterns (app directory structure)
- Use shadcn/ui components for consistent styling
- Implement clean, minimal UI design (Apple/Vercel style - black/white theme)
- Use Tailwind CSS for styling
- Ensure components are modular and reusable
- Implement proper error handling and loading states
- Use React Server Components where appropriate
- Follow Next.js best practices for API routes

## API Integration

- The application uses a custom Bonzai universal endpoint that's similar to OpenAI but with differences:
  - Authentication uses `api-key` header instead of Authorization Bearer
  - Some parameters may not be supported
  - Response format may differ slightly from standard OpenAI format

## Key Features to Implement

- Clean chat interface with message history
- Configuration panel for API settings
- Status indicators for API connectivity
- Support for streaming and non-streaming responses
- System prompt configuration
- Model selection
- Response parameter controls (temperature, top_p, max_tokens, etc.)
