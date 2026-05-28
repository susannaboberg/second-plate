DROP TABLE RequestContents CASCADE CONSTRAINTS;
DROP TABLE DonationContents CASCADE CONSTRAINTS;
DROP TABLE Perishables CASCADE CONSTRAINTS;
DROP TABLE NonPerishables CASCADE CONSTRAINTS;

DROP TABLE Offers CASCADE CONSTRAINTS;
DROP TABLE Works CASCADE CONSTRAINTS;
DROP TABLE ShiftsSupervisedBy CASCADE CONSTRAINTS;

DROP TABLE Donations CASCADE CONSTRAINTS;
DROP TABLE Requests CASCADE CONSTRAINTS;
DROP TABLE Vehicles CASCADE CONSTRAINTS;
DROP TABLE WarehouseFoods CASCADE CONSTRAINTS;
DROP TABLE Recipients CASCADE CONSTRAINTS;
DROP TABLE Employees CASCADE CONSTRAINTS;
DROP TABLE Shifts CASCADE CONSTRAINTS;
DROP TABLE ShiftDays CASCADE CONSTRAINTS;
DROP TABLE VehicleTypes CASCADE CONSTRAINTS;

DROP TABLE Providers CASCADE CONSTRAINTS;
DROP TABLE ProviderChains CASCADE CONSTRAINTS;
DROP TABLE Volunteers CASCADE CONSTRAINTS;
DROP TABLE LocationZones CASCADE CONSTRAINTS;
DROP TABLE FoodCategorizations CASCADE CONSTRAINTS;



CREATE TABLE ProviderChains (
    providerName VARCHAR(50),
    providerLocation VARCHAR(50),
    providerChain VARCHAR(50),
    PRIMARY KEY (providerName, providerLocation)
);

CREATE TABLE Providers (
    providerID INT PRIMARY KEY,
    providerLocation VARCHAR(50),
    providerName VARCHAR(50),
   FOREIGN KEY (providerName, providerLocation)
      REFERENCES ProviderChains(providerName, providerLocation) 
);

CREATE TABLE Volunteers (
    volunteerID INT PRIMARY KEY,
    volunteerName VARCHAR(50)
);


CREATE TABLE Donations (
    donationID INT PRIMARY KEY,
    providerID INT,
    volunteerID INT,
    donationCreatedTime TIMESTAMP NOT NULL,
    warehouseDropOffTime TIMESTAMP,
    donationSize INT,
    FOREIGN KEY (providerID) 
        REFERENCES Providers(providerID) ON DELETE SET NULL,
    FOREIGN KEY (volunteerID)
        REFERENCES Volunteers(volunteerID) ON DELETE SET NULL
);

CREATE TABLE Offers (
    providerID INT,
    donationID INT,
    PRIMARY KEY (providerID, donationID),
    FOREIGN KEY (providerID) REFERENCES Providers(providerID),
    FOREIGN KEY (donationID) REFERENCES Donations(donationID)
);


CREATE TABLE VehicleTypes (
    vehicleMake VARCHAR(50),
    vehicleModel VARCHAR(50),
    vehicleSize CHAR(20),
    PRIMARY KEY (vehicleMake, vehicleModel)
);

CREATE TABLE Vehicles (
    plateNumber CHAR(20) PRIMARY KEY,
    vehicleMake VARCHAR(50),
    vehicleModel VARCHAR(50),
    volunteerID INT NOT NULL,
    FOREIGN KEY (vehicleMake, vehicleModel)
        REFERENCES VehicleTypes(vehicleMake, vehicleModel),
    FOREIGN KEY (volunteerID)
        REFERENCES Volunteers(volunteerID) ON DELETE CASCADE
);

CREATE TABLE ShiftDays (
    shiftDate DATE PRIMARY KEY,
    shiftDay CHAR(20) NOT NULL
);

CREATE TABLE Shifts (
    shiftID INT PRIMARY KEY,
    shiftStartTime TIMESTAMP,
    shiftEndTime TIMESTAMP,
    shiftDate DATE,
    FOREIGN KEY (shiftDate) REFERENCES ShiftDays(shiftDate)
);

CREATE TABLE Works (
    volunteerID INT,
    shiftID INT, 
    PRIMARY KEY (volunteerID, shiftID),
    FOREIGN KEY (volunteerID) REFERENCES Volunteers(volunteerID) ON DELETE CASCADE,
    FOREIGN KEY (shiftID) REFERENCES Shifts(shiftID)
);

