import { Router, type Request, type Response } from 'express';

const router = Router();

router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { prompt, style, size } = req.body;
    const apiKey = req.headers['x-stability-key'] as string;

    if (!apiKey) {
      res.status(400).json({ error: '缺少 Stability AI API Key' });
      return;
    }

    const stylePrompts: Record<string, string> = {
      photorealistic: ', photorealistic, highly detailed, 8k resolution',
      anime: ', anime style, manga art, vibrant colors',
      'digital-art': ', digital art, concept art, detailed illustration',
      'oil-painting': ', oil painting, textured brushstrokes, masterpiece',
      '3d-render': ', 3d render, octane render, cinematic lighting',
      'pixel-art': ', pixel art, 16-bit style, retro gaming aesthetic',
    };

    const fullPrompt = prompt + (stylePrompts[style] || '');

    const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
      body: JSON.stringify({
        text_prompts: [{ text: fullPrompt, weight: 1 }],
        cfg_scale: 7,
        height: parseInt(size?.split('x')[1] || '1024'),
        width: parseInt(size?.split('x')[0] || '1024'),
        samples: 1,
        steps: 30,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      res.status(response.status).json({ error: err });
      return;
    }

    const data = await response.json();
    const images = data.artifacts.map((a: { base64: string }) => ({
      url: `data:image/png;base64,${a.base64}`,
    }));

    res.json({ images });
  } catch (error) {
    console.error('Image error:', error);
    res.status(500).json({ error: '图像生成失败' });
  }
});

export default router;