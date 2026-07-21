import { Router, type Request, type Response } from 'express';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { messages, character, model } = req.body;
    const apiKey = req.headers['x-openai-key'] as string;

    if (!apiKey) {
      res.status(400).json({ error: '缺少 OpenAI API Key' });
      return;
    }

    const systemMessage = {
      role: 'system',
      content: character?.systemPrompt || '你是一个友好的 AI 助手。请用中文回答。',
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'gpt-4o-mini',
        messages: [systemMessage, ...messages],
        stream: true,
        temperature: 0.8,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      res.status(response.status).json({ error: err });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = response.body?.getReader();
    if (!reader) {
      res.status(500).json({ error: '无法读取流' });
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    const pump = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            res.write('data: [DONE]\n\n');
            res.end();
            break;
          }
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;
            const data = trimmed.slice(6);
            if (data === '[DONE]') {
              res.write('data: [DONE]\n\n');
              res.end();
              return;
            }
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                res.write(`data: ${JSON.stringify({ content })}\n\n`);
              }
            } catch {}
          }
        }
      } catch {
        res.write('data: [DONE]\n\n');
        res.end();
      }
    };

    pump();
    req.on('close', () => reader.cancel().catch(() => {}));
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

export default router;