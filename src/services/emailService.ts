import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resendFrom =
  process.env.RESEND_FROM || "PastaPet <suporte@pastapet.com.br>";

const resend = resendApiKey ? new Resend(resendApiKey) : null;

const buildVerificationHtml = (verificationLink: string, fullName?: string) => {
  const safeName = fullName ? fullName : "";
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f9fafb;padding:0;margin:0;">
      <div style="background:#0adb6c;color:#034924;text-align:center;padding:16px 0;font-weight:700;font-size:18px;letter-spacing:0.4px;">
        Pasta Pet
      </div>
      <div style="max-width:480px;margin:32px auto;background:#ffffff;padding:32px;border-radius:8px;text-align:center;">
        <h2 style="color:#034924;font-size:24px;font-weight:600;margin:0 0 12px;">Olá${
          safeName ? `, ${safeName}` : ""
        }! 👋</h2>
        <p style="color:#034924;font-size:14px;line-height:22px;margin:0 0 16px;">
          Obrigado por se cadastrar no <strong>PastaPet</strong>. Por favor confirme seu endereço de e-mail para ativar sua conta.
        </p>
        <a href="${verificationLink}" style="display:inline-block;background:#0adb6c;color:#034924;padding:12px 18px;border-radius:6px;text-align:center;text-decoration:none;font-weight:600;margin:24px 0;">
          Verificar e-mail
        </a>
        <p style="color:#034924;font-size:14px;line-height:22px;margin:0 0 16px;">
          Se o botão não funcionar, copie e cole este link no seu navegador:
        </p>
        <a href="${verificationLink}" style="color:#2563eb;font-size:13px;word-break:break-all;">
          ${verificationLink}
        </a>
        <hr style="border:1px solid #e5e7eb;margin:32px 0;" />
        <p style="color:#6b7280;font-size:12px;line-height:18px;margin:0;">
          Este link expira em <strong>24 horas</strong>.<br />
          Precisa de ajuda? Fale com a gente: <a href="mailto:suporte@pastapet.com.br" style="color:#6b7280;text-decoration:underline;">suporte@pastapet.com.br</a>
        </p>
      </div>
    </div>
  `;
};

export const sendVerificationEmail = async (
  to: string,
  verificationLink: string,
  fullName?: string
) => {
  if (!resend) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const { error } = await resend.emails.send({
    from: resendFrom,
    to: [to],
    subject: "Pasta Pet - Verificação sua conta",
    html: buildVerificationHtml(verificationLink, fullName),
  });

  if (error) {
    throw error;
  }
};

const buildResetPasswordHtml = (resetLink: string, fullName?: string) => {
  const safeName = fullName ? fullName : "";
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f9fafb;padding:0;margin:0;">
      <div style="background:#0adb6c;color:#034924;text-align:center;padding:16px 0;font-weight:700;font-size:18px;letter-spacing:0.4px;">
        Pasta Pet
      </div>
      <div style="max-width:480px;margin:32px auto;background:#ffffff;padding:32px;border-radius:8px;text-align:center;">
        <h2 style="color:#034924;font-size:24px;font-weight:600;margin:0 0 12px;">Olá${
          safeName ? `, ${safeName}` : ""
        }! 👋</h2>
        <p style="color:#034924;font-size:14px;line-height:22px;margin:0 0 16px;">
          Recebemos um pedido para redefinir sua senha no <strong>PastaPet</strong>.
        </p>
        <p style="color:#034924;font-size:14px;line-height:22px;margin:0 0 16px;">
          Clique no botão abaixo para criar uma nova senha. O link expira em <strong>1 hora</strong>.
        </p>
        <a href="${resetLink}" style="display:inline-block;background:#0adb6c;color:#034924;padding:12px 18px;border-radius:6px;text-align:center;text-decoration:none;font-weight:600;margin:24px 0;">
          Redefinir senha
        </a>
        <p style="color:#034924;font-size:14px;line-height:22px;margin:0 0 16px;">
          Se o botão não funcionar, copie e cole este link no seu navegador:
        </p>
        <a href="${resetLink}" style="color:#2563eb;font-size:13px;word-break:break-all;">
          ${resetLink}
        </a>
        <hr style="border:1px solid #e5e7eb;margin:32px 0;" />
        <p style="color:#6b7280;font-size:12px;line-height:18px;margin:0;">
          Se você não solicitou esta alteração, pode ignorar este e-mail.
          <br />
          Precisa de ajuda? <a href="mailto:suporte@pastapet.com.br" style="color:#6b7280;text-decoration:underline;">suporte@pastapet.com.br</a>
        </p>
      </div>
    </div>
  `;
};

export const sendResetPasswordEmail = async (
  to: string,
  resetLink: string,
  fullName?: string
) => {
  if (!resend) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const { error } = await resend.emails.send({
    from: resendFrom,
    to: [to],
    subject: "Pasta Pet - Redefinir senha",
    html: buildResetPasswordHtml(resetLink, fullName),
  });

  if (error) {
    throw error;
  }
};
