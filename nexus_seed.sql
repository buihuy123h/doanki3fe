-- ============================================================
-- NEXUS SERVICE MARKETING SYSTEM — Normalized Seed Data (3NF)
-- Source: NexusContext.ts INITIAL_* arrays
-- Run AFTER nexus_schema.sql
-- ============================================================

-- ============================================================
-- 1. PLANS (14 gói cước chuẩn spec §5)
-- ============================================================
INSERT INTO Plans (Id, Name, Type, SpeedOrBandwidth, MonthlyRental, SecurityDeposit, DataLimit, Status, BillingCycle, Validity, IncludedHours, Description)
VALUES
('plan-du-h10', 'Dial-Up Hourly 10 Hrs', 'Dial-Up', '56 Kbps V.92', 50.00, 325.00, '10 Hours', 'Active', 'Hourly Pack', '1 Month', 10, 'Prepaid 10-hour dial-up pack, valid for one month.'),
('plan-du-h30', 'Dial-Up Hourly 30 Hrs', 'Dial-Up', '56 Kbps V.92', 130.00, 325.00, '30 Hours', 'Active', 'Hourly Pack', '3 Months', 30, 'Prepaid 30-hour dial-up pack, valid for three months.'),
('plan-du-h60', 'Dial-Up Hourly 60 Hrs', 'Dial-Up', '56 Kbps V.92', 260.00, 325.00, '60 Hours', 'Active', 'Hourly Pack', '6 Months', 60, 'Prepaid 60-hour dial-up pack, valid for six months.'),
('plan-du-28', 'Dial-Up Unlimited 28 Kbps', 'Dial-Up', '28 Kbps', 75.00, 325.00, 'Unlimited', 'Active', 'Monthly', '1 Month', NULL, 'Unlimited dial-up access at 28 Kbps. Quarterly billing also available at $150.'),
('plan-du-56', 'Dial-Up Unlimited 56 Kbps', 'Dial-Up', '56 Kbps', 100.00, 325.00, 'Unlimited', 'Active', 'Monthly', '1 Month', NULL, 'Unlimited dial-up access at 56 Kbps. Quarterly billing also available at $180.'),

('plan-bb-h30', 'Broadband Hourly 30 Hrs', 'Broadband', 'Broadband', 175.00, 500.00, '30 Hours', 'Active', 'Hourly Pack', '1 Month', 30, 'Prepaid 30-hour broadband pack, valid for one month.'),
('plan-bb-h60', 'Broadband Hourly 60 Hrs', 'Broadband', 'Broadband', 315.00, 500.00, '60 Hours', 'Active', 'Hourly Pack', '6 Months', 60, 'Prepaid 60-hour broadband pack, valid for six months.'),
('plan-bb-64', 'Broadband Unlimited 64 Kbps', 'Broadband', '64 Kbps', 225.00, 500.00, 'Unlimited', 'Active', 'Monthly', '1 Month', NULL, 'Unlimited broadband at 64 Kbps. Quarterly billing also available at $400.'),
('plan-bb-128', 'Broadband Unlimited 128 Kbps', 'Broadband', '128 Kbps', 350.00, 500.00, 'Unlimited', 'Active', 'Monthly', '1 Month', NULL, 'Unlimited broadband at 128 Kbps. Quarterly billing also available at $445.'),

('plan-ll-local-y', 'Landline Local — Unlimited (Yearly)', 'Landline', 'PSTN Voice', 75.00, 250.00, 'Unlimited Local', 'Active', 'Yearly', '1 Year', NULL, 'Local plan, yearly rental. Call charges billed on top of the rental.'),
('plan-ll-local-m', 'Landline Local — Monthly', 'Landline', 'PSTN Voice', 35.00, 250.00, 'Local Calling', 'Active', 'Monthly', '1 Month', NULL, 'Local plan, monthly rental. Call charges billed on top of the rental.'),
('plan-ll-std-m', 'Landline STD — Monthly', 'Landline', 'PSTN Voice', 125.00, 250.00, 'Local + STD', 'Active', 'Monthly', '1 Month', NULL, 'STD plan, monthly rental with local, STD and mobile-messaging call charges.'),
('plan-ll-std-h', 'Landline STD — Half-Yearly', 'Landline', 'PSTN Voice', 420.00, 250.00, 'Local + STD', 'Active', 'Half-Yearly', '6 Months', NULL, 'STD plan, half-yearly rental with reduced call charges.'),
('plan-ll-std-y', 'Landline STD — Yearly', 'Landline', 'PSTN Voice', 780.00, 250.00, 'Local + STD', 'Active', 'Yearly', '1 Year', NULL, 'STD plan, yearly rental with the lowest call charges.');
GO

