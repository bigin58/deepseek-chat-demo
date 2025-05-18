import { useState } from 'react';
import { ApolloClient, InMemoryCache, ApolloProvider, gql, useQuery, } from '@apollo/client';
// 创建Apollo客户端
const client = new ApolloClient({
  uri: 'https://deepseek-api-worker.bigbin0508.workers.dev',
  cache: new InMemoryCache(),
});

// GraphQL查询
const ASK_DEEPSEEK = gql`
      query AskDeepSeek($prompt: String!) {
        askDeepSeek(prompt: $prompt)
      }
    `;

//  DeepSeek查询组件
function DeepSeekQuery() {
  const [prompt, setPrompt] = useState('');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const { refetch } = useQuery(ASK_DEEPSEEK, {
    variables: { prompt },
    skip: true,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setData({});
    setLoading(true);
    try {
      const { data, loading, error } = await refetch({ prompt });
      if (error) {
        console.error(error);
        setLoading(false);
      } else {
        setLoading(loading);
        setData(data);
      }
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
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

      {data && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h2 className="text-lg font-semibold mb-2">DeepSeek 回复:</h2>
          <div className="whitespace-pre-wrap max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-gray-200 scrollbar-thumb-rounded">{data.askDeepSeek}</div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ApolloProvider client={client}>
      <div className="min-h-screen bg-gray-100 py-8">
        <DeepSeekQuery />
      </div>
    </ApolloProvider>
  );
}