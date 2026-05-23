<?php

// Contact Form Mailer — Akash Bhardwaj Portfolio
session_start();

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require '../PHPMailer/src/Exception.php';
require '../PHPMailer/src/PHPMailer.php';
require '../PHPMailer/src/SMTP.php';

// ─── CORS / JSON headers ───────────────────────────────────────────────────
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// ─── Retrieve & sanitize POST data ────────────────────────────────────────
$name         = isset($_POST['name'])         ? trim($_POST['name'])         : '';
$email        = isset($_POST['email'])        ? trim($_POST['email'])        : '';
$project_type = isset($_POST['project_type']) ? trim($_POST['project_type']) : 'General Inquiry';
$message      = isset($_POST['message'])      ? trim($_POST['message'])      : '';

// ─── Validation ───────────────────────────────────────────────────────────
$errors = [];
if (empty($name) || strlen($name) < 3) {
    $errors[] = 'Please enter a valid name (at least 3 characters).';
}
if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Please enter a valid email address..';
}
if (empty($message) || strlen($message) < 10) {
    $errors[] = 'Please enter your message (at least 10 characters).';
}

if (!empty($errors)) {
    echo json_encode(['success' => false, 'message' => implode(' ', $errors)]);
    exit;
}

// ─── SMTP credentials (Gmail App Password) ────────────────────────────────
$smtp_host     = 'smtp.gmail.com';
$smtp_user     = 'akash1998bhardwaj@gmail.com';
$smtp_password = 'zlhohpyhocdkazhd';
$smtp_port     = 465;
$smtp_secure   = PHPMailer::ENCRYPTION_SMTPS;

// ─── Inline styles / color tokens ─────────────────────────────────────────
$accent      = '#00ffaa';
$dark        = '#0a0a0a';
$card_bg     = '#111111';
$border      = '#222222';
$text_light  = '#e8e8e8';
$text_muted  = '#999999';
$white       = '#ffffff';

// ─── SMTP helper ──────────────────────────────────────────────────────────
function buildMailer($smtp_host, $smtp_user, $smtp_password, $smtp_port, $smtp_secure): PHPMailer {
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->SMTPAuth   = true;
    $mail->Host       = $smtp_host;
    $mail->Username   = $smtp_user;
    $mail->Password   = $smtp_password;
    $mail->SMTPSecure = $smtp_secure;
    $mail->Port       = $smtp_port;
    $mail->CharSet    = 'UTF-8';
    $mail->isHTML(true);
    return $mail;
}

