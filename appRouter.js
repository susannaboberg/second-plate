// Modified based on InclassExercise 9 

const express = require('express');
const appConnect = require('./connectApp');

const router = express.Router();


// End points organized below by tabs


//PROVIDER ----------------------------------------------------------------------------------
router.get('/providers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const provider = await appConnect.getProviderById(id);

        res.json({
            exists: !!provider
        });

    } catch (error) {
        console.error('Error checking provider:', error);

        res.status(500).json({
            exists: false,
            error: 'Server error'
        });
    }
});

router.get('/providers/:id/details', async (req, res) => {
    try {
        const { id } = req.params;
        const details = await appConnect.getProviderDetails(id);
        res.json({ data: details });
    } catch (error) {
        res.status(500).json({ data: null });
    }
});

router.post('/show-filtered-food', async (req, res) => {
	try {
		const { brand, name, category } = req.body;

		const data = await appConnect.getFilteredFood(
			brand,
			name,
			category
		);

		res.json({ data });

	} catch (err) {
		console.error('Error in /show-filtered-food:', err);

		res.status(500).json({
			data: [],
			error: 'Server error'
		});
	}
});

router.post('/submit-donation', async (req, res) => {
	try {
		const {
			donationID,
			providerID,
			donationCreatedTime,
			donationSize,
			foodItems
		} = req.body;

		const success = await appConnect.submitDonation(
			donationID,
			providerID,
			donationCreatedTime,
			donationSize,
			foodItems
		);

		res.json({ success });

	} catch (err) {
		console.error('Error in /submit-donation:', err);
		res.status(500).json({ success: false });
	}
});


//VOLUNTEER -----------------------------------------------------------------------------------
router.get('/volunteers/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const volunteer = await appConnect.getVolunteerById(id);

		res.json({
			exists: !!volunteer
		});

	} catch (error) {
		console.error('Error checking volunteer:', error);

		res.status(500).json({
			exists: false,
			error: 'Server error'
		});
	}
});

router.get('/volunteers/:id/details', async (req, res) => {
    try {
        const { id } = req.params;
        const details = await appConnect.getVolunteerDetails(id);
        res.json({ data: details });
    } catch (error) {
        res.status(500).json({ data: null });
    }
});

router.get('/unclaimed-donations-table', async (req, res) => {
	try {
		const donations = await appConnect.getUnclaimedDonations();

		res.json({
			data: donations
		});

	} catch (error) {
		console.error('Error fetching unclaimed donations:', error);

		res.status(500).json({
			data: [],
			error: 'Internal server error'
		});
	}
});

router.post('/update-donation', async (req, res) => {
	try {
		const { vid, did } = req.body;

		const success = await appConnect.claimDonation(vid, did);

		res.json({
			success
		});

	} catch (error) {
		console.error('Error updating donation (claim):', error);

		res.status(500).json({
			success: false,
			error: 'Internal server error'
		});
	}
});
router.get('/uncompleted-donations/:id', async (req, res) => {
	try {
		const { id } = req.params;

		const donations = await appConnect.getUncompletedDonations(id);

		res.json({
			data: donations
		});

	} catch (error) {
		console.error('Error fetching uncompleted donations:', error);

		res.status(500).json({
			data: [],
			error: 'Internal server error'
		});
	}
});

router.post('/complete-donation', async (req, res) => {
	try {
		const { donationID } = req.body;

		const success = await appConnect.completeDonation(
			donationID
		);

		res.json({ success });

	} catch (error) {
		console.error('Error in /complete-donation:', error);
		res.status(500).json({ success: false });
	}
});


//RECIPIENT ---------------------------------------------------------------------------
router.get('/recipients/:id', async (req, res) => {
	try {
		const { id } = req.params;

		const exists = await appConnect.getRecipientById(id);

		res.json({ exists });
	} catch (error) {
		console.error('Error validating recipient:', error);

		res.status(500).json({
			exists: false,
			error: 'Server error'
		});
	}
});

router.get('/recipients/:id/details', async (req, res) => {
    try {
        const { id } = req.params;
        const details = await appConnect.getRecipientDetails(id);
        res.json({ data: details });
    } catch (error) {
        res.status(500).json({ data: null });
    }
});


