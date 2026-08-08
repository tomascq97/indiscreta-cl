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

type EmailVerificationProps = {
  verification_url?: string;
};

function EmailVerificationEmail({ verification_url }: EmailVerificationProps) {
  const verificationUrl = verification_url || "#";

  return (
    <Html lang="es">
      <Head />
      <Preview>Confirma tu correo electrónico en Indiscreta</Preview>

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

            <Text
              style={{
                color: "#f29ab2",
                fontSize: "10px",
                letterSpacing: "3px",
                margin: "8px 0 0",
                textTransform: "uppercase",
              }}
            >
              Disfruta, vive y descubre
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
              Verificación de cuenta
            </Text>

            <Heading
              style={{
                color: "#111111",
                fontSize: "28px",
                lineHeight: "36px",
                margin: "14px 0 16px",
              }}
            >
              Confirma tu correo electrónico
            </Heading>

            <Text
              style={{
                color: "#555555",
                fontSize: "15px",
                lineHeight: "24px",
                margin: 0,
              }}
            >
              Gracias por crear una cuenta en Indiscreta. Confirma tu dirección
              de correo para activar tu cuenta y acceder al seguimiento de
              pedidos, direcciones guardadas y una experiencia de compra
              personalizada.
            </Text>

            <Section style={{ margin: "30px 0", textAlign: "center" }}>
              <Button
                href={verificationUrl}
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
                Verificar mi correo
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
              {verificationUrl}
            </Text>

            <Hr
              style={{
                borderColor: "#e5e5e5",
                margin: "28px 0",
              }}
            />

            <Text
              style={{
                color: "#777777",
                fontSize: "12px",
                lineHeight: "20px",
                margin: 0,
              }}
            >
              Si no creaste esta cuenta, puedes ignorar este correo. No
              compartas este enlace con otras personas.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export const emailVerificationEmail = (props: Record<string, unknown>) => (
  <EmailVerificationEmail
    verification_url={
      typeof props.verification_url === "string"
        ? props.verification_url
        : undefined
    }
  />
);
