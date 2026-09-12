-- ============================================================
-- NEXUS SERVICE MARKETING SYSTEM — SQL Server Normalized Schema (3NF)
-- Generated from: src/types/nexus.ts
-- Spec reference : SPEC-SUMMARY (1).md
-- ============================================================

-- 1. Service Plans (Danh mục gói cước)
-- Corresponds to: interface Plan
CREATE TABLE Plans (
    Id                  NVARCHAR(50)    PRIMARY KEY,
    Name                NVARCHAR(200)   NOT NULL,
    Type                NVARCHAR(20)    NOT NULL CHECK (Type IN ('Broadband', 'Dial-Up', 'Landline')),
    SpeedOrBandwidth    NVARCHAR(100)   NOT NULL,          -- e.g. "56 Kbps", "128 Kbps", "PSTN Voice"
    MonthlyRental       DECIMAL(10,2)   NOT NULL,           -- headline charge / pack price
    HourlyCharge        DECIMAL(10,2)   NULL,               -- for dial-up or metered plans
    SecurityDeposit     DECIMAL(10,2)   NOT NULL,           -- Broadband $500 / Dial-Up $325 / Landline $250
    DataLimit           NVARCHAR(50)    NULL,               -- e.g. "Unlimited", "60 Hours"
    Status              NVARCHAR(20)    NOT NULL DEFAULT 'Active' CHECK (Status IN ('Active', 'Archived')),
    Description         NVARCHAR(500)   NOT NULL DEFAULT '',
    BillingCycle        NVARCHAR(20)    NULL CHECK (BillingCycle IN ('Hourly Pack', 'Monthly', 'Quarterly', 'Half-Yearly', 'Yearly')),
    Validity            NVARCHAR(50)    NULL,               -- e.g. "1 Month", "6 Months", "1 Year"
    IncludedHours       INT             NULL,               -- hourly dial-up / broadband packs
    CallRates           NVARCHAR(300)   NULL                -- landline call charges summary
);

-- 2. Employees (Nhân viên nội bộ theo từng bộ phận)
-- Corresponds to: interface Employee
CREATE TABLE Employees (
    Id                  NVARCHAR(50)    PRIMARY KEY,
    EmployeeCode        NVARCHAR(20)    NOT NULL UNIQUE,    -- e.g. "EMP-1001"
    Name                NVARCHAR(200)   NOT NULL,
    Email               NVARCHAR(200)   NOT NULL,
    Phone               NVARCHAR(30)    NOT NULL,
    Role                NVARCHAR(30)    NOT NULL CHECK (Role IN ('Manager', 'Retail Staff', 'Field Engineer', 'Senior Accountant', 'Support Agent')),
    Department          NVARCHAR(50)    NOT NULL CHECK (Department IN ('Administration', 'Retail Outlets', 'Technical Operations', 'Finance & Accounts')),
    RetailShopAssigned  NVARCHAR(100)   NULL,              -- e.g. "Downtown Flagship (SH-01)"
    Status              NVARCHAR(20)    NOT NULL DEFAULT 'Active' CHECK (Status IN ('Active', 'Inactive')),
    DateOfJoining       DATE            NOT NULL
);

-- 3. Vendors (Nhà cung cấp vật tư thiết bị)
-- Corresponds to: interface Vendor
CREATE TABLE Vendors (
    Id                  NVARCHAR(50)    PRIMARY KEY,
    VendorCode          NVARCHAR(20)    NOT NULL UNIQUE,    -- e.g. "VND-401"
    CompanyName         NVARCHAR(200)   NOT NULL,
    ContactPerson       NVARCHAR(200)   NOT NULL,
    Category            NVARCHAR(50)    NOT NULL CHECK (Category IN ('Fiber Optics & Cabling', 'Modems & Routers', 'Telecom Switches', 'Field Tooling')),
    Phone               NVARCHAR(30)    NOT NULL,
    Email               NVARCHAR(200)   NOT NULL,
    Address             NVARCHAR(500)   NOT NULL,
    Rating              INT             NOT NULL CHECK (Rating BETWEEN 1 AND 5),
    Status              NVARCHAR(20)    NOT NULL DEFAULT 'Active' CHECK (Status IN ('Active', 'Pending Review', 'Terminated'))
);

