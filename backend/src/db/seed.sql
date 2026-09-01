USE fincrm;
GO

-- Seed data for MASCOM
IF NOT EXISTS (SELECT 1 FROM MASCOM WHERE mascom_id = 'MC0001')
  INSERT INTO MASCOM (mascom_id, company_name, industry_type, city, state, data_source, erp_using, user_name, mascom_remarks) VALUES
  ('MC0001', 'Sunrise Pharmaceuticals Pvt Ltd', 'Pharma Formulation', 'Gurugram', 'Haryana', 'IndiaMART', 'Tally ERP 9', 'Suman', '3 plants, 240 users expected. Wants batch costing + eQMS in phase 1.');

IF NOT EXISTS (SELECT 1 FROM MASCOM WHERE mascom_id = 'MC0002')
  INSERT INTO MASCOM (mascom_id, company_name, industry_type, city, state, data_source, erp_using, user_name, mascom_remarks) VALUES
  ('MC0002', 'Meridian Auto Components Ltd', 'Auto Ancillary', 'Faridabad', 'Haryana', 'Trade Fair 2026', 'SAP B1', 'Umasankar', 'Unhappy with SAP B1 licence renewal cost. Evaluating replacement.');

IF NOT EXISTS (SELECT 1 FROM MASCOM WHERE mascom_id = 'MC0003')
  INSERT INTO MASCOM (mascom_id, company_name, industry_type, city, state, data_source, erp_using, user_name, mascom_remarks) VALUES
  ('MC0003', 'Kaveri Textile Mills', 'Textile Spinning', 'Coimbatore', 'Tamil Nadu', 'Cold Call', 'None', 'Suman', 'Manual registers. Owner-driven decision, slow cycle.');

IF NOT EXISTS (SELECT 1 FROM MASCOM WHERE mascom_id = 'MC0004')
  INSERT INTO MASCOM (mascom_id, company_name, industry_type, city, state, data_source, erp_using, user_name, mascom_remarks) VALUES
  ('MC0004', 'Orbit Polymers LLP', 'Plastic Moulding', 'Noida', 'Uttar Pradesh', 'Referral - Sunrise', 'Busy 21', 'Rakesh', 'Referred by Mr. Menon. Needs job-work tracking.');

IF NOT EXISTS (SELECT 1 FROM MASCOM WHERE mascom_id = 'MC0005')
  INSERT INTO MASCOM (mascom_id, company_name, industry_type, city, state, data_source, erp_using, user_name, mascom_remarks) VALUES
  ('MC0005', 'Deccan Agro Foods Pvt Ltd', 'Food Processing', 'Hyderabad', 'Telangana', 'Website Enquiry', 'Tally Prime', 'Rakesh', 'FSSAI traceability is the hook. 45 users.');

IF NOT EXISTS (SELECT 1 FROM MASCOM WHERE mascom_id = 'MC0006')
  INSERT INTO MASCOM (mascom_id, company_name, industry_type, city, state, data_source, erp_using, user_name, mascom_remarks) VALUES
  ('MC0006', 'Nova Life Sciences Ltd', 'API Manufacturing', 'Ahmedabad', 'Gujarat', 'LinkedIn', 'Marg ERP', 'Umasankar', 'USFDA audited unit. Insists on 21 CFR Part 11 audit trail.');

IF NOT EXISTS (SELECT 1 FROM MASCOM WHERE mascom_id = 'MC0007')
  INSERT INTO MASCOM (mascom_id, company_name, industry_type, city, state, data_source, erp_using, user_name, mascom_remarks) VALUES
  ('MC0007', 'Steelcraft Engineering Works', 'Fabrication', 'Ludhiana', 'Punjab', 'IndiaMART', 'None', 'Suman', 'Budget sensitive. Dropped after price discussion.');

IF NOT EXISTS (SELECT 1 FROM MASCOM WHERE mascom_id = 'MC0008')
  INSERT INTO MASCOM (mascom_id, company_name, industry_type, city, state, data_source, erp_using, user_name, mascom_remarks) VALUES
  ('MC0008', 'Vertex Electricals Pvt Ltd', 'Electrical Equipment', 'Bhiwadi', 'Rajasthan', 'Exhibition - ELECRAMA', 'In-house FoxPro', 'Rakesh', 'Legacy FoxPro app since 2008. Data migration is the main concern.');

