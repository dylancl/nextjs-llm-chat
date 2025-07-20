# AI Playground

A beautiful, modern interface for interacting with AI models through the Bonzai Universal API endpoint. Built with Next.js, TypeScript, Tailwind CSS, and shadcn/ui components.

![AI Playground Screenshot](https://via.placeholder.com/800x600?text=AI+Playground+Interface)

## Features

- **Clean Chat Interface**: Beautifully designed chat interface with message history
- **Real-time Streaming**: Support for both streaming and non-streaming responses
- **Model Configuration**: Easy model selection and parameter tuning
- **API Status Indicators**: Real-time connection status monitoring
- **System Prompts**: Configurable system prompts for different use cases
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Dark/Light Theme**: Clean black and white theme inspired by Apple/Vercel design

## Supported Models

The application supports all models available through the Bonzai Universal endpoint:

**Anthropic:**

- claude-3-haiku
- claude-3-5-sonnet
- claude-3-7-sonnet
- claude-4-sonnet

**OpenAI:**

- gpt-4.1
- gpt-4o
- gpt-4o-mini
- o1
- o3
- o3-mini
- o4-mini

## Getting Started

### Prerequisites

- Node.js 18+
- A Bonzai API key

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd ai-playground
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file and add your API key:

```env
BONZAI_API_KEY=your_api_key_here
BONZAI_BASE_URL=https://api.bonzai.iodigital.com/universal
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Configure API Key**: Enter your Bonzai API key in the settings panel
2. **Select Model**: Choose from the available AI models
3. **Adjust Parameters**: Fine-tune temperature, max tokens, and other settings
4. **Set System Prompt**: Configure the AI's behavior with custom system prompts
5. **Start Chatting**: Type your message and press Enter to send

## Configuration Options

### API Settings

- **API Key**: Your Bonzai Universal API key
- **Model**: Select from available AI models
- **System Prompt**: Custom instructions for the AI

### Model Parameters

- **Temperature**: Controls randomness (0.0 - 2.0)
- **Max Tokens**: Maximum response length (100 - 4000)
- **Streaming**: Enable/disable real-time response streaming

## API Endpoints

### Chat Completion

`POST /api/chat`

Handles chat completions with support for both streaming and non-streaming responses.

### Connection Test

`GET /api/test-connection`

Tests the API connection and returns status information.

## Development

### Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/                # shadcn/ui components
│   └── ChatInterface.tsx  # Main chat component
└── lib/
    └── utils.ts           # Utility functions
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Technologies Used

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components
- **Lucide React** - Beautiful icons
- **OpenAI SDK** - API client (configured for Bonzai endpoint)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For support or questions, please open an issue on GitHub.