CREATE TABLE Employees (
    employeeID INT PRIMARY KEY,
    employeeName VARCHAR(50)
);

CREATE TABLE ShiftsSupervisedBy (
    shiftID INT PRIMARY KEY, 
    employeeID INT,
    FOREIGN KEY (employeeID) REFERENCES Employees(employeeID),
    FOREIGN KEY (shiftID) REFERENCES Shifts(shiftID)
);

CREATE TABLE LocationZones (
    recipientLocation VARCHAR(50) PRIMARY KEY,
    recipientZone CHAR(20) NOT NULL
);

CREATE TABLE Recipients (
    recipientID INT PRIMARY KEY,
    recipientName VARCHAR(50),
    recipientLocation VARCHAR(50),
    acceptsPerishables CHAR(1),
    FOREIGN KEY (recipientLocation)
        REFERENCES LocationZones(recipientLocation)
);



CREATE TABLE Requests (
    requestID INT PRIMARY KEY,
    requestCreatedTime TIMESTAMP,
    requestSize FLOAT,
    recipientID INT NOT NULL,
    deliveringVolunteer INT,
    deliveryTime TIMESTAMP,
    FOREIGN KEY (recipientID)
        REFERENCES Recipients(recipientID),
    FOREIGN KEY (deliveringVolunteer)
        REFERENCES Volunteers(volunteerID) ON DELETE SET NULL
);

CREATE TABLE FoodCategorizations (
    foodName VARCHAR(50),
    foodCategory CHAR(20) NOT NULL,
    PRIMARY KEY (foodName)
);

CREATE TABLE WarehouseFoods (
    foodBrand VARCHAR(50),
    foodName VARCHAR(50),
    allergens VARCHAR(100),
    quantity INT NOT NULL,
    PRIMARY KEY (foodBrand, foodName),
    FOREIGN KEY (foodName) REFERENCES FoodCategorizations (foodName)
);

CREATE TABLE RequestContents (
    requestID INT,
    foodBrand VARCHAR(50),
    foodName VARCHAR(50),
    quantity INT,
    PRIMARY KEY (requestID, foodBrand, foodName),
    FOREIGN KEY (requestID)
        REFERENCES Requests(requestID),
    FOREIGN KEY (foodBrand, foodName)
        REFERENCES WarehouseFoods(foodBrand, foodName)
);

CREATE TABLE DonationContents (
    donationID INT,
    foodBrand VARCHAR(50),
    foodName VARCHAR(50),
    quantity INT,
    PRIMARY KEY (donationID, foodBrand, foodName),
    FOREIGN KEY (donationID) REFERENCES Donations(donationID),
    FOREIGN KEY (foodBrand, foodName)
        REFERENCES WarehouseFoods(foodBrand, foodName)
);

CREATE TABLE Perishables (
    foodBrand VARCHAR(50),
    foodName VARCHAR(50),
    expirationDate DATE,
    PRIMARY KEY (foodBrand, foodName),
    FOREIGN KEY (foodBrand, foodName)
        REFERENCES WarehouseFoods(foodBrand, foodName)
);

CREATE TABLE NonPerishables (
    foodBrand VARCHAR(50),
    foodName VARCHAR(50),
    PRIMARY KEY (foodBrand, foodName),
    FOREIGN KEY (foodBrand, foodName)
        REFERENCES WarehouseFoods(foodBrand, foodName)
);

INSERT INTO ProviderChains VALUES ('Stop and Shop', 'North Adams', 'Ahold Delhaize');
INSERT INTO ProviderChains VALUES ('Whole Foods Market', 'Cambridge', 'Amazon');
INSERT INTO ProviderChains VALUES ('Walmart Supercenter', 'Worcester', 'Walmart Inc');
INSERT INTO ProviderChains VALUES ('Target', 'Springfield', 'Target Corporation');
INSERT INTO ProviderChains VALUES ('Costco Wholesale', 'Lowell', 'Costco Wholesale Corporation');
INSERT INTO ProviderChains VALUES ('Trader Joes', 'New Bedford', 'Aldi Nord');
INSERT INTO ProviderChains VALUES ('Kroger Marketplace', 'Quincy', 'Kroger Co');
INSERT INTO ProviderChains VALUES ('Amazon Fresh', 'Pittsfield', 'Amazon');

