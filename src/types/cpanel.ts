export interface CpanelConfig {
  hostname: string;
  username: string;
  password?: string;
  apiToken?: string;
  port?: number;
  ssl?: boolean;
}

export interface CpanelResponse<T = any> {
  cpanelresult: {
    apiversion: number;
    func: string;
    data: T[];
    event: {
      result: 1 | 0;
      reason?: string;
    };
    module: string;
    metadata?: {
      command: string;
      reason: string;
      result: number;
      version: number;
    };
  };
}

export interface CpanelErrorData {
  reason: string;
  type?: string;
  code?: string;
  context?: any;
}

export interface FileManagerItem {
  file: string;
  fullpath: string;
  type: 'dir' | 'file';
  size: number;
  mtime: number;
  mode: string;
  uid: number;
  gid: number;
}

export interface DatabaseInfo {
  db: string;
  disk_usage: number;
}

export interface EmailAccount {
  email: string;
  domain: string;
  user: string;
  diskused: number;
  diskquota: string;
  _diskused_bytes: number;
  _diskquota_bytes: number;
}

export interface DomainInfo {
  domain: string;
  type: string;
  documentroot: string;
  serveralias?: string;
}

export interface BackupInfo {
  backup_id: string;
  backup_date: string;
  backup_size: number;
  backup_type: string;
  status: string;
}

export interface CronJob {
  linekey: string;
  minute: string;
  hour: string;
  day: string;
  month: string;
  weekday: string;
  command: string;
  enabled?: boolean;
  created?: string;
}

export interface DiskUsage {
  diskusage: {
    [key: string]: {
      diskused: number;
      diskavail: number;
      diskused_percent: number;
      diskavail_percent: number;
    };
  };
  quota: {
    diskused: number;
    diskquota: number;
    diskused_percent: number;
    diskavail_percent: number;
  };
}

export interface SSLCertificate {
  id: string;
  friendly_name: string;
  domains: string[];
  issuer: string;
  subject: string;
  not_after: string;
  not_before: string;
  is_self_signed: boolean;
  is_wildcard: boolean;
  certificate_text: string;
  private_key?: string;
  ca_bundle?: string;
}

export interface Subdomain {
  domain: string;
  rootdomain: string;
  dir: string;
  hasstat: boolean;
  reldir: string;
  status: string;
}

export interface FTPAccount {
  user: string;
  homedir: string;
  humandiskused: string;
  humandiskquota: string;
  diskused: number;
  diskquota: number;
  login_time: string;
  diskused_percent: number;
}

export interface DatabaseUser {
  user: string;
  host: string;
  privileges: string[];
}

export interface DNSRecord {
  linekey: string;
  line: string;
  type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS' | 'SRV' | 'PTR';
  name: string;
  record: string;
  ttl: number;
  priority?: number;
  weight?: number;
  port?: number;
  target?: string;
}
