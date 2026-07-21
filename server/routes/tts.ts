import { Router, type Request, type Response } from 'express';

const router = Router();

router.post('/synthesize', async (req: Request, res: Response) => {
  try {
    const { text, voiceId } = req.body;
    const apiKey = req.headers['x-elevenlabs-key'] as string;

    if (!apiKey) {
      res.status(400).json({ error: '缺少 ElevenLabs API Key' });
      return;
    }

    const vid = voiceId || '21m00Tcm4TlvDq8ikWAM';

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${vid}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      res.status(response.status).json({ error: err });
      return;
    }

    const audioBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(audioBuffer));
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ error: '语音合成失败' });
  }
});

export default router;