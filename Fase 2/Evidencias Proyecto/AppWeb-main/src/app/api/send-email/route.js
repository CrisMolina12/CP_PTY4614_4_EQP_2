import { Resend } from 'resend';

const resend = new Resend('re_QgFM1Ckg_NFjofpSa8ghyixjWC59W4zbW');

export async function POST(request) {
  const { email } = await request.json();

  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',  // Cambia esto a tu correo
      to: email,
      subject: 'Recuperación de contraseña',
      text: `Haz clic en el siguiente enlace para recuperar tu contraseña: ${process.env.NEXT_PUBLIC_APP_URL}/reset`,
    });
    return new Response('Correo enviado', { status: 200 });
  } catch (error) {
    console.error('Error al enviar el correo:', error);
    return new Response('Error al enviar el correo', { status: 500 });
  }
}
