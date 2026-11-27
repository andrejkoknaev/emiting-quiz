const UPSTREAM_TIMEOUT_MS = 9000;
const MAX_FIELD_LENGTH = 160;

function sanitizeString(value) {
  if (typeof value !== 'string' && typeof value !== 'number') return '';
  return String(value).trim().slice(0, MAX_FIELD_LENGTH);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
  if (!scriptUrl) {
    return res.status(500).json({ ok: false, error: 'Ошибка конфигурации сервера' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ ok: false, error: 'Некорректный формат данных' });
    }
  }

  if (!body || typeof body !== 'object') {
    return res.status(400).json({ ok: false, error: 'Пустое тело запроса' });
  }

  const name = sanitizeString(body.name);
  const course = sanitizeString(body.course);
  const institute = sanitizeString(body.institute);
  const department = institute === 'ЭМИТ' ? sanitizeString(body.department) : '';
  const source = sanitizeString(body.source);
  const song = sanitizeString(body.song);

  if (
    name.replace(/\s+/g, '').length < 3 ||
    !course ||
    !institute ||
    (institute === 'ЭМИТ' && !department) ||
    source.length < 2 ||
    song.length < 2
  ) {
    return res.status(400).json({ ok: false, error: 'Не все обязательные поля заполнены' });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, course, institute, department, source, song }),
      redirect: 'follow',
      signal: controller.signal,
    });

    const rawText = await response.text();
    let data = null;

    try {
      data = rawText ? JSON.parse(rawText) : null;
    } catch {
      return res.status(502).json({ ok: false, error: 'Некорректный ответ базы данных' });
    }

    if (!response.ok || !data || !data.ok) {
      return res.status(502).json({
        ok: false,
        error: data?.error || 'Ошибка записи в базу данных',
      });
    }

    if (
      data.ticketNumber === undefined ||
      data.ticketNumber === null ||
      String(data.ticketNumber).trim() === ''
    ) {
      return res.status(502).json({ ok: false, error: 'Сервер не вернул номер билета' });
    }

    return res.status(200).json({ ok: true, ticketNumber: data.ticketNumber });
  } catch (error) {
    if (error?.name === 'AbortError') {
      return res.status(504).json({ ok: false, error: 'Превышено время ожидания сервера' });
    }
    console.error('Submit API error:', error);
    return res.status(500).json({ ok: false, error: 'Ошибка соединения с базой данных' });
  } finally {
    clearTimeout(timeoutId);
  }
}
