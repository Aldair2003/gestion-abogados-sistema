import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// URL del logo (usando una URL pública de Imgur)
const LOGO_URL = 'https://i.imgur.com/llPgRfz.png';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verificar conexión
const verifyConnection = async () => {
  try {
    await transporter.verify();
    console.log('Conexión SMTP establecida correctamente');
  } catch (error) {
    console.error('Error en la conexión SMTP:', error);
  }
};

verifyConnection();

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const mailOptions = {
      from: {
        name: 'M&V Abogados',
        address: process.env.EMAIL_USER || ''
      },
      to: options.to,
      subject: options.subject,
      html: options.html
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error al enviar email:', error);
    throw new Error('Error al enviar email');
  }
};

export const sendPasswordResetEmail = async (email: string, resetToken: string): Promise<void> => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  const content = `
    <table role="presentation" style="width:100%;border-collapse:collapse;border:0;border-spacing:0;background:#ffffff;margin:0 auto;max-width:600px;">
      <tr>
        <td style="padding:30px;background:#f6f9fc;">
          <table role="presentation" style="width:100%;border-collapse:collapse;border:0;border-spacing:0;">
            <tr>
              <td style="padding:30px;background:#ffffff;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="margin:0 0 20px 0;color:#2d3748;">Recuperación de Contraseña</h2>
                <p style="margin:0 0 12px 0;font-size:16px;line-height:24px;color:#4a5568;">Has solicitado restablecer tu contraseña.</p>
                <p style="margin:0 0 12px 0;font-size:16px;line-height:24px;color:#4a5568;">Haz click en el siguiente enlace para crear una nueva contraseña:</p>
                <p style="margin:0 0 25px 0;text-align:center;">
                  <a href="${resetUrl}" style="display:inline-block;background:#4CAF50;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:5px;font-weight:bold;">
                    Restablecer Contraseña
                  </a>
                </p>
                <p style="margin:0;font-size:14px;line-height:20px;color:#718096;">Este enlace expirará en 1 hora.</p>
                <p style="margin:12px 0 0 0;font-size:14px;line-height:20px;color:#718096;">Si no solicitaste este cambio, ignora este mensaje.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
  
  await sendEmail({
    to: email,
    subject: 'Recuperación de Contraseña',
    html: content
  });
};

export const sendWelcomeEmail = async (email: string, temporalPassword: string): Promise<void> => {
  const loginUrl = process.env.FRONTEND_URL || 'https://gestion-abogados-sistema.vercel.app';
  const content = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
  <div style="background: #1a365d; padding: 20px; text-align: center;">
    <img src="${LOGO_URL}" 
         alt="M&V Abogados" 
         style="max-width: 300px; width: auto; height: auto; display: block; margin: 0 auto;"
         width="300">
  </div>

  <div style="padding: 30px;">
    <h1 style="color: #1a365d; font-size: 24px; margin: 0 0 20px; text-align: center;">¡Bienvenido al Sistema de M&V Abogados!</h1>
    
    <p style="color: #4a5568; font-size: 16px; margin: 0 0 20px;">Tu cuenta ha sido creada exitosamente. Aquí están tus credenciales:</p>
    
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; margin: 0 0 20px;">
      <p style="margin: 0 0 10px; font-size: 15px;"><strong>Email:</strong> ${email}</p>
      <p style="margin: 0; font-size: 15px;"><strong>Contraseña temporal:</strong> <span style="background: #edf2f7; padding: 2px 4px; border-radius: 3px;">${temporalPassword}</span></p>
    </div>
    
    <div style="background: #fff5f5; border-radius: 6px; padding: 12px; margin: 0 0 20px;">
      <p style="margin: 0; font-size: 14px; color: #c53030;">⚠️ <strong>Importante:</strong> Deberás cambiar esta contraseña en tu primer inicio de sesión.</p>
    </div>
    
    <div style="text-align: center; margin: 0 0 20px;">
      <a href="${loginUrl}/login" style="display: inline-block; background: #4299e1; color: white; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: bold;">Acceder al Sistema</a>
    </div>
    
    <div style="margin: 0 0 20px;">
      <h2 style="color: #1a365d; font-size: 18px; margin: 0 0 12px;">Próximos pasos:</h2>
      <ol style="margin: 0; padding: 0 0 0 20px; font-size: 14px; color: #4a5568;">
        <li style="margin-bottom: 8px;">Ingresa con las credenciales proporcionadas</li>
        <li style="margin-bottom: 8px;">Cambia tu contraseña temporal</li>
        <li style="margin-bottom: 8px;">Completa tu perfil profesional</li>
        <li style="margin-bottom: 8px;">Comienza a usar el sistema</li>
      </ol>
    </div>
  </div>

  <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center;">
    <p style="margin: 0; font-size: 13px; color: #718096;">M&V Abogados © 2024 | <a href="mailto:soporte@mvabogados.com" style="color: #4299e1; text-decoration: none;">soporte@mvabogados.com</a></p>
    <p style="margin: 5px 0 0; font-size: 13px; color: #718096;">¿Necesitas ayuda? <a href="tel:+593XXXXXXXXX" style="color: #4299e1; text-decoration: none;">+593 (XX) XXX-XXXX</a></p>
  </div>
</div>`;

  await sendEmail({
    to: email,
    subject: 'Bienvenido a M&V Abogados - Credenciales de Acceso',
    html: content
  });
};

