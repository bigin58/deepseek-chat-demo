// worker.js
import { Router } from 'itty-router';
import { createHandler } from 'graphql-http';
import { buildSchema } from 'graphql';

// 定义GraphQL Schema
const schema = buildSchema(`
  type Query {
    hello: String
  }
  
  type DeepSeekResponse {
    response: String!
  }
  
  type Mutation {
    askDeepSeek(prompt: String!): DeepSeekResponse!
  }
`);

// GraphQL解析器
const resolvers = {
  hello: () => 'Hello, World!',
  askDeepSeek: async ({ prompt }) => {
    try {
      // 调用DeepSeek API
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`, // 从环境变量获取
        },
        body: JSON.stringify({
          model: 'deepseek-chat', // 替换为适当的模型名称
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 1000
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepSeek API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      return { response: data.choices[0].message.content };
    } catch (error) {
      console.error('Error calling DeepSeek API:', error);
      throw new Error('Failed to get response from DeepSeek');
    }
  }
};

// 创建路由
const router = Router();

// GraphQL 端点
router.all('/graphql', request => {
  return createHandler({
    schema,
    rootValue: resolvers,
    context: request,
    graphiql: true // 开发环境中启用GraphiQL
  })(request);
});

// 处理CORS
router.options('*', () => new Response(null, {
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  },
}));

// 默认路由
router.all('*', () => new Response('Not Found', { status: 404 }));

// Worker入口点
addEventListener('fetch', event => {
  const request = event.request;

  // 处理CORS预检请求
  if (request.method === 'OPTIONS') {
    return event.respondWith(
      new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      })
    );
  }

  // 处理常规请求
  event.respondWith(
    router.handle(request)
      .then(response => {
        // 添加CORS头
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: {
            ...Object.fromEntries(response.headers),
            'Access-Control-Allow-Origin': '*',
          },
        });
      })
      .catch(error => {
        console.error('Worker error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      })
  );
});