INSERT INTO Providers VALUES (1, 'North Adams', 'Stop and Shop');
INSERT INTO Providers VALUES (2, 'Cambridge', 'Whole Foods Market');
INSERT INTO Providers VALUES (3, 'Worcester', 'Walmart Supercenter');
INSERT INTO Providers VALUES (4, 'Springfield', 'Target');
INSERT INTO Providers VALUES (5, 'Lowell', 'Costco Wholesale');
INSERT INTO Providers VALUES (6, 'New Bedford', 'Trader Joes');
INSERT INTO Providers VALUES (7, 'Quincy', 'Kroger Marketplace');
INSERT INTO Providers VALUES (8, 'Pittsfield', 'Amazon Fresh');

INSERT INTO Volunteers VALUES (10171, 'Aliza');
INSERT INTO Volunteers VALUES (10217, 'Susanna');
INSERT INTO Volunteers VALUES (12381, 'Jamie');
INSERT INTO Volunteers VALUES (10410, 'Kelly');
INSERT INTO Volunteers VALUES (19551, 'Jeannie');
INSERT INTO Volunteers VALUES (10613, 'Sam');

INSERT INTO Donations VALUES (1001, 1, 10171, TIMESTAMP '2026-04-01 06:05:00', TIMESTAMP '2026-04-02 08:20:00', 12);
INSERT INTO Donations VALUES (1002, 2, 10217, TIMESTAMP '2026-04-01 07:00:00', TIMESTAMP '2026-04-03 10:30:00', 8);
INSERT INTO Donations VALUES (1003, 3, 12381, TIMESTAMP '2026-04-02 08:00:00', TIMESTAMP '2026-04-03 12:00:00', 15);
INSERT INTO Donations VALUES (1004, 4, 10410, TIMESTAMP '2026-04-02 09:00:00', TIMESTAMP '2026-04-03 14:00:00', 20);
INSERT INTO Donations VALUES (1005, 5, 19551, TIMESTAMP '2026-04-03 10:00:00', TIMESTAMP '2026-04-04 16:06:00', 5);
INSERT INTO Donations VALUES (2001, 6, NULL, TIMESTAMP '2026-04-28 10:00:00', NULL, 7);


INSERT INTO Offers VALUES (1, 1001);
INSERT INTO Offers VALUES (2, 1002);
INSERT INTO Offers VALUES (3, 1003);
INSERT INTO Offers VALUES (4, 1004);
INSERT INTO Offers VALUES (5, 1005);

INSERT INTO VehicleTypes VALUES ('Ford', 'Transit', 'Large');
INSERT INTO VehicleTypes VALUES ('Toyota', 'Hiace', 'Medium');
INSERT INTO VehicleTypes VALUES ('Mercedes', 'Sprinter', 'Large');
INSERT INTO VehicleTypes VALUES ('Honda', 'Odyssey', 'Medium');
INSERT INTO VehicleTypes VALUES ('Chevrolet', 'Express', 'Large');

INSERT INTO Vehicles VALUES ('ABC123', 'Ford', 'Transit', 10171);
INSERT INTO Vehicles VALUES ('XYZ789', 'Toyota', 'Hiace', 10217);
INSERT INTO Vehicles VALUES ('LMN456', 'Mercedes', 'Sprinter', 12381);
INSERT INTO Vehicles VALUES ('JKL111', 'Honda', 'Odyssey', 10410);
INSERT INTO Vehicles VALUES ('QRS222', 'Chevrolet', 'Express', 19551);

INSERT INTO ShiftDays VALUES (DATE '2026-04-01', 'Wed');
INSERT INTO ShiftDays VALUES (DATE '2026-04-02', 'Thu');
INSERT INTO ShiftDays VALUES (DATE '2026-04-03', 'Fri');
INSERT INTO ShiftDays VALUES (DATE '2026-04-04', 'Sat');
INSERT INTO ShiftDays VALUES (DATE '2026-04-05', 'Sun');

