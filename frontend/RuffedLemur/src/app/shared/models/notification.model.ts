export interface Notification {
  id?: number;
  message: string;
  subject: string;
  type: NotificationType;
  attachment?: File;
  level: NotificationLevel;
  user: string;
  read: boolean;
  data?: any;
  createdAt?: Date;
  toAddress: string[];
  fromAddress: string;

}

export enum NotificationType {
  CERTIFICATE_EXPIRATION = 'certificate_expiration',
  CERTIFICATE_CREATION = 'certificate_creation',
  CERTIFICATE_REVOCATION = 'certificate_revocation',
  AUTHORITY_CREATION = 'authority_creation',
  AUTHORITY_EXPIRATION = 'authority_expiration',
  SYSTEM = 'system',
  USER = 'user'
}

export enum NotificationLevel {
  INFO = 'info', //for reports and summaries
  WARNING = 'warning', //for large numbers of certs expiring at once
  ERROR = 'error',  //for email bounces
  SUCCESS = 'success', //for certificate issuance/renewals
  EXPIRATION = 'expiration' //for expiration notifications
}

export interface NotificationConfig {
  id?: number;
  name: string;
  interval: number[];
  description?: string;
  plugin: NotificationPlugin;
  pluginOptions: any;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  smtpServer: string;
  stmpPort: number;
  smtpUser?: string;
  smtpPassword?: string;
}

export enum NotificationPlugin {
  EMAIL = 'email',
  SLACK = 'Slack',
  TEAMS = 'Microsoft Teams',
  WEBHOOK = 'webhook',
  SMS = 'sms'
}
