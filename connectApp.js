// Modified based on InclassExercise 9 

const oracledb = require('oracledb');

require('dotenv').config();

let poolPromise;

async function initiateConnectionPool()
{
	const user = process.env.DB_USER; 
	const password = process.env.DB_PASSWORD;

	const connectString = process.env.DB_CONNECT_STRING;
	let connection;
	try {
		poolPromise = oracledb.createPool({
			user,
			password,
			connectString,
			configDir: process.env.WALLET_LOCATION,
			walletLocation: process.env.WALLET_LOCATION,
			walletPassword: process.env.WALLET_PASSWORD,
			poolAlias: "default",
			njs:     {
				    poolMin: 1,
    				poolMax: 3,
   					poolIncrement: 1,
    				poolTimeout: 60
			}
		});
		await poolPromise;
	    connection = await oracledb.getConnection();
		console.log("Successfully connected to Oracle Database");
	} catch (err) {
		console.error(err);
	} finally {

	}
}

async function closePoolAndExit() {
	await poolPromise;
	console.log('\nTerminating');
        try {
                // 10 seconds grace period for connections to finish	
		await oracledb.getPool().close(10); 
		process.exit(0);
	} catch (err) {
		console.error(err.message);
		process.exit(1);
	}
}

process
    .once('SIGTERM', closePoolAndExit)
    .once('SIGINT', closePoolAndExit);

// ----------------------------------------------------------
// Wrapper to manage OracleDB actions, simplifying connection handling.
async function withOracleDB(action) {
	let connection;
	await poolPromise;

	try {
                // Gets a connection from the default pool 
	        connection = await oracledb.getConnection(); 
		return await action(connection);
	} catch (err) {
		console.error(err);
		throw err;
	} finally {
		if (connection) {
			try {
				await connection.close();
			} catch (err) {
				console.error(err);
			}
		}
	}
}



// Core functions for database operations organized below by tabs


//PROVIDER ----------------------------------------------------------------------------------
async function getProviderById(id) {
	return await withOracleDB(async (connection) => {
		const result = await connection.execute(
			`
			SELECT *
			FROM Providers
			WHERE providerID = :id
			`,
			{ id: Number(id) },
			{
				outFormat: oracledb.OUT_FORMAT_OBJECT
			}
		);

		return result.rows.length > 0 ? result.rows[0] : null;
	}).catch((err) => {
		console.error('Error fetching provider:', err);
		return null;
	});
}

async function getProviderDetails(id) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `SELECT P.providerID, P.providerName, P.providerLocation, PC.providerChain
             FROM Providers P
             JOIN ProviderChains PC
               ON P.providerName = PC.providerName
               AND P.providerLocation = PC.providerLocation
             WHERE P.providerID = :id`,
            { id: Number(id) },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows.length > 0 ? result.rows[0] : null;
    }).catch(() => null);
}

async function submitDonation(
    donationID,
    providerID,
    donationCreatedTime,
    donationSize,
    foodItems
) {
    return await withOracleDB(async (connection) => {

        try {
            const nativeDate = new Date(donationCreatedTime);

            await connection.execute(
                `
                INSERT INTO Donations
                (donationID, providerID, volunteerID, donationCreatedTime, warehouseDropOffTime, donationSize)
                VALUES (:donationID, :providerID, NULL, :createdTime, NULL, :donationSize)
                `,
                {
                    donationID: Number(donationID),
                    providerID: Number(providerID),
                    createdTime: nativeDate,
                    donationSize: Number(donationSize)
                }
            );

            for (const item of foodItems) {

                const brand = item.brand?.trim();
                const name = item.name?.trim();
                const category = item.category?.trim() || 'unknown';
                const allergens = item.allergens?.trim() || '';
                const quantity = Number(item.quantity);
				
				/*
				 SQL merge query is modeled after the examples provided in 
				 https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/MERGE.html
				*/

                await connection.execute(
                    `
					MERGE INTO FoodCategorizations t
						USING (SELECT :foodName AS foodName, :foodCategory AS foodCategory FROM dual) s
						ON (t.foodName = s.foodName)
						WHEN NOT MATCHED THEN
							INSERT (foodName, foodCategory)
							VALUES (s.foodName, s.foodCategory)
                    `,
                    {
                        foodName: name,
                        foodCategory: category
                    }
                );

                await connection.execute(
                    `
					MERGE INTO WarehouseFoods t
						USING (SELECT :foodBrand AS foodBrand, :foodName AS foodName, :allergens AS allergens FROM dual) s
						ON (t.foodBrand = s.foodBrand AND t.foodName = s.foodName)
						WHEN NOT MATCHED THEN
							INSERT (foodBrand, foodName, allergens, quantity)
							VALUES (s.foodBrand, s.foodName, s.allergens, 0)
                    `,
                    {
                        foodBrand: brand,
                        foodName: name,
                        allergens: allergens
                    }
                );

                await connection.execute(
                    `
                    INSERT INTO DonationContents
                    (donationID, foodBrand, foodName, quantity)
                    VALUES (:donationID, :foodBrand, :foodName, :quantity)
                    `,
                    {
                        donationID: Number(donationID),
                        foodBrand: brand,
                        foodName: name,
                        quantity: quantity,
                    }
                );
            }

            await connection.execute(
                `
                INSERT INTO Offers (providerID, donationID)
                VALUES (:providerID, :donationID)
                `,
                {
                    providerID: Number(providerID),
                    donationID: Number(donationID)
                }
            );

            await connection.commit();
            return true;

        } catch (err) {
            console.error('Error submitting donation:', err);
            await connection.rollback();
            return false;
        }
    });
}