-- ============================================================
-- 2. EMPLOYEES (5 nhân viên)
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
-- 3. VENDORS (4 nhà cung cấp)
-- ============================================================
INSERT INTO Vendors (Id, VendorCode, CompanyName, ContactPerson, Category, Phone, Email, Address, Rating, Status)
VALUES
('vnd-01', 'VND-401', 'Corning Optical Systems Ltd',         'Gregory Vance',  'Fiber Optics & Cabling', '+1 (800) 522-6789', 'sales@corning-telecom.com',    '800 Corning Way, Hickory, NC',            5, 'Active'),
('vnd-02', 'VND-402', 'Cisco Systems Commercial Hardware',   'Linda Morrison',  'Modems & Routers',      '+1 (800) 553-6387', 'enterprise-hw@cisco.com',      '170 West Tasman Dr, San Jose, CA',        5, 'Active'),
('vnd-03', 'VND-403', 'Zyxel Communications Corp',           'Kenji Sato',      'Modems & Routers',      '+1 (714) 632-0882', 'support-b2b@zyxel.com',        '1130 North Miller St, Anaheim, CA',       4, 'Active'),
('vnd-04', 'VND-404', 'Amphenol Telecom Assemblies',         'Rachel Ward',     'Telecom Switches',      '+1 (203) 265-8900', 'supply@amphenol-rf.com',       '358 Hall Avenue, Wallingford, CT',        4, 'Active');
GO

-- ============================================================
-- 4. RETAIL SHOPS (4 cửa hàng)
-- ============================================================
INSERT INTO RetailShops (Id, ShopCode, Name, City, CityCode, Address, ManagerName, Phone, OperatingHours, ActiveEmployeesCount, TotalSubscribersServed)
VALUES
('sh-01', 'SH-01', 'Downtown Nexus Flagship Store',    'New York', '064', '452 Broadway, Manhattan, NY 10013',              'David Chen',   '+1 (212) 555-0144', 'Mon-Sat: 08:30 - 20:00, Sun: 10:00 - 18:00', 6, 1420),
('sh-02', 'SH-02', 'Metro Uptown Tech Hub',            'New York', '064', '2190 Broadway, Upper West Side, NY 10024',       'Aiden Brooks',  '+1 (212) 555-0189', 'Mon-Sat: 09:00 - 19:30',                      4, 980),
('sh-03', 'SH-03', 'Queens Central Service Center',    'Queens',   '072', '70-20 Austin St, Forest Hills, NY 11375',        'Kavita Patel',  '+1 (718) 555-0199', 'Mon-Fri: 09:00 - 18:00, Sat: 09:00 - 15:00',  3, 750),
('sh-04', 'SH-04', 'Brooklyn Nexus Connect Depot',     'Brooklyn', '081', '320 Atlantic Ave, Boerum Hill, NY 11201',         'Robert Gomez',  '+1 (718) 555-0210', 'Mon-Sat: 09:00 - 19:00',                      5, 1120);
GO