-- Seed data for MASCON
IF NOT EXISTS (SELECT 1 FROM MASCON WHERE mascon_id = 'CN0001')
  INSERT INTO MASCON (mascon_id, mascom_id, contact_name, designation, mobile, email, key_person, user_name, mascon_remarks) VALUES
  ('CN0001', 'MC0001', 'Rajesh Menon', 'GM - Operations', '98110 42781', 'rajesh.menon@sunrisepharma.in', 'Y', 'Suman', 'Final decision maker. Prefers evening calls after 6 PM.');

IF NOT EXISTS (SELECT 1 FROM MASCON WHERE mascon_id = 'CN0002')
  INSERT INTO MASCON (mascon_id, mascom_id, contact_name, designation, mobile, email, key_person, user_name, mascon_remarks) VALUES
  ('CN0002', 'MC0001', 'Priya Sharma', 'Head - Quality Assurance', '98180 33914', 'priya.s@sunrisepharma.in', 'N', 'Suman', 'Evaluating the eQMS module. Very detail oriented.');

IF NOT EXISTS (SELECT 1 FROM MASCON WHERE mascon_id = 'CN0003')
  INSERT INTO MASCON (mascon_id, mascom_id, contact_name, designation, mobile, email, key_person, user_name, mascon_remarks) VALUES
  ('CN0003', 'MC0001', 'Anil Kapoor', 'IT Manager', '99719 20844', 'it@sunrisepharma.in', 'N', 'Suman', 'Handles server and network readiness.');

IF NOT EXISTS (SELECT 1 FROM MASCON WHERE mascon_id = 'CN0004')
  INSERT INTO MASCON (mascon_id, mascom_id, contact_name, designation, mobile, email, key_person, user_name, mascon_remarks) VALUES
  ('CN0004', 'MC0002', 'S. Venkatesh', 'Director - Finance', '98991 55620', 'venkatesh@meridianauto.com', 'Y', 'Umasankar', 'Cost-driven. Wants 5-year TCO comparison against SAP B1.');

IF NOT EXISTS (SELECT 1 FROM MASCON WHERE mascon_id = 'CN0005')
  INSERT INTO MASCON (mascon_id, mascom_id, contact_name, designation, mobile, email, key_person, user_name, mascon_remarks) VALUES
  ('CN0005', 'MC0002', 'Deepak Rana', 'Plant Head', '98107 78113', 'd.rana@meridianauto.com', 'N', 'Umasankar', 'Shop-floor requirement owner.');

IF NOT EXISTS (SELECT 1 FROM MASCON WHERE mascon_id = 'CN0006')
  INSERT INTO MASCON (mascon_id, mascom_id, contact_name, designation, mobile, email, key_person, user_name, mascon_remarks) VALUES
  ('CN0006', 'MC0003', 'M. Karthikeyan', 'Managing Partner', '94420 61137', 'karthik@kaveritextiles.co.in', 'Y', 'Suman', 'Speaks Tamil mostly. Send material in English, explain on call.');

IF NOT EXISTS (SELECT 1 FROM MASCON WHERE mascon_id = 'CN0007')
  INSERT INTO MASCON (mascon_id, mascom_id, contact_name, designation, mobile, email, key_person, user_name, mascon_remarks) VALUES
  ('CN0007', 'MC0004', 'Nitin Bhardwaj', 'Proprietor', '98718 40025', 'nitin@orbitpolymers.in', 'Y', 'Rakesh', 'Referred by Sunrise. Warm lead.');

IF NOT EXISTS (SELECT 1 FROM MASCON WHERE mascon_id = 'CN0008')
  INSERT INTO MASCON (mascon_id, mascom_id, contact_name, designation, mobile, email, key_person, user_name, mascon_remarks) VALUES
  ('CN0008', 'MC0004', 'Sunita Rawat', 'Accounts Manager', '98738 61190', 'accounts@orbitpolymers.in', 'N', 'Rakesh', 'Will handle billing and GST mapping.');

IF NOT EXISTS (SELECT 1 FROM MASCON WHERE mascon_id = 'CN0009')
  INSERT INTO MASCON (mascon_id, mascom_id, contact_name, designation, mobile, email, key_person, user_name, mascon_remarks) VALUES
  ('CN0009', 'MC0005', 'P. Ravi Kumar', 'CEO', '98490 27314', 'ravi@deccanagro.com', 'Y', 'Rakesh', 'Travels often. WhatsApp works better than calls.');

