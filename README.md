# MCQ Quiz Builder

An AI-powered Multiple Choice Questions generator that creates 10 MCQs based on any topic or prompt you provide.

## Features

- 🤖 **AI-Powered**: Uses OpenAI's GPT model to generate questions
- 📝 **Interactive Quiz**: Select answers and get instant feedback
- 🎯 **Smart Scoring**: See your results with explanations
- 📊 **Difficulty Levels**: Choose from Easy, Medium, or Hard questions
- 🎨 **Modern UI**: Clean, responsive design with Tailwind CSS
- ⚡ **Fast**: Built with Next.js and React

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- OpenAI API key (for GPT models)
- AWS Account with Bedrock access (for Claude models)

### Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up your environment variables:
   ```bash
   cp env.example .env.local
   ```
   
4. Add your API keys to `.env.local`:
   ```
   # OpenAI API Key (required for OpenAI GPT models)
   OPENAI_API_KEY=your_openai_api_key_here
   
   # AWS Credentials (required for Claude via AWS Bedrock)
   AWS_ACCESS_KEY_ID=your_aws_access_key_id
   AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
   AWS_REGION=us-east-1
   ```

5. Start the development server:
   ```bash
   pnpm dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## How to Use

1. **Enter a Topic**: Type any subject or prompt in the input field
   - Examples: "JavaScript fundamentals", "World War 2", "Photosynthesis", "Machine Learning basics"

2. **Choose Settings**: 
   - Select number of questions (5, 10, 15, or 20)
   - Choose AI model (OpenAI GPT-4o or Claude 4 Sonnet)
   - Pick difficulty level (Easy, Medium, or Hard)

3. **Generate Questions**: Click "Generate MCQs" to create your custom quiz

4. **Take the Quiz**: Select your answers for each question (A, B, C, or D)

5. **Submit & Review**: Click "Submit Answers" to see your results with explanations

6. **Reset**: Start over with a new topic anytime

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **AI**: OpenAI GPT-4o-mini & Claude 3.5 Sonnet via Vercel AI SDK
- **Cloud**: AWS Bedrock for Claude integration
- **Package Manager**: pnpm

## API Endpoints

- `POST /api/generate-mcq` - Generates MCQs based on a prompt

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).