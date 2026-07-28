create schema if not exists manzor_mail;

create table if not exists manzor_mail."MailAccount" (
  "id" text primary key,
  "organizationName" text not null,
  "email" text not null unique,
  "provider" text not null,
  "accessToken" text,
  "refreshToken" text,
  "tokenExpiresAt" timestamptz,
  "encryptedSecret" text,
  "imapHost" text,
  "imapPort" integer,
  "imapSecure" boolean not null default true,
  "smtpHost" text,
  "smtpPort" integer,
  "smtpSecure" boolean not null default true,
  "connectionStatus" text not null default 'CONNECTED',
  "lastConnectedAt" timestamptz not null default now(),
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create unique index if not exists "MailAccount_email_key"
  on manzor_mail."MailAccount" ("email");

create index if not exists "MailAccount_organizationName_idx"
  on manzor_mail."MailAccount" ("organizationName");

create table if not exists manzor_mail."EmailAttachment" (
  "id" text primary key,
  "accountId" text not null,
  "filename" text not null,
  "contentType" text not null,
  "size" integer not null,
  "content" bytea not null,
  "contentId" text,
  "disposition" text not null default 'inline',
  "createdAt" timestamptz not null default now(),
  "sentAt" timestamptz
);

create index if not exists "EmailAttachment_accountId_idx"
  on manzor_mail."EmailAttachment" ("accountId");
