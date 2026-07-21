import express from 'express';
import cors from 'cors';
import chatRoutes from './routes/chat.js';
import imageRoutes from './routes/image.js';
import ttsRoutes from './routes/tts.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/chat', chatRoutes);
app.use('/api/image', imageRoutes);
app.use('/api/tts', ttsRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Layra AI Server is running' });
});

app.listen(PORT, () => {
  console.log(`Layra AI Server running on port ${PORT}`);
});