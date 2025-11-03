'use client';

import { useState, useEffect } from 'react';

interface ApiKeys {
  openai: string;
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
  awsRegion: string;
}

interface ApiKeySettingsProps {
  onKeysUpdate?: (keys: ApiKeys) => void;
}

export default function ApiKeySettings({ onKeysUpdate }: ApiKeySettingsProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    openai: '',
    awsAccessKeyId: '',
    awsSecretAccessKey: '',
    awsRegion: 'us-east-1',
  });
  const [showKeys, setShowKeys] = useState({
    openai: false,
    awsAccessKeyId: false,
    awsSecretAccessKey: false,
  });
  const [savedStatus, setSavedStatus] = useState('');

  // Load API keys from localStorage on component mount
  useEffect(() => {
    const savedKeys = localStorage.getItem('mcq_api_keys');
    if (savedKeys) {
      try {
        const parsedKeys = JSON.parse(savedKeys);
        setApiKeys(parsedKeys);
        onKeysUpdate?.(parsedKeys);
      } catch (error) {
        console.error('Failed to parse saved API keys:', error);
      }
    }
  }, []);

  const handleSaveKeys = () => {
    try {
      localStorage.setItem('mcq_api_keys', JSON.stringify(apiKeys));
      setSavedStatus('✅ API keys saved successfully!');
      onKeysUpdate?.(apiKeys);
      
      setTimeout(() => {
        setSavedStatus('');
      }, 3000);
    } catch (error) {
      setSavedStatus('❌ Failed to save API keys');
      console.error('Error saving API keys:', error);
    }
  };

  const handleClearKeys = () => {
    if (confirm('Are you sure you want to clear all saved API keys?')) {
      localStorage.removeItem('mcq_api_keys');
      setApiKeys({
        openai: '',
        awsAccessKeyId: '',
        awsSecretAccessKey: '',
        awsRegion: 'us-east-1',
      });
      setSavedStatus('🗑️ API keys cleared');
      onKeysUpdate?.({ openai: '', awsAccessKeyId: '', awsSecretAccessKey: '', awsRegion: 'us-east-1' });
      
      setTimeout(() => {
        setSavedStatus('');
      }, 3000);
    }
  };

  const hasAnySavedKey = apiKeys.openai || apiKeys.awsAccessKeyId || apiKeys.awsSecretAccessKey;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">🔑 API Key Settings</h2>
          <p className="text-sm text-gray-600">
            {hasAnySavedKey ? '✅ Keys configured' : '⚠️ No API keys configured'} • Keys are stored locally in your browser
          </p>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium text-gray-700"
        >
          {showSettings ? '▲ Hide' : '▼ Configure'}
        </button>
      </div>

      {showSettings && (
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Your API keys are stored only in your browser's local storage and are never sent to our servers. 
              They are sent directly to the AI providers' APIs.
            </p>
          </div>

          {/* OpenAI API Key */}
          <div>
            <label htmlFor="openai-key" className="block text-sm font-medium text-gray-700 mb-2">
              OpenAI API Key
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  id="openai-key"
                  type={showKeys.openai ? 'text' : 'password'}
                  value={apiKeys.openai}
                  onChange={(e) => setApiKeys({ ...apiKeys, openai: e.target.value })}
                  placeholder="sk-proj-..."
                  className="text-black w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowKeys({ ...showKeys, openai: !showKeys.openai })}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  title={showKeys.openai ? 'Hide key' : 'Show key'}
                >
                  {showKeys.openai ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">OpenAI Platform</a>
            </p>
          </div>

          {/* AWS Credentials for Claude/Bedrock */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h3 className="font-semibold text-gray-800 mb-3">AWS Bedrock Credentials (for Claude)</h3>
            
            {/* AWS Access Key ID */}
            <div className="mb-4">
              <label htmlFor="aws-access-key" className="block text-sm font-medium text-gray-700 mb-2">
                AWS Access Key ID
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    id="aws-access-key"
                    type={showKeys.awsAccessKeyId ? 'text' : 'password'}
                    value={apiKeys.awsAccessKeyId}
                    onChange={(e) => setApiKeys({ ...apiKeys, awsAccessKeyId: e.target.value })}
                    placeholder="AKIA..."
                    className="text-black w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeys({ ...showKeys, awsAccessKeyId: !showKeys.awsAccessKeyId })}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    title={showKeys.awsAccessKeyId ? 'Hide key' : 'Show key'}
                  >
                    {showKeys.awsAccessKeyId ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>
            </div>

            {/* AWS Secret Access Key */}
            <div className="mb-4">
              <label htmlFor="aws-secret-key" className="block text-sm font-medium text-gray-700 mb-2">
                AWS Secret Access Key
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    id="aws-secret-key"
                    type={showKeys.awsSecretAccessKey ? 'text' : 'password'}
                    value={apiKeys.awsSecretAccessKey}
                    onChange={(e) => setApiKeys({ ...apiKeys, awsSecretAccessKey: e.target.value })}
                    placeholder="wJalrXUtnFEMI/K7MDENG..."
                    className="text-black w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeys({ ...showKeys, awsSecretAccessKey: !showKeys.awsSecretAccessKey })}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    title={showKeys.awsSecretAccessKey ? 'Hide key' : 'Show key'}
                  >
                    {showKeys.awsSecretAccessKey ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>
            </div>

            {/* AWS Region */}
            <div>
              <label htmlFor="aws-region" className="block text-sm font-medium text-gray-700 mb-2">
                AWS Region
              </label>
              <input
                id="aws-region"
                type="text"
                value={apiKeys.awsRegion}
                onChange={(e) => setApiKeys({ ...apiKeys, awsRegion: e.target.value })}
                placeholder="us-east-1, ap-south-1, eu-west-1, etc."
                className="text-black w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter your AWS region code. Get AWS credentials from <a href="https://console.aws.amazon.com/iam/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">AWS IAM Console</a>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSaveKeys}
              className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              💾 Save API Keys
            </button>
            {hasAnySavedKey && (
              <button
                onClick={handleClearKeys}
                className="px-6 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
              >
                🗑️ Clear
              </button>
            )}
          </div>

          {/* Status Message */}
          {savedStatus && (
            <div className={`p-3 rounded-lg ${
              savedStatus.includes('✅') ? 'bg-green-100 text-green-800' :
              savedStatus.includes('❌') ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {savedStatus}
            </div>
          )}

          {/* Instructions */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">📝 How to get API keys:</h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>
                <strong>OpenAI:</strong> Sign up at <a href="https://platform.openai.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">platform.openai.com</a>, 
                go to API Keys section, and create a new key.
              </li>
              <li>
                <strong>Claude (Bedrock):</strong> This app uses AWS Bedrock for Claude. You'll need AWS credentials with Bedrock access.
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to get API keys from localStorage
export function getStoredApiKeys(): ApiKeys {
  if (typeof window === 'undefined') {
    return { openai: '', awsAccessKeyId: '', awsSecretAccessKey: '', awsRegion: 'us-east-1' };
  }
  
  const savedKeys = localStorage.getItem('mcq_api_keys');
  if (savedKeys) {
    try {
      return JSON.parse(savedKeys);
    } catch (error) {
      console.error('Failed to parse stored API keys:', error);
      return { openai: '', awsAccessKeyId: '', awsSecretAccessKey: '', awsRegion: 'us-east-1' };
    }
  }
  return { openai: '', awsAccessKeyId: '', awsSecretAccessKey: '', awsRegion: 'us-east-1' };
}

