-- ============================================================
-- NEXUS SERVICE MARKETING SYSTEM — SQL Server Database Schema
-- Generated from: src/types/nexus.ts
-- Spec reference : SPEC-SUMMARY (1).md
-- ============================================================

-- 1. Service Plans
-- Corresponds to: interface Plan
CREATE TABLE Plans (
    Id              NVARCHAR(50)    PRIMARY KEY,
    Name            NVARCHAR(200)   NOT NULL,
    Type            NVARCHAR(20)    NOT NULL CHECK (Type IN ('Broadband', 'Dial-Up', 'Landline')),
    SpeedOrBandwidth NVARCHAR(100)  NOT NULL,          -- e.g. "56 Kbps", "128 Kbps", "PSTN Voice"
    MonthlyRental   DECIMAL(10,2)   NOT NULL,           -- headline charge / pack price
    HourlyCharge    DECIMAL(10,2)   NULL,               -- for dial-up or metered plans
    SecurityDeposit DECIMAL(10,2)   NOT NULL,           -- Broadband $500 / Dial-Up $325 / Landline $250
    DataLimit       NVARCHAR(50)    NULL,               -- e.g. "Unlimited", "60 Hours"
    Status          NVARCHAR(20)    NOT NULL DEFAULT 'Active' CHECK (Status IN ('Active', 'Archived')),
    Description     NVARCHAR(500)   NOT NULL DEFAULT '',
    BillingCycle    NVARCHAR(20)    NULL CHECK (BillingCycle IN ('Hourly Pack', 'Monthly', 'Quarterly', 'Half-Yearly', 'Yearly')),
    Validity        NVARCHAR(50)    NULL,               -- e.g. "1 Month", "6 Months", "1 Year"
    IncludedHours   INT             NULL,               -- hourly dial-up / broadband packs
    CallRates       NVARCHAR(300)   NULL                -- landline call charges summary
);

-- 2. Employees (Admin Management)
-- Corresponds to: interface Employee
CREATE TABLE Employees (
    Id              NVARCHAR(50)    PRIMARY KEY,
    EmployeeCode    NVARCHAR(20)    NOT NULL UNIQUE,    -- e.g. "EMP-1001"
    Name            NVARCHAR(200)   NOT NULL,
    Email           NVARCHAR(200)   NOT NULL,
    Phone           NVARCHAR(30)    NOT NULL,
    Role            NVARCHAR(30)    NOT NULL CHECK (Role IN ('Manager', 'Retail Staff', 'Field Engineer', 'Senior Accountant', 'Support Agent')),
    Department      NVARCHAR(50)    NOT NULL CHECK (Department IN ('Administration', 'Retail Outlets', 'Technical Operations', 'Finance & Accounts')),
    RetailShopAssigned NVARCHAR(100) NULL,              -- e.g. "Downtown Flagship (SH-01)"
    Status          NVARCHAR(20)    NOT NULL DEFAULT 'Active' CHECK (Status IN ('Active', 'Inactive')),
    DateOfJoining   DATE            NOT NULL
);

-- 3. Vendors (Admin Management)
-- Corresponds to: interface Vendor
CREATE TABLE Vendors (
    Id              NVARCHAR(50)    PRIMARY KEY,
    VendorCode      NVARCHAR(20)    NOT NULL UNIQUE,    -- e.g. "VND-401"
    CompanyName     NVARCHAR(200)   NOT NULL,
    ContactPerson   NVARCHAR(200)   NOT NULL,
    Category        NVARCHAR(50)    NOT NULL CHECK (Category IN ('Fiber Optics & Cabling', 'Modems & Routers', 'Telecom Switches', 'Field Tooling')),
    Phone           NVARCHAR(30)    NOT NULL,
    Email           NVARCHAR(200)   NOT NULL,
    Address         NVARCHAR(500)   NOT NULL,
    Rating          INT             NOT NULL CHECK (Rating BETWEEN 1 AND 5),
    Status          NVARCHAR(20)    NOT NULL DEFAULT 'Active' CHECK (Status IN ('Active', 'Pending Review', 'Terminated'))
);

-- 4. Retail Shops / Outlets (Admin Management)
-- Corresponds to: interface RetailShop
CREATE TABLE RetailShops (
    Id              NVARCHAR(50)    PRIMARY KEY,
    ShopCode        NVARCHAR(10)    NOT NULL UNIQUE,    -- e.g. "SH-01"
    Name            NVARCHAR(200)   NOT NULL,
    City            NVARCHAR(100)   NOT NULL,
    CityCode        CHAR(3)         NOT NULL,           -- 3-digit numeric code, used inside Account ID
    Address         NVARCHAR(500)   NOT NULL,
    ManagerName     NVARCHAR(200)   NOT NULL,
    Phone           NVARCHAR(30)    NOT NULL,
    OperatingHours  NVARCHAR(100)   NOT NULL,
    ActiveEmployeesCount    INT     NOT NULL DEFAULT 0,
    TotalSubscribersServed  INT     NOT NULL DEFAULT 0
);