IF NOT EXISTS (SELECT 1 FROM MASCON WHERE mascon_id = 'CN0010')
  INSERT INTO MASCON (mascon_id, mascom_id, contact_name, designation, mobile, email, key_person, user_name, mascon_remarks) VALUES
  ('CN0010', 'MC0005', 'Lakshmi Iyer', 'QA Executive', '90000 71225', 'qa@deccanagro.com', 'N', 'Rakesh', 'Raised FSSAI traceability questions in demo.');

IF NOT EXISTS (SELECT 1 FROM MASCON WHERE mascon_id = 'CN0011')
  INSERT INTO MASCON (mascon_id, mascom_id, contact_name, designation, mobile, email, key_person, user_name, mascon_remarks) VALUES
  ('CN0011', 'MC0006', 'Dr. Hiren Patel', 'Director - Technical', '98250 19048', 'hiren.patel@novalifesciences.com', 'Y', 'Umasankar', 'Wants validation documents (IQ/OQ/PQ) before commercials.');

IF NOT EXISTS (SELECT 1 FROM MASCON WHERE mascon_id = 'CN0012')
  INSERT INTO MASCON (mascon_id, mascom_id, contact_name, designation, mobile, email, key_person, user_name, mascon_remarks) VALUES
  ('CN0012', 'CN0012', 'Jigar Shah', 'Manager - IT', '90999 34162', 'jigar.shah@novalifesciences.com', 'N', 'Umasankar', 'Asked for on-premise deployment only.');

IF NOT EXISTS (SELECT 1 FROM MASCON WHERE mascon_id = 'CN0013')
  INSERT INTO MASCON (mascon_id, mascom_id, contact_name, designation, mobile, email, key_person, user_name, mascon_remarks) VALUES
  ('CN0013', 'MC0007', 'Gurpreet Singh', 'Owner', '98140 55731', 'gurpreet@steelcraftworks.in', 'Y', 'Suman', 'Wanted one-time purchase, no AMC. Not aligned.');

IF NOT EXISTS (SELECT 1 FROM MASCON WHERE mascon_id = 'CN0014')
  INSERT INTO MASCON (mascon_id, mascom_id, contact_name, designation, mobile, email, key_person, user_name, mascon_remarks) VALUES
  ('CN0014', 'MC0008', 'Alok Mehra', 'VP - Operations', '99280 41176', 'alok.mehra@vertexelectricals.com', 'Y', 'Rakesh', 'Concerned about downtime during migration.');

IF NOT EXISTS (SELECT 1 FROM MASCON WHERE mascon_id = 'CN0015')
  INSERT INTO MASCON (mascon_id, mascom_id, contact_name, designation, mobile, email, key_person, user_name, mascon_remarks) VALUES
  ('CN0015', 'MC0008', 'Ritu Saxena', 'Sr. Accountant', '99280 41180', 'ritu@vertexelectricals.com', 'N', 'Rakesh', 'Maintains the old FoxPro data. Key for migration mapping.');

-- Seed data for SUB_MASTERS
IF NOT EXISTS (SELECT 1 FROM SUB_MASTERS WHERE master_type = 'industry_type' AND value_name = 'Pharma Manufacturing')
  INSERT INTO SUB_MASTERS (master_type, value_name) VALUES ('industry_type', 'Pharma Manufacturing');
IF NOT EXISTS (SELECT 1 FROM SUB_MASTERS WHERE master_type = 'industry_type' AND value_name = 'Pharma Marketing')
  INSERT INTO SUB_MASTERS (master_type, value_name) VALUES ('industry_type', 'Pharma Marketing');
IF NOT EXISTS (SELECT 1 FROM SUB_MASTERS WHERE master_type = 'industry_type' AND value_name = 'Medical Devices')
  INSERT INTO SUB_MASTERS (master_type, value_name) VALUES ('industry_type', 'Medical Devices');
IF NOT EXISTS (SELECT 1 FROM SUB_MASTERS WHERE master_type = 'industry_type' AND value_name = 'Nutraceuticals')
  INSERT INTO SUB_MASTERS (master_type, value_name) VALUES ('industry_type', 'Nutraceuticals');
