# MCQ Quiz Builder

An AI-powered Multiple Choice Questions generator that creates 10 MCQs based on any topic or prompt you provide.

## Features

- 🤖 **Multi-AI Support**: Choose from OpenAI GPT-4o, Google Gemini, or Claude (via AWS Bedrock)
- 🔑 **Client-Side API Keys**: Securely store your API keys in your browser
- 📝 **Interactive Quiz**: Select answers and get instant feedback
- 🎯 **Smart Scoring**: See your results with explanations
- 📊 **Difficulty Levels**: Choose from Easy, Medium, or Hard questions
- 🎨 **Modern UI**: Clean, responsive design with Tailwind CSS
- ⚡ **Fast**: Built with Next.js and React
- 🔄 **Streaming Support**: Real-time question generation

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- At least one AI provider API key:
  - OpenAI API key (for GPT-4o)
  - Google Gemini API key (for Gemini)
  - AWS Account with Bedrock access (for Claude, optional)

### Installation

1. Clone this repository

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Install the Google AI SDK (for Gemini support):
   ```bash
   pnpm add @ai-sdk/google
   ```

4. Start the development server:
   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### API Key Configuration

**Option 1: Client-Side Storage (Recommended for Personal Use)**

The app now supports storing API keys directly in your browser's local storage:

1. Click on **"🔑 API Key Settings"** at the top of the page
2. Click **"▼ Configure"** to expand the settings
3. Enter your API keys:
   - **OpenAI API Key**: Get from [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - **AWS Credentials** (for Claude via Bedrock - optional):
     - AWS Access Key ID
     - AWS Secret Access Key
     - AWS Region (e.g., us-east-1, ap-south-1, eu-west-1)
4. Click **"💾 Save API Keys"**
5. Your keys are stored locally and never sent to any server except the AI providers

**Option 2: Environment Variables (For Deployment)**

You can also use environment variables by creating a `.env.local` file:

```bash
cp env.example .env.local
```

Add your API keys:
```
# OpenAI API Key (required for OpenAI GPT models)
OPENAI_API_KEY=your_openai_api_key_here

# AWS Credentials (required for Claude via AWS Bedrock)
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
```

> **Note**: Client-side API keys take precedence over environment variables.

## How to Use

1. **Configure API Keys** (First-time setup):
   - Click on **"🔑 API Key Settings"** and configure your API keys
   - Keys are saved in your browser for future use

2. **Enter a Topic**: Type any subject or prompt in the input field
   - Examples: "JavaScript fundamentals", "World War 2", "Photosynthesis", "Machine Learning basics"

3. **Choose Settings**: 
   - Select number of questions (2, 5, 10, 15, or 20)
   - Choose AI model (OpenAI GPT-4o, Google Gemini, or Claude via Bedrock)
   - Pick difficulty level (Easy, Medium, or Hard)

4. **Generate Questions**: 
   - Click **"⚡ Generate MCQs"** for instant generation
   - Or click **"🚀 Stream MCQs"** for real-time streaming

5. **Take the Quiz**: Select your answers for each question (A, B, C, or D)

6. **Submit & Review**: Click **"Submit Answers"** to see your results with explanations

7. **Reset**: Start over with a new topic anytime

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **AI Models**: 
  - OpenAI GPT-4o via `@ai-sdk/openai`
  - Google Gemini 1.5 Pro via `@ai-sdk/google`
  - Claude via AWS Bedrock with `@ai-sdk/amazon-bedrock`
- **AI SDK**: Vercel AI SDK
- **Package Manager**: pnpm

## Security & Privacy

### Client-Side API Keys
- API keys are stored in your browser's `localStorage` only
- Keys are never sent to our servers
- Keys are transmitted directly to OpenAI or AWS Bedrock APIs
- You can clear your keys anytime using the "🗑️ Clear" button

### Best Practices
- Never share your API keys with others
- Rotate your API keys regularly
- Use browser-stored keys only for personal/development use
- For production deployments, use environment variables

## API Endpoints

- `POST /api/generate-mcq` - Generates MCQs based on a prompt (standard)
- `POST /api/generate-mcq-stream` - Generates MCQs with streaming (real-time)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).