import type {
  Logger,
  ProviderSendNotificationDTO,
  ProviderSendNotificationResultsDTO,
} from "@medusajs/framework/types";
import {
  AbstractNotificationProviderService,
  MedusaError,
} from "@medusajs/framework/utils";
import type { ReactNode } from "react";
import { Resend, type CreateEmailOptions } from "resend";

import { emailVerificationEmail } from "./emails/email-verification";

type ResendOptions = {
  api_key: string;
  from: string;
};

type InjectedDependencies = {
  logger: Logger;
};

enum Templates {
  EMAIL_VERIFICATION = "email-verification",
}

const templates: Record<
  Templates,
  (props: Record<string, unknown>) => ReactNode
> = {
  [Templates.EMAIL_VERIFICATION]: emailVerificationEmail,
};

class ResendNotificationProviderService extends AbstractNotificationProviderService {
  static identifier = "notification-resend";

  private readonly resendClient: Resend;
  private readonly options: ResendOptions;
  private readonly logger: Logger;

  constructor({ logger }: InjectedDependencies, options: ResendOptions) {
    super();

    this.resendClient = new Resend(options.api_key);
    this.options = options;
    this.logger = logger;
  }

  static validateOptions(options: Record<string, unknown>) {
    if (!options.api_key) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "RESEND_API_KEY es obligatorio para el proveedor de correo.",
      );
    }

    if (!options.from) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "RESEND_FROM_EMAIL es obligatorio para el proveedor de correo.",
      );
    }
  }

  private getTemplate(template: Templates) {
    return templates[template] ?? null;
  }

  private getTemplateSubject(template: Templates) {
    switch (template) {
      case Templates.EMAIL_VERIFICATION:
        return "Verifica tu correo electrónico | Indiscreta";
      default:
        return "Notificación de Indiscreta";
    }
  }

  async send(
    notification: ProviderSendNotificationDTO,
  ): Promise<ProviderSendNotificationResultsDTO> {
    const template = this.getTemplate(notification.template as Templates);

    if (!template) {
      this.logger.error(
        `No existe una plantilla para ${notification.template}.`,
      );
      return {};
    }

    const emailOptions: CreateEmailOptions = {
      from: this.options.from,
      to: [notification.to],
      subject: this.getTemplateSubject(notification.template as Templates),
      react: template((notification.data ?? {}) as Record<string, unknown>),
    };

    const { data, error } = await this.resendClient.emails.send(emailOptions);

    if (error || !data) {
      this.logger.error(
        "No fue posible enviar el correo de verificación.",
        error,
      );
      return {};
    }

    return { id: data.id };
  }
}

export default ResendNotificationProviderService;