-- 4. Retail Shops / Outlets (Hệ thống cửa hàng chi nhánh)
-- Corresponds to: interface RetailShop
CREATE TABLE RetailShops (
    Id                  NVARCHAR(50)    PRIMARY KEY,
    ShopCode            NVARCHAR(10)    NOT NULL UNIQUE,    -- e.g. "SH-01"
    Name                NVARCHAR(200)   NOT NULL,
    City                NVARCHAR(100)   NOT NULL,
    CityCode            CHAR(3)         NOT NULL,           -- 3-digit numeric code, used inside Account ID
    Address             NVARCHAR(500)   NOT NULL,
    ManagerName         NVARCHAR(200)   NOT NULL,
    Phone               NVARCHAR(30)    NOT NULL,
    OperatingHours      NVARCHAR(100)   NOT NULL,
    ActiveEmployeesCount INT            NOT NULL DEFAULT 0,
    TotalSubscribersServed INT          NOT NULL DEFAULT 0
);

-- 5. Stock / Inventory (Kho vật tư thiết bị)
-- Corresponds to: interface InventoryItem
CREATE TABLE InventoryItems (
    Id                  NVARCHAR(50)    PRIMARY KEY,
    ItemCode            NVARCHAR(20)    NOT NULL UNIQUE,    -- e.g. "EQ-FBR-01"
    Name                NVARCHAR(200)   NOT NULL,
    Category            NVARCHAR(30)    NOT NULL CHECK (Category IN ('Modem', 'Router', 'Fiber ONT', 'Splitter', 'Patch Cord', 'VoIP Adapter')),
    StockQuantity       INT             NOT NULL DEFAULT 0,
    ReorderLevel        INT             NOT NULL DEFAULT 0,
    UnitCost            DECIMAL(10,2)   NOT NULL,
    Location            NVARCHAR(200)   NOT NULL,
    Supplier            NVARCHAR(200)   NOT NULL
);

-- 6. Customers (Chuẩn hóa thực thể Thuê bao / Khách hàng - 3NF)
-- Corresponds to: interface Customer
CREATE TABLE Customers (
    Id                  NVARCHAR(50)    PRIMARY KEY,    -- e.g. "cust-01"
    FullName            NVARCHAR(200)   NOT NULL,
    Phone               NVARCHAR(30)    NOT NULL,
    Email               NVARCHAR(200)   NOT NULL,
    InstallationAddress NVARCHAR(500)   NOT NULL,
    IdProofType         NVARCHAR(30)    NOT NULL CHECK (IdProofType IN ('National ID Card', 'Passport', 'Driver''s License')),
    IdProofNumber       NVARCHAR(50)    NOT NULL,
    CreatedAt           DATETIME2       NOT NULL DEFAULT GETDATE()
);

CREATE INDEX IX_Customers_Phone ON Customers(Phone);
CREATE INDEX IX_Customers_IdProofNumber ON Customers(IdProofNumber);

-- 7. Orders (Đơn đăng ký dịch vụ & Khảo sát kỹ thuật)
-- Corresponds to: interface Order
-- Order ID: 11-char alphanumeric, prefix D/B/T + 10-digit serial (spec §3)
CREATE TABLE Orders (
    Id                  CHAR(11)        PRIMARY KEY,    -- e.g. "D0000000001", "B0000000002"
    CustomerId          NVARCHAR(50)    NOT NULL REFERENCES Customers(Id),
    ConnectionType      NVARCHAR(20)    NOT NULL CHECK (ConnectionType IN ('Broadband', 'Dial-Up', 'Landline')),
    PlanId              NVARCHAR(50)    NOT NULL REFERENCES Plans(Id),
    RetailOutletCode    NVARCHAR(10)    NOT NULL REFERENCES RetailShops(ShopCode),
    RetailEmployeeName  NVARCHAR(200)   NOT NULL,
    CreatedAt           DATETIME2       NOT NULL DEFAULT GETDATE(),
    Status              NVARCHAR(30)    NOT NULL DEFAULT 'Pending' CHECK (Status IN ('Pending', 'Feasible', 'Not Feasible', 'Connection Provided')),
    
    -- Feasibility Telemetry Fields (Khảo sát kỹ thuật đo kiểm hiện trường)
    FeasibilityNotes    NVARCHAR(1000)  NULL,
    CableDistanceMeters INT             NULL,
    DpBoxCapacity       NVARCHAR(100)   NULL,
    SignalLossDbm       DECIMAL(6,2)    NULL,
    AssignedAccountId   NVARCHAR(20)    NULL,           -- Account ID cấp khi Feasible (16-17 chars)

    -- Bulk / corporate scheme (spec §4)
    BulkConnectionsCount INT            NOT NULL DEFAULT 1,
    BulkDiscountPercent  INT            NOT NULL DEFAULT 0 CHECK (BulkDiscountPercent IN (0, 25, 50, 75, 100)),

    -- Group linking (mở rộng ngoài spec — xem SPEC-SUMMARY §2)
    OrderGroupId        NVARCHAR(50)    NULL,           -- e.g. "GRP-1726142775001"
    OrderGroupIndex     INT             NULL,           -- 1-based position within group

    -- Dial-Up dual-leg feasibility (spec §7)
    ExistingLandlineAccountId NVARCHAR(20) NULL,
    LandlineFeasible    BIT             NULL,
    InternetFeasible    BIT             NULL
);

