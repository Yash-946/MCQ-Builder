import { createOpenAI } from '@ai-sdk/openai';
import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock';
import { streamText } from 'ai';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { 
      prompt, 
      questionCount = 10, 
      aiModel = 'openai', 
      difficulty = 'medium', 
      apiKey,
      awsAccessKeyId,
      awsSecretAccessKey,
      awsRegion
    } = await request.json();

    if (!prompt) {
      return new Response('Prompt is required', { status: 400 });
    }

    // Validate credentials based on selected model
    if (aiModel === 'openai' && !apiKey) {
      return new Response('OpenAI API key is required', { status: 400 });
    }

    if (aiModel === 'claude' && (!awsAccessKeyId || !awsSecretAccessKey || !awsRegion)) {
      return new Response('AWS credentials (Access Key ID, Secret Access Key, and Region) are required for Claude', { status: 400 });
    }

    // Validate question count
    if (![2, 5, 10, 15, 20].includes(questionCount)) {
      return new Response('Question count must be 2, 5, 10, 15, or 20', { status: 400 });
    }

    // Validate AI model
    if (!['openai', 'claude'].includes(aiModel)) {
      return new Response('AI model must be either "openai" or "claude"', { status: 400 });
    }

    // Validate difficulty
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return new Response('Difficulty must be "easy", "medium", or "hard"', { status: 400 });
    }

    // Select the appropriate model with credentials
    let model;
    if (aiModel === 'claude') {
      const bedrockProvider = createAmazonBedrock({
        region: awsRegion,
        accessKeyId: awsAccessKeyId,
        secretAccessKey: awsSecretAccessKey,
      });
      model = bedrockProvider('apac.anthropic.claude-sonnet-4-20250514-v1:0');
    } else {
      const openaiProvider = createOpenAI({
        apiKey: apiKey,
      });
      model = openaiProvider('gpt-4o');
    }

    // Create difficulty-specific instructions
    const difficultyInstructions = {
      easy: `
      - Use simple, straightforward language
      - Focus on basic concepts and definitions
      - Include obvious wrong answers that are clearly incorrect
      - Target beginner-level knowledge
      - Avoid complex scenarios or edge cases`,
      medium: `
      - Use moderate complexity in language and concepts
      - Include some application-based questions
      - Mix definition and application questions
      - Include plausible distractors that require thinking
      - Target intermediate-level knowledge`,
      hard: `
      - Use advanced terminology and complex scenarios
      - Focus on application, analysis, and synthesis
      - Include subtle distinctions between options
      - Create challenging distractors that test deep understanding
      - Include edge cases and advanced concepts
      - Target expert-level knowledge`
    };

    const result = streamText({
      model,
      prompt: `Generate ${questionCount} multiple choice questions at ${difficulty.toUpperCase()} difficulty level based on the following topic/prompt: "${prompt}". 

      IMPORTANT: Generate questions one by one, with each question as a complete JSON object on its own line.
      
      Format each question as a single line JSON object like this:
      {"question": "Your question here", "options": ["Option A", "Option B", "Option C", "Option D"], "correctAnswer": 0, "explanation": "Brief explanation"}
      
      Requirements:
      - Generate exactly ${questionCount} questions
      - Each question on a separate line as valid JSON
      - correctAnswer should be the index (0, 1, 2, or 3) of the correct option
      - Questions should be educational and cover different aspects of the topic
      - Each line should be a complete, valid JSON object
      
      Difficulty-specific guidelines for ${difficulty.toUpperCase()} level:${difficultyInstructions[difficulty as keyof typeof difficultyInstructions]}
      
      Start generating now:`,
    });

    // Create a simpler stream that processes the full text and sends questions as they're identified
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullText = '';
          let questionCount = 0;
          let lastSentIndex = 0;
          let a=0,b=0, c=0;
          
          // Collect all the streamed text
          for await (const chunk of result.textStream) {
            a++;
            fullText += chunk;
            // console.log('Full text:', fullText);
            
            // Try to extract complete JSON objects from the accumulated text
            const lines = fullText.split('\n');
            // console.log('Lines:', lines);
            
            for (let i = lastSentIndex; i < lines.length - 1; i++) {
              b++;
              const line = lines[i].trim();
              // console.log('Line:', line);
              if (line && line.startsWith('{') && line.endsWith('}')) {
                try {
                  const question = JSON.parse(line);
                  if (question.question && question.options && question.correctAnswer !== undefined) {
                    questionCount++;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ question, index: questionCount - 1 })}\n\n`));
                    lastSentIndex = i + 1;
                  }
                } catch (e) {
                  // Ignore malformed JSON lines
                  console.warn('Failed to parse JSON line:', line);
                }
              }
            }
          }
          console.log('a:', a);
          console.log('b:', b);
          
          // Process the last line if it's complete
          const remainingLines = fullText.split('\n').slice(lastSentIndex);
          for (const line of remainingLines) {
            c++;
            const trimmedLine = line.trim();
            if (trimmedLine && trimmedLine.startsWith('{') && trimmedLine.endsWith('}')) {
              try {
                const question = JSON.parse(trimmedLine);
                if (question.question && question.options && question.correctAnswer !== undefined) {
                  questionCount++;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ question, index: questionCount - 1 })}\n\n`));
                }
              } catch (e) {
                console.warn('Failed to parse final JSON line:', trimmedLine);
              }
            }
          }
          console.log('c:', c);
          
          // Send completion signal
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ complete: true, totalQuestions: questionCount })}\n\n`));
          controller.close();
          
        } catch (error) {
          console.error('Streaming error:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream processing failed' })}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error in streaming MCQ generation:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
