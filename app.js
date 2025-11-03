// Wait for Firebase to initialize
let ridesListener = null;

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadRidesRealtime();
});

function setupEventListeners() {
    document.getElementById('postRideBtn').addEventListener('click', togglePostForm);
    document.getElementById('submitRide').addEventListener('click', handlePostRide);
    document.getElementById('cancelPost').addEventListener('click', togglePostForm);
    document.getElementById('searchInput').addEventListener('input', handleSearch);
}

function togglePostForm() {
    const form = document.getElementById('postRideForm');
    form.classList.toggle('hidden');
}

async function handlePostRide() {
    const driverName = document.getElementById('driverName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const from = document.getElementById('from').value.trim();
    const to = document.getElementById('to').value.trim();
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;
    const seats = parseInt(document.getElementById('seats').value);
    const pricePerSeat = document.getElementById('pricePerSeat').value;

    if (!driverName || !phone || !from || !to || !date || !time || !pricePerSeat) {
        alert('Please fill all required fields');
        return;
    }

    // Show loading
    const submitBtn = document.getElementById('submitRide');
    const submitText = document.getElementById('submitText');
    const submitLoader = document.getElementById('submitLoader');
    submitBtn.disabled = true;
    submitText.classList.add('hidden');
    submitLoader.classList.remove('hidden');

    try {
        const newRide = {
            driverName,
            phone,
            from,
            to,
            date,
            time,
            seatsAvailable: seats,
            totalSeats: seats,
            pricePerSeat: parseInt(pricePerSeat),
            bookings: [],
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('rides').add(newRide);
        
        alert('Ride posted successfully! 🚗');
        clearForm();
        togglePostForm();
    } catch (error) {
        console.error('Error posting ride:', error);
        alert('Failed to post ride. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitText.classList.remove('hidden');
        submitLoader.classList.add('hidden');
    }
}

function loadRidesRealtime() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    loadingIndicator.classList.remove('hidden');

    // Set up real-time listener
    ridesListener = db.collection('rides')
        .orderBy('createdAt', 'desc')
        .onSnapshot((snapshot) => {
            const rides = [];
            snapshot.forEach((doc) => {
                rides.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            loadingIndicator.classList.add('hidden');
            displayRides(rides);
        }, (error) => {
            console.error('Error loading rides:', error);
            loadingIndicator.classList.add('hidden');
            alert('Error loading rides. Please refresh the page.');
        });
}

function handleSearch(e) {
    const query = e.target.value.toLowerCase();
    
    if (query === '') {
        loadRidesRealtime();
        return;
    }

    // For search, we'll fetch and filter client-side
    db.collection('rides').get().then((snapshot) => {
        const rides = [];
        snapshot.forEach((doc) => {
            const ride = { id: doc.id, ...doc.data() };
            if (ride.from.toLowerCase().includes(query) ||
                ride.to.toLowerCase().includes(query) ||
                ride.driverName.toLowerCase().includes(query)) {
                rides.push(ride);
            }
        });
        displayRides(rides);
    });
}

async function handleBookSeat(rideId, passengerName, seatsToBook) {
    if (!passengerName || !seatsToBook) {
        alert('Please provide your name and number of seats');
        return;
    }

    try {
        const rideRef = db.collection('rides').doc(rideId);
        const rideDoc = await rideRef.get();

        if (!rideDoc.exists) {
            alert('Ride not found!');
            return;
        }

        const ride = rideDoc.data();

        if (ride.seatsAvailable >= seatsToBook) {
            const newBooking = {
                passengerName,
                seats: seatsToBook,
                bookedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await rideRef.update({
                seatsAvailable: ride.seatsAvailable - seatsToBook,
                bookings: firebase.firestore.FieldValue.arrayUnion(newBooking)
            });

            alert(`Successfully booked ${seatsToBook} seat(s)! 🎉`);
        } else {
            alert('Not enough seats available!');
        }
    } catch (error) {
        console.error('Error booking seat:', error);
        alert('Failed to book seat. Please try again.');
    }
}

function displayRides(rides) {
    const ridesList = document.getElementById('ridesList');
    
    if (rides.length === 0) {
        ridesList.innerHTML = `
            <div class="empty-state">
                <div class="icon">🚗</div>
                <h3>No rides available yet</h3>
                <p>Be the first to post a ride!</p>
            </div>
        `;
        return;
    }

    ridesList.innerHTML = rides.map(ride => {
        const createdDate = ride.createdAt ? new Date(ride.createdAt.toDate()).toLocaleDateString() : 'Just now';
        
        return `
        <div class="ride-card">
            <div class="ride-header">
                <div class="driver-icon">👤</div>
                <div class="driver-info">
                    <h3>${ride.driverName}</h3>
                    <p>${ride.phone}</p>
                    <span class="posted-date">Posted: ${createdDate}</span>
                </div>
            </div>
            
            <div class="ride-details">
                <div class="detail-item">
                    <div class="detail-icon">📍</div>
                    <div class="detail-content">
                        <p>From</p>
                        <p>${ride.from}</p>
                    </div>
                </div>
                <div class="detail-item">
                    <div class="detail-icon">🎯</div>
                    <div class="detail-content">
                        <p>To</p>
                        <p>${ride.to}</p>
                    </div>
                </div>
                <div class="detail-item">
                    <div class="detail-icon">📅</div>
                    <div class="detail-content">
                        <p>Date</p>
                        <p>${ride.date}</p>
                    </div>
                </div>
                <div class="detail-item">
                    <div class="detail-icon">🕐</div>
                    <div class="detail-content">
                        <p>Time</p>
                        <p>${ride.time}</p>
                    </div>
                </div>
            </div>
            
            <div class="ride-footer">
                <div>
                    <div class="seats-info">
                        👥 ${ride.seatsAvailable}/${ride.totalSeats} seats available
                    </div>
                    <div class="price">₹${ride.pricePerSeat}/seat</div>
                </div>
                
                ${ride.seatsAvailable > 0 ? `
                    <div class="booking-section">
                        <input type="text" placeholder="Your name" id="passenger-${ride.id}">
                        <input type="number" min="1" max="${ride.seatsAvailable}" value="1" id="seats-${ride.id}">
                        <button class="btn-primary" onclick="bookRide('${ride.id}')">Book Now</button>
                    </div>
                ` : `
                    <div class="fully-booked">Fully Booked</div>
                `}
            </div>
            
            ${ride.bookings && ride.bookings.length > 0 ? `
                <div class="bookings-list">
                    <p>Bookings:</p>
                    ${ride.bookings.map(booking => `
                        <div class="booking-item">
                            ${booking.passengerName} - ${booking.seats} seat(s)
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `}).join('');
}

function bookRide(rideId) {
    const passengerName = document.getElementById(`passenger-${rideId}`).value.trim();
    const seatsToBook = parseInt(document.getElementById(`seats-${rideId}`).value);
    handleBookSeat(rideId, passengerName, seatsToBook);
}

function clearForm() {
    document.getElementById('driverName').value = '';
    document.getElementById('phone').value = '';
    document.getElementById('from').value = '';
    document.getElementById('to').value = '';
    document.getElementById('date').value = '';
    document.getElementById('time').value = '';
    document.getElementById('seats').value = '1';
    document.getElementById('pricePerSeat').value = '';
}

// Cleanup listener on page unload
window.addEventListener('beforeunload', () => {
    if (ridesListener) {
        ridesListener();
    }
});
