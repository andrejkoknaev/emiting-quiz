export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
  if (!scriptUrl) {
    return res.status(500).json({
      ok: false,
      error: 'Не задана переменная окружения GOOGLE_SCRIPT_URL',
    });
  }

  try {
    const { name, course, source, song } = req.body || {};

    if (!name?.trim() || !course?.trim() || !source?.trim() || !song?.trim()) {
      return res.status(400).json({
        ok: false,
        error: 'Заполни все поля перед отправкой',
      });
    }

    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, course, source, song }),
      redirect: 'follow',
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Ошибка записи в Google Таблицу');
    }

    return res.status(200).json({
      ok: true,
      ticketNumber: data.ticketNumber,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message || 'Внутренняя ошибка сервера',
    });
  }
}
