-- ============================================================
-- NEXUS SERVICE MARKETING SYSTEM — Seed Data
-- Source: NexusContext.ts INITIAL_* arrays
-- Spec:   SPEC-SUMMARY (1).md §4-§5
-- ============================================================
-- Run AFTER nexus_schema.sql
-- ============================================================

-- ============================================================
-- 1. PLANS (14 gói — theo bảng giá spec §5)
-- ============================================================

-- ---- Dial-Up (Security Deposit: $325) ----
INSERT INTO Plans (Id, Name, Type, SpeedOrBandwidth, MonthlyRental, SecurityDeposit, DataLimit, Status, BillingCycle, Validity, IncludedHours, Description)
VALUES
('plan-du-h10', 'Dial-Up Hourly 10 Hrs', 'Dial-Up', '56 Kbps V.92', 50.00, 325.00, '10 Hours', 'Active', 'Hourly Pack', '1 Month', 10, 'Prepaid 10-hour dial-up pack, valid for one month.'),
('plan-du-h30', 'Dial-Up Hourly 30 Hrs', 'Dial-Up', '56 Kbps V.92', 130.00, 325.00, '30 Hours', 'Active', 'Hourly Pack', '3 Months', 30, 'Prepaid 30-hour dial-up pack, valid for three months.'),
('plan-du-h60', 'Dial-Up Hourly 60 Hrs', 'Dial-Up', '56 Kbps V.92', 260.00, 325.00, '60 Hours', 'Active', 'Hourly Pack', '6 Months', 60, 'Prepaid 60-hour dial-up pack, valid for six months.'),
('plan-du-28', 'Dial-Up Unlimited 28 Kbps', 'Dial-Up', '28 Kbps', 75.00, 325.00, 'Unlimited', 'Active', 'Monthly', '1 Month', NULL, 'Unlimited dial-up access at 28 Kbps. Quarterly billing also available at $150.'),
('plan-du-56', 'Dial-Up Unlimited 56 Kbps', 'Dial-Up', '56 Kbps', 100.00, 325.00, 'Unlimited', 'Active', 'Monthly', '1 Month', NULL, 'Unlimited dial-up access at 56 Kbps. Quarterly billing also available at $180.');

-- ---- Broadband (Security Deposit: $500) ----
INSERT INTO Plans (Id, Name, Type, SpeedOrBandwidth, MonthlyRental, SecurityDeposit, DataLimit, Status, BillingCycle, Validity, IncludedHours, Description)
VALUES
('plan-bb-h30', 'Broadband Hourly 30 Hrs', 'Broadband', 'Broadband', 175.00, 500.00, '30 Hours', 'Active', 'Hourly Pack', '1 Month', 30, 'Prepaid 30-hour broadband pack, valid for one month.'),
('plan-bb-h60', 'Broadband Hourly 60 Hrs', 'Broadband', 'Broadband', 315.00, 500.00, '60 Hours', 'Active', 'Hourly Pack', '6 Months', 60, 'Prepaid 60-hour broadband pack, valid for six months.'),
('plan-bb-64', 'Broadband Unlimited 64 Kbps', 'Broadband', '64 Kbps', 225.00, 500.00, 'Unlimited', 'Active', 'Monthly', '1 Month', NULL, 'Unlimited broadband at 64 Kbps. Quarterly billing also available at $400.'),
('plan-bb-128', 'Broadband Unlimited 128 Kbps', 'Broadband', '128 Kbps', 350.00, 500.00, 'Unlimited', 'Active', 'Monthly', '1 Month', NULL, 'Unlimited broadband at 128 Kbps. Quarterly billing also available at $445.');

-- ---- Landline / Telephone Only (Security Deposit: $250) ----
INSERT INTO Plans (Id, Name, Type, SpeedOrBandwidth, MonthlyRental, SecurityDeposit, DataLimit, Status, BillingCycle, Validity, CallRates, Description)
VALUES
('plan-ll-local-y', 'Landline Local — Unlimited (Yearly)', 'Landline', 'PSTN Voice', 75.00, 250.00, 'Unlimited Local', 'Active', 'Yearly', '1 Year', 'Local: 55¢/min', 'Local plan, yearly rental. Call charges billed on top of the rental.'),
('plan-ll-local-m', 'Landline Local — Monthly', 'Landline', 'PSTN Voice', 35.00, 250.00, 'Local Calling', 'Active', 'Monthly', '1 Month', 'Local: 75¢/min', 'Local plan, monthly rental. Call charges billed on top of the rental.'),
('plan-ll-std-m', 'Landline STD — Monthly', 'Landline', 'PSTN Voice', 125.00, 250.00, 'Local + STD', 'Active', 'Monthly', '1 Month', 'Local: 70¢/min · STD: $2.25/min · SMS to mobile: $1.00/min', 'STD plan, monthly rental with local, STD and mobile-messaging call charges.'),
('plan-ll-std-h', 'Landline STD — Half-Yearly', 'Landline', 'PSTN Voice', 420.00, 250.00, 'Local + STD', 'Active', 'Half-Yearly', '6 Months', 'Local: 60¢/min · STD: $2.00/min · SMS to mobile: $1.15/min', 'STD plan, half-yearly rental with reduced call charges.'),
('plan-ll-std-y', 'Landline STD — Yearly', 'Landline', 'PSTN Voice', 780.00, 250.00, 'Local + STD', 'Active', 'Yearly', '1 Year', 'Local: 60¢/min · STD: $1.75/min · SMS to mobile: $1.25/min', 'STD plan, yearly rental with the lowest call charges.');
GO

