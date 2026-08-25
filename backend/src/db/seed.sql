USE fincrm;

-- Seed data for MASCOM
INSERT INTO MASCOM (mascom_id, company_name, industry_type, city, state, data_source, erp_using, user_name, mascom_remarks) VALUES
('178-00001', 'Demo Manufacturing Ltd.', 'Pharma Manufacturing', 'Noida', 'Uttar Pradesh', 'Referral', 'Manual', 'Sourav', 'Demo scheduled'),
('178-00002', 'Sample Healthcare Pvt. Ltd.', 'Medical Devices', 'Ghaziabad', 'Uttar Pradesh', 'Website', 'Tally', 'Ayush', 'New enquiry'),
('178-00003', 'Example Nutraceuticals', 'Nutraceuticals', 'Baddi', 'Himachal Pradesh', 'WhatsApp', 'In-house', 'Chandan', 'Proposal under discussion');

-- Seed data for MASCON
INSERT INTO MASCON (mascon_id, mascom_id, contact_name, designation, mobile, email, key_person, user_name, mascon_remarks) VALUES
('178-00001', '178-00001', 'Demo Contact', 'Director', '9876543210', 'contact@example.com', 'Y', 'Sourav', 'Primary contact'),
('178-00002', '178-00002', 'Sample Contact', 'GM', '9876501234', 'gm@example.com', 'Y', 'Ayush', '');

-- Seed data for TRACOM
INSERT INTO TRACOM (tracom_id, mascom_id, mascon_id, tracom_date, demo_date, demo_time, demo_mode, price_quoted, amc_quoted, mode, user_name, remarks, followup_date, followup_time) VALUES
('178-00001', '178-00001', '178-00001', '2026-08-20', '2026-08-21', '14:00:00', 'Online', 150000.00, 25000.00, 'Referral', 'Sourav', 'Demo planned', '2026-08-21', '11:00:00'),
('178-00002', '178-00002', '178-00002', '2026-08-20', NULL, NULL, NULL, NULL, NULL, 'WhatsApp', 'Ayush', 'Call customer for demo', '2026-08-22', '10:30:00');