export const sendPasswordChangeConfirmation = async (email: string): Promise<void> => {
  const content = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
  <div style="background: #1a365d; padding: 20px; text-align: center;">
    <img src="${LOGO_URL}" 
         alt="M&V Abogados" 
         style="max-width: 300px; width: auto; height: auto; display: block; margin: 0 auto;"
         width="300">
  </div>

  <div style="padding: 30px;">
    <h1 style="color: #1a365d; font-size: 24px; margin: 0 0 20px; text-align: center;">¡Contraseña Actualizada Exitosamente!</h1>
    
    <p style="color: #4a5568; font-size: 16px; margin: 0 0 20px;">La contraseña de tu cuenta ha sido actualizada correctamente. Aquí hay algunos detalles importantes:</p>
    
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; margin: 0 0 20px;">
      <p style="margin: 0 0 10px; font-size: 15px;"><strong>Email:</strong> ${email}</p>
      <p style="margin: 0; font-size: 15px;"><strong>Estado:</strong> <span style="background: #c6f6d5; color: #22543d; padding: 2px 8px; border-radius: 12px; font-size: 14px;">Actualizada ✓</span></p>
    </div>
    
    <div style="background: #fff5f5; border-radius: 6px; padding: 12px; margin: 0 0 20px;">
      <p style="margin: 0; font-size: 14px; color: #c53030;">⚠️ <strong>Importante:</strong> Si no realizaste este cambio, por favor contacta inmediatamente al soporte técnico.</p>
    </div>
    
    <div style="background: #f0fff4; border-radius: 6px; padding: 15px; margin: 0 0 20px;">
      <h2 style="color: #1a365d; font-size: 18px; margin: 0 0 12px;">Recomendaciones de Seguridad:</h2>
      <ul style="margin: 0; padding: 0 0 0 20px; font-size: 14px; color: #4a5568;">
        <li style="margin-bottom: 8px;">No compartas tu contraseña con nadie</li>
        <li style="margin-bottom: 8px;">Utiliza una contraseña única para cada servicio</li>
        <li style="margin-bottom: 8px;">Cambia tu contraseña regularmente</li>
      </ul>
    </div>
  </div>

  <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center;">
    <p style="margin: 0; font-size: 13px; color: #718096;">M&V Abogados © 2024 | <a href="mailto:soporte@mvabogados.com" style="color: #4299e1; text-decoration: none;">soporte@mvabogados.com</a></p>
    <p style="margin: 5px 0 0; font-size: 13px; color: #718096;">¿Necesitas ayuda? <a href="tel:+593XXXXXXXXX" style="color: #4299e1; text-decoration: none;">+593 (XX) XXX-XXXX</a></p>
  </div>
</div>`;

  await sendEmail({
    to: email,
    subject: 'Contraseña Actualizada Exitosamente - M&V Abogados',
    html: content
  });
};

export const sendProfileCompletionEmail = async (email: string, userData: {
  nombre: string;
  rol: string;
}): Promise<void> => {
  const content = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
  <div style="background: #1a365d; padding: 20px; text-align: center;">
    <img src="${LOGO_URL}" 
         alt="M&V Abogados" 
         style="max-width: 300px; width: auto; height: auto; display: block; margin: 0 auto;"
         width="300">
  </div>

  <div style="padding: 30px;">
    <h1 style="color: #1a365d; font-size: 24px; margin: 0 0 20px; text-align: center;">¡Bienvenido ${userData.nombre}!</h1>
    
    <p style="color: #4a5568; font-size: 16px; margin: 0 0 20px;">Tu perfil ha sido completado exitosamente. Ahora tienes acceso completo al Sistema de Gestión Legal.</p>
    
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; margin: 0 0 20px;">
      <p style="margin: 0 0 10px; font-size: 15px;"><strong>Nombre:</strong> ${userData.nombre}</p>
      <p style="margin: 0 0 10px; font-size: 15px;"><strong>Email:</strong> ${email}</p>
      <p style="margin: 0; font-size: 15px;"><strong>Rol:</strong> <span style="background: #ebf8ff; color: #2c5282; padding: 2px 8px; border-radius: 12px; font-size: 14px;">${userData.rol}</span></p>
    </div>
    
    <div style="background: #f0fff4; border-radius: 6px; padding: 15px; margin: 0 0 20px;">
      <h2 style="color: #1a365d; font-size: 18px; margin: 0 0 12px;">¿Qué puedes hacer ahora?</h2>
      <ul style="margin: 0; padding: 0 0 0 20px; font-size: 14px; color: #4a5568;">
        <li style="margin-bottom: 8px;">Acceder a todas las funcionalidades del sistema</li>
        <li style="margin-bottom: 8px;">Gestionar casos y expedientes</li>
        <li style="margin-bottom: 8px;">Colaborar con otros miembros del equipo</li>
        <li style="margin-bottom: 8px;">Visualizar reportes y estadísticas</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 0 0 20px;">
      <a href="${process.env.FRONTEND_URL}/dashboard" style="display: inline-block; background: #4299e1; color: white; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: bold;">Ir al Dashboard</a>
    </div>
  </div>

  <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center;">
    <p style="margin: 0; font-size: 13px; color: #718096;">M&V Abogados © 2024 | <a href="mailto:soporte@mvabogados.com" style="color: #4299e1; text-decoration: none;">soporte@mvabogados.com</a></p>
    <p style="margin: 5px 0 0; font-size: 13px; color: #718096;">¿Necesitas ayuda? <a href="tel:+593XXXXXXXXX" style="color: #4299e1; text-decoration: none;">+593 (XX) XXX-XXXX</a></p>
  </div>
</div>`;

  await sendEmail({
    to: email,
    subject: '¡Bienvenido a M&V Abogados - Perfil Completado!',
    html: content
  });
}; 