INSERT INTO Shifts VALUES (65, TIMESTAMP '2026-04-01 07:00:00', TIMESTAMP '2026-04-01 11:00:00', DATE '2026-04-01');
INSERT INTO Shifts VALUES (66, TIMESTAMP '2026-04-02 09:00:00', TIMESTAMP '2026-04-02 13:00:00', DATE '2026-04-02');
INSERT INTO Shifts VALUES (67, TIMESTAMP '2026-04-03 11:00:00', TIMESTAMP '2026-04-03 15:00:00', DATE '2026-04-03');
INSERT INTO Shifts VALUES (68, TIMESTAMP '2026-04-04 13:00:00', TIMESTAMP '2026-04-04 17:00:00', DATE '2026-04-04');
INSERT INTO Shifts VALUES (69, TIMESTAMP '2026-04-05 15:00:00', TIMESTAMP '2026-04-05 19:00:00', DATE '2026-04-05');

INSERT INTO Works VALUES (10171, 65);
INSERT INTO Works VALUES (10171, 66);
INSERT INTO Works VALUES (10217, 66);
INSERT INTO Works VALUES (10217, 67);
INSERT INTO Works VALUES (10410, 68);

INSERT INTO Employees VALUES (123, 'Jim');
INSERT INTO Employees VALUES (124, 'Shikha');
INSERT INTO Employees VALUES (125, 'Dan');
INSERT INTO Employees VALUES (126, 'Aaron');
INSERT INTO Employees VALUES (127, 'Mark');

INSERT INTO ShiftsSupervisedBy VALUES (65, 123);
INSERT INTO ShiftsSupervisedBy VALUES (66, 124);
INSERT INTO ShiftsSupervisedBy VALUES (67, 125);
INSERT INTO ShiftsSupervisedBy VALUES (68, 126);
INSERT INTO ShiftsSupervisedBy VALUES (69, 126);

INSERT INTO FoodCategorizations VALUES ('Macaroni', 'Grain');
INSERT INTO FoodCategorizations VALUES ('Kidney Beans', 'Canned Goods');
INSERT INTO FoodCategorizations VALUES ('Chicken Soup', 'Canned Goods');
INSERT INTO FoodCategorizations VALUES ('Steel-cut Oats', 'Grain');
INSERT INTO FoodCategorizations VALUES ('Cereal', 'Grain');
INSERT INTO FoodCategorizations VALUES ('Chocolate Milk', 'Dairy');
INSERT INTO FoodCategorizations VALUES ('Whole Milk', 'Dairy');
INSERT INTO FoodCategorizations VALUES ('Bread', 'Grain');
INSERT INTO FoodCategorizations VALUES ('Cheese', 'Dairy');
INSERT INTO FoodCategorizations VALUES ('Crackers', 'Snacks and Beverages');

INSERT INTO WarehouseFoods VALUES ('Kraft', 'Macaroni', 'Gluten', 2);
INSERT INTO WarehouseFoods VALUES ('Heinz', 'Kidney Beans', 'None', 7);
INSERT INTO WarehouseFoods VALUES ('Campbell', 'Chicken Soup', 'None', 6);
INSERT INTO WarehouseFoods VALUES ('Quaker', 'Steel-cut Oats', 'Gluten', 4);
INSERT INTO WarehouseFoods VALUES ('General Mills', 'Cereal', 'Gluten', 5);
INSERT INTO WarehouseFoods VALUES ('Nestle', 'Chocolate Milk', 'Dairy', 1);
INSERT INTO WarehouseFoods VALUES ('Hood', 'Whole Milk', 'Dairy', 5);
INSERT INTO WarehouseFoods VALUES ('Daves Killer Bread', 'Bread', 'Gluten', 8);
INSERT INTO WarehouseFoods VALUES ('Babybell', 'Cheese', 'Dairy', 12);
INSERT INTO WarehouseFoods VALUES ('Cheezit', 'Crackers', 'Gluten', 10);

INSERT INTO DonationContents VALUES (1001, 'Kraft', 'Macaroni', 4);
INSERT INTO DonationContents VALUES (1001, 'Heinz', 'Kidney Beans', 10);
INSERT INTO DonationContents VALUES (1002, 'Campbell', 'Chicken Soup', 9);
INSERT INTO DonationContents VALUES (1003, 'Quaker', 'Steel-cut Oats', 8);
INSERT INTO DonationContents VALUES (1004, 'General Mills', 'Cereal', 7);
INSERT INTO DonationContents VALUES (1005, 'Nestle', 'Chocolate Milk', 2);