//VOLUNTEER -----------------------------------------------------------------------------------
async function getVolunteerById(id) {
	return await withOracleDB(async (connection) => {
		const result = await connection.execute(
			`
			SELECT *
			FROM Volunteers
			WHERE volunteerID = :id
			`,
			{ id: Number(id) },
			{
				outFormat: oracledb.OUT_FORMAT_OBJECT
			}
		);

		return result.rows.length > 0 ? result.rows[0] : null;
	}).catch((err) => {
		console.error('Error fetching volunteer:', err);
		return null;
	});
}

async function getVolunteerDetails(id) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `SELECT volunteerID, volunteerName
             FROM Volunteers
             WHERE volunteerID = :id`,
            { id: Number(id) },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows.length > 0 ? result.rows[0] : null;
    }).catch(() => null);
}

async function getUnclaimedDonations() {
	return await withOracleDB(async (connection) => {
		const result = await connection.execute(
			`
			SELECT 
				d.donationID,
				pc.providerChain,
				p.providerName,
				p.providerLocation,
				d.donationCreatedTime,
				d.donationSize
			FROM Donations d
			JOIN Providers p
				ON d.providerID = p.providerID
			JOIN ProviderChains pc
				ON p.providerName = pc.providerName
				AND p.providerLocation = pc.providerLocation
			WHERE d.volunteerID IS NULL
				AND d.warehouseDropOffTime IS NULL
			ORDER BY d.donationCreatedTime DESC
			`,
			{},
			{
				outFormat: oracledb.OUT_FORMAT_OBJECT
			}
		);

		return result.rows.map(r => [
			r.DONATIONID,
			r.PROVIDERCHAIN,
			r.PROVIDERNAME,
			r.PROVIDERLOCATION,
			r.DONATIONCREATEDTIME,
			r.DONATIONSIZE
		]);
	}).catch((err) => {
		console.error('Error fetching unclaimed donations:', err);
		return [];
	});
}
async function claimDonation(volunteerID, donationID) {
	return await withOracleDB(async (connection) => {
		const result = await connection.execute(
			`
			UPDATE Donations
			SET volunteerID = :vid
			WHERE donationID = :did
				AND volunteerID IS NULL
				AND warehouseDropOffTime IS NULL
			`,
			{
				vid: Number(volunteerID),
				did: Number(donationID)
			},
			{ autoCommit: true }
		);

		return result.rowsAffected > 0;
	}).catch((err) => {
		console.error('Error claiming donation:', err);
		return false;
	});
}
async function getUncompletedDonations(volunteerID) {
	return await withOracleDB(async (connection) => {
		const result = await connection.execute(
			`
			SELECT 
				d.donationID,
				pc.providerChain,
				p.providerName,
				d.donationCreatedTime,
				p.providerLocation,
				d.donationSize
			FROM Donations d
			JOIN Providers p
				ON d.providerID = p.providerID
			JOIN ProviderChains pc
				ON p.providerName = pc.providerName
				AND p.providerLocation = pc.providerLocation
			WHERE d.volunteerID = :vid
				AND d.warehouseDropOffTime IS NULL
			ORDER BY d.donationCreatedTime ASC
			`,
			{
				vid: Number(volunteerID)
			},
			{
				outFormat: oracledb.OUT_FORMAT_OBJECT
			}
		);

		return result.rows.map(r => [
			r.DONATIONID,
			r.PROVIDERCHAIN,
			r.PROVIDERNAME,
			r.DONATIONCREATEDTIME,
			r.PROVIDERLOCATION,
			r.DONATIONSIZE
		]);
	}).catch((err) => {
		console.error('Error fetching uncompleted donations:', err);
		return [];
	});
}
async function completeDonation(donationID) {
	return await withOracleDB(async (connection) => {
		const result = await connection.execute(
			`
			UPDATE Donations
			SET warehouseDropOffTime = CURRENT_TIMESTAMP
			WHERE donationID = :did
				AND volunteerID IS NOT NULL
				AND warehouseDropOffTime IS NULL
			`,
			{
				did: Number(donationID)
			}
		);


        if (result.rowsAffected === 0) {
            await connection.rollback();
            return false;
        }

		await connection.execute(
			`
			UPDATE WarehouseFoods WF
			SET WF.quantity = WF.quantity + (
				SELECT SUM(DC.quantity)
				FROM DonationContents DC
				WHERE DC.donationID = :did
					AND DC.foodBrand = WF.foodBrand
					AND DC.foodName = WF.foodName
			)
			WHERE EXISTS (
				SELECT 1
				FROM DonationContents DC
				WHERE DC.donationID = :did
					AND DC.foodBrand = WF.foodBrand
					AND DC.foodName = WF.foodName
			)
			`,
			{
				did: Number(donationID)
			}
		);

		await connection.commit();
		return true;

	}).catch((err) => {
		console.error('Error completing donation:', err);
		return false;
	});
}

