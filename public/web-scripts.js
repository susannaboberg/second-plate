
//UNIVERSAL -------------------------------------------------------------------------------
function formatDate(val) {
    if (!val) return '';
    const d = new Date(val);
    return d.toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

function showTab(evt, tabName) {
  // Declare all variables
  var i, tabcontent, tablinks;

  // hide all tabs
  tabcontent = document.getElementsByClassName("tab-content");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  // remove active from tab buttons
  tablinks = document.getElementsByClassName("tab-links");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  // Show the current tab, and add an "active" class to the button that opened the tab
  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.className += " active";

  if (tabName == 'tab-recipient') {
    applyFilters();
  }
}

async function showWelcomeBanner(role, id) {
    const response = await fetch(`/${role}s/${id}/details`, { method: 'GET' });
    const responseData = await response.json();
    const details = responseData.data;
    if (!details) return;

    let bannerText = '';
    if (role === 'provider') {
        bannerText = `Welcome!

            Provider: ${details.PROVIDERNAME}
            Chain: ${details.PROVIDERCHAIN}
            ID: ${details.PROVIDERID}`;
    } else if (role === 'volunteer') {
        bannerText = `Welcome, ${details.VOLUNTEERNAME}!
            ID: ${details.VOLUNTEERID}`;
    } else if (role === 'recipient') {
        bannerText = `Welcome! 

            User Info:
            Recipient: ${details.RECIPIENTNAME}
            Location: ${details.RECIPIENTLOCATION}, ${details.RECIPIENTZONE}
            ID: ${details.RECIPIENTID}`;
    } else if (role === 'employee') {
        bannerText = `Welcome, ${details.EMPLOYEENAME}!
            ID: ${details.EMPLOYEEID}`;
    }

    document.getElementById(`${role}-welcome`).textContent = bannerText;
    document.getElementById(`${role}-welcome`).style.display = 'block';
    document.getElementById(`${role}-id-login`).style.display = 'none'; // hide login fieldset
}

function logout(role) {
    // hide the main content
    document.getElementById(`${role}-main`).style.display = 'none';

    // clear and re-show the login fieldset
    const loginFieldset = document.getElementById(`${role}-id-login`) 
                       || document.getElementById(`${role}-id-section`);
    if (loginFieldset) {
        loginFieldset.style.display = 'block';
    }

    // clear the ID input
    const inputID = document.getElementById(`${role}ID`);
    if (inputID) {
        inputID.value = '';
        inputID.disabled = false;
    }

    // hide the welcome banner
    const welcome = document.getElementById(`${role}-welcome`);
    if (welcome) {
        welcome.style.display = 'none';
        welcome.textContent = '';
    }

    // clear the stored ID for volunteer
    if (role === 'volunteer') currentVolunteerID = null;
    if (role === 'recipient') currentRecipientID = null;
    if (role === 'provider') {
        clearProviderFoodTable();
        clearDonationMessages();
    }
    if (role === 'employee') {
        currentEmployeeID = null;
    }
}

//PROVIDER ----------------------------------------------------------------------------------
let providerConfirmTimer = null;

async function submitProviderID() {
    const id = document.getElementById('providerID').value.trim();
    const parsedId = Number(id);
    const error = document.getElementById('provider-id-error');
    const main = document.getElementById('provider-main');

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

    const isValid = await validateProviderID(id);

    if (isValid) {
        error.style.display = 'none';
        main.style.display = 'block';
        await showWelcomeBanner('provider', id);
    } else {
        error.textContent = 'ID does not exist.';
        error.style.display = 'block';
        main.style.display = 'none';
    }

}

async function validateProviderID(id) {
    const response = await fetch(`/providers/${id}`, {
        method: 'GET',
        headers: {'Content-Type': 'application/json'}
    });
    // request failed
    if (!response.ok) {return false;}

    const data = await response.json();

    // expected response: { exists: true }

    return data.exists === true
}

//HELPER FUNCTIONS FOR FOOD TABLE ----------------------------
function clearProviderFoodTable() {
    const tbody = document.getElementById('food-items-tbody');
    tbody.innerHTML = '';
    foodItemCount = 0;
}

//renumber rows of the food table when deleting or adding entries
function renumberRows() {
    const rows = document.querySelectorAll('#food-items-tbody tr');
    rows.forEach((row, i) => {
        row.querySelector('.row-num').textContent = i + 1;
    });
}

//gets rid of error and confirmation messages for submitting donations
function clearDonationMessages() {
    const error = document.getElementById('donation-enter-error');
    const confirm = document.getElementById('confirmation-details');

    error.textContent = '';
    error.style.display = 'none';

    confirm.textContent = '';
    confirm.style.display = 'none';
}

//print message based on what information was missing in the attempted submit
function showDonationError(message) {
    const error = document.getElementById('donation-enter-error');
    const confirm = document.getElementById('confirmation-details');

    confirm.textContent = '';
    confirm.style.display = 'none';

    error.textContent = message;
    error.style.display = 'block';
}

//temporary message when donation goes through
function showTemporaryConfirmation(message) {
    const confirm = document.getElementById('confirmation-details');
    const error = document.getElementById('donation-enter-error');

    error.textContent = '';
    error.style.display = 'none';

    confirm.textContent = message;
    confirm.style.display = 'block';

    if (providerConfirmTimer) {
        clearTimeout(providerConfirmTimer);
    }

    providerConfirmTimer = setTimeout(() => {
        confirm.textContent = '';
        confirm.style.display = 'none';
    }, 2500);
}

let foodItemCount = 0;

function addFoodItem() {
    foodItemCount++;
    const index = foodItemCount;
    const tbody = document.getElementById('food-items-tbody');

    const row = document.createElement('tr');
    row.id = 'food-item-' + index;
    row.className = 'food-item';
    row.innerHTML = `
                <td class="row-num">${index}</td>
                <td><input type="text" id="foodBrand-${index}" placeholder="e.g. Campbell's"></td>
                <td><input type="text" id="foodName-${index}" placeholder="e.g. Tomato Soup"></td>
                <td>
                    <select id="foodCategory-${index}">
                    <option value=""disabled selected>Select a category</option>
                    <option value="Canned Goods">Canned Goods</option>
                    <option value="Grain">Grain</option>
                    <option value="Protein">Protein</option>
                    <option value="Produce">Produce</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Condiments and Cooking">Condiments & Cooking</option>
                    <option value="Snacks and Beverages">Snacks & Beverages</option>
                    </select>
                </td>
                <td><input type="text" id="allergens-${index}" placeholder="e.g. gluten, dairy"></td>
                <td><input type="number" id="quantity-${index}" min="1" step="1"></td>
                <td class="remove-col"><button type="button" class="remove-btn" onclick="removeFoodItem(${index})">✕</button></td>
                `;
    tbody.appendChild(row);
    renumberRows();
}

function removeFoodItem(index) {
    const el = document.getElementById('food-item-' + index);
    if (el) {el.remove()};
    renumberRows();
}

function getDonationID(){
   return Number(Date.now().toString().slice(-8));

}

//returns [all item info, total units in donation]
function gatherFoodItems() {
    const error = document.getElementById('donation-enter-error');
    const rows = document.querySelectorAll('#food-items-tbody tr');
    const items = [];
    let totalUnits = 0;

    if (rows.length === 0) {
        showDonationError('Please add at least one food item.');
        return null;
    }

    rows.forEach(row => {
        const index = row.id.split('-')[2]; //isolates index number
        const brand = document.getElementById('foodBrand-' + index).value.trim();
        const name = document.getElementById('foodName-' + index).value.trim();
        const category = document.getElementById('foodCategory-' + index).value.trim();
        const allergens = document.getElementById('allergens-' + index).value.trim();

        const quantityRaw = document.getElementById('quantity-' + index).value.trim();
        const quantity = Number(quantityRaw);

        //error handling
        if (!brand) {
            showDonationError('Please make sure all donation items have a food brand entered');
            return null;
        }

        if (!name) {
            showDonationError('Please make sure all donation items have a food name entered');
            return null;
        }

        if (!category) {
            showDonationError('Please make sure all donation items have a category entered');
            return null;
        }

        if (!Number.isInteger(quantity) || quantity <= 0) {
            console.log(quantity, index);
            showDonationError('Please enter a positive whole number quantity for all donation items');
            return null;
        }

        totalUnits += quantity;
        items.push({brand, name, category, allergens, quantity});

    });
    console.log('food items contains' + items);
    return {
        foodItems: items,
        totalUnits: totalUnits
    };
}

async function submitDonation(event) {
    event.preventDefault();
    clearDonationMessages();
    const donationData = gatherFoodItems();
    console.log(donationData);

    if (donationData === null) {
        console.log('donation was null');
        return;
    }

    const foodItems = donationData.foodItems;
    const totalNumUnits = donationData.totalUnits;

    if (foodItems.length === 0 || totalNumUnits <= 0) {
    return;
}

    const providerID = document.getElementById('providerID').value.trim();
    const error = document.getElementById('donation-enter-error');
    const confirm = document.getElementById('confirmation-details');

    //generate donation id
    const donationID = getDonationID();
    let timeCreated = new Date();
    let donationSize = totalNumUnits;

    //FETCH
    //expected response: {success: true} or {success: false}
    const response = await fetch(`/submit-donation`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            providerID: providerID,
            donationID: donationID,
            donationCreatedTime: timeCreated,
            volunteerID: null,
            warehouseDropOffTime: null,
            donationSize: donationSize,
            foodItems: foodItems
        })
    });

    const responseData = await response.json();

    if (responseData.success) {
        clearProviderFoodTable();
        showTemporaryConfirmation('Thank you for donating! Your donation has been recorded.');

        if (typeof displayUnclaimedDonations === 'function') {
            await displayUnclaimedDonations();
        }
    } else {
        showDonationError('Could not create donation. Please check your food item information.');
    }
}


