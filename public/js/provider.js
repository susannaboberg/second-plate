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