-- 5. Stock / Inventory (Admin & Technical)
-- Corresponds to: interface InventoryItem
CREATE TABLE InventoryItems (
    Id              NVARCHAR(50)    PRIMARY KEY,
    ItemCode        NVARCHAR(20)    NOT NULL UNIQUE,    -- e.g. "EQ-FBR-01"
    Name            NVARCHAR(200)   NOT NULL,
    Category        NVARCHAR(30)    NOT NULL CHECK (Category IN ('Modem', 'Router', 'Fiber ONT', 'Splitter', 'Patch Cord', 'VoIP Adapter')),
    StockQuantity   INT             NOT NULL DEFAULT 0,
    ReorderLevel    INT             NOT NULL DEFAULT 0,
    UnitCost        DECIMAL(10,2)   NOT NULL,
    Location        NVARCHAR(200)   NOT NULL,
    Supplier        NVARCHAR(200)   NOT NULL
);

-- 6. Orders (Retail & Technical Feasibility)
-- Corresponds to: interface Order
-- Order ID: 11-char alphanumeric, prefix D/B/T + 10-digit serial (spec §3)
CREATE TABLE Orders (
    Id                  CHAR(11)        PRIMARY KEY,    -- e.g. "D0000000001", "B0000000002"
    CustomerName        NVARCHAR(200)   NOT NULL,
    CustomerPhone       NVARCHAR(30)    NOT NULL,
    CustomerEmail       NVARCHAR(200)   NOT NULL,
    InstallationAddress NVARCHAR(500)   NOT NULL,
    IdProofType         NVARCHAR(30)    NOT NULL CHECK (IdProofType IN ('National ID Card', 'Passport', 'Driver''s License')),
    IdProofNumber       NVARCHAR(50)    NOT NULL,
    ConnectionType      NVARCHAR(20)    NOT NULL CHECK (ConnectionType IN ('Broadband', 'Dial-Up', 'Landline')),
    PlanId              NVARCHAR(50)    NOT NULL REFERENCES Plans(Id),
    PlanName            NVARCHAR(200)   NOT NULL,
    RetailOutletCode    NVARCHAR(10)    NOT NULL,       -- FK to RetailShops.ShopCode
    RetailEmployeeName  NVARCHAR(200)   NOT NULL,
    CreatedAt           DATETIME2       NOT NULL DEFAULT GETDATE(),
    Status              NVARCHAR(30)    NOT NULL DEFAULT 'Pending' CHECK (Status IN ('Pending', 'Feasible', 'Not Feasible', 'Connection Provided')),
    FeasibilityNotes    NVARCHAR(1000)  NULL,
    CableDistanceMeters INT             NULL,
    DpBoxCapacity       NVARCHAR(100)   NULL,
    SignalLossDbm       DECIMAL(6,2)    NULL,
    AssignedAccountId   CHAR(16)        NULL,           -- 16-char Account ID, issued when Feasible

    -- Bulk / corporate scheme (spec §4)
    BulkConnectionsCount INT           NOT NULL DEFAULT 1,
    BulkDiscountPercent  INT           NOT NULL DEFAULT 0 CHECK (BulkDiscountPercent IN (0, 25, 50, 75, 100)),

    -- Group linking (mở rộng ngoài spec — xem SPEC-SUMMARY §2)
    OrderGroupId        NVARCHAR(50)    NULL,           -- e.g. "GRP-1726142775001"
    OrderGroupIndex     INT             NULL,           -- 1-based position within group

    -- Dial-Up dual-leg feasibility (spec §7)
    ExistingLandlineAccountId CHAR(16)  NULL,           -- customer's existing Nexus landline
    LandlineFeasible    BIT             NULL,
    InternetFeasible    BIT             NULL
);

-- Index: tìm kiếm nhanh đơn cùng nhóm
CREATE INDEX IX_Orders_OrderGroupId ON Orders(OrderGroupId) WHERE OrderGroupId IS NOT NULL;
-- Index: tìm theo trạng thái (feasibility queue)
CREATE INDEX IX_Orders_Status ON Orders(Status);
-- Index: tìm theo Account ID
CREATE INDEX IX_Orders_AssignedAccountId ON Orders(AssignedAccountId) WHERE AssignedAccountId IS NOT NULL;