//VOLUNTEER -----------------------------------------------------------------------------------
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


//RECIPIENT ---------------------------------------------------------------------------
let currentRecipientID = null;

async function submitRecipientID() {
    const id = document.getElementById('recipientID').value.trim();
    const parsedId = Number(id);
    const error = document.getElementById('recipient-id-error');
    const main = document.getElementById('recipient-main');

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

    const isValid =  await validateRecipientID(id);

    if (isValid) {
        error.style.display = 'none';
        main.style.display = 'block';
        await showWelcomeBanner('recipient', id);
    } else {
        error.textContent = 'ID does not exist.';
        error.style.display = 'block';
        main.style.display = 'none';
    }
}

async function validateRecipientID(id) {
    //FETCH
    const response = await fetch(`/recipients/${id}`, {
        method: 'GET',
        headers: {'Content-Type': 'application/json'}
    });
    // request failed
    if (!response.ok) {return false;}

    const data = await response.json();

    // example expected response:
    // { exists: true }

    return data.exists === true
}


function toggleFilters() {
    const panel = document.getElementById('filter-panel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

async function applyFilters() {
    const brand = document.getElementById('filterBrand').value.trim();
    const name = document.getElementById('filterName').value.trim();
    const category = document.getElementById('filterCategory').value;

    const filters = {
        brand: brand || null,
        name: name || null,
        category: category || null
    }
 
    //FETCH
    //expected response: {data: [[foodBrand, foodName, foodCategory, allergens, quantity], ...]}
    //post or get?
    const response = await fetch('/show-filtered-food', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(filters)
    })

    const responseData = await response.json();
    const tbody = document.getElementById('available-foods-tbody');
    const thead = document.getElementById('available-foods-head');
    tbody.innerHTML = '';

    document.getElementById('filter-panel').style.display = 'none';

    if (!responseData.data || responseData.data.length === 0) {
        thead.style.display = 'none';
        tbody.innerHTML = '<tr><td colspan="6">No foods found.</td></tr>';
        return;
    } else {
        thead.style.display = '';
    }

    responseData.data.forEach(row => {
        const tr = tbody.insertRow();
        // row = [foodBrand, foodName, foodCategory, allergens, quantity]
        row.forEach((field, i) => {
            tr.insertCell(i).textContent = field;
        });
    });
}

function clearFilters() {
    document.getElementById('filterBrand').value = '';
    document.getElementById('filterName').value = '';
    document.getElementById('filterCategory').value = '';
    applyFilters();
}


//ANALYTICS ---------------------------------------------------------------------
async function loadAnalytics() {
    loadAllVolunteers();
    // loadAllVehicles();
    await loadCompletedDonations();
}

let currentEmployeeID = null;

async function submitEmployeeID() {
    const id = document.getElementById('employeeID').value.trim();
    const parsedId = Number(id);
    const error = document.getElementById('employee-id-error');
    const main = document.getElementById('employee-main');

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

    const isValid = await validateEmployeeID(id);

    if (isValid) {
        error.style.display = 'none';
        await showWelcomeBanner('employee', id);
        main.style.display = 'block';
        currentEmployeeID = id;
        loadAnalytics();
    } else {
        error.textContent = 'ID does not exist.';
        error.style.display = 'block';
        main.style.display = 'none';
    }
}

async function validateEmployeeID(id) {
    //FETCH
    // expected response: {exists: true}
    const response = await fetch(`/employees/${id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    // request failed
    if (!response.ok) {
        return false;
    }

    const data = await response.json();
    return data.exists === true
}

function showResults(tbodyID, tableID, emptyID, rows) {
    const tbody = document.getElementById(tbodyID);
    const table = document.getElementById(tableID);
    const empty = document.getElementById(emptyID);
    tbody.innerHTML = '';

    if (!rows || rows.length === 0) {
        table.style.display = 'none';
        empty.style.display = 'block';
        return;
    }

    rows.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = row.map(cell => `<td>${cell}</td>`).join('');
        tbody.appendChild(tr);
    });

    table.style.display = 'table';
    empty.style.display = 'none';
}

async function loadAllVolunteers() {

    //FETCH: need volunteer id and name from volunteer table
    //expected response: {data: [[volunteerID, volunteerName], ...]}
    const response = await fetch('/all-volunteers', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    const responseData = await response.json();
    const tbody = document.getElementById('all-volunteers-tbody');
    const thead = document.getElementById('all-volunteers-head');
    const empty = document.getElementById('all-volunteers-empty');
    tbody.innerHTML = '';

    if (!responseData.data || responseData.data.length === 0) {
        empty.style.display = 'block';
        thead.style.display = 'none';
        return;
    }
    thead.style.display = '';
    empty.style.display = 'none';
    responseData.data.forEach(row => {
        const tr = tbody.insertRow();
        row.forEach((field, i) => tr.insertCell(i).textContent = field);

        //insert delete button at end of each volunteer entry
        const deleteCell = tr.insertCell(row.length);
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.textContent = "Delete";
        deleteBtn.addEventListener("click", () => deleteVolunteer(row[0]));
        deleteCell.appendChild(deleteBtn);
    })
}

async function loadAllVehicles() {
        //FETCH: 
        // query needed: volunteer name, plate number, make, model, size from vehicle and vehicletype table
        //expected response: {data: [[volunteerName, plateNumber, vehicleMake, vehicleModel, vehicleSize], ...]}
    const response = await fetch('/all-vehicles', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    const responseData = await response.json();
    const tbody = document.getElementById('all-vehicles-tbody');
    const thead = document.getElementById('all-vehicles-head');
    const empty = document.getElementById('all-vehicles-empty');
    tbody.innerHTML = '';

    //if there are no vehicles
    if (!responseData.data || responseData.data.length === 0) {
        empty.style.display = 'block';
        thead.style.display = 'none';
        return;
    }
    thead.style.display = '';
    empty.style.display = 'none';
    responseData.data.forEach(row => {
        const tr = tbody.insertRow();
        row.forEach((field, i) => tr.insertCell(i).textContent = field);
    })
}

async function viewVehicles(){
    // var elems = document.getElementsByClassName("veh-table-head");
    // for(var i = 0; i < elems.length; i++) {
    //     elems[i].style.display = "none";}
    var str1 = ""
    var veh1IsChecked = document.getElementById("volunteer-check").checked;
    var veh2IsChecked = document.getElementById("plate-check").checked;
    var veh3IsChecked = document.getElementById("make-check").checked;
    var veh4IsChecked = document.getElementById("model-check").checked;
    const thead = document.getElementById("veh-table-head")
    thead.innerHTML = '';
    if (veh1IsChecked){
        const input1 = document.getElementById("volunteer-check").value; 
        str1 = str1 + input1 + ",";
        const node = document.createElement("th")
        const textnode = document.createTextNode("Volunteer Name")
        node.appendChild(textnode);
        document.getElementById("veh-table-head").appendChild(node);
    }
    if (veh2IsChecked){
        const input2 = document.getElementById("plate-check").value;
        str1 = str1 + input2 + ",";
        const node = document.createElement("th")
        const textnode = document.createTextNode("Plate Number")
        node.appendChild(textnode);
        document.getElementById("veh-table-head").appendChild(node);
    }
    if (veh3IsChecked){
        const input3 = document.getElementById("make-check").value;
        str1 = str1 + input3 + ",";
        const node = document.createElement("th")
        const textnode = document.createTextNode("Make")
        node.appendChild(textnode);
        document.getElementById("veh-table-head").appendChild(node);
    }
    if (veh4IsChecked){
        const input4 = document.getElementById("model-check").value;
        str1 = str1 + input4 + ",";
        const node = document.createElement("th")
        const textnode = document.createTextNode("Model")
        node.appendChild(textnode);
        document.getElementById("veh-table-head").appendChild(node);
    }
    str1 = str1.slice(0,-1)
    console.log(str1)

    const response = await fetch('/vehicle-project', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({attr: str1})
    })

    const responseData = await response.json();
    const tbody = document.getElementById('all-vehicles-tbody');
    const empty = document.getElementById('all-vehicles-empty');
    tbody.innerHTML = '';

    //if there are no vehicles
    if (!responseData.data || responseData.data.length === 0) {
        empty.style.display = 'block';
        return;
    }
    empty.style.display = 'none';
    console.log(responseData.data)
    responseData.data.forEach(row => {
        const tr = tbody.insertRow();
        Object.values(row).forEach((field, i) => tr.insertCell(i).textContent = field);
    })
}


async function loadCompletedDonations() {
    //FETCH: 
    // query needed: donations where warehouseDropOffTime is not null
    //expected resposne: {data: [[donationID, providerChain, providerName, volunteerName, donationCreatedTime, warehouseDropOffTime], ...]}
    const response = await fetch('/completed-donations', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    const responseData = await response.json();
    const tbody = document.getElementById('completed-donations-tbody');
    const thead = document.getElementById('completed-donations-head');
    const empty = document.getElementById('completed-donations-empty');
    tbody.innerHTML = '';

    if (!responseData.data || responseData.data.length === 0) {
        empty.style.display = 'block';
        thead.style.display = 'none';
        return;
    }
    thead.style.display = '';
    empty.style.display = 'none';
    responseData.data.forEach(row => {
        const tr = tbody.insertRow();
        row.forEach((field, i) => tr.insertCell(i).textContent = ((i === 3) || (i === 4)) ? formatDate(field) : field);
    })

}

async function deleteVolunteer(id) {
    const confirmed = window.confirm(`Are you sure you want to remove volunteer ${id} from the system? This cannot be undone.`);
    if (!confirmed) return; 
   
    const confirmMsg = document.getElementById('delete-vol-confirm')

    //FETCH
    const response = await fetch('/delete-volunteer', {
        method: 'DELETE',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({volunteerID: id})
    });

    const responseData = await response.json();
    if (responseData.success) {
        //reload tables related to volunteer to reflect the change
        loadAllVolunteers();
        viewVehicles();
        //loadAllVehicles();
        confirm.textContent = "Sucessfully deleted"

    } else {
        alert('unable to delete volunteer');
    }
}

async function showPickupsPerVolunteer() {
    const startDate = document.getElementById('pickupStartDate').value;
    const endDate = document.getElementById('pickupEndDate').value;

    const dateRange = {
        startDate: startDate,
        endDate: endDate
    }

    //FETCH
    //expected response: {data: [[volunteerName, volunteerID, totalDonationsPickedUp], ...]}
    const response = await fetch('/pickups-per-volunteer', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(dateRange)
    })
    
    const responseData = await response.json();
    showResults('pickups-tbody', 'pickups-table', 'pickups-empty', responseData.data);
}

async function showMinDonated() {
    const minUnitsDonated = document.getElementById('minUnitsDonated').value;
    const foodBrand = document.getElementById('foodBrand').value.trim();
    const foodName = document.getElementById('foodName').value.trim();

    const filters = {
        minUnitsDonated: minUnitsDonated,
        foodBrand: foodBrand,
        foodName: foodName
    }

    //FETCH
    //expected resposne: {data: [[foodBrand, foodName, foodCategory, totalUnitsDonated], ...]}
    const response = await fetch('/show-min-donated', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(filters)
    })

    const responseData = await response.json();
    showResults('min-donated-tbody', 'min-donated-table', 'min-donated-empty', responseData.data);
}

async function showAboveAverageFoods() {
    const startDate = document.getElementById('aboveAvgStartDate').value;
    const endDate = document.getElementById('aboveAvgEndDate').value;

    const dateRange = {
        startDate: startDate,
        endDate: endDate
    }

    //FETCH
    //expected response: {data: [[foodbrand, foodName, foodCategory, totalDonated], ...]}
    const response = await fetch('/run-above-average', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(dateRange)
    })
    
    const responseData = await response.json();
    showResults('above-avg-foods-tbody', 'above-avg-foods-table', 'above-avg-empty', responseData.data);
}

async function showUniversallyRequested() {

    const response = await fetch('/universally-requested', {
        method: 'GET',
        headers: {'Content-Type': 'application/json'},
    })

    const responseData = await response.json();
    showResults('universal-foods-tbody', 'universal-foods-table', 'universal-foods-empty', responseData.data);
}
