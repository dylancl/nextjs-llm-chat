import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

export async function GET(request: NextRequest) {
  try {
    // Get API key from headers or environment (never from query params for security)
    const apiKey =
      request.headers.get('x-api-key') || process.env.BONZAI_API_KEY;

    // Get model from query parameters
    const url = new URL(request.url);
    const model = url.searchParams.get('model') || 'o3-mini';

    if (!apiKey) {
      return NextResponse.json(
        { status: 'error', error: 'API key is required' },
        { status: 401 }
      );
    }

    const bonzai = new OpenAI({
      baseURL:
        process.env.BONZAI_BASE_URL ||
        'https://api.bonzai.iodigital.com/universal',
      apiKey: 'placeholder',
      defaultHeaders: {
        'api-key': apiKey,
      },
    });

    // Test with a simple completion using the specified model
    const completion = await bonzai.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'user',
          content: 'Test',
        },
      ],
      max_tokens: 1,
    });

    return NextResponse.json({
      status: 'connected',
      model: completion.model,
      usage: completion.usage,
      testedModel: model,
    });
  } catch (error) {
    console.error('Connection test failed:', error);

    // Check if it's a model-specific error
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    const isModelError =
      errorMessage.toLowerCase().includes('model') ||
      errorMessage.toLowerCase().includes('not found') ||
      errorMessage.toLowerCase().includes('invalid');

    const url = new URL(request.url);
    return NextResponse.json(
      {
        status: 'error',
        error: errorMessage,
        isModelError,
        testedModel: url.searchParams.get('model') || 'o3-mini',
      },
      { status: 500 }
    );
  }
}
