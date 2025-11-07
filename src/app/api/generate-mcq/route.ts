import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock';
import { generateText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';

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
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Validate credentials based on selected model
    if (aiModel === 'openai' && !apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key is required' },
        { status: 400 }
      );
    }

    if (aiModel === 'gemini' && !apiKey) {
      return NextResponse.json(
        { error: 'Google Gemini API key is required' },
        { status: 400 }
      );
    }

    if (aiModel === 'claude' && (!awsAccessKeyId || !awsSecretAccessKey || !awsRegion)) {
      return NextResponse.json(
        { error: 'AWS credentials (Access Key ID, Secret Access Key, and Region) are required for Claude' },
        { status: 400 }
      );
    }

    // Validate question count
    if (![2, 5, 10, 15, 20].includes(questionCount)) {
      return NextResponse.json(
        { error: 'Question count must be 2, 5, 10, 15, or 20' },
        { status: 400 }
      );
    }

    // Validate AI model
    if (!['openai', 'gemini', 'claude'].includes(aiModel)) {
      return NextResponse.json(
        { error: 'AI model must be "openai", "gemini", or "claude"' },
        { status: 400 }
      );
    }

    // Validate difficulty
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return NextResponse.json(
        { error: 'Difficulty must be "easy", "medium", or "hard"' },
        { status: 400 }
      );
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
    } else if (aiModel === 'gemini') {
      const geminiProvider = createGoogleGenerativeAI({
        apiKey: apiKey,
      });
      model = geminiProvider('gemini-2.5-flash');
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

    const { text } = await generateText({
      model,
      // maxOutputTokens: 4096,
      prompt: `Generate EXACTLY ${questionCount} multiple choice questions at ${difficulty.toUpperCase()} difficulty level based on the following topic/prompt: "${prompt}". 

      CRITICAL: You must generate EXACTLY ${questionCount} questions - no more, no less.

      Format the response as a valid JSON object with the following structure:
      {
        "questions": [
          {
            "question": "Your question here",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": 0,
            "explanation": "Brief explanation of the correct answer"
          }
        ]
      }

      STRICT Requirements:
      - Generate EXACTLY ${questionCount} questions (count them before responding)
      - Each question must have exactly 4 options
      - correctAnswer must be the index (0, 1, 2, or 3) of the correct option
      - Questions should be educational and cover different aspects of the topic
      - Return ONLY the JSON object, no additional text
      - Double-check that your questions array has exactly ${questionCount} items

      Difficulty-specific guidelines for ${difficulty.toUpperCase()} level:${difficultyInstructions[difficulty as keyof typeof difficultyInstructions]}`,
    });

    // Clean the text response - remove markdown code blocks if present
    let cleanedText = text.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Parse the cleaned text as JSON
    const parsedResponse = JSON.parse(cleanedText);
    
    // Validate that we have the expected structure
    if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions)) {
      throw new Error('Invalid response format. No questions array found.');
    }

    // Handle case where AI generates fewer questions than requested
    if (parsedResponse.questions.length < questionCount) {
      console.warn(`AI generated ${parsedResponse.questions.length} questions instead of ${questionCount}. Using what was generated.`);
    }
    
    // Handle case where AI generates more questions than requested (trim to requested count)
    if (parsedResponse.questions.length > questionCount) {
      console.warn(`AI generated ${parsedResponse.questions.length} questions instead of ${questionCount}. Trimming to ${questionCount}.`);
      parsedResponse.questions = parsedResponse.questions.slice(0, questionCount);
    }

    // Ensure we have at least 1 question
    if (parsedResponse.questions.length === 0) {
      throw new Error('No valid questions were generated.');
    }

    // console.log(parsedResponse);

    return NextResponse.json(parsedResponse);
  } catch (error) {
    console.error('Error generating MCQs:', error);
    return NextResponse.json(
      { error: 'Failed to generate MCQs' },
      { status: 500 }
    );
  }
}