CREATE INDEX IX_Orders_CustomerId ON Orders(CustomerId);
CREATE INDEX IX_Orders_OrderGroupId ON Orders(OrderGroupId) WHERE OrderGroupId IS NOT NULL;
CREATE INDEX IX_Orders_Status ON Orders(Status);
CREATE INDEX IX_Orders_AssignedAccountId ON Orders(AssignedAccountId) WHERE AssignedAccountId IS NOT NULL;

-- 8. Customer Connections (Đường truyền kết nối đang hoạt động)
-- Corresponds to: interface Connection
-- Account ID format: [D/B/T] + city(3) + serial(12) (e.g. "B064-000000000005")
CREATE TABLE Connections (
    AccountId           NVARCHAR(20)    PRIMARY KEY,    -- 16-17 chars
    OrderId             CHAR(11)        NOT NULL REFERENCES Orders(Id),
    CustomerId          NVARCHAR(50)    NOT NULL REFERENCES Customers(Id),
    PlanId              NVARCHAR(50)    NOT NULL REFERENCES Plans(Id),
    ConnectionType      NVARCHAR(20)    NOT NULL CHECK (ConnectionType IN ('Broadband', 'Dial-Up', 'Landline')),
    MonthlyRental       DECIMAL(10,2)   NOT NULL,
    SecurityDeposit     DECIMAL(10,2)   NOT NULL,
    Status              NVARCHAR(30)    NOT NULL DEFAULT 'Active' CHECK (Status IN ('Active', 'Temporarily Inactive', 'Permanently Inactive')),
    
    -- Network runtime telemetry (Thông số mạng khi online)
    IpAddress           NVARCHAR(45)    NULL,
    PortNumber          NVARCHAR(30)    NULL,
    InstalledDate       DATE            NOT NULL,
    LastUpdated         DATETIME2       NOT NULL DEFAULT GETDATE(),
    LastStatusReason    NVARCHAR(500)   NULL
);

CREATE INDEX IX_Connections_OrderId ON Connections(OrderId);
CREATE INDEX IX_Connections_CustomerId ON Connections(CustomerId);

-- 9. Equipment / Product Details (Quản lý thiết bị gán cho khách hàng)
-- Corresponds to: interface Equipment
-- Quan hệ 1:1 qua AssignedAccountId (thiết bị trỏ tới đúng kết nối đang phục vụ)
CREATE TABLE Equipments (
    Id                  NVARCHAR(50)    PRIMARY KEY,
    SerialNumber        NVARCHAR(50)    NOT NULL UNIQUE,    -- e.g. "NX-HW-992810"
    MacAddress          NVARCHAR(20)    NOT NULL,           -- e.g. "BC:A9:93:21:44:8E"
    DeviceModel         NVARCHAR(200)   NOT NULL,
    DeviceType          NVARCHAR(50)    NOT NULL CHECK (DeviceType IN ('Fiber ONT Modem', 'VDSL2/ADSL Modem', 'Gigabit Router', 'Analog Telephone Adapter')),
    AssignedAccountId   NVARCHAR(20)    NULL REFERENCES Connections(AccountId),
    FirmwareVersion     NVARCHAR(50)    NOT NULL,
    Status              NVARCHAR(20)    NOT NULL DEFAULT 'In Stock' CHECK (Status IN ('In Service', 'In Stock', 'Maintenance', 'Faulty')),
    AssignedTechnician  NVARCHAR(200)   NULL,
    InstalledDate       DATE            NULL
);

CREATE INDEX IX_Equipments_AssignedAccountId ON Equipments(AssignedAccountId) WHERE AssignedAccountId IS NOT NULL;
CREATE INDEX IX_Equipments_Status ON Equipments(Status);

