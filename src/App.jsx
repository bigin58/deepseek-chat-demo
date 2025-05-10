import { useState } from 'react';
import { ApolloClient, InMemoryCache, ApolloProvider, gql, useMutation } from '@apollo/client';

// 创建Apollo客户端连接到Cloudflare Worker
const client = new ApolloClient({
  uri: 'https://deepseek-api-worker.bigbin0508.workers.dev/graphql',
  cache: new InMemoryCache(),
});

// GraphQL mutation
const ASK_DEEPSEEK = gql`
  mutation AskDeepSeek($prompt: String!) {
    askDeepSeek(prompt: $prompt) {
      response
    }
  }
`;

function DeepSeekChat() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const [askDeepSeek] = useMutation(ASK_DEEPSEEK, {
    onCompleted: (data) => {
      setResponse(data.askDeepSeek.response);
      setLoading(false);
    },
    onError: (error) => {
      console.error('Error querying DeepSeek:', error);
      setResponse('出错了，请稍后再试');
      setLoading(false);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    setLoading(true);
    askDeepSeek({ variables: { prompt } });
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-center">DeepSeek AI 助手</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <textarea
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="4"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="请输入您的问题..."
            disabled={loading}
          />
        </div>
        
        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
          disabled={loading || !prompt.trim()}
        >
          {loading ? '处理中...' : '发送'}
        </button>
      </form>
      
      {response && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h2 className="text-lg font-semibold mb-2">DeepSeek 回复:</h2>
          <div className="whitespace-pre-wrap">{response}</div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ApolloProvider client={client}>
      <div className="min-h-screen bg-gray-100 py-8">
        <DeepSeekChat />
      </div>
    </ApolloProvider>
  );
}