-- ============================================================
-- 5. INVENTORY ITEMS (Kho vật tư)
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
-- 6. CUSTOMERS (Bảng khách hàng chuẩn hóa 3NF)
-- ============================================================
INSERT INTO Customers (Id, FullName, Phone, Email, InstallationAddress, IdProofType, IdProofNumber, CreatedAt)
VALUES
('cust-01', 'Arthur Pendelton',       '+1 (555) 902-1844', 'arthur.p@classiccorp.net',     '144 West 82nd St, Apt 4B, New York, NY 10024',   'National ID Card', 'ID-US-9918231', '2026-09-04 10:30'),
('cust-02', 'Samantha Vance',         '+1 (555) 301-4477', 'samantha.vance@gmail.com',      '78 Mercer St, Soho, New York, NY 10012',         'Passport',         'P-98827419',    '2026-09-04 14:15'),
('cust-03', 'Highline Consulting LLC', '+1 (555) 777-8899', 'office@highlineconsulting.com', '55 Hudson Yards, Fl 18, New York, NY 10001',     'Driver''s License', 'DL-NY-2940192',  '2026-09-02 09:00'),
('cust-04', 'Robert Lewandowski',     '+1 (555) 621-9988', 'robert.lewan@yahoo.com',       '89-12 Far Rockaway Blvd, Queens, NY 11693',       'National ID Card', 'ID-US-8827391', '2026-09-03 11:45'),
('cust-05', 'Victoria Sterling',      '+1 (555) 441-2099', 'v.sterling@apexlegal.org',      '120 E 64th St, Manhattan, NY 10065',             'Passport',         'P-11928472',    '2026-08-14 09:00'),
('cust-06', 'Retro Arcade Lounge LLC', '+1 (555) 332-9011', 'manager@retroarcadeny.com',    '31 St Marks pl, East Village, NY 10003',         'Driver''s License', 'DL-NY-8829101',  '2026-07-09 14:00'),
('cust-07', 'Jonathan Meyer',         '+1 (555) 881-2300', 'j.meyer@brooklynloft.io',       '175 Water St, Dumbo, Brooklyn, NY 11201',        'National ID Card', 'ID-US-5544129', '2026-05-17 11:00');
GO

-- ============================================================
-- 7. ORDERS (Đơn hàng & Khảo sát đo kiểm)
-- ============================================================
INSERT INTO Orders (Id, CustomerId, ConnectionType, PlanId, RetailOutletCode, RetailEmployeeName, CreatedAt, Status, AssignedAccountId, FeasibilityNotes, CableDistanceMeters, DpBoxCapacity, SignalLossDbm, BulkConnectionsCount, BulkDiscountPercent, LandlineFeasible, InternetFeasible)
VALUES
('D0000000001', 'cust-01', 'Dial-Up',   'plan-du-56',   'SH-02', 'David Chen',   '2026-09-04 10:30', 'Pending',             NULL,                 NULL,                                                                                                                 420,  'Port 6 Available / DP-B12', -18.5, 1,  0,  NULL, NULL),
('B0000000002', 'cust-02', 'Broadband', 'plan-bb-128',  'SH-01', 'David Chen',   '2026-09-04 14:15', 'Feasible',            'B064-000000000005',  'Fiber termination box available within 85m. Signal strength -16.2 dBm (Excellent). Line tested OK.',                 85,   'Port 2 Available / DP-S04', -16.2, 1,  0,  NULL, 1),
('T0000000003', 'cust-03', 'Landline',  'plan-ll-std-m','SH-01', 'David Chen',   '2026-09-02 09:00', 'Connection Provided', 'T064-000000000001',  'Copper loop line deployed. Line tested and audio quality verified.',                                                 120,  'Port 8 Dedicated',          -15.1, 12, 25, 1,    NULL),
('B0000000004', 'cust-04', 'Broadband', 'plan-bb-64',   'SH-03', 'Aiden Brooks', '2026-09-03 11:45', 'Not Feasible',        NULL,                 'Distance to nearest fiber distribution box exceeds 1,150 meters. Severe optical attenuation (-34 dBm). Main trunk ext.', 1150, 'No Spare Ports',           -34.0, 1,  0,  NULL, 0),
('B0000000005', 'cust-05', 'Broadband', 'plan-bb-64',   'SH-01', 'David Chen',   '2026-08-14 09:00', 'Connection Provided', 'B064-000000000002',  'Fiber connection verified.',                                                                                          95,   'Port 1 Available',          -17.0, 1,  0,  NULL, 1),
('D0000000006', 'cust-06', 'Dial-Up',   'plan-du-56',   'SH-01', 'David Chen',   '2026-07-09 14:00', 'Connection Provided', 'D064-000000000003',  'Line operational.',                                                                                                  210,  'Port 3 Dedicated',          -19.0, 1,  0,  1,    1),
('B0000000007', 'cust-07', 'Broadband', 'plan-bb-64',   'SH-04', 'Robert Gomez', '2026-05-17 11:00', 'Connection Provided', 'B081-000000000004',  'Installation complete.',                                                                                             110,  'Port 4 Available',          -18.2, 1,  0,  NULL, 1);
GO