//RECIPIENT ---------------------------------------------------------------------------
async function getRecipientById(id) {
	return await withOracleDB(async (connection) => {
		const result = await connection.execute(
			`
			SELECT *
			FROM Recipients
			WHERE recipientID = :id
			`,
			{ id: Number(id) },
			{ outFormat: oracledb.OUT_FORMAT_OBJECT }
		);

		return result.rows.length > 0;
	}).catch(err => {
		console.error('Error fetching recipient:', err);
		return false;
	});
}

async function getRecipientDetails(id) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `SELECT R.recipientID, R.recipientName, R.recipientLocation, LZ.recipientZone
             FROM Recipients R
             JOIN LocationZones LZ ON R.recipientLocation = LZ.recipientLocation
             WHERE R.recipientID = :id`,
            { id: Number(id) },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows.length > 0 ? result.rows[0] : null;
    }).catch(() => null);
}

async function getFilteredFood(brand, name, category) {
	return await withOracleDB(async (connection) => {

		const result = await connection.execute(
			`
			SELECT WF.foodBrand,
                   WF.foodName,
                   TRIM(FC.foodCategory) AS foodCategory,
                   WF.allergens,
                   WF.quantity
            FROM WarehouseFoods WF
            JOIN FoodCategorizations FC
              ON WF.foodName = FC.foodName
            WHERE WF.quantity > 0
			  AND (:brand IS NULL OR LOWER(WF.foodBrand) LIKE '%' || LOWER(:brand) || '%')
              AND (:name IS NULL OR LOWER(WF.foodName) LIKE '%' || LOWER(:name) || '%')
              AND (:category IS NULL OR LOWER(TRIM(FC.foodCategory)) = LOWER(TRIM(:category)))
            ORDER BY WF.foodName
			`,
			{
				brand: brand || null,
				name: name || null,
				category: category || null
			},
			{ outFormat: oracledb.OUT_FORMAT_OBJECT }
		);

		return result.rows.map(r => [
			r.FOODBRAND,
			r.FOODNAME,
			r.FOODCATEGORY,
			r.ALLERGENS,
			r.QUANTITY
		]);
	}).catch(err => {
		console.error('Error fetching filtered food:', err);
		return [];
	});
}


//ANALYTICS ---------------------------------------------------------------------
async function getEmployeeById(id) {
	return await withOracleDB(async (connection) => {
		const result = await connection.execute(
			`
			SELECT *
			FROM Employees
			WHERE employeeID = :id
			`,
			{ id: Number(id) },
			{ outFormat: oracledb.OUT_FORMAT_OBJECT }
		);

		return result.rows.length > 0;
	}).catch(err => {
		console.error('Error fetching recipient:', err);
		return false;
	});
}

async function getEmployeeDetails(id) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `SELECT E.employeeID, E.employeeName
             FROM Employees E
             WHERE E.employeeID = :id`,
            { id: Number(id) },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows.length > 0 ? result.rows[0] : null;
    }).catch(() => null);
}