-- 7. Customer Connections (Technical & Retail)
-- Corresponds to: interface Connection
-- Account ID: 16-char [D/B/T] + city(3) + serial(12) (spec §3)
CREATE TABLE Connections (
    AccountId           CHAR(16)        PRIMARY KEY,    -- e.g. "B064-000000000005"
    OrderId             CHAR(11)        NOT NULL REFERENCES Orders(Id),
    CustomerName        NVARCHAR(200)   NOT NULL,
    CustomerPhone       NVARCHAR(30)    NOT NULL,
    CustomerEmail       NVARCHAR(200)   NOT NULL,
    InstallationAddress NVARCHAR(500)   NOT NULL,
    ConnectionType      NVARCHAR(20)    NOT NULL CHECK (ConnectionType IN ('Broadband', 'Dial-Up', 'Landline')),
    PlanName            NVARCHAR(200)   NOT NULL,
    MonthlyRental       DECIMAL(10,2)   NOT NULL,
    SecurityDeposit     DECIMAL(10,2)   NOT NULL,
    Status              NVARCHAR(30)    NOT NULL DEFAULT 'Active' CHECK (Status IN ('Active', 'Temporarily Inactive', 'Permanently Inactive')),
    IpAddress           NVARCHAR(45)    NULL,
    PortNumber          NVARCHAR(30)    NULL,
    AssignedDeviceSerial NVARCHAR(50)   NULL,
    AssignedDeviceModel  NVARCHAR(200)  NULL,
    InstalledDate       DATE            NOT NULL,
    LastUpdated         DATETIME2       NOT NULL DEFAULT GETDATE(),
    LastStatusReason    NVARCHAR(500)   NULL
);

CREATE INDEX IX_Connections_OrderId ON Connections(OrderId);

-- 8. Equipment / Product Details (Technical Staff)
-- Corresponds to: interface Equipment
CREATE TABLE Equipments (
    Id                  NVARCHAR(50)    PRIMARY KEY,
    SerialNumber        NVARCHAR(50)    NOT NULL UNIQUE,    -- e.g. "NX-HW-992810"
    MacAddress          NVARCHAR(20)    NOT NULL,           -- e.g. "BC:A9:93:21:44:8E"
    DeviceModel         NVARCHAR(200)   NOT NULL,
    DeviceType          NVARCHAR(50)    NOT NULL CHECK (DeviceType IN ('Fiber ONT Modem', 'VDSL2/ADSL Modem', 'Gigabit Router', 'Analog Telephone Adapter')),
    AssignedAccountId   CHAR(16)        NULL REFERENCES Connections(AccountId),
    AssignedCustomerName NVARCHAR(200)  NULL,
    FirmwareVersion     NVARCHAR(50)    NOT NULL,
    Status              NVARCHAR(20)    NOT NULL DEFAULT 'In Stock' CHECK (Status IN ('In Service', 'In Stock', 'Maintenance', 'Faulty')),
    AssignedTechnician  NVARCHAR(200)   NULL,
    InstalledDate       DATE            NULL
);

CREATE INDEX IX_Equipments_AssignedAccountId ON Equipments(AssignedAccountId) WHERE AssignedAccountId IS NOT NULL;
CREATE INDEX IX_Equipments_Status ON Equipments(Status);

-- 9. Billing & Invoices (Accounts Department)
-- Corresponds to: interface Bill
CREATE TABLE Bills (
    Id                  NVARCHAR(50)    PRIMARY KEY,
    InvoiceNumber       NVARCHAR(30)    NOT NULL UNIQUE,    -- e.g. "NEX-INV-2025-001"
    AccountId           CHAR(16)        NOT NULL REFERENCES Connections(AccountId),
    CustomerName        NVARCHAR(200)   NOT NULL,
    BillingMonth        NVARCHAR(30)    NOT NULL,           -- e.g. "September 2026"
    BillingDate         DATE            NOT NULL,
    DueDate             DATE            NOT NULL,
    PlanName            NVARCHAR(200)   NOT NULL,
    ConnectionType      NVARCHAR(20)    NOT NULL CHECK (ConnectionType IN ('Broadband', 'Dial-Up', 'Landline')),

    -- Financial Breakdowns (spec §5)
    SecurityDeposit     DECIMAL(10,2)   NOT NULL DEFAULT 0,
    MonthlyRental       DECIMAL(10,2)   NOT NULL DEFAULT 0,
    HourlyCharges       DECIMAL(10,2)   NOT NULL DEFAULT 0,
    DiscountPercent     DECIMAL(5,2)    NOT NULL DEFAULT 0, -- bulk / corporate scheme discount
    DiscountAmount      DECIMAL(10,2)   NOT NULL DEFAULT 0, -- applied to (securityDeposit + monthlyRental)
    Subtotal            DECIMAL(10,2)   NOT NULL DEFAULT 0, -- deposit + rental + hourly - discount
    ServiceTaxRate      DECIMAL(5,2)    NOT NULL DEFAULT 12.24, -- spec: 12.24%
    ServiceTaxAmount    DECIMAL(10,2)   NOT NULL DEFAULT 0, -- subtotal * 12.24%
    TotalAmount         DECIMAL(10,2)   NOT NULL DEFAULT 0, -- subtotal + serviceTaxAmount

    -- Payment Status Tracking
    AmountPaid          DECIMAL(10,2)   NOT NULL DEFAULT 0,
    DueAmount           DECIMAL(10,2)   NOT NULL DEFAULT 0, -- totalAmount - amountPaid
    Status              NVARCHAR(20)    NOT NULL DEFAULT 'Unpaid' CHECK (Status IN ('Paid', 'Partially Paid', 'Unpaid'))
);

