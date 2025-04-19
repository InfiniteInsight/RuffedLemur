export interface CertificateSource {
  id?: number;
  label: string; //aka name
  description?: string;
  plugin: SourcePlugin;
  pluginOptions: any;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum SourcePlugin {
  AWS_ACM = 'aws-acm',
  DIGICERT = 'digicert',
  ENTRUST = 'entrust',
  VAULT = 'vault',
  VERISIGN = 'verisign',
  LETS_ENCRYPT = 'lets-encrypt',
  CUSTOM = 'custom'
  //TO DO:
  //manual import
  //manual create in lemur
  //network discovery
}
