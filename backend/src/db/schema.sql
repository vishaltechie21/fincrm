-- Create Database if not exists
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = N'fincrm')
BEGIN
  CREATE DATABASE fincrm;
END;
GO

USE fincrm;
GO

-- Company Master
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[MASCOM]') AND type in (N'U'))
BEGIN
  CREATE TABLE MASCOM (
    mascom_id NVARCHAR(20) PRIMARY KEY,
    company_name NVARCHAR(150) NOT NULL,
    industry_type NVARCHAR(100) NOT NULL,
    city NVARCHAR(100) NOT NULL,
    state NVARCHAR(100) NOT NULL,
    data_source NVARCHAR(100) NOT NULL,
    erp_using NVARCHAR(100),
    user_name NVARCHAR(100) NOT NULL,
    mascom_remarks NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
  );
END;

-- Contact Master
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[MASCON]') AND type in (N'U'))
BEGIN
  CREATE TABLE MASCON (
    mascon_id NVARCHAR(20) PRIMARY KEY,
    mascom_id NVARCHAR(20) NOT NULL,
    contact_name NVARCHAR(150) NOT NULL,
    designation NVARCHAR(100),
    mobile NVARCHAR(20),
    email NVARCHAR(150),
    key_person NVARCHAR(5) DEFAULT 'N',
    user_name NVARCHAR(100) NOT NULL,
    mascon_remarks NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT fk_mascon_mascom FOREIGN KEY (mascom_id) REFERENCES MASCOM(mascom_id) ON DELETE CASCADE
  );
END;

-- Transaction / Demo / Follow-up Master
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TRACOM]') AND type in (N'U'))
BEGIN
  CREATE TABLE TRACOM (
    tracom_id NVARCHAR(20) PRIMARY KEY,
    mascom_id NVARCHAR(20) NOT NULL,
    mascon_id NVARCHAR(20) NOT NULL,
    tracom_date DATE,
    demo_date DATE,
    demo_time TIME,
    demo_mode NVARCHAR(50),
    price_quoted DECIMAL(15, 2),
    amc_quoted DECIMAL(15, 2),
    mode NVARCHAR(50),
    user_name NVARCHAR(100) NOT NULL,
    remarks NVARCHAR(MAX),
    followup_date DATE,
    followup_time TIME,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT fk_tracom_mascom FOREIGN KEY (mascom_id) REFERENCES MASCOM(mascom_id) ON DELETE CASCADE,
    CONSTRAINT fk_tracom_mascon FOREIGN KEY (mascon_id) REFERENCES MASCON(mascon_id)
  );
END;

-- User Settings / Page Layout preferences
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[USER_SETTINGS]') AND type in (N'U'))
BEGIN
  CREATE TABLE USER_SETTINGS (
    page_name NVARCHAR(100) NOT NULL,
    user_key NVARCHAR(100) NOT NULL,
    setting_data NVARCHAR(MAX) NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    PRIMARY KEY (page_name, user_key)
  );
END;

-- Optimization Indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'idx_mascom_name' AND object_id = OBJECT_ID(N'[dbo].[MASCOM]'))
  CREATE INDEX idx_mascom_name ON MASCOM(company_name);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'idx_mascom_city' AND object_id = OBJECT_ID(N'[dbo].[MASCOM]'))
  CREATE INDEX idx_mascom_city ON MASCOM(city);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'idx_mascom_state' AND object_id = OBJECT_ID(N'[dbo].[MASCOM]'))
  CREATE INDEX idx_mascom_state ON MASCOM(state);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'idx_mascon_mascom' AND object_id = OBJECT_ID(N'[dbo].[MASCON]'))
  CREATE INDEX idx_mascon_mascom ON MASCON(mascom_id);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'idx_tracom_mascom' AND object_id = OBJECT_ID(N'[dbo].[TRACOM]'))
  CREATE INDEX idx_tracom_mascom ON TRACOM(mascom_id);

-- Sub Master Configuration Lookup Tables
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SUB_MASTERS]') AND type in (N'U'))
BEGIN
  CREATE TABLE SUB_MASTERS (
    id INT IDENTITY(1,1) PRIMARY KEY,
    master_type NVARCHAR(50) NOT NULL,
    value_name NVARCHAR(100) NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT unique_type_value UNIQUE (master_type, value_name)
  );
END;
