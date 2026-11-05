interface EventContext {
  request: Request;
  env?: Record<string, any>;
}

export const onRequestPost = async (context: EventContext): Promise<Response> => {
  try {
    const body = await context.request.json() as {
      nickname?: string;
      message?: string;
    };

    const nickname = body.nickname?.trim();
    const message = body.message?.trim();

    if (!nickname || !message) {
      return new Response(
        JSON.stringify({ error: 'ニックネームとお問い合わせ内容を入力してください。' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // mopmatsu@gmail.com is strictly server-side and never exposed to the client
    const targetEmail = 'mopmatsu@gmail.com';

    const forwardRes = await fetch(`https://formsubmit.co/ajax/${targetEmail}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(4000),
      body: JSON.stringify({
        name: nickname,
        message: message,
        _subject: `【ベースボールリーグWeb】お問い合わせ: ${nickname}`,
        _template: 'table',
        _captcha: 'false',
      }),
    });

    if (!forwardRes.ok) {
      const errText = await forwardRes.text();
      console.error('Email delivery error:', errText);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Contact function error:', err);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