-- ============================================================
-- 2. EMPLOYEES (5 nhân viên — mỗi role 1 người)
-- ============================================================
INSERT INTO Employees (Id, EmployeeCode, Name, Email, Phone, Role, Department, RetailShopAssigned, Status, DateOfJoining)
VALUES
('emp-01', 'EMP-1001', 'Sarah Jenkins',   'sarah.jenkins@nexus.telecom',   '+1 (555) 234-8901', 'Manager',           'Administration',        NULL,                              'Active', '2022-03-15'),
('emp-02', 'EMP-1042', 'David Chen',       'david.chen@nexus.telecom',      '+1 (555) 456-1123', 'Retail Staff',      'Retail Outlets',        'Downtown Flagship (SH-01)',        'Active', '2023-06-10'),
('emp-03', 'EMP-1077', 'Marcus Ramirez',   'marcus.ramirez@nexus.telecom',  '+1 (555) 789-3344', 'Field Engineer',    'Technical Operations',  NULL,                              'Active', '2021-11-04'),
('emp-04', 'EMP-1090', 'Elena Rostova',    'elena.rostova@nexus.telecom',   '+1 (555) 901-5567', 'Senior Accountant', 'Finance & Accounts',    NULL,                              'Active', '2020-08-20'),
('emp-05', 'EMP-1105', 'Aiden Brooks',     'aiden.brooks@nexus.telecom',    '+1 (555) 345-6789', 'Retail Staff',      'Retail Outlets',        'Metro Uptown Hub (SH-02)',         'Active', '2024-01-15');
GO

-- ============================================================
-- 3. VENDORS (4 nhà cung cấp thiết bị)
-- ============================================================
INSERT INTO Vendors (Id, VendorCode, CompanyName, ContactPerson, Category, Phone, Email, Address, Rating, Status)
VALUES
('vnd-01', 'VND-401', 'Corning Optical Systems Ltd',         'Gregory Vance',  'Fiber Optics & Cabling', '+1 (800) 522-6789', 'sales@corning-telecom.com',    '800 Corning Way, Hickory, NC',            5, 'Active'),
('vnd-02', 'VND-402', 'Cisco Systems Commercial Hardware',   'Linda Morrison',  'Modems & Routers',      '+1 (800) 553-6387', 'enterprise-hw@cisco.com',      '170 West Tasman Dr, San Jose, CA',        5, 'Active'),
('vnd-03', 'VND-403', 'Zyxel Communications Corp',           'Kenji Sato',      'Modems & Routers',      '+1 (714) 632-0882', 'support-b2b@zyxel.com',        '1130 North Miller St, Anaheim, CA',       4, 'Active'),
('vnd-04', 'VND-404', 'Amphenol Telecom Assemblies',         'Rachel Ward',     'Telecom Switches',      '+1 (203) 265-8900', 'supply@amphenol-rf.com',       '358 Hall Avenue, Wallingford, CT',        4, 'Active');
GO

-- ============================================================
-- 4. RETAIL SHOPS (4 chi nhánh — mỗi cái có mã thành phố 3 số)
-- ============================================================
INSERT INTO RetailShops (Id, ShopCode, Name, City, CityCode, Address, ManagerName, Phone, OperatingHours, ActiveEmployeesCount, TotalSubscribersServed)
VALUES
('sh-01', 'SH-01', 'Downtown Nexus Flagship Store',    'New York', '064', '452 Broadway, Manhattan, NY 10013',              'David Chen',   '+1 (212) 555-0144', 'Mon-Sat: 08:30 - 20:00, Sun: 10:00 - 18:00', 6, 1420),
('sh-02', 'SH-02', 'Metro Uptown Tech Hub',            'New York', '064', '2190 Broadway, Upper West Side, NY 10024',       'Aiden Brooks',  '+1 (212) 555-0189', 'Mon-Sat: 09:00 - 19:30',                      4, 980),
('sh-03', 'SH-03', 'Queens Central Service Center',    'Queens',   '072', '70-20 Austin St, Forest Hills, NY 11375',        'Kavita Patel',  '+1 (718) 555-0199', 'Mon-Fri: 09:00 - 18:00, Sat: 09:00 - 15:00',  3, 750),
('sh-04', 'SH-04', 'Brooklyn Nexus Connect Depot',     'Brooklyn', '081', '320 Atlantic Ave, Boerum Hill, NY 11201',         'Robert Gomez',  '+1 (718) 555-0210', 'Mon-Sat: 09:00 - 19:00',                      5, 1120);
GO

