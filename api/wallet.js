/**
 * Vercel Serverless Function — /api/wallet
 * Genera un Apple Wallet pass via PassKit.com API
 *
 * Variables de entorno requeridas en Vercel:
 *   PASSKIT_API_KEY    → tu API Key de PassKit.com
 *   PASSKIT_API_SECRET → tu API Secret de PassKit.com
 *   PASSKIT_TEMPLATE   → nombre del template (ej: "san-miguel-desayuno")
 */

export default async function handler(req, res) {
  // Solo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    guestName,
    room,
    plan,
    checkin,
    checkout,
    company,
    qrCode,
    guestId,
  } = req.body;

  // Validación básica
  if (!guestName || !room || !qrCode) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  const apiKey    = process.env.PASSKIT_API_KEY;
  const apiSecret = process.env.PASSKIT_API_SECRET;
  const template  = process.env.PASSKIT_TEMPLATE || 'san-miguel-desayuno';

  if (!apiKey || !apiSecret) {
    return res.status(500).json({ error: 'Credenciales PassKit no configuradas' });
  }

  // Credenciales en Base64 para Basic Auth
  const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

  try {
    const response = await fetch(
      `https://api.passkit.com/v1/pass/issue/template/${template}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type':  'application/json',
          'Accept':        'application/json',
        },
        body: JSON.stringify({
          // Barcode / QR del pase
          barcodes: [
            {
              format:          'PKBarcodeFormatQR',
              message:         qrCode,
              messageEncoding: 'iso-8859-1',
            },
          ],
          // Campos visibles en el pase
          pass: {
            headerFields: [
              { key: 'room', label: 'HABITACIÓN', value: room },
            ],
            primaryFields: [
              { key: 'guestName', label: 'HUÉSPED', value: guestName },
            ],
            secondaryFields: [
              { key: 'checkin',  label: 'CHECK-IN',  value: checkin  },
              { key: 'checkout', label: 'CHECK-OUT', value: checkout },
            ],
            auxiliaryFields: [
              { key: 'plan',    label: 'PLAN',    value: plan === 'BB' ? 'Desayuno incluido' : 'Solo alojamiento' },
              { key: 'company', label: 'EMPRESA', value: company || '—' },
            ],
            backFields: [
              { key: 'instructions', label: 'INSTRUCCIONES', value: 'Presente este pase al llegar al restaurante. Válido una vez por día. No acumulable.' },
              { key: 'guestId',      label: 'ID RESERVA',    value: guestId || qrCode },
              { key: 'hotel',        label: 'HOTEL',         value: 'San Miguel Hotel, Golf & Club · Maturín, Venezuela' },
            ],
          },
          // Metadata
          expiryDate: checkout,
        }),
      }
    );

    if (!response.ok) {
      const errBody = await response.text();
      console.error('PassKit error:', errBody);
      return res.status(response.status).json({ error: 'Error generando el pase', detail: errBody });
    }

    const data = await response.json();

    // PassKit devuelve la URL del pase y un serial
    return res.status(200).json({
      success:    true,
      passUrl:    data.url,           // URL para descargar/abrir en Wallet
      serial:     data.serialNumber,
      appleUrl:   data.url,           // En iPhone abre directamente en Wallet
      googleUrl:  data.googlePayUrl,  // URL para Google Wallet (si el template lo soporta)
    });

  } catch (err) {
    console.error('Error en /api/wallet:', err);
    return res.status(500).json({ error: 'Error interno del servidor', detail: err.message });
  }
}
