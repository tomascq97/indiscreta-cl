import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

type PasswordResetEmailProps = {
  reset_url?: string;
};

function PasswordResetEmail({ reset_url }: PasswordResetEmailProps) {
  const resetUrl = reset_url || "#";

  return (
    <Html lang="es">
      <Head />
      <Preview>Restablece tu contraseña de Indiscreta</Preview>
      <Body
        style={{
          backgroundColor: "#f5f5f5",
          fontFamily: "Arial, Helvetica, sans-serif",
          margin: 0,
          padding: "32px 12px",
        }}
      >
        <Container
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5e5e5",
            margin: "0 auto",
            maxWidth: "560px",
          }}
        >
          <Section
            style={{
              backgroundColor: "#000000",
              padding: "28px 32px",
              textAlign: "center",
            }}
          >
            <Text
              style={{
                color: "#f29ab2",
                fontSize: "28px",
                fontWeight: 800,
                letterSpacing: "4px",
                margin: 0,
              }}
            >
              INDISCRETA
            </Text>
          </Section>
          <Section style={{ padding: "36px 32px" }}>
            <Text
              style={{
                color: "#d97998",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "2px",
                margin: 0,
                textTransform: "uppercase",
              }}
            >
              Recuperación de contraseña
            </Text>
            <Heading
              style={{
                color: "#111111",
                fontSize: "28px",
                lineHeight: "36px",
                margin: "14px 0 16px",
              }}
            >
              Crea una nueva contraseña
            </Heading>
            <Text
              style={{
                color: "#555555",
                fontSize: "15px",
                lineHeight: "24px",
                margin: 0,
              }}
            >
              Recibimos una solicitud para restablecer la contraseña de tu
              cuenta. Este enlace tiene una duración limitada.
            </Text>
            <Section style={{ margin: "30px 0", textAlign: "center" }}>
              <Button
                href={resetUrl}
                style={{
                  backgroundColor: "#000000",
                  color: "#ffffff",
                  display: "inline-block",
                  fontSize: "12px",
                  fontWeight: 700,
                  letterSpacing: "1.4px",
                  padding: "16px 24px",
                  textDecoration: "none",
                  textTransform: "uppercase",
                }}
              >
                RESTABLECER CONTRASEÑA
              </Button>
            </Section>
            <Text
              style={{
                color: "#777777",
                fontSize: "12px",
                lineHeight: "20px",
                margin: 0,
              }}
            >
              Si el botón no funciona, copia y pega este enlace en tu navegador:
            </Text>
            <Text
              style={{
                color: "#111111",
                fontSize: "12px",
                lineHeight: "20px",
                overflowWrap: "anywhere",
              }}
            >
              {resetUrl}
            </Text>
            <Hr style={{ borderColor: "#e5e5e5", margin: "28px 0" }} />
            <Text
              style={{
                color: "#777777",
                fontSize: "12px",
                lineHeight: "20px",
                margin: 0,
              }}
            >
              Si no solicitaste este cambio, puedes ignorar este correo. Tu
              contraseña seguirá siendo la misma.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export const passwordResetEmail = (props: Record<string, unknown>) => (
  <PasswordResetEmail
    reset_url={
      typeof props.reset_url === "string" ? props.reset_url : undefined
    }
  />
);
