declare module 'mailparser' {
  export interface ParsedMail {
    text?: string;
    html?: string;
    textAsHtml?: string;
    subject?: string;
    from?: any;
    to?: any;
    headers?: Map<string, any>;
    messageId?: string;
    date?: Date;
    attachments?: any[];
  }

  export function simpleParser(source: any): Promise<ParsedMail>;
}