-- ============================================================
-- 8. CONNECTIONS (Đường truyền đã cấp)
-- ============================================================
INSERT INTO Connections (AccountId, OrderId, CustomerId, PlanId, ConnectionType, MonthlyRental, SecurityDeposit, Status, IpAddress, PortNumber, InstalledDate, LastUpdated, LastStatusReason)
VALUES
('T064-000000000001', 'T0000000003', 'cust-03', 'plan-ll-std-m', 'Landline',  125.00, 250.00, 'Active',               '198.51.100.42', 'VOIP-ETH-1', '2026-09-02', '2026-09-02 16:30', NULL),
('B064-000000000002', 'B0000000005', 'cust-05', 'plan-bb-64',    'Broadband', 225.00, 500.00, 'Active',               '203.0.113.88',  'GPON-0/1/4', '2026-08-15', '2026-08-15 11:20', NULL),
('D064-000000000003', 'D0000000006', 'cust-06', 'plan-du-56',    'Dial-Up',   100.00, 325.00, 'Temporarily Inactive', '192.0.2.14',    'PSTN-LINE-4', '2026-07-10', '2026-09-01 09:15', 'Customer requested seasonal suspension during venue renovation.'),
('B081-000000000004', 'B0000000007', 'cust-07', 'plan-bb-64',    'Broadband', 225.00, 500.00, 'Permanently Inactive', NULL,            NULL,          '2026-05-18', '2026-08-30 17:00', 'Tenant relocated outside coverage zone; equipment returned and de-provisioned.');
GO

-- ============================================================
-- 9. EQUIPMENTS (Thiết bị gán kết nối hoặc trong kho)
-- ============================================================
INSERT INTO Equipments (Id, SerialNumber, MacAddress, DeviceModel, DeviceType, AssignedAccountId, FirmwareVersion, Status, AssignedTechnician, InstalledDate)
VALUES
('eq-01', 'NX-HW-992810', 'BC:A9:93:21:44:8E', 'Huawei EchoLife HG8245H5 GPON ONT',           'Fiber ONT Modem',          'B064-000000000002', 'V500R019C20SPC120', 'In Service', 'Marcus Ramirez', '2026-08-15'),
('eq-02', 'NX-ATA-881920', '00:0B:82:76:D4:11', 'Grandstream HT802 2-Port Analog VoIP Adapter', 'Analog Telephone Adapter', 'T064-000000000001', '1.0.35.3',          'In Service', 'Marcus Ramirez', '2026-09-02'),
('eq-03', 'NX-MD-110294',  'F8:E4:FB:99:A2:03', 'USRobotics 56K V.92 Faxmodem USB/PSTN',        'VDSL2/ADSL Modem',         'D064-000000000003', 'v2.1.8-PSTN',       'In Service', 'Marcus Ramirez', '2026-07-10'),
('eq-04', 'NX-HW-992811', '00:1A:2B:3C:4D:5E', 'Nexus Wi-Fi 6 AX3000 Dual-Band Router',         'Gigabit Router',           NULL,                'v3.2.4-BUILD-921',  'In Stock',   NULL,             NULL),
('eq-05', 'NX-HW-992812', '54:AF:97:88:B1:00', 'Huawei EchoLife HG8245H5 GPON ONT',           'Fiber ONT Modem',          NULL,                'V500R019C20SPC120', 'In Stock',   NULL,             NULL),
('eq-06', 'NX-HW-992813', 'A0:B1:C2:D3:E4:F5', 'Nexus Wi-Fi 6 AX3000 Dual-Band Router',         'Gigabit Router',           NULL,                'v3.2.4-BUILD-921',  'In Stock',   NULL,             NULL);
GO

