
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




