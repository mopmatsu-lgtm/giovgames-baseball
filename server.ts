import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

async function startServer() {
  const app = express();
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Contact API route: mopmatsu@gmail.com is strictly server-side
  app.post('/api/contact', async (req, res) => {
    const { nickname, message } = req.body || {};
    const cleanNick = nickname?.trim();
    const cleanMsg = message?.trim();

    if (!cleanNick || !cleanMsg) {
      return res.status(400).json({ error: 'ニックネームとお問い合わせ内容を入力してください。' });
    }

    try {
      const targetEmail = 'mopmatsu@gmail.com';
      await fetch(`https://formsubmit.co/ajax/${targetEmail}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(3500),
        body: JSON.stringify({
          name: cleanNick,
          message: cleanMsg,
          _subject: `【ベースボールリーグWeb】お問い合わせ: ${cleanNick}`,
          _template: 'table',
          _captcha: 'false',
        }),
      });
    } catch (err) {
      console.log('[Server Contact Form]', cleanNick, cleanMsg);
    }

    return res.json({ success: true, message: 'お問い合わせを受け付けました。' });
  });

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
