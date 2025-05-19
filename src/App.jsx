import { useState, useEffect } from 'react';
import { MastraClient } from "@mastra/client-js";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import React from 'react';

//  DeepSeek查询组件
function DeepSeekQuery() {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([]); // [{role: 'user'|'ai', content: string}]
  const [loading, setLoading] = useState(false);

  const client = new MastraClient({
    baseUrl: "https://mastra.bigbin0508.workers.dev",
  });
  const agent = client.getAgent("codeReviewAgent");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    const userMsg = { role: 'user', content: prompt };
    setMessages((prev) => [...prev, userMsg]);
    setPrompt('');
    setLoading(true);
    try {
      const response = await agent.stream({
        messages: [userMsg],
      });
      let fullResponse = '';
      response.processDataStream({
        onTextPart: (text) => {
          fullResponse += text;
          // 实时更新最后一条AI消息
          setMessages((prev) => {
            if (prev[prev.length - 1]?.role === 'ai') {
              return [...prev.slice(0, -1), { role: 'ai', content: fullResponse }];
            } else {
              return [...prev, { role: 'ai', content: fullResponse }];
            }
          });
        },
        onFilePart: (file) => {
          console.log('Received file:', file);
        },
        onDataPart: (data) => {
          console.log('Received data:', data);
        },
        onErrorPart: (error) => {
          console.error('Stream error:', error);
          setMessages((prev) => [...prev, { role: 'ai', content: '发生错误，请稍后重试' }]);
        },
      });
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [...prev, { role: 'ai', content: '发生错误，请稍后重试' }]);
    } finally {
      setLoading(false);
    }
  };

  // 滚动到底部
  const messagesEndRef = React.useRef(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <div className="min-h-screen bg-[#18181b] flex flex-col items-center justify-center py-0">
      <div className="w-full max-w-2xl flex flex-col h-[90vh] bg-[#232329] rounded-2xl shadow-2xl border border-[#303030]/80 overflow-hidden">
        {/* 对话区 */}
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 custom-scrollbar bg-[#18181b]">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 mt-20">欢迎使用代码分析助手，请在下方输入您的问题</div>
          )}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-5 py-3 rounded-2xl shadow-md whitespace-pre-wrap break-words text-sm
                  ${msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : 'bg-[#232329] text-gray-100 border border-[#393944] rounded-bl-md'}
                `}
              >
                {msg.role === 'ai' ? (
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={vscDarkPlus}
                            language={match[1]}
                            PreTag="div"
                            customStyle={{
                              margin: '1em 0',
                              borderRadius: '0.5rem',
                              fontSize: '0.95rem',
                              background: '#232329',
                            }}
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className="bg-[#232329] px-1.5 py-0.5 rounded text-sm text-pink-400 font-mono" {...props}>
                            {children}
                          </code>
                        );
                      },
                      p: ({ children }) => <p className="mb-2 leading-relaxed text-gray-200">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc pl-6 mb-2 text-gray-200">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-6 mb-2 text-gray-200">{children}</ol>,
                      li: ({ children }) => <li className="mb-1 text-gray-200">{children}</li>,
                      h1: ({ children }) => <h1 className="text-xl font-bold mb-2 text-white">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-lg font-bold mb-2 text-white">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-base font-bold mb-1 text-white">{children}</h3>,
                      strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-gray-500 pl-4 italic my-2 text-gray-300 bg-[#232329] rounded">
                          {children}
                        </blockquote>
                      ),
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  <span>{msg.content}</span>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        {/* 输入区 */}
        <form
          onSubmit={handleSubmit}
          className="w-full bg-[#232329] border-t border-[#393944] p-4 flex items-end gap-2"
        >
          <textarea
            className="flex-1 min-h-[40px] max-h-32 p-3 bg-[#18181b] border border-[#393944] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 resize-none shadow-inner"
            rows={1}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="请输入您的问题..."
            disabled={loading}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button
            type="submit"
            className="py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed shadow"
            disabled={loading || !prompt.trim()}
          >
            {loading ? '处理中...' : '发送'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <DeepSeekQuery />
    </div>
  );
}