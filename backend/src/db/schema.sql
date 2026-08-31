CREATE DATABASE IF NOT EXISTS fincrm;
USE fincrm;

-- Company Master
CREATE TABLE IF NOT EXISTS MASCOM (
  mascom_id VARCHAR(20) PRIMARY KEY,
  company_name VARCHAR(150) NOT NULL,
  industry_type VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  data_source VARCHAR(100) NOT NULL,
  erp_using VARCHAR(100), -- Maps to excel erp_usnig
  user_name VARCHAR(100) NOT NULL,
  mascom_remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_mascom_id (mascom_id)
);

-- Contact Master
CREATE TABLE IF NOT EXISTS MASCON (
  mascon_id VARCHAR(20) PRIMARY KEY,
  mascom_id VARCHAR(20) NOT NULL,
  contact_name VARCHAR(150) NOT NULL,
  designation VARCHAR(100),
  mobile VARCHAR(20),
  email VARCHAR(150),
  key_person VARCHAR(5) DEFAULT 'N', -- Maps to excel Key_person
  user_name VARCHAR(100) NOT NULL, -- Maps to excel User Name
  mascon_remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_mascon_id (mascon_id),
  FOREIGN KEY (mascom_id) REFERENCES MASCOM(mascom_id) ON DELETE CASCADE
);

-- Transaction / Demo / Follow-up Master
CREATE TABLE IF NOT EXISTS TRACOM (
  tracom_id VARCHAR(20) PRIMARY KEY,
  mascom_id VARCHAR(20) NOT NULL,
  mascon_id VARCHAR(20) NOT NULL,
  tracom_date DATE,
  demo_date DATE, -- Maps to excel Demo_date
  demo_time TIME, -- Maps to excel Demo_time
  demo_mode VARCHAR(50),
  price_quoted DECIMAL(15, 2), -- Maps to excel Price Quoted
  amc_quoted DECIMAL(15, 2), -- Maps to excel AMC Quoted
  mode VARCHAR(50),
  user_name VARCHAR(100) NOT NULL,
  remarks TEXT,
  followup_date DATE,
  followup_time TIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_tracom_id (tracom_id),
  FOREIGN KEY (mascom_id) REFERENCES MASCOM(mascom_id) ON DELETE CASCADE,
  FOREIGN KEY (mascon_id) REFERENCES MASCON(mascon_id) ON DELETE CASCADE
);
-- User Settings / Page Layout preferences
CREATE TABLE IF NOT EXISTS USER_SETTINGS (
  page_name VARCHAR(100) NOT NULL,
  user_key VARCHAR(100) NOT NULL,
  setting_data TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (page_name, user_key)
);

-- Optimization Indexes
CREATE INDEX idx_mascom_name ON MASCOM(company_name);
CREATE INDEX idx_mascom_city ON MASCOM(city);
CREATE INDEX idx_mascom_state ON MASCOM(state);
CREATE INDEX idx_mascon_mascom ON MASCON(mascom_id);
CREATE INDEX idx_tracom_mascom ON TRACOM(mascom_id);
