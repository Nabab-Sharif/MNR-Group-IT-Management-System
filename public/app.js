document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const createUserBtn = document.getElementById('create-user-btn');
    const userIdInput = document.getElementById('user-id-input');
    const userNameInput = document.getElementById('user-name-input');
    const currentUserSpan = document.getElementById('current-user-id');
    const addProductBtn = document.getElementById('add-product-btn');
    const productNameInput = document.getElementById('product-name');
    const transferUserIdInput = document.getElementById('transfer-user-id');
    
    const userProfileDiv = document.getElementById('user-profile');
    const productTrackingDiv = document.getElementById('product-tracking');
    const productTotalsList = document.getElementById('product-totals');
    const transactionList = document.getElementById('transaction-list');
    const existingUsersList = document.getElementById('existing-users-list');
    const totalUsersDiv = document.getElementById('total-users');

    const startCameraBtn = document.getElementById('start-camera-btn');
    const switchCameraBtn = document.getElementById('switch-camera-btn');
    const captureBtn = document.getElementById('capture-btn');
    const uploadPicInput = document.getElementById('upload-pic');
    const video = document.getElementById('camera-view');
    const canvas = document.getElementById('canvas');
    const profilePic = document.getElementById('profile-pic');
    const printBtn = document.getElementById('print-btn');

    let currentUserId = null;
    let currentStream;
    let useFrontCamera = true;

    // --- LocalStorage Helper Functions ---
    const getFromStorage = (key) => JSON.parse(localStorage.getItem(key)) || [];
    const saveToStorage = (key, data) => localStorage.setItem(key, JSON.stringify(data));

    // --- Initial Load ---
    displayExistingUsers();

    // --- User Functions ---
    createUserBtn.addEventListener('click', () => {
        const userId = userIdInput.value.trim();
        const userName = userNameInput.value.trim();
        if (!userId) {
            alert('User ID is required.');
            return;
        }

        let users = getFromStorage('users');
        let user = users.find(u => u.userId === userId);

        if (user) {
            currentUserId = userId;
        } else if (userName) {
            user = { userId, name: userName, profilePicture: '', productTotals: {} };
            users.push(user);
            saveToStorage('users', users);
            currentUserId = userId;
            displayExistingUsers();
        } else {
            alert('User not found. Please provide a name to create a new user.');
            return;
        }
        
        displayUserData(currentUserId);
        userIdInput.value = '';
        userNameInput.value = '';
    });

    function displayExistingUsers() {
        const users = getFromStorage('users');
        existingUsersList.innerHTML = '';
        totalUsersDiv.textContent = `Total Users: ${users.length}`;
        if (users.length === 0) {
            existingUsersList.innerHTML = '<li>No users found.</li>';
            return;
        }
        users.forEach(user => {
            const li = document.createElement('li');
            li.textContent = `${user.name} (${user.userId})`;
            li.onclick = () => {
                userIdInput.value = user.userId;
                userNameInput.value = user.name;
                createUserBtn.click();
            };
            existingUsersList.appendChild(li);
        });
    }

    function displayUserData(userId) {
        const users = getFromStorage('users');
        const user = users.find(u => u.userId === userId);
        if (!user) {
            userProfileDiv.style.display = 'none';
            productTrackingDiv.style.display = 'none';
            return;
        }

        currentUserId = userId;
        currentUserSpan.textContent = `${user.name} (${user.userId})`;
        profilePic.src = user.profilePicture || 'placeholder.png';

        // Display product totals
        productTotalsList.innerHTML = '';
        const totals = user.productTotals || {};
        if (Object.keys(totals).length === 0) {
            productTotalsList.innerHTML = '<li>No products found.</li>';
        } else {
            for (const [product, count] of Object.entries(totals)) {
                productTotalsList.innerHTML += `<li>${product}: ${count}</li>`;
            }
        }

        displayTransactions(userId);
        userProfileDiv.style.display = 'block';
        productTrackingDiv.style.display = 'block';
    }

    // --- Product Transaction Functions ---
    addProductBtn.addEventListener('click', () => {
        const productName = productNameInput.value.trim();
        const transferToUserId = transferUserIdInput.value.trim();
        if (!productName) {
            alert('Product name is required.');
            return;
        }

        if (transferToUserId) {
            // Transfer logic
            transferProduct(currentUserId, transferToUserId, productName);
        } else {
            // Add new product logic
            addTransaction(currentUserId, productName);
        }
        
        productNameInput.value = '';
        transferUserIdInput.value = '';
        displayUserData(currentUserId);
    });

    function addTransaction(userId, productName, notes = 'New product added') {
        let transactions = getFromStorage('transactions');
        const userTransactions = transactions.filter(t => t.userId === userId);
        const lastTransaction = userTransactions.pop();

        const newTransaction = {
            transactionId: Date.now(),
            userId,
            productName,
            transactionDate: new Date().toISOString(),
            previousTransactionDate: lastTransaction ? lastTransaction.transactionDate : null,
            notes
        };
        transactions.push(newTransaction);
        saveToStorage('transactions', transactions);

        // Update user's product totals
        let users = getFromStorage('users');
        let user = users.find(u => u.userId === userId);
        user.productTotals[productName] = (user.productTotals[productName] || 0) + 1;
        saveToStorage('users', users);
    }
    
    function transferProduct(fromUserId, toUserId, productName) {
        let users = getFromStorage('users');
        const fromUser = users.find(u => u.userId === fromUserId);
        const toUser = users.find(u => u.userId === toUserId);

        if (!toUser) {
            alert(`User with ID "${toUserId}" not found.`);
            return;
        }
        if (!fromUser.productTotals[productName] || fromUser.productTotals[productName] <= 0) {
            alert(`User ${fromUserId} does not have product "${productName}" to transfer.`);
            return;
        }

        // Decrease fromUser's count and add a transaction note
        fromUser.productTotals[productName]--;
        addTransaction(fromUserId, productName, `Transferred to ${toUserId}`);

        // Increase toUser's count and add a transaction note
        toUser.productTotals[productName] = (toUser.productTotals[productName] || 0) + 1;
        addTransaction(toUserId, productName, `Received from ${fromUserId}`);
        
        saveToStorage('users', users);
        alert(`Product ${productName} transferred to ${toUserId}.`);
    }

    function displayTransactions(userId) {
        transactionList.innerHTML = '';
        const transactions = getFromStorage('transactions').filter(t => t.userId === userId);
        transactions.reverse().forEach(t => {
            const date = new Date(t.transactionDate).toLocaleString();
            transactionList.innerHTML += `
                <li>
                    <strong>${t.productName}</strong> on ${date} <br>
                    <small>Notes: ${t.notes || 'N/A'}</small>
                    <button onclick="editTransaction(${t.transactionId})">Edit</button>
                    <button onclick="deleteTransaction(${t.transactionId})">Delete</button>
                </li>`;
        });
    }

    window.deleteTransaction = (transactionId) => {
        if (!confirm('Are you sure you want to delete this transaction?')) return;

        let transactions = getFromStorage('transactions');
        const transaction = transactions.find(t => t.transactionId === transactionId);
        
        // Update user product total
        let users = getFromStorage('users');
        let user = users.find(u => u.userId === transaction.userId);
        if (user && user.productTotals[transaction.productName] > 0) {
            user.productTotals[transaction.productName]--;
        }
        saveToStorage('users', users);

        // Remove transaction
        transactions = transactions.filter(t => t.transactionId !== transactionId);
        saveToStorage('transactions', transactions);
        displayUserData(currentUserId);
    };

    window.editTransaction = (transactionId) => {
        let transactions = getFromStorage('transactions');
        const transaction = transactions.find(t => t.transactionId === transactionId);
        const newNotes = prompt('Enter new notes for this transaction:', transaction.notes);
        if (newNotes !== null) {
            transaction.notes = newNotes;
            saveToStorage('transactions', transactions);
            displayUserData(currentUserId);
        }
    };

    // --- Camera and Picture Functions ---
    async function startCamera() {
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }

        const constraints = {
            video: {
                facingMode: useFrontCamera ? 'user' : 'environment'
            }
        };

        try {
            currentStream = await navigator.mediaDevices.getUserMedia(constraints);
            video.srcObject = currentStream;
            video.style.display = 'block';
            captureBtn.style.display = 'inline-block';
            switchCameraBtn.style.display = 'inline-block';
        } catch (err) {
            console.error("Error accessing camera: ", err);
            alert('Could not access the camera. Please check permissions.');
        }
    }

    startCameraBtn.addEventListener('click', startCamera);

    switchCameraBtn.addEventListener('click', () => {
        useFrontCamera = !useFrontCamera;
        startCamera();
    });

    captureBtn.addEventListener('click', () => {
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        profilePic.src = dataUrl;
        saveProfilePicture(dataUrl);
    });

    uploadPicInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                profilePic.src = e.target.result;
                saveProfilePicture(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    });

    function saveProfilePicture(dataUrl) {
        let users = getFromStorage('users');
        let user = users.find(u => u.userId === currentUserId);
        if (user) {
            user.profilePicture = dataUrl;
            saveToStorage('users', users);
        }
    }

    printBtn.addEventListener('click', () => window.print());
});