-- ============================================================
-- 5. INVENTORY ITEMS (5 loại thiết bị trong kho)
-- ============================================================
INSERT INTO InventoryItems (Id, ItemCode, Name, Category, StockQuantity, ReorderLevel, UnitCost, Location, Supplier)
VALUES
('inv-01', 'EQ-ONT-FBR',  'Huawei EchoLife HG8245H5 GPON ONT',           'Fiber ONT',    145, 25, 55.00, 'Central Depot Bay 4A', 'Cisco Systems Commercial Hardware'),
('inv-02', 'EQ-RTR-AX',   'Nexus Wi-Fi 6 AX3000 Dual-Band Router',       'Router',        88, 20, 65.00, 'Central Depot Bay 2B', 'Zyxel Communications Corp'),
('inv-03', 'EQ-MDM-V92',  'USRobotics 56K V.92 Faxmodem USB/PSTN',       'Modem',         18, 10, 32.00, 'Central Depot Bay 7C', 'Amphenol Telecom Assemblies'),
('inv-04', 'EQ-ATA-VOIP', 'Grandstream HT802 2-Port Analog VoIP Adapter', 'VoIP Adapter',  42, 15, 28.00, 'Central Depot Bay 3C', 'Amphenol Telecom Assemblies'),
('inv-05', 'EQ-SPL-1X8',  'Corning 1x8 PLC Optical Fiber Splitter',      'Splitter',       9, 15, 14.50, 'Central Depot Bay 1A', 'Corning Optical Systems Ltd');
GO

-- ============================================================
-- 6. EQUIPMENTS (6 thiết bị cụ thể — 3 đang dùng, 3 trong kho)
-- ============================================================

-- Đang gán cho khách (In Service)
INSERT INTO Equipments (Id, SerialNumber, MacAddress, DeviceModel, DeviceType, AssignedAccountId, AssignedCustomerName, FirmwareVersion, Status, AssignedTechnician, InstalledDate)
VALUES
('eq-01', 'NX-HW-992810', 'BC:A9:93:21:44:8E', 'Huawei EchoLife HG8245H5 GPON ONT',           'Fiber ONT Modem',           'B064-000000000002', 'Victoria Sterling',          'V500R019C20SPC120',  'In Service', 'Marcus Ramirez', '2026-08-15'),
('eq-02', 'NX-ATA-881920', '00:0B:82:76:D4:11', 'Grandstream HT802 2-Port Analog VoIP Adapter', 'Analog Telephone Adapter',  'T064-000000000001', 'Highline Consulting LLC',    '1.0.35.3',           'In Service', 'Marcus Ramirez', '2026-09-02'),
('eq-03', 'NX-MD-110294',  'F8:E4:FB:99:A2:03', 'USRobotics 56K V.92 Faxmodem USB/PSTN',        'VDSL2/ADSL Modem',          'D064-000000000003', 'Retro Arcade Lounge LLC',    'v2.1.8-PSTN',        'In Service', 'Marcus Ramirez', '2026-07-10');

-- Trong kho sẵn sàng (In Stock)
INSERT INTO Equipments (Id, SerialNumber, MacAddress, DeviceModel, DeviceType, FirmwareVersion, Status)
VALUES
('eq-04', 'NX-HW-992811', '00:1A:2B:3C:4D:5E', 'Nexus Wi-Fi 6 AX3000 Dual-Band Router',  'Gigabit Router',    'v3.2.4-BUILD-921',  'In Stock'),
('eq-05', 'NX-HW-992812', '54:AF:97:88:B1:00', 'Huawei EchoLife HG8245H5 GPON ONT',       'Fiber ONT Modem',   'V500R019C20SPC120',  'In Stock'),
('eq-06', 'NX-HW-992813', 'A0:B1:C2:D3:E4:F5', 'Nexus Wi-Fi 6 AX3000 Dual-Band Router',  'Gigabit Router',    'v3.2.4-BUILD-921',  'In Stock');
GO

-- ============================================================
-- 7. SYSTEM SETTINGS (1 dòng duy nhất — singleton)
-- ============================================================
-- Nếu đã INSERT trong nexus_schema.sql thì bỏ qua block này.
IF NOT EXISTS (SELECT 1 FROM SystemSettings WHERE Id = 1)
BEGIN
    INSERT INTO SystemSettings (Id, ServiceTaxRate, LatePaymentFeePercent,
        DefaultDepositBroadband, DefaultDepositDialUp, DefaultDepositLandline,
        InstallationGracePeriodDays)
    VALUES (1, 12.24, 5.00, 500.00, 325.00, 250.00, 20);
END;
GO

-- ============================================================
-- VERIFY SEED DATA
-- ============================================================
SELECT 'Plans' AS [Table], COUNT(*) AS [Rows] FROM Plans
UNION ALL SELECT 'Employees', COUNT(*) FROM Employees
UNION ALL SELECT 'Vendors', COUNT(*) FROM Vendors
UNION ALL SELECT 'RetailShops', COUNT(*) FROM RetailShops
UNION ALL SELECT 'InventoryItems', COUNT(*) FROM InventoryItems
UNION ALL SELECT 'Equipments', COUNT(*) FROM Equipments
UNION ALL SELECT 'SystemSettings', COUNT(*) FROM SystemSettings;
GO
