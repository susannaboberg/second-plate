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