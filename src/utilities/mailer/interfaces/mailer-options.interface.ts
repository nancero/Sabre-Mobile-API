// Dependencies
import * as SMTPTransport from 'nodemailer/lib/smtp-transport';

// Interfaces
import { TemplateAdapter } from './template-adapter.interface';

export interface MailerOptions {
  defaults?: SMTPTransport.Options;
  transport?: SMTPTransport | SMTPTransport.Option | string;
  template?: {
    dir?: string;
    adapter?: TemplateAdapter;
    options?: { [name: string]: any };
  };
}