CREATE INDEX IX_Bills_AccountId ON Bills(AccountId);
CREATE INDEX IX_Bills_Status ON Bills(Status);

-- 9b. Payment Records (child of Bills)
-- Corresponds to: interface PaymentRecord (embedded in Bill.paymentHistory)
CREATE TABLE PaymentRecords (
    PaymentId           NVARCHAR(50)    PRIMARY KEY,
    BillId              NVARCHAR(50)    NOT NULL REFERENCES Bills(Id),
    PaymentDate         DATETIME2       NOT NULL DEFAULT GETDATE(),
    AmountPaid          DECIMAL(10,2)   NOT NULL,
    PaymentMode         NVARCHAR(30)    NOT NULL CHECK (PaymentMode IN ('Cash', 'Cheque', 'Credit/Debit Card', 'Bank Transfer/NEFT', 'UPI/Digital Wallet')),
    ReferenceNumber     NVARCHAR(100)   NOT NULL DEFAULT '',
    RecordedBy          NVARCHAR(200)   NOT NULL
);

CREATE INDEX IX_PaymentRecords_BillId ON PaymentRecords(BillId);

-- 10. Customer Feedback
-- Corresponds to: interface Feedback
CREATE TABLE Feedbacks (
    Id                  NVARCHAR(50)    PRIMARY KEY,
    AccountId           CHAR(16)        NULL REFERENCES Connections(AccountId),
    OrderId             CHAR(11)        NULL REFERENCES Orders(Id),
    CustomerName        NVARCHAR(200)   NOT NULL,
    Rating              INT             NOT NULL CHECK (Rating BETWEEN 1 AND 5),
    Category            NVARCHAR(30)    NOT NULL CHECK (Category IN ('Service Quality', 'Installation', 'Billing', 'Support', 'Other')),
    Message             NVARCHAR(2000)  NOT NULL,
    CreatedAt           DATETIME2       NOT NULL DEFAULT GETDATE(),
    Response            NVARCHAR(2000)  NULL,
    RespondedBy         NVARCHAR(200)   NULL,
    RespondedAt         DATETIME2       NULL
);

-- 11. System Settings
-- Corresponds to: interface SystemSettings
CREATE TABLE SystemSettings (
    Id                          INT             PRIMARY KEY DEFAULT 1 CHECK (Id = 1), -- singleton row
    ServiceTaxRate              DECIMAL(5,2)    NOT NULL DEFAULT 12.24,
    LatePaymentFeePercent       DECIMAL(5,2)    NOT NULL DEFAULT 5.00,
    DefaultDepositBroadband     DECIMAL(10,2)   NOT NULL DEFAULT 500.00,
    DefaultDepositDialUp        DECIMAL(10,2)   NOT NULL DEFAULT 325.00,
    DefaultDepositLandline      DECIMAL(10,2)   NOT NULL DEFAULT 250.00,
    InstallationGracePeriodDays INT             NOT NULL DEFAULT 20
);

-- ============================================================
-- Bulk Discount Function (spec §4)
-- getBulkDiscountPercent(connectionCount) → 0 / 25 / 50 / 75 / 100
-- ============================================================
CREATE FUNCTION dbo.fn_GetBulkDiscountPercent(@ConnectionCount INT)
RETURNS INT
AS
BEGIN
    DECLARE @n INT = CASE WHEN @ConnectionCount < 1 THEN 1 ELSE @ConnectionCount END;
    RETURN CASE
        WHEN @n > 50  THEN 100
        WHEN @n >= 25 THEN 75
        WHEN @n >= 15 THEN 50
        WHEN @n >= 10 THEN 25
        ELSE 0
    END;
END;
GO

-- ============================================================
-- Insert default system settings
-- ============================================================
INSERT INTO SystemSettings (Id, ServiceTaxRate, LatePaymentFeePercent,
    DefaultDepositBroadband, DefaultDepositDialUp, DefaultDepositLandline,
    InstallationGracePeriodDays)
VALUES (1, 12.24, 5.00, 500.00, 325.00, 250.00, 20);
GO
