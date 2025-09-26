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
    };
    module: string;
  };
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
}