-- ============================================================
-- 10. BILLS & PAYMENT RECORDS (Hóa đơn và thanh toán)
-- ============================================================
INSERT INTO Bills (Id, InvoiceNumber, AccountId, BillingMonth, BillingDate, DueDate, SecurityDeposit, MonthlyRental, HourlyCharges, DiscountPercent, DiscountAmount, Subtotal, ServiceTaxRate, ServiceTaxAmount, TotalAmount, AmountPaid, DueAmount, Status)
VALUES
('bill-01', 'NEX-INV-2026-001', 'B064-000000000002', 'August 2026',    '2026-08-15', '2026-09-05', 500.00, 225.00, 0.00, 0.00,  0.00,  725.00, 12.24, 88.74, 813.74, 813.74, 0.00,   'Paid'),
('bill-02', 'NEX-INV-2026-002', 'T064-000000000001', 'September 2026', '2026-09-02', '2026-09-22', 250.00, 125.00, 0.00, 25.00, 93.75, 281.25, 12.24, 34.43, 315.68, 100.00, 215.68, 'Partially Paid');
GO

INSERT INTO PaymentRecords (PaymentId, BillId, PaymentDate, AmountPaid, PaymentMode, ReferenceNumber, RecordedByEmployeeId)
VALUES
('PAY-89201', 'bill-01', '2026-08-20', 813.74, 'Credit/Debit Card',   'TXN-VISA-994821', 'emp-04'),
('PAY-89205', 'bill-02', '2026-09-03', 100.00, 'Bank Transfer/NEFT',   'ACH-CITI-449102', 'emp-04');
GO

-- ============================================================
-- 11. CUSTOMER FEEDBACKS
-- ============================================================
INSERT INTO Feedbacks (Id, AccountId, OrderId, Rating, Category, Message, CreatedAt, Response, RespondedByEmployeeId, RespondedAt)
VALUES
('fb-01', 'B064-000000000002', 'B0000000005', 5, 'Installation', 'Field engineer arrived on time and the fibre line was live within an hour. Very smooth.', '2026-08-16 09:12', 'Thank you for the kind words — we have shared this with the SH-01 install team.', 'emp-01', '2026-08-16 15:40'),
('fb-02', 'D064-000000000003', 'D0000000006', 3, 'Support',      'Took two calls to get the seasonal suspension applied. Please make this self-service.',     '2026-09-01 11:05', NULL, NULL, NULL);
GO

-- ============================================================
-- VERIFY SEED DATA
-- ============================================================
SELECT 'Plans' AS [Table], COUNT(*) AS [Rows] FROM Plans
UNION ALL SELECT 'Employees', COUNT(*) FROM Employees
UNION ALL SELECT 'Vendors', COUNT(*) FROM Vendors
UNION ALL SELECT 'RetailShops', COUNT(*) FROM RetailShops
UNION ALL SELECT 'InventoryItems', COUNT(*) FROM InventoryItems
UNION ALL SELECT 'Customers', COUNT(*) FROM Customers
UNION ALL SELECT 'Orders', COUNT(*) FROM Orders
UNION ALL SELECT 'Connections', COUNT(*) FROM Connections
UNION ALL SELECT 'Equipments', COUNT(*) FROM Equipments
UNION ALL SELECT 'Bills', COUNT(*) FROM Bills
UNION ALL SELECT 'PaymentRecords', COUNT(*) FROM PaymentRecords
UNION ALL SELECT 'Feedbacks', COUNT(*) FROM Feedbacks
UNION ALL SELECT 'SystemSettings', COUNT(*) FROM SystemSettings;
GO