// ──────────────────────────────────────────────────────────────────────────
// EMAIL TEMPLATE HELPER
// ──────────────────────────────────────────────────────────────────────────
function buildEmailHtml(string $preheader, string $bodyContent): string {
    return '<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>' . htmlspecialchars($preheader) . '</title>
<!--[if mso]><style>body,table,td{font-family:Arial,sans-serif!important}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#0d0d0d;font-family:Arial,Helvetica,sans-serif;">

<!-- Outer wrapper -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#0d0d0d;padding:40px 0;">
<tr><td align="center">

  <!-- Main card -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background-color:#111111;border-radius:16px;overflow:hidden;border:1px solid #222222;">

    <!-- ── HEADER ── -->
    <tr>
      <td style="background:linear-gradient(135deg,#0a0a0a 0%,#141414 100%);padding:32px 40px;border-bottom:1px solid #1e1e1e;text-align:center;">
        <!-- Logo / brand mark -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td align="center">
              <!-- Monogram badge -->
              <div style="display:inline-block;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="background:linear-gradient(135deg,#00ffaa,#00ccff);border-radius:12px;padding:2px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="background:#0a0a0a;border-radius:11px;padding:14px 22px;text-align:center;">
                            <span style="font-family:Arial,sans-serif;font-size:26px;font-weight:900;letter-spacing:4px;color:#ffffff;">AB</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:16px;">
              <span style="font-family:Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#00ffaa;">AKASH BHARDWAJ</span>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:4px;">
              <span style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#666666;">Frontend Developer &amp; UI/UX Designer</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- ── ACCENT BAR ── -->
    <tr>
      <td style="height:3px;background:linear-gradient(90deg,#00ffaa,#00ccff,#a855f7);font-size:0;line-height:0;">&nbsp;</td>
    </tr>

    <!-- ── BODY ── -->
    ' . $bodyContent . '

    <!-- ── FOOTER ── -->
    <tr>
      <td style="background-color:#0a0a0a;padding:24px 40px;border-top:1px solid #1e1e1e;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td align="center" style="padding-bottom:12px;">
              <!-- Social links -->
              <a href="https://github.com/akash1998bhardwaj" style="display:inline-block;margin:0 6px;color:#555555;font-family:Arial,sans-serif;font-size:11px;letter-spacing:1px;text-decoration:none;text-transform:uppercase;">GitHub</a>
              <span style="color:#333333;">|</span>
              <a href="https://linkedin.com/in/akash1998bhardwaj" style="display:inline-block;margin:0 6px;color:#555555;font-family:Arial,sans-serif;font-size:11px;letter-spacing:1px;text-decoration:none;text-transform:uppercase;">LinkedIn</a>
              <span style="color:#333333;">|</span>
              <a href="mailto:akash1998bhardwaj@gmail.com" style="display:inline-block;margin:0 6px;color:#555555;font-family:Arial,sans-serif;font-size:11px;letter-spacing:1px;text-decoration:none;text-transform:uppercase;">Email</a>
            </td>
          </tr>
          <tr>
            <td align="center">
              <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:#333333;letter-spacing:0.5px;">&copy; 2026 Akash Bhardwaj. All Rights Reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

  </table>
  <!-- /Main card -->

</td></tr>
</table>
<!-- /Outer wrapper -->

</body>
</html>';
}

// ──────────────────────────────────────────────────────────────────────────
// 1. ADMIN EMAIL BODY
// ──────────────────────────────────────────────────────────────────────────
$adminBodyContent = '
    <tr>
      <td style="padding:40px 40px 8px;">
        <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#00ffaa;">NEW INQUIRY</p>
        <h1 style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:26px;font-weight:900;color:#ffffff;line-height:1.2;">New Contact Message</h1>
        <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:#666666;">Someone just reached out through your portfolio contact form.</p>
      </td>
    </tr>

    <!-- Sender details card -->
    <tr>
      <td style="padding:24px 40px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#161616;border-radius:12px;border:1px solid #222222;overflow:hidden;">
          <!-- Row: Name -->
          <tr>
            <td style="padding:16px 20px;border-bottom:1px solid #1e1e1e;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td width="120" style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#555555;">FROM</td>
                  <td style="font-family:Arial,sans-serif;font-size:14px;font-weight:600;color:#e8e8e8;">' . htmlspecialchars($name) . '</td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Row: Email -->
          <tr>
            <td style="padding:16px 20px;border-bottom:1px solid #1e1e1e;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td width="120" style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#555555;">EMAIL</td>
                  <td><a href="mailto:' . htmlspecialchars($email) . '" style="font-family:Arial,sans-serif;font-size:14px;color:#00ffaa;text-decoration:none;">' . htmlspecialchars($email) . '</a></td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Row: Project Type -->
          <tr>
            <td style="padding:16px 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td width="120" style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#555555;">PROJECT</td>
                  <td>
                    <span style="display:inline-block;background:linear-gradient(135deg,rgba(0,255,170,0.15),rgba(0,204,255,0.15));border:1px solid rgba(0,255,170,0.3);border-radius:6px;padding:4px 12px;font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:#00ffaa;">' . htmlspecialchars($project_type) . '</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Message -->
    <tr>
      <td style="padding:20px 40px 0;">
        <p style="margin:0 0 10px;font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#555555;">MESSAGE</p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#161616;border-radius:12px;border:1px solid #222222;border-left:3px solid #00ffaa;">
          <tr>
            <td style="padding:20px 24px;">
              <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:#cccccc;">' . nl2br(htmlspecialchars($message)) . '</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td style="padding:28px 40px 40px;text-align:center;">
        <a href="mailto:' . htmlspecialchars($email) . '?subject=Re: ' . htmlspecialchars($project_type) . '" style="display:inline-block;background:linear-gradient(135deg,#00ffaa,#00ccff);color:#000000;font-family:Arial,sans-serif;font-size:13px;font-weight:900;letter-spacing:2px;text-transform:uppercase;text-decoration:none;padding:14px 32px;border-radius:50px;">Reply to ' . htmlspecialchars($name) . ' →</a>
      </td>
    </tr>
';

// ──────────────────────────────────────────────────────────────────────────
// 2. USER CONFIRMATION EMAIL BODY
// ──────────────────────────────────────────────────────────────────────────
$userBodyContent = '
    <tr>
      <td style="padding:40px 40px 8px;text-align:center;">
        <!-- Check icon -->
        <div style="display:inline-block;width:64px;height:64px;background:linear-gradient(135deg,rgba(0,255,170,0.15),rgba(0,204,255,0.15));border:2px solid rgba(0,255,170,0.4);border-radius:50%;text-align:center;line-height:64px;margin-bottom:24px;">
          <span style="font-size:28px;line-height:64px;">✓</span>
        </div>
        <h1 style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:26px;font-weight:900;color:#ffffff;line-height:1.2;">Message Received!</h1>
        <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:#666666;line-height:1.6;">Thanks for reaching out, ' . htmlspecialchars($name) . '. I\'ll get back to you soon.</p>
      </td>
    </tr>

    <!-- Info card -->
    <tr>
      <td style="padding:28px 40px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:linear-gradient(135deg,#141414,#161616);border-radius:16px;border:1px solid #222222;overflow:hidden;">
          <tr>
            <td style="padding:28px 28px 20px;">
              <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:15px;line-height:1.7;color:#cccccc;">
                Thank you for getting in touch! I&apos;ve received your message and will review your <strong style="color:#00ffaa;">' . htmlspecialchars($project_type) . '</strong> inquiry shortly.
              </p>
              <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:15px;line-height:1.7;color:#cccccc;">
                I typically respond within <strong style="color:#ffffff;">24 hours</strong>. For urgent inquiries, feel free to reach out directly.
              </p>
              <!-- Divider -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="height:1px;background:linear-gradient(90deg,transparent,#333333,transparent);font-size:0;line-height:0;margin:4px 0 20px;">&nbsp;</td>
                </tr>
              </table>
              <!-- Contact details -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding-bottom:10px;">
                    <span style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#555555;">📧&nbsp; EMAIL &nbsp;</span>
                    <a href="mailto:akash1998bhardwaj@gmail.com" style="font-family:Arial,sans-serif;font-size:13px;color:#00ffaa;text-decoration:none;">akash1998bhardwaj@gmail.com</a>
                  </td>
                </tr>
                <tr>
                  <td>
                    <span style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#555555;">📱&nbsp; PHONE &nbsp;</span>
                    <span style="font-family:Arial,sans-serif;font-size:13px;color:#e8e8e8;">+91-6398282580</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Your message recap -->
    <tr>
      <td style="padding:20px 40px 0;">
        <p style="margin:0 0 10px;font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#555555;">YOUR MESSAGE</p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#0d0d0d;border-radius:12px;border:1px solid #1e1e1e;border-left:3px solid #a855f7;">
          <tr>
            <td style="padding:20px 24px;">
              <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;line-height:1.7;color:#888888;font-style:italic;">&ldquo;' . nl2br(htmlspecialchars($message)) . '&rdquo;</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td style="padding:28px 40px 40px;text-align:center;">
        <p style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:13px;color:#555555;">While you wait, check out my latest work:</p>
        <a href="https://akashbhardwaj.dev" style="display:inline-block;background:linear-gradient(135deg,#00ffaa,#00ccff);color:#000000;font-family:Arial,sans-serif;font-size:13px;font-weight:900;letter-spacing:2px;text-transform:uppercase;text-decoration:none;padding:14px 32px;border-radius:50px;">View Portfolio →</a>
      </td>
    </tr>
    <tr>
      <td style="padding:0 40px 32px;text-align:center;">
        <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:#444444;line-height:1.6;">
          Warm Regards,<br/>
          <strong style="color:#cccccc;">Akash Bhardwaj</strong>
        </p>
      </td>
    </tr>
';

// ──────────────────────────────────────────────────────────────────────────
// SEND EMAILS
// ──────────────────────────────────────────────────────────────────────────
try {

    // 1. Admin Notification Email
    $adminMail = buildMailer($smtp_host, $smtp_user, $smtp_password, $smtp_port, $smtp_secure);
    $adminMail->setFrom($smtp_user, 'Akash Bhardwaj Portfolio');
    $adminMail->addAddress($smtp_user, 'Akash Bhardwaj');
    $adminMail->Subject = '🔔 New ' . $project_type . ' Inquiry from ' . $name;
    $adminMail->Body    = buildEmailHtml('New Contact Message - Akash Bhardwaj Portfolio', $adminBodyContent);
    $adminMail->AltBody = "New inquiry from: $name\nEmail: $email\nProject: $project_type\nMessage:\n$message";
    $adminMail->send();

    // 2. User Confirmation Email
    $userMail = buildMailer($smtp_host, $smtp_user, $smtp_password, $smtp_port, $smtp_secure);
    $userMail->setFrom($smtp_user, 'Akash Bhardwaj');
    $userMail->addAddress($email, $name);
    $userMail->Subject = '✅ Got your message, ' . $name . '! — Akash Bhardwaj';
    $userMail->Body    = buildEmailHtml('Message Received - Akash Bhardwaj', $userBodyContent);
    $userMail->AltBody = "Hi $name, thanks for reaching out! I received your message and will reply within 24 hours.\n\n— Akash Bhardwaj\nakash1998bhardwaj@gmail.com";
    $userMail->send();

    echo json_encode([
        'success' => true,
        'message' => 'Your message has been sent! Check your inbox for a confirmation email.'
    ]);
    exit;

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Mailer error: ' . $e->getMessage()
    ]);
    exit;
}
