export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method Not Allowed' });

  const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
  if (!scriptUrl) return res.status(500).json({ ok: false, error: 'Server configuration error' });

  try {
    const { name, course, institute, department, source, song } = req.body || {};

    if (!name || !course || !institute || !source || !song) {
      return res.status(400).json({ ok: false, error: 'Не все обязательные поля заполнены' });
    }

    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, course, institute, department, source, song }),
      redirect: 'follow',
    });

    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || 'Ошибка записи базы данных');

    return res.status(200).json({ ok: true, ticketNumber: data.ticketNumber });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}