IF NOT EXISTS (SELECT 1 FROM SUB_MASTERS WHERE master_type = 'industry_type' AND value_name = 'Food Manufacturing')
  INSERT INTO SUB_MASTERS (master_type, value_name) VALUES ('industry_type', 'Food Manufacturing');
IF NOT EXISTS (SELECT 1 FROM SUB_MASTERS WHERE master_type = 'industry_type' AND value_name = 'Chemical Manufacturing')
  INSERT INTO SUB_MASTERS (master_type, value_name) VALUES ('industry_type', 'Chemical Manufacturing');
IF NOT EXISTS (SELECT 1 FROM SUB_MASTERS WHERE master_type = 'industry_type' AND value_name = 'Other')
  INSERT INTO SUB_MASTERS (master_type, value_name) VALUES ('industry_type', 'Other');

IF NOT EXISTS (SELECT 1 FROM SUB_MASTERS WHERE master_type = 'data_source' AND value_name = 'Website')
  INSERT INTO SUB_MASTERS (master_type, value_name) VALUES ('data_source', 'Website');
IF NOT EXISTS (SELECT 1 FROM SUB_MASTERS WHERE master_type = 'data_source' AND value_name = 'Referral')
  INSERT INTO SUB_MASTERS (master_type, value_name) VALUES ('data_source', 'Referral');
IF NOT EXISTS (SELECT 1 FROM SUB_MASTERS WHERE master_type = 'data_source' AND value_name = 'WhatsApp')
  INSERT INTO SUB_MASTERS (master_type, value_name) VALUES ('data_source', 'WhatsApp');
IF NOT EXISTS (SELECT 1 FROM SUB_MASTERS WHERE master_type = 'data_source' AND value_name = 'Bulk Mail')
  INSERT INTO SUB_MASTERS (master_type, value_name) VALUES ('data_source', 'Bulk Mail');
IF NOT EXISTS (SELECT 1 FROM SUB_MASTERS WHERE master_type = 'data_source' AND value_name = 'Cold Call')
  INSERT INTO SUB_MASTERS (master_type, value_name) VALUES ('data_source', 'Cold Call');
IF NOT EXISTS (SELECT 1 FROM SUB_MASTERS WHERE master_type = 'data_source' AND value_name = 'Exhibition')
  INSERT INTO SUB_MASTERS (master_type, value_name) VALUES ('data_source', 'Exhibition');
IF NOT EXISTS (SELECT 1 FROM SUB_MASTERS WHERE master_type = 'data_source' AND value_name = 'Existing Client')
  INSERT INTO SUB_MASTERS (master_type, value_name) VALUES ('data_source', 'Existing Client');
IF NOT EXISTS (SELECT 1 FROM SUB_MASTERS WHERE master_type = 'data_source' AND value_name = 'Other')
  INSERT INTO SUB_MASTERS (master_type, value_name) VALUES ('data_source', 'Other');

IF NOT EXISTS (SELECT 1 FROM SUB_MASTERS WHERE master_type = 'stage' AND value_name = 'Lead')
  INSERT INTO SUB_MASTERS (master_type, value_name) VALUES ('stage', 'Lead');
IF NOT EXISTS (SELECT 1 FROM SUB_MASTERS WHERE master_type = 'stage' AND value_name = 'Demo Done')
  INSERT INTO SUB_MASTERS (master_type, value_name) VALUES ('stage', 'Demo Done');
IF NOT EXISTS (SELECT 1 FROM SUB_MASTERS WHERE master_type = 'stage' AND value_name = 'Quoted')
  INSERT INTO SUB_MASTERS (master_type, value_name) VALUES ('stage', 'Quoted');
IF NOT EXISTS (SELECT 1 FROM SUB_MASTERS WHERE master_type = 'stage' AND value_name = 'Negotiation')
  INSERT INTO SUB_MASTERS (master_type, value_name) VALUES ('stage', 'Negotiation');
IF NOT EXISTS (SELECT 1 FROM SUB_MASTERS WHERE master_type = 'stage' AND value_name = 'Won')
  INSERT INTO SUB_MASTERS (master_type, value_name) VALUES ('stage', 'Won');
IF NOT EXISTS (SELECT 1 FROM SUB_MASTERS WHERE master_type = 'stage' AND value_name = 'Lost')
  INSERT INTO SUB_MASTERS (master_type, value_name) VALUES ('stage', 'Lost');
