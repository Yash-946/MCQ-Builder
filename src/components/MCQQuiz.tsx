'use client';

import { useState } from 'react';
import { streamObject } from 'ai';
import ApiKeySettings from './ApiKeySettings';


interface MCQ {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface MCQResponse {
  questions: MCQ[];
}

interface UserAnswer {
  questionIndex: number;
  selectedOption: number;
}

export default function MCQQuiz() {
  const [prompt, setPrompt] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  const [aiModel, setAiModel] = useState('openai');
  const [difficulty, setDifficulty] = useState('medium');
  const [questions, setQuestions] = useState<MCQ[]>([]);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamingQuestions, setStreamingQuestions] = useState<MCQ[]>([]);
  const [error, setError] = useState('');
  const [apiKeys, setApiKeys] = useState({ openai: '', awsAccessKeyId: '', awsSecretAccessKey: '', awsRegion: 'us-east-1' });

  const generateMCQs = async () => {
    if (!prompt.trim()) {
      setError('Please enter a topic or prompt');
      return;
    }

    // Check if API key is available for selected model
    if (aiModel === 'openai') {
      if (!apiKeys.openai) {
        setError('Please configure your OpenAI API key in settings');
        return;
      }
    } else if (aiModel === 'claude') {
      if (!apiKeys.awsAccessKeyId || !apiKeys.awsSecretAccessKey || !apiKeys.awsRegion) {
        setError('Please configure all AWS credentials (Access Key ID, Secret Access Key, and Region) in settings');
        return;
      }
    }

    setLoading(true);
    setError('');
    setQuestions([]);
    setUserAnswers([]);
    setShowResults(false);

    try {
      const response = await fetch('/api/generate-mcq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt, 
          questionCount, 
          aiModel, 
          difficulty,
          apiKey: aiModel === 'openai' ? apiKeys.openai : undefined,
          awsAccessKeyId: aiModel === 'claude' ? apiKeys.awsAccessKeyId : undefined,
          awsSecretAccessKey: aiModel === 'claude' ? apiKeys.awsSecretAccessKey : undefined,
          awsRegion: aiModel === 'claude' ? apiKeys.awsRegion : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate MCQs');
      }

      const data: MCQResponse = await response.json();
      setQuestions(data.questions);
    } catch (err) {
      setError('Failed to generate MCQs. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateMCQsStreaming = async () => {
    if (!prompt.trim()) {
      setError('Please enter a topic or prompt');
      return;
    }

    // Check if API key is available for selected model
    if (aiModel === 'openai') {
      if (!apiKeys.openai) {
        setError('Please configure your OpenAI API key in settings');
        return;
      }
    } else if (aiModel === 'claude') {
      if (!apiKeys.awsAccessKeyId || !apiKeys.awsSecretAccessKey || !apiKeys.awsRegion) {
        setError('Please configure all AWS credentials (Access Key ID, Secret Access Key, and Region) in settings');
        return;
      }
    }

    setStreaming(true);
    setError('');
    setQuestions([]);
    setStreamingQuestions([]);
    setUserAnswers([]);
    setShowResults(false);

    try {
      const response = await fetch('/api/generate-mcq-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt, 
          questionCount, 
          aiModel, 
          difficulty,
          apiKey: aiModel === 'openai' ? apiKeys.openai : undefined,
          awsAccessKeyId: aiModel === 'claude' ? apiKeys.awsAccessKeyId : undefined,
          awsSecretAccessKey: aiModel === 'claude' ? apiKeys.awsSecretAccessKey : undefined,
          awsRegion: aiModel === 'claude' ? apiKeys.awsRegion : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate MCQs');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      const receivedQuestions: MCQ[] = [];

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.question) {
                  receivedQuestions.push(data.question);
                  // if(streaming) {
                    setStreaming(false);
                  // }
                  console.log('Received question:', data.question);
                  console.log('Total streaming questions:', receivedQuestions.length);
                  setStreamingQuestions([...receivedQuestions]);
                  
                } else if (data.complete) {
                  console.log('Streaming complete, total questions:', receivedQuestions.length);
                  setQuestions([...receivedQuestions]);
                  setStreamingQuestions([]);
                  break;
                } else if (data.error) {
                  throw new Error(data.error);
                }
              } catch (e) {
                console.warn('Failed to parse streaming data:', line);
              }
            }
          }
        }
      }
      
    } catch (err) {
      setError('Failed to generate MCQs. Please try again.');
      console.error(err);
      setStreamingQuestions([]);
    } finally {
      // setStreaming(false);
    }
  };

  const handleAnswerSelect = (questionIndex: number, selectedOption: number) => {
    if (showResults) return; // Prevent changes after submission

    setUserAnswers(prev => {
      const existing = prev.find(a => a.questionIndex === questionIndex);
      if (existing) {
        return prev.map(a => 
          a.questionIndex === questionIndex 
            ? { ...a, selectedOption }
            : a
        );
      } else {
        return [...prev, { questionIndex, selectedOption }];
      }
    });
  };

  console.log('Streaming questions:', streamingQuestions);
  console.log('Streaming:', streaming);

  const submitAnswers = () => {
    if (userAnswers.length < questions.length) {
      setError('Please answer all questions before submitting');
      return;
    }
    setShowResults(true);
    setError('');
  };

  const resetQuiz = () => {
    setPrompt('');
    setQuestions([]);
    setStreamingQuestions([]);
    setUserAnswers([]);
    setShowResults(false);
    setLoading(false);
    setStreaming(false);
    setError('');
  };

  const calculateScore = () => {
    let correct = 0;
    userAnswers.forEach(answer => {
      if (questions[answer.questionIndex]?.correctAnswer === answer.selectedOption) {
        correct++;
      }
    });
    return correct;
  };

  const getScoreColor = (score: number) => {
    const percentage = (score / questions.length) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">MCQ Quiz Builder</h1>
        <p className="text-gray-600">Enter a topic and get 10 multiple choice questions</p>
      </div>

      {/* API Key Settings */}
      <ApiKeySettings onKeysUpdate={setApiKeys} />

      {/* Prompt Input Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
              Enter Topic or Prompt
            </label>
            <input
              id="prompt"
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., JavaScript fundamentals, World War 2, Photosynthesis..."
              className="text-black w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="questionCount" className="block text-sm font-medium text-gray-700 mb-2">
                Number of Questions
              </label>
              <select
                id="questionCount"
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="text-black w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                disabled={loading}
              >
                <option value={2}>2 Questions</option>
                <option value={5}>5 Questions</option>
                <option value={10}>10 Questions</option>
                <option value={15}>15 Questions</option>
                <option value={20}>20 Questions</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="aiModel" className="block text-sm font-medium text-gray-700 mb-2">
                AI Model
              </label>
              <select
                id="aiModel"
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                className="text-black w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                disabled={loading}
              >
                <option value="openai">OpenAI</option>
                <option value="claude">Claude</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty Level
              </label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="text-black w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                disabled={loading}
              >
                <option value="easy">🟢 Easy</option>
                <option value="medium">🟡 Medium</option>
                <option value="hard">🔴 Hard</option>
              </select>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={generateMCQs}
              disabled={loading || streaming || !prompt.trim()}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Generating Questions...' : '⚡ Generate MCQs'}
            </button>
            
            <button
              onClick={generateMCQsStreaming}
              disabled={loading || streaming || !prompt.trim()}
              className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {streaming ? '🔄 Streaming...' : '🚀 Stream MCQs'}
            </button>
            
            {(questions.length > 0 || streamingQuestions.length > 0) && (
              <button
                onClick={resetQuiz}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Generating your questions...</p>
        </div>
      )}

      {/* Streaming State */}
      {streaming && (
        <div className="text-center py-8">
          <div className="inline-block animate-pulse rounded-full h-8 w-8 bg-green-600"></div>
          <p className="mt-2 text-gray-600">Streaming questions... ({streamingQuestions.length}/{questionCount})</p>
        </div>
      )}

      {/* Streaming Questions Display */}
      {streamingQuestions.length > 0 && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  🔄 Streaming: {prompt}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {streamingQuestions.length} Questions Generated • {difficulty === 'easy' ? '🟢 Easy' : difficulty === 'medium' ? '🟡 Medium' : '🔴 Hard'} Level • {aiModel === 'openai' ? 'OpenAI GPT-4o' : 'Claude 4 Sonnet'}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  DEBUG: Streaming questions array length: {streamingQuestions.length}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {streamingQuestions.map((question, questionIndex) => (
                <div key={questionIndex} className="border border-gray-200 rounded-lg p-4 animate-fadeIn">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    {questionIndex + 1}. {question.question}
                  </h3>

                  <div className="space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <div
                        key={optionIndex}
                        className="w-full text-left p-3 border border-gray-300 rounded-lg bg-gray-50"
                      >
                        <span className="font-medium mr-2">
                          {String.fromCharCode(65 + optionIndex)}.
                        </span>
                        {option}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Questions Section */}
      {questions.length > 0 && !loading && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Quiz: {prompt}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {questions.length} Questions{questions.length !== questionCount ? ` (requested ${questionCount})` : ''} • {difficulty === 'easy' ? '🟢 Easy' : difficulty === 'medium' ? '🟡 Medium' : '🔴 Hard'} Level • {aiModel === 'openai' ? 'OpenAI GPT-4o' : 'Claude 4 Sonnet'}
                </p>
              </div>
              {!showResults && (
                <button
                  onClick={submitAnswers}
                  disabled={userAnswers.length < questions.length}
                  className="bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Submit Answers ({userAnswers.length}/{questions.length})
                </button>
              )}
            </div>

            {showResults && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-xl font-bold mb-2">Quiz Results</h3>
                <p className={`text-2xl font-bold ${getScoreColor(calculateScore())}`}>
                  Score: {calculateScore()}/{questions.length} ({Math.round((calculateScore() / questions.length) * 100)}%)
                </p>
              </div>
            )}

            <div className="space-y-6">
              {questions.map((question, questionIndex) => {
                const userAnswer = userAnswers.find(a => a.questionIndex === questionIndex);
                const isCorrect = userAnswer?.selectedOption === question.correctAnswer;

                return (
                  <div key={questionIndex} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      {questionIndex + 1}. {question.question}
                    </h3>

                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => {
                        const isSelected = userAnswer?.selectedOption === optionIndex;
                        const isCorrectOption = optionIndex === question.correctAnswer;
                        
                        let buttonClass = "text-black w-full text-left p-3 border rounded-lg transition-colors ";
                        
                        if (showResults) {
                          if (isCorrectOption) {
                            buttonClass += "bg-green-100 border-green-500 text-green-800";
                          } else if (isSelected && !isCorrect) {
                            buttonClass += "bg-red-100 border-red-500 text-red-800";
                          } else {
                            buttonClass += "bg-gray-50 border-gray-300 text-gray-600";
                          }
                        } else {
                          if (isSelected) {
                            buttonClass += "bg-blue-100 border-blue-500 text-blue-800";
                          } else {
                            buttonClass += "border-gray-300 hover:bg-gray-50";
                          }
                        }

                        return (
                          <button
                            key={optionIndex}
                            onClick={() => handleAnswerSelect(questionIndex, optionIndex)}
                            disabled={showResults}
                            className={buttonClass}
                          >
                            <span className="font-medium mr-2">
                              {String.fromCharCode(65 + optionIndex)}.
                            </span>
                            {option}
                            {showResults && isCorrectOption && (
                              <span className="ml-2 text-green-600">✓</span>
                            )}
                            {showResults && isSelected && !isCorrect && (
                              <span className="ml-2 text-red-600">✗</span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {showResults && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Explanation:</strong> {question.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Submit Button at the end */}
            {!showResults && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={submitAnswers}
                  disabled={userAnswers.length < questions.length}
                  className="bg-green-600 text-white py-3 px-8 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-lg"
                >
                  Submit Answers ({userAnswers.length}/{questions.length})
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