async function getAllVolunteers() {
	return await withOracleDB(async (connection) => {
		const result = await connection.execute(
			`
			SELECT volunteerID, volunteerName
			FROM Volunteers
			`,
			{},
			{
				outFormat: oracledb.OUT_FORMAT_OBJECT
			}
		);

		return result.rows;
	}).catch((err) => {
		console.error('Error fetching volunteers:', err);
		return [];
	});
}
async function deleteVolunteer(volunteerID) {
	return await withOracleDB(async (connection) => {
		const result = await connection.execute(
			`
			DELETE FROM Volunteers
			WHERE volunteerID = :id
			`,
			{ id: Number(volunteerID) },
			{ autoCommit: true }
		);

		return result.rowsAffected > 0;
	}).catch((err) => {
		console.error('Error deleting volunteer:', err);
		return false;
	});
}
async function getAllVehicles() {
	return await withOracleDB(async (connection) => {
		const result = await connection.execute(
			`
			SELECT 
				ve.plateNumber,
				ve.vehicleMake,
				ve.vehicleModel,
				v.volunteerName
			FROM Vehicles ve
			JOIN Volunteers v
				ON ve.volunteerID = v.volunteerID
			JOIN VehicleTypes vt
				ON ve.vehicleMake = vt.vehicleMake
				AND ve.vehicleModel = vt.vehicleModel
			`,
			{},
			{
				outFormat: oracledb.OUT_FORMAT_OBJECT
			}
		);

		return result.rows.map(r => [
			r.PLATENUMBER,
			r.VEHICLEMAKE,
			r.VEHICLEMODEL,
			r.VOLUNTEERNAME

		]);
	}).catch((err) => {
		console.error('Error fetching vehicles:', err);
		return [];
	});
}

async function projectVehicles(attributes){
	return await withOracleDB(async (connection) => {
		const result = await connection.execute(
			`
			SELECT ${attributes}
			FROM Vehicles Ve
			JOIN Volunteers Vo
				ON Ve.volunteerID = Vo.volunteerID
			`,
			{},
			{
				outFormat: oracledb.OUT_FORMAT_OBJECT
			}
		);

		// TODO: Figure out how to process this!
		return result.rows;
	}).catch((err) => {
		console.error('Error fetching vehicles:', err);
		return [];
	});

}

async function getCompletedDonations() {
	return await withOracleDB(async (connection) => {
		const result = await connection.execute(
			`
			SELECT
				d.donationID,
				p.providerName,
				v.volunteerName,
				d.donationCreatedTime,
				d.warehouseDropOffTime
			FROM Donations d
			LEFT JOIN Providers p
				ON d.providerID = p.providerID
			LEFT JOIN Volunteers v
				ON d.volunteerID = v.volunteerID
			WHERE d.warehouseDropOffTime IS NOT NULL
			ORDER BY d.warehouseDropOffTime DESC
			`,
			[],
			{
				outFormat: oracledb.OUT_FORMAT_OBJECT
			}
		);

		return result.rows.map(r => [
			r.DONATIONID,
			r.PROVIDERNAME,
			r.VOLUNTEERNAME,
			r.DONATIONCREATEDTIME,
			r.WAREHOUSEDROPOFFTIME
		]);
	}).catch((err) => {
		console.error('Error fetching completed donations:', err);
		return [];
	});
}

async function getPickupsPerVolunteer(startDate, endDate) {
	return await withOracleDB(async (connection) => {
		const result = await connection.execute(
			`
			SELECT 
				V.volunteerName,
				V.volunteerID,
				COUNT(D.donationID) AS totalDonationsPickedUp
			FROM Donations D
			JOIN Volunteers V
				ON D.volunteerID = V.volunteerID
			WHERE D.warehouseDropOffTime IS NOT NULL
			  AND (:startDate IS NULL OR D.warehouseDropOffTime >= TO_TIMESTAMP(:startDate, 'YYYY-MM-DD'))
			  AND (:endDate IS NULL OR D.warehouseDropOffTime < TO_TIMESTAMP(:endDate, 'YYYY-MM-DD') + INTERVAL '1' DAY)
			GROUP BY V.volunteerID, V.volunteerName
			ORDER BY totalDonationsPickedUp DESC
			`,
			{
				startDate: startDate || null,
				endDate: endDate || null
			},
			{
				outFormat: oracledb.OUT_FORMAT_OBJECT
			}
		);

		return result.rows.map(r => [
			r.VOLUNTEERNAME,
			r.VOLUNTEERID,
			r.TOTALDONATIONSPICKEDUP
		]);
	}).catch((err) => {
		console.error('Error fetching pickups per volunteer:', err);
		return [];
	});
}