-- 10. Billing & Invoices (Hóa đơn cước phí)
-- Corresponds to: interface Bill
CREATE TABLE Bills (
    Id                  NVARCHAR(50)    PRIMARY KEY,
    InvoiceNumber       NVARCHAR(30)    NOT NULL UNIQUE,    -- e.g. "NEX-INV-2025-001"
    AccountId           NVARCHAR(20)    NOT NULL REFERENCES Connections(AccountId),
    BillingMonth        NVARCHAR(30)    NOT NULL,           -- e.g. "September 2026"
    BillingDate         DATE            NOT NULL,
    DueDate             DATE            NOT NULL,

    -- Financial Snapshot Breakdowns (spec §5 - lưu vết số tiền thời điểm xuất bill)
    SecurityDeposit     DECIMAL(10,2)   NOT NULL DEFAULT 0,
    MonthlyRental       DECIMAL(10,2)   NOT NULL DEFAULT 0,
    HourlyCharges       DECIMAL(10,2)   NOT NULL DEFAULT 0,
    DiscountPercent     DECIMAL(5,2)    NOT NULL DEFAULT 0,
    DiscountAmount      DECIMAL(10,2)   NOT NULL DEFAULT 0,
    Subtotal            DECIMAL(10,2)   NOT NULL DEFAULT 0,
    ServiceTaxRate      DECIMAL(5,2)    NOT NULL DEFAULT 12.24, -- spec: 12.24%
    ServiceTaxAmount    DECIMAL(10,2)   NOT NULL DEFAULT 0,
    TotalAmount         DECIMAL(10,2)   NOT NULL DEFAULT 0,

    -- Payment Status Tracking
    AmountPaid          DECIMAL(10,2)   NOT NULL DEFAULT 0,
    DueAmount           DECIMAL(10,2)   NOT NULL DEFAULT 0,
    Status              NVARCHAR(20)    NOT NULL DEFAULT 'Unpaid' CHECK (Status IN ('Paid', 'Partially Paid', 'Unpaid'))
);

CREATE INDEX IX_Bills_AccountId ON Bills(AccountId);
CREATE INDEX IX_Bills_Status ON Bills(Status);

-- 10b. Payment Records (Lịch sử thanh toán của từng hóa đơn)
-- Corresponds to: interface PaymentRecord
CREATE TABLE PaymentRecords (
    PaymentId           NVARCHAR(50)    PRIMARY KEY,
    BillId              NVARCHAR(50)    NOT NULL REFERENCES Bills(Id),
    PaymentDate         DATETIME2       NOT NULL DEFAULT GETDATE(),
    AmountPaid          DECIMAL(10,2)   NOT NULL,
    PaymentMode         NVARCHAR(30)    NOT NULL CHECK (PaymentMode IN ('Cash', 'Cheque', 'Credit/Debit Card', 'Bank Transfer/NEFT', 'UPI/Digital Wallet')),
    ReferenceNumber     NVARCHAR(100)   NOT NULL DEFAULT '',
    RecordedByEmployeeId NVARCHAR(50)   NULL REFERENCES Employees(Id)
);

CREATE INDEX IX_PaymentRecords_BillId ON PaymentRecords(BillId);

-- 11. Customer Feedback (Phản hồi khách hàng)
-- Corresponds to: interface Feedback
CREATE TABLE Feedbacks (
    Id                  NVARCHAR(50)    PRIMARY KEY,
    AccountId           NVARCHAR(20)    NULL REFERENCES Connections(AccountId),
    OrderId             CHAR(11)        NULL REFERENCES Orders(Id),
    Rating              INT             NOT NULL CHECK (Rating BETWEEN 1 AND 5),
    Category            NVARCHAR(30)    NOT NULL CHECK (Category IN ('Service Quality', 'Installation', 'Billing', 'Support', 'Other')),
    Message             NVARCHAR(2000)  NOT NULL,
    CreatedAt           DATETIME2       NOT NULL DEFAULT GETDATE(),
    Response            NVARCHAR(2000)  NULL,
    RespondedByEmployeeId NVARCHAR(50)  NULL REFERENCES Employees(Id),
    RespondedAt         DATETIME2       NULL
);

-- 12. System Settings (Cấu hình chung hệ thống)
-- Corresponds to: interface SystemSettings
CREATE TABLE SystemSettings (
    Id                          INT             PRIMARY KEY DEFAULT 1 CHECK (Id = 1),
    ServiceTaxRate              DECIMAL(5,2)    NOT NULL DEFAULT 12.24,
    LatePaymentFeePercent       DECIMAL(5,2)    NOT NULL DEFAULT 5.00,
    DefaultDepositBroadband     DECIMAL(10,2)   NOT NULL DEFAULT 500.00,
    DefaultDepositDialUp        DECIMAL(10,2)   NOT NULL DEFAULT 325.00,
    DefaultDepositLandline      DECIMAL(10,2)   NOT NULL DEFAULT 250.00,
    InstallationGracePeriodDays INT             NOT NULL DEFAULT 20
);

-- Cài đặt mặc định
INSERT INTO SystemSettings (Id, ServiceTaxRate, LatePaymentFeePercent,
    DefaultDepositBroadband, DefaultDepositDialUp, DefaultDepositLandline,
    InstallationGracePeriodDays)
VALUES (1, 12.24, 5.00, 500.00, 325.00, 250.00, 20);
GO
