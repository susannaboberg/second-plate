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


// Called by category sidebar buttons
function selectCategory(event, category) {
    // update active state on sidebar
    document.querySelectorAll('.category-tab').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');
    currentCategory = category;
    applyFilters();
}
 
function toggleFilters() {
    const panel = document.getElementById('filter-panel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}
 
async function applyFilters() {
    const brand = document.getElementById('filterBrand') ? document.getElementById('filterBrand').value.trim() : '';
    const name = document.getElementById('filterName') ? document.getElementById('filterName').value.trim() : '';
    const minQty = document.getElementById('filterMinQty') ? document.getElementById('filterMinQty').value.trim() : '';
 
    const filters = {
        brand: brand || null,
        name: name || null,
        category: currentCategory || null,
        minQty: minQty ? Number(minQty) : null
    };
 
    const response = await fetch('/show-filtered-food', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(filters)
    });
 
    const responseData = await response.json();
    const tbody = document.getElementById('available-foods-tbody');
    const thead = document.getElementById('available-foods-head');
    const empty = document.getElementById('available-foods-empty');
    tbody.innerHTML = '';
 
    if (!responseData.data || responseData.data.length === 0) {
        thead.style.display = 'none';
        empty.style.display = 'block';
        return;
    }
 
    thead.style.display = '';
    empty.style.display = 'none';
 
    // row = [foodBrand, foodName, foodCategory, allergens, quantity]
    responseData.data.forEach(row => {
        const tr = tbody.insertRow();
        row.forEach((field, i) => {
            tr.insertCell(i).textContent = field;
        });
        // Request qty input in last column
        const qtyCell = tr.insertCell(row.length);
        const input = document.createElement('input');
        input.type = 'number';
        input.min = '0';
        input.max = String(row[4]); // cap at available quantity
        input.value = '0';
        input.placeholder = '0';
        input.dataset.brand = row[0];
        input.dataset.name = row[1];
        input.dataset.available = row[4];
        input.className = 'request-qty-input';
        qtyCell.appendChild(input);
    });
}
 
function clearFilters() {
    if (document.getElementById('filterBrand')) document.getElementById('filterBrand').value = '';
    if (document.getElementById('filterName')) document.getElementById('filterName').value = '';
    if (document.getElementById('filterMinQty')) document.getElementById('filterMinQty').value = '';
    applyFilters();
}
 
function showRequestMessage(message, isError) {
    const confirmEl = document.getElementById('request-confirmation-details');
    const errorEl = document.getElementById('request-error');
 
    if (isError) {
        confirmEl.style.display = 'none';
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    } else {
        errorEl.style.display = 'none';
        confirmEl.textContent = message;
        confirmEl.style.display = 'block';
 
        if (requestConfirmTimer) clearTimeout(requestConfirmTimer);
        requestConfirmTimer = setTimeout(() => {
            confirmEl.style.display = 'none';
        }, 3000);
    }
}
 
async function submitRequest() {
    // Gather all rows where the user entered a quantity > 0
    const inputs = document.querySelectorAll('.request-qty-input');
    const items = [];
    let totalUnits = 0;
    let hasError = false;
 
    inputs.forEach(input => {
        const qty = parseInt(input.value, 10);
        if (isNaN(qty) || qty < 0) {
            showRequestMessage('Please enter valid (non-negative) quantities.', true);
            hasError = true;
            return;
        }
        if (qty === 0) return; // not requested
 
        const available = parseInt(input.dataset.available, 10);
        if (qty > available) {
            showRequestMessage(`Requested quantity for "${input.dataset.name}" exceeds available stock (${available}).`, true);
            hasError = true;
            return;
        }
 
        totalUnits += qty;
        items.push({
            brand: input.dataset.brand,
            name: input.dataset.name,
            quantity: qty
        });
    });
 
    if (hasError) return;
 
    if (items.length === 0) {
        showRequestMessage('Please enter a quantity for at least one item.', true);
        return;
    }
 
    const requestID = Number(Date.now().toString().slice(-8));
    const requestCreatedTime = new Date();
 
    const response = await fetch('/submit-request', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            requestID,
            recipientID: currentRecipientID,
            requestCreatedTime,
            requestSize: totalUnits,
            items
        })
    });
 
    const responseData = await response.json();
 
    if (responseData.success) {
        showRequestMessage('Your request has been submitted!', false);
        // reset all qty inputs to 0
        document.querySelectorAll('.request-qty-input').forEach(i => i.value = '0');
    } else {
        showRequestMessage('Could not submit request. Please try again.', true);
    }
}