INSERT INTO Perishables VALUES ('Campbell', 'Chicken Soup', DATE '2026-05-01');
INSERT INTO Perishables VALUES ('Nestle', 'Chocolate Milk', DATE '2026-06-01');
INSERT INTO Perishables VALUES ('Hood', 'Whole Milk', DATE '2026-07-01');
INSERT INTO Perishables VALUES ('Daves Killer Bread', 'Bread', DATE '2026-07-01');
INSERT INTO Perishables VALUES ('Babybell', 'Cheese', DATE '2026-09-01');


INSERT INTO NonPerishables VALUES ('Kraft', 'Macaroni');
INSERT INTO NonPerishables VALUES ('Heinz', 'Kidney Beans');
INSERT INTO NonPerishables VALUES ('Quaker', 'Steel-cut Oats');
INSERT INTO NonPerishables VALUES ('General Mills', 'Cereal');
INSERT INTO NonPerishables VALUES ('Cheezit', 'Crackers');


INSERT INTO LocationZones VALUES ('Pittsfield', 'Zone 1');
INSERT INTO LocationZones VALUES ('North Adams', 'Zone 2');
INSERT INTO LocationZones VALUES ('Boston', 'Zone 3');
INSERT INTO LocationZones VALUES ('Springfield', 'Zone 4');
INSERT INTO LocationZones VALUES ('Williamstown', 'Zone 5');

INSERT INTO Recipients VALUES (301, 'Helping Hands', 'Pittsfield', 'Y');
INSERT INTO Recipients VALUES (302, 'Food Bank North', 'North Adams', 'Y');
INSERT INTO Recipients VALUES (303, 'Grass Roots', 'Boston', 'N');
INSERT INTO Recipients VALUES (304, 'Hope Center', 'Springfield', 'Y');
INSERT INTO Recipients VALUES (305, 'Williamstown Shelter', 'Williamstown', 'N');

INSERT INTO Requests VALUES (4001, TIMESTAMP '2026-03-30 10:00:00', 5.0, 301, 10171, TIMESTAMP '2026-04-01 10:30:00');
INSERT INTO Requests VALUES (4002, TIMESTAMP '2026-03-31 11:00:00', 6.5, 302, 12381, TIMESTAMP '2026-04-02 11:40:00');
INSERT INTO Requests VALUES (4003, TIMESTAMP '2026-04-01 12:00:00', 4.0, 303, 10410, TIMESTAMP '2026-04-03 12:45:00');
INSERT INTO Requests VALUES (4004, TIMESTAMP '2026-04-02 13:00:00', 7.5, 304, 19551, TIMESTAMP '2026-04-04 13:50:00');
INSERT INTO Requests VALUES (4005, TIMESTAMP '2026-04-03 14:00:00', 3.0, 305, 10613, TIMESTAMP '2026-04-05 14:30:00');

INSERT INTO RequestContents VALUES (4001, 'Kraft', 'Macaroni', 2);
INSERT INTO RequestContents VALUES (4001, 'Heinz', 'Kidney Beans', 3);
INSERT INTO RequestContents VALUES (4002, 'Campbell', 'Chicken Soup', 3);
INSERT INTO RequestContents VALUES (4003, 'Quaker', 'Steel-cut Oats', 4);
INSERT INTO RequestContents VALUES (4004, 'General Mills', 'Cereal', 2);
INSERT INTO RequestContents VALUES (4005, 'Nestle', 'Chocolate Milk', 1);
INSERT INTO RequestContents VALUES (4002, 'Kraft', 'Macaroni', 1);
INSERT INTO RequestContents VALUES (4003, 'Kraft', 'Macaroni', 3);
INSERT INTO RequestContents VALUES (4004, 'Kraft', 'Macaroni', 2);
INSERT INTO RequestContents VALUES (4005, 'Kraft', 'Macaroni', 1);
INSERT INTO RequestContents VALUES (4001, 'Campbell', 'Chicken Soup', 3);
INSERT INTO RequestContents VALUES (4003, 'Campbell', 'Chicken Soup', 1);
INSERT INTO RequestContents VALUES (4004, 'Campbell', 'Chicken Soup', 2);
INSERT INTO RequestContents VALUES (4005, 'Campbell', 'Chicken Soup', 1);
COMMIT;