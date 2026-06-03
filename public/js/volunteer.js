
let currentVolunteerID = null;
let volunteerConfirmTimer = 0;

//
function showTemporaryVolunteerMessage(message) {
    const confirm = document.getElementById('vol-confirmation-details');

    confirm.textContent = message;
    confirm.style.display = 'block';

    if (volunteerConfirmTimer) {
        clearTimeout(volunteerConfirmTimer);
    }

    volunteerConfirmTimer = setTimeout(() => {
        confirm.textContent = '';
        confirm.style.display = 'none';
    }, 2500);
}


async function submitVolunteerID() {
    const id = document.getElementById('volunteerID').value.trim();
    const parsedId = Number(id);
    const error = document.getElementById('volunteer-id-error');
    const main = document.getElementById('volunteer-main');
        console.log('id:', id, 'parsedId:', parsedId, 'isInteger:', Number.isInteger(parsedId), 'gt0:', parsedId > 0);


    if (!id) {
        error.textContent = 'Please enter an ID.';
        error.style.display = 'block';
        return;
    }

    if (!Number.isInteger(parsedId) || parsedId <= 0) {
    error.textContent = 'ID must be a valid integer.';
    error.style.display = 'block';
    return;
    }

    const isValid = await validateVolunteerID(id);

    if (isValid) {
        error.style.display = 'none';
        main.style.display = 'block';
        currentVolunteerID = id;
        await showWelcomeBanner('volunteer', id);
        await displayUnclaimedDonations();
        await displayUncompletedDonations();

    } else {
        error.textContent = 'ID does not exist.';
        error.style.display = 'block';
        main.style.display = 'none';
    }
}

async function validateVolunteerID(id) {
    //FETCH
    // expected response: {exists: true}
    const response = await fetch(`/volunteers/${id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    console.log('validate response ok:', response.ok, 'status:', response.status);

    // request failed
    if (!response.ok) {
        return false;
    }

    const data = await response.json();
    return data.exists === true
}

async function displayUnclaimedDonations() {
    const table = document.getElementById('unclaimed-donations-table');
    const tbody = document.getElementById('unclaimed-donations-tbody');
    const empty = document.getElementById('unclaimed-donations-empty');

    // FETCH: grab unclaimed donations only (volunteer ID and wareHouseDropOffTime are null)
    //query needed here
    //expected response: {data: [[donationID, providerChain, providerName, providerLocation, donationCreatedTime, donationSize, ...]}
    const response = await fetch('/unclaimed-donations-table', {method: 'GET'});
    const responseData = await response.json();
    const tableContent = responseData.data;

    tbody.innerHTML = '';

    if (!responseData.data || responseData.data.length === 0) {
        table.style.display = 'none';
        empty.style.display = 'block'
        return;
    }

    table.style.display = 'table';
    empty.style.display = 'none';

    tableContent.forEach(row => {
        const tr = tbody.insertRow();
        // For each field returned, inserts it into the index-th cell in a row
        row.forEach((field, index) => {
            const cell = tr.insertCell(index);
            cell.textContent = (index === 4) ? formatDate(field) : field;
        });
        const claimCell = tr.insertCell(row.length);
        const claimBtn = document.createElement('button');
        claimBtn.type = 'button';
        claimBtn.textContent = 'Claim';
        claimBtn.addEventListener("click", () => claimDonation(row[0])); //donationid
        claimCell.appendChild(claimBtn);
    });
  
}

async function claimDonation(donationID){

    //FETCH
    //expected response: {success: true}
    const response = await fetch('/update-donation',  {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            vid: currentVolunteerID,
            did: donationID,
        })
    });

    const responseData = await response.json();
    if (responseData.success) {
        await displayUnclaimedDonations();
        await displayUncompletedDonations();
    } else {
        alert('unable to claim donation');
    }

}

async function displayUncompletedDonations() {
    // loads donations claimed by this volunteer that haven't been dropped off yet
    //FETCH
    //expected response: {data: [[donationID, providerChain, providerName, donationCreatedTime, Location, donationSize], ...]}

    const response = await fetch(`/uncompleted-donations/${currentVolunteerID}`, {
        method: 'GET'
    });

    const responseData = await response.json();
    const tbody = document.getElementById('uncompleted-donations-tbody');
    const thead = document.getElementById('uncompleted-donations-head');

    tbody.innerHTML = '';

    if (!responseData.data || responseData.data.length === 0) {
        thead.style.display = 'none'
        tbody.innerHTML = 'No active deliveries assigned to you.';
        return;
    }

    thead.style.display = '';

    responseData.data.forEach(row => {
        const tr = tbody.insertRow();
        // row = [donationID, providerName, donationCreatedTime, donationSize, warehouseDropOffTime]
        row.forEach((field, i) => {
         const cell = tr.insertCell(i);  // create the cell first
        cell.textContent = (i === 3) ? formatDate(field) : field; // index 3 is donationCreatedTime
        });
        // complete button — only show if not yet dropped off (warehouseDropOffTime is null)
        const completeCell = tr.insertCell(row.length);
            const completeBtn = document.createElement('button');
            completeBtn.textContent = 'Mark as Complete';
            completeBtn.type = 'button';
            completeBtn.onclick = () => completeDonation(row[0]);
            completeCell.appendChild(completeBtn);
    });
}

async function completeDonation(donationID) {
    // sets warehouseDropOffTime to now
    //FETCH
    //expected resposne: {success: true}
    const response = await fetch('/complete-donation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            donationID: donationID})
    });

    responseData = await response.json();

    if (responseData.success) {
        await displayUncompletedDonations();
        await loadCompletedDonations();
        showTemporaryVolunteerMessage('Thank you for completing the delivery!');
    } else {
        showTemporaryVolunteerMessage('Error completing delivery.');
    }
}