//ANALYTICS ---------------------------------------------------------------------
router.get('/employees/:id', async (req, res) => {
	try {
		const { id } = req.params;

		const exists = await appConnect.getEmployeeById(id);

		res.json({ exists });
	} catch (error) {
		console.error('Error validating employee:', error);

		res.status(500).json({
			exists: false,
			error: 'Server error'
		});
	}
});

router.get('/employees/:id/details', async (req, res) => {
    try {
        const { id } = req.params;
        const details = await appConnect.getEmployeeDetails(id);
        res.json({ data: details });
    } catch (error) {
        res.status(500).json({ data: null });
    }
});

router.get('/all-volunteers', async (req, res) => {
    try {
        const volunteers = await appConnect.getAllVolunteers();

        const data = volunteers.map(v => [
            v.VOLUNTEERID,
            v.VOLUNTEERNAME
        ]);

        res.json({
            data
        });

    } catch (error) {
        console.error('Error fetching volunteers:', error);

        res.status(500).json({
            data: [],
            error: 'Server error'
        });
    }
});

router.delete('/delete-volunteer', async (req, res) => {
    try {
        const { volunteerID } = req.body;

        const success = await appConnect.deleteVolunteer(volunteerID);

        if (!success) {
            return res.status(400).json({
                success: false,
                error: 'Volunteer not found or could not be deleted'
            });
        }

        res.json({
            success: true
        });

    } catch (error) {
        console.error('Error deleting volunteer:', error);

        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});


router.get('/all-vehicles', async (req, res) => {
	try {
		const vehicles = await appConnect.getAllVehicles();

		res.json({
			data: vehicles
		});

	} catch (error) {
		console.error('Error fetching vehicles:', error);

		res.status(500).json({
			data: [],
			error: 'Internal server error'
		});
	}
});

router.post('/vehicle-project', async (req, res) => {
	const { attr } = req.body;
	console.log(req.body)
	try {
		const vehicles = await appConnect.projectVehicles(attr);

		res.json({
			data: vehicles
		});

	} catch (error) {
		console.error('Error fetching vehicles:', error);

		res.status(500).json({
			data: [],
			error: 'Internal server error'
		});
	}
});

router.get('/completed-donations', async (req, res) => {
	try {
		const donations = await appConnect.getCompletedDonations();

		res.json({
			data: donations
		});

	} catch (error) {
		console.error('Error fetching completed donations:', error);

		res.status(500).json({
			data: [],
			error: 'Server error'
		});
	}
});

router.post('/pickups-per-volunteer', async (req, res) => {
	try {
		const { startDate, endDate } = req.body;

		const data = await appConnect.getPickupsPerVolunteer(startDate, endDate);

		res.json({ data });
	} catch (err) {
		console.error('Error in /pickups-per-volunteer:', err);
		res.status(500).json({ 
            data: [],
            error: 'Server error'
         });
	}
});

router.post('/show-min-donated', async (req, res) => {
	try {
		const { minUnitsDonated, foodBrand, foodName } = req.body;

		const data = await appConnect.getMinDonated(minUnitsDonated, foodBrand, foodName);

		res.json({ data });

	} catch (err) {
		console.error('Error in /show-min-donated:', err);

		res.status(500).json({
			data: [],
			error: 'Internal server error'
		});
	}
});

router.post('/run-above-average', async (req, res) => {
	try {
		const { startDate, endDate } = req.body;

		const data = await appConnect.getAboveAverageFoods(startDate, endDate);

		res.json({ data });

	} catch (err) {
		console.error('Error in /run-above-average:', err);

		res.status(500).json({
			data: [],
			error: 'Internal server error'
		});
	}
});

router.get('/universally-requested', async (req, res) => {
	try {
		const data = await appConnect.getUniversallyRequested();

		res.json({
			data
		});
	} catch (err) {
		console.error('Error in /universally-requested:', err);
		res.status(500).json({ data: [] });
	}
});

router.get('/check-db-connection', async (req, res) => {
    const isConnect = await appService.testOracleConnection();
    if (isConnect) {
        res.send('connected');
    } else {
        res.send('unable to connect');
    }
});


module.exports = router;