async function getMinDonated(minUnitsDonated, foodBrand, foodName) {
	return await withOracleDB(async (connection) => {

		const result = await connection.execute(
			`
			SELECT DC.foodBrand, DC.foodName, FC.foodCategory, SUM(DC.quantity) AS totalUnitsDonated
			FROM DonationContents DC, FoodCategorizations FC
			WHERE DC.foodName = FC.foodName 
				AND (:foodBrand IS NULL OR DC.foodBrand = :foodBrand)
				AND (:foodName IS NULL OR DC.foodName = :foodName)
			GROUP BY DC.foodBrand, DC.foodName, FC.foodCategory
			HAVING (:minUnitsDonated IS NULL OR SUM(DC.quantity) > :minUnitsDonated)
			ORDER BY totalUnitsDonated DESC
			`,
			{
				minUnitsDonated: Number(minUnitsDonated) || null,
				foodBrand: foodBrand || null,
				foodName: foodName || null
			},
			{ outFormat: oracledb.OUT_FORMAT_OBJECT }
		);

		return result.rows.map(r => [
			r.FOODBRAND,
			r.FOODNAME,
			r.FOODCATEGORY,
			r.TOTALUNITSDONATED
		]);
	});
}


async function getAboveAverageFoods(startDate, endDate) {
	return await withOracleDB(async (connection) => {

		const start = startDate ? new Date(startDate) : null;
		const end = endDate ? new Date(endDate) : null;

		const result = await connection.execute(
			`
			SELECT DC.foodBrand, DC.foodName, FC.foodCategory,
				SUM(DC.quantity) AS totalDonated
			FROM DonationContents DC
			JOIN FoodCategorizations FC ON DC.foodName = FC.foodName
			JOIN Donations D ON DC.donationID = D.donationID
			WHERE D.donationCreatedTime >= :startDate
			AND D.donationCreatedTime <= :endDate
			GROUP BY DC.foodBrand, DC.foodName, FC.foodCategory
			HAVING SUM(DC.quantity) > (
				SELECT AVG(food_total)
				FROM (
					SELECT SUM(DC2.quantity) AS food_total
					FROM DonationContents DC2
					JOIN Donations D2 ON DC2.donationID = D2.donationID
					WHERE D2.donationCreatedTime >= :startDate
					AND D2.donationCreatedTime <= :endDate
					GROUP BY DC2.foodBrand, DC2.foodName
				)
			)
			`,
			{
				startDate: start,
				endDate: end
			},
			{ outFormat: oracledb.OUT_FORMAT_OBJECT }
		);

		return result.rows.map(r => [
			r.FOODBRAND,
			r.FOODNAME,
			r.FOODCATEGORY,
			r.TOTALDONATED
		]);
	});
}

async function getUniversallyRequested() {
	return await withOracleDB(async (connection) => {
		const result = await connection.execute(
			`
			SELECT WF.foodBrand,
			       WF.foodName,
			       FC.foodCategory
			FROM WarehouseFoods WF
			JOIN FoodCategorizations FC
			  ON WF.foodName = FC.foodName
			WHERE NOT EXISTS (
				SELECT RC.recipientID
				FROM Recipients RC
				WHERE NOT EXISTS (
					SELECT 1
					FROM Requests R
					JOIN RequestContents RCon
					  ON R.requestID = RCon.requestID
					WHERE R.recipientID = RC.recipientID
					  AND RCon.foodBrand = WF.foodBrand
					  AND RCon.foodName = WF.foodName
				)
			)
			`,
			{},
			{ outFormat: oracledb.OUT_FORMAT_OBJECT }
		);

		return result.rows.map(r => [
			r.FOODBRAND,
			r.FOODNAME,
			r.FOODCATEGORY
		]);
	}).catch(err => {
		console.error('Error fetching universally requested foods:', err);
		return [];
	});
}


async function testOracleConnection() {
	return await withOracleDB(async (connection) => {
		return true;
	}).catch(() => {
		return false;
	});
}



initiateConnectionPool();

module.exports = {
    testOracleConnection,
	getProviderById,
	getProviderDetails,
	getAllVolunteers,
	deleteVolunteer,
	getAllVehicles,
	getCompletedDonations,
	getVolunteerById,
	getVolunteerDetails,
	getUnclaimedDonations,
	getUncompletedDonations,
	claimDonation,
	completeDonation,
	getPickupsPerVolunteer,
	getMinDonated,
	getAboveAverageFoods,
	getUniversallyRequested,
	getRecipientById,
	getRecipientDetails,
	getFilteredFood,
	submitDonation,
	projectVehicles,
	getEmployeeById,
	getEmployeeDetails

};




