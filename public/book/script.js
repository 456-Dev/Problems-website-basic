document.addEventListener('DOMContentLoaded', () => {
    // Remove any existing event listeners
    const oldButtons = document.querySelectorAll('.book-slot-btn');
    oldButtons.forEach(button => {
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
    });

    // Handle book slot button clicks
    document.querySelectorAll('.book-slot-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const eventCard = button.closest('.event-card');
            const formSection = eventCard.querySelector('.booking-form-section');
            
            // Close any other open forms
            document.querySelectorAll('.booking-form-section.expanded').forEach(section => {
                if (section !== formSection) {
                    section.classList.remove('expanded');
                    section.style.display = 'none';
                }
            });
            
            // Toggle this form
            if (formSection.style.display === 'none') {
                formSection.style.display = 'block';
                // Use setTimeout to allow display:block to take effect before adding expanded class
                setTimeout(() => {
                    formSection.classList.add('expanded');
                }, 10);
            } else {
                formSection.classList.remove('expanded');
                // Wait for transition to complete before hiding
                setTimeout(() => {
                    formSection.style.display = 'none';
                }, 300);
            }
        });
    });

    // Handle form submissions
    document.querySelectorAll('.booking-form').forEach(form => {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log("Form submitted - starting processing");
            
            // Get form data
            const eventName = this.querySelector('.form-event-name-hidden').value;
            const username = this.querySelector('[name="username"]').value;
            const email = this.querySelector('[name="email"]').value;
            const phone = this.querySelector('[name="phone"]').value || '';
            const instagram = this.querySelector('[name="instagram"]').value || '';
            const bookChoice = this.querySelector('[name="book_edition_reserved"]').value;
            
            // Find the event card
            const eventCard = this.closest('.event-card');
            if (!eventCard) {
                alert("Error: Event not found.");
                return;
            }
            
            const totalSlots = parseInt(eventCard.dataset.eventSlotsTotal, 10);
            const bookedSlots = parseInt(eventCard.dataset.eventSlotsBooked, 10);
            const availableSlots = totalSlots - bookedSlots;
            
            if (availableSlots <= 0) {
                alert("Sorry, all slots for this event are booked!");
                return;
            }
            
            try {
                // First save to Firebase
                let docRef = null;
                if (window.db) {
                    // Start a batch write
                    const batch = db.batch();
                    
                    // Add the booking
                    const bookingRef = db.collection("bookings").doc();
                    batch.set(bookingRef, {
                        event_name: eventName,
                        username: username,
                        book_edition: bookChoice,
                        email: email,
                        phone: phone,
                        instagram: instagram,
                        timestamp: new Date()
                    });
                    
                    // Update the event's booked slots
                    const eventRef = db.collection("events").where("name", "==", eventName).limit(1);
                    const eventSnapshot = await eventRef.get();
                    
                    if (!eventSnapshot.empty) {
                        const eventDoc = eventSnapshot.docs[0];
                        const currentBookedSlots = eventDoc.data().bookedSlots || 0;
                        batch.update(eventDoc.ref, {
                            bookedSlots: currentBookedSlots + 1
                        });
                    }
                    
                    // Commit the batch
                    await batch.commit();
                    docRef = bookingRef;
                    
                    console.log("Booking recorded in Firebase with ID:", docRef.id);
                    
                    // Update the event card slots
                    const newBookedSlots = bookedSlots + 1;
                    const newAvailableSlots = totalSlots - newBookedSlots;
                    
                    eventCard.dataset.eventSlotsBooked = newBookedSlots;
                    eventCard.querySelector('.slots-available').textContent = newAvailableSlots;
                    eventCard.querySelector('.slots-bar-filled').style.width = `${(newBookedSlots / totalSlots) * 100}%`;
                    
                    // Disable the button if no more slots are available
                    if (newAvailableSlots <= 0) {
                        const bookButton = eventCard.querySelector('.book-slot-btn');
                        if (bookButton) {
                            bookButton.disabled = true;
                            bookButton.textContent = "Fully Booked";
                            bookButton.style.backgroundColor = 'var(--pixel-grey)';
                        }
                    }
                }

                // Send confirmation email via EmailJS
                console.log("Sending confirmation email...");
                const emailData = {
                    subscriber_email: email,
                    event_name: eventName,
                    book_edition: bookChoice,
                    confirmation_link: docRef ? `https://456solutions.com/confirm?id=${docRef.id}` : "",
                    to_email: email,
                    username: username,
                    email: email,
                    from_name: "THEY SAID YOU CAN'T - Book Reservation",
                    reply_to: "books@456solutions.com"
                };
                
                const emailResult = await emailjs.send(
                    "service_hubj58x",
                    "template_da4g2be",
                    emailData,
                    "8c7vCsoyTAZuZfMap"
                );
                
                console.log("Email sent successfully:", emailResult);
                
                // Show thank you message
                const formSection = this.closest('.booking-form-section');
                this.style.display = 'none';
                
                const thankYouMessage = document.createElement('div');
                thankYouMessage.className = 'form-success-message';
                thankYouMessage.innerHTML = `
                    <h4>Thank You, ${username}!</h4>
                    <p>Your reservation has been submitted successfully.</p>
                    <p>A confirmation email has been sent to ${email}.</p>
                `;
                formSection.appendChild(thankYouMessage);
                
                // Close form section after a delay
                setTimeout(() => {
                    formSection.classList.remove('expanded');
                    setTimeout(() => {
                        formSection.style.display = 'none';
                        // Reset the form and remove thank you message after it's hidden
                        this.style.display = 'block';
                        this.reset();
                        thankYouMessage.remove();
                    }, 300);
                }, 3000);
                
            } catch (error) {
                console.error("Error processing booking:", error);
                alert("There was an error processing your reservation. Please try again or contact support.");
            }
        });
    });

    // --- Current Year for Footer ---
    const currentYearSpan = document.getElementById('currentYear');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // --- Load Events from Firebase ---
    const eventList = document.querySelector('.event-list');
    
    function loadEvents() {
        if (!eventList || !window.db) return;
        
        // Clear existing events
        eventList.innerHTML = '<div class="loading-events">Loading events...</div>';
        
        db.collection("events")
            .orderBy("date", "asc")
            .get()
            .then((querySnapshot) => {
                eventList.innerHTML = ''; // Clear loading message
                
                if (querySnapshot.empty) {
                    eventList.innerHTML = '<p class="no-events">No upcoming events scheduled. Check back soon!</p>';
                    return;
                }
                
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    const eventId = doc.id;
                    const availableSlots = data.totalSlots - data.bookedSlots;
                    const percentageBooked = (data.bookedSlots / data.totalSlots) * 100;
                    
                    const eventCard = document.createElement('article');
                    eventCard.className = 'event-card';
                    eventCard.dataset.eventName = data.name;
                    eventCard.dataset.eventSlotsTotal = data.totalSlots;
                    eventCard.dataset.eventSlotsBooked = data.bookedSlots;
                    
                    eventCard.innerHTML = `
                        <h3 class="event-name">${data.name}</h3>
                        <p class="event-details">${data.date}</p>
                        <p class="event-location">${data.location}</p>
                        <div class="slots-tracker">
                            Slots Remaining: <span class="slots-available">${availableSlots}</span>/${data.totalSlots}
                            <div class="slots-bar-container">
                                <div class="slots-bar-filled" style="width: ${percentageBooked}%;"></div>
                            </div>
                        </div>
                        <button class="btn book-slot-btn" ${availableSlots <= 0 ? 'disabled' : ''}>
                            ${availableSlots <= 0 ? 'Fully Booked' : 'Book Pickup Slot'}
                        </button>
                        
                        <!-- Expandable Booking Form -->
                        <div class="booking-form-section" style="display: none;">
                            <form class="booking-form">
                                <input type="hidden" name="event_name" class="form-event-name-hidden" value="${data.name}">
                                
                                <div class="form-group">
                                    <label for="full-name-${eventId}">Username*</label>
                                    <input type="text" id="full-name-${eventId}" name="username" required>
                                </div>

                                <div class="form-group">
                                    <label for="email-${eventId}">Email Address*</label>
                                    <input type="email" id="email-${eventId}" name="email" required>
                                </div>

                                <div class="form-group">
                                    <label for="phone-${eventId}">Phone Number (Optional)</label>
                                    <input type="tel" id="phone-${eventId}" name="phone">
                                </div>

                                <div class="form-group">
                                    <label for="instagram-${eventId}">Instagram Handle (Optional)</label>
                                    <input type="text" id="instagram-${eventId}" name="instagram" placeholder="@yourusername">
                                </div>

                                <div class="form-group">
                                    <label for="book-choice-${eventId}">Book Edition*</label>
                                    <select id="book-choice-${eventId}" name="book_edition_reserved" required>
                                        <option value="" disabled selected>Select an edition...</option>
                                        <option value="Standard Edition" data-price="$25">Standard Edition - $25</option>
                                        <option value="Deluxe [Worse] Edition" data-price="$50">Deluxe [Worse] Edition - $50</option>
                                    </select>
                                </div>

                                <p class="form-note">* Required fields. Confirmation will be sent to your email. Payment is due at pickup.</p>
                                <button type="submit" class="btn modal-submit-btn">Submit Reservation</button>
                            </form>
                        </div>
                    `;
                    
                    if (availableSlots <= 0) {
                        const bookButton = eventCard.querySelector('.book-slot-btn');
                        if (bookButton) {
                            bookButton.style.backgroundColor = 'var(--pixel-grey)';
                        }
                    }
                    
                    eventList.appendChild(eventCard);
                });
                
                // Reattach event listeners after creating all cards
                attachEventListeners();
            })
            .catch((error) => {
                console.error("Error loading events: ", error);
                eventList.innerHTML = '<p class="error-message">Error loading events. Please refresh the page to try again.</p>';
            });
    }
    
    // Function to attach all event listeners
    function attachEventListeners() {
        console.log("Attaching event listeners to buttons and forms...");
        
        // Handle book slot button clicks
        const buttons = document.querySelectorAll('.book-slot-btn');
        console.log(`Found ${buttons.length} book slot buttons`);
        
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                console.log("Book slot button clicked");
                e.preventDefault();
                const eventCard = button.closest('.event-card');
                const formSection = eventCard.querySelector('.booking-form-section');
                console.log("Form section found:", formSection);
                
                // Close any other open forms
                document.querySelectorAll('.booking-form-section.expanded').forEach(section => {
                    if (section !== formSection) {
                        section.classList.remove('expanded');
                        section.style.display = 'none';
                    }
                });
                
                // Toggle this form
                if (formSection.style.display === 'none' || !formSection.style.display) {
                    console.log("Opening form section");
                    formSection.style.display = 'block';
                    // Use setTimeout to allow display:block to take effect before adding expanded class
                    setTimeout(() => {
                        formSection.classList.add('expanded');
                    }, 10);
                } else {
                    console.log("Closing form section");
                    formSection.classList.remove('expanded');
                    // Wait for transition to complete before hiding
                    setTimeout(() => {
                        formSection.style.display = 'none';
                    }, 300);
                }
            });
        });

        // Handle form submissions
        document.querySelectorAll('.booking-form').forEach(form => {
            form.addEventListener('submit', async function(e) {
                e.preventDefault();
                console.log("Form submitted - starting processing");
                
                // Get form data
                const eventName = this.querySelector('.form-event-name-hidden').value;
                const username = this.querySelector('[name="username"]').value;
                const email = this.querySelector('[name="email"]').value;
                const phone = this.querySelector('[name="phone"]').value || '';
                const instagram = this.querySelector('[name="instagram"]').value || '';
                const bookChoice = this.querySelector('[name="book_edition_reserved"]').value;
                
                // Find the event card
                const eventCard = this.closest('.event-card');
                if (!eventCard) {
                    alert("Error: Event not found.");
                    return;
                }
                
                const totalSlots = parseInt(eventCard.dataset.eventSlotsTotal, 10);
                const bookedSlots = parseInt(eventCard.dataset.eventSlotsBooked, 10);
                const availableSlots = totalSlots - bookedSlots;
                
                if (availableSlots <= 0) {
                    alert("Sorry, all slots for this event are booked!");
                    return;
                }
                
                try {
                    // First save to Firebase
                    let docRef = null;
                    if (window.db) {
                        // Start a batch write
                        const batch = db.batch();
                        
                        // Add the booking
                        const bookingRef = db.collection("bookings").doc();
                        batch.set(bookingRef, {
                            event_name: eventName,
                            username: username,
                            book_edition: bookChoice,
                            email: email,
                            phone: phone,
                            instagram: instagram,
                            timestamp: new Date()
                        });
                        
                        // Update the event's booked slots
                        const eventRef = db.collection("events").where("name", "==", eventName).limit(1);
                        const eventSnapshot = await eventRef.get();
                        
                        if (!eventSnapshot.empty) {
                            const eventDoc = eventSnapshot.docs[0];
                            const currentBookedSlots = eventDoc.data().bookedSlots || 0;
                            batch.update(eventDoc.ref, {
                                bookedSlots: currentBookedSlots + 1
                            });
                        }
                        
                        // Commit the batch
                        await batch.commit();
                        docRef = bookingRef;
                        
                        console.log("Booking recorded in Firebase with ID:", docRef.id);
                        
                        // Update the event card slots
                        const newBookedSlots = bookedSlots + 1;
                        const newAvailableSlots = totalSlots - newBookedSlots;
                        
                        eventCard.dataset.eventSlotsBooked = newBookedSlots;
                        eventCard.querySelector('.slots-available').textContent = newAvailableSlots;
                        eventCard.querySelector('.slots-bar-filled').style.width = `${(newBookedSlots / totalSlots) * 100}%`;
                        
                        // Disable the button if no more slots are available
                        if (newAvailableSlots <= 0) {
                            const bookButton = eventCard.querySelector('.book-slot-btn');
                            if (bookButton) {
                                bookButton.disabled = true;
                                bookButton.textContent = "Fully Booked";
                                bookButton.style.backgroundColor = 'var(--pixel-grey)';
                            }
                        }
                    }

                    // Send confirmation email via EmailJS
                    console.log("Sending confirmation email...");
                    const emailData = {
                        subscriber_email: email,
                        event_name: eventName,
                        book_edition: bookChoice,
                        confirmation_link: docRef ? `https://456solutions.com/confirm?id=${docRef.id}` : "",
                        to_email: email,
                        username: username,
                        email: email,
                        from_name: "THEY SAID YOU CAN'T - Book Reservation",
                        reply_to: "books@456solutions.com"
                    };
                    
                    const emailResult = await emailjs.send(
                        "service_hubj58x",
                        "template_da4g2be",
                        emailData,
                        "8c7vCsoyTAZuZfMap"
                    );
                    
                    console.log("Email sent successfully:", emailResult);
                    
                    // Show thank you message
                    const formSection = this.closest('.booking-form-section');
                    this.style.display = 'none';
                    
                    const thankYouMessage = document.createElement('div');
                    thankYouMessage.className = 'form-success-message';
                    thankYouMessage.innerHTML = `
                        <h4>Thank You, ${username}!</h4>
                        <p>Your reservation has been submitted successfully.</p>
                        <p>A confirmation email has been sent to ${email}.</p>
                    `;
                    formSection.appendChild(thankYouMessage);
                    
                    // Close form section after a delay
                    setTimeout(() => {
                        formSection.classList.remove('expanded');
                        setTimeout(() => {
                            formSection.style.display = 'none';
                            // Reset the form and remove thank you message after it's hidden
                            this.style.display = 'block';
                            this.reset();
                            thankYouMessage.remove();
                        }, 300);
                    }, 3000);
                    
                } catch (error) {
                    console.error("Error processing booking:", error);
                    alert("There was an error processing your reservation. Please try again or contact support.");
                }
            });
        });
    }
    
    // Load events if Firebase is available
    if (window.db) {
        loadEvents();
    } else {
        // If Firebase isn't loaded yet, wait for it
        window.addEventListener('firebase-ready', loadEvents);
    }

    // --- Booking Modal Logic ---
    const bookingModal = document.getElementById('booking-modal');
    const modalCloseBtn = bookingModal ? bookingModal.querySelector('.modal-close-btn') : null;
    const bookSlotButtons = document.querySelectorAll('.book-slot-btn');
    const bookingForm = document.getElementById('booking-form');
    const modalEventNameDisplay = document.getElementById('modal-event-name');
    const formEventNameHiddenInput = document.getElementById('form-event-name-hidden');

    function openModal(eventName) {
        if (bookingModal && modalEventNameDisplay && formEventNameHiddenInput) {
            modalEventNameDisplay.textContent = `Book Slot for ${eventName}`;
            formEventNameHiddenInput.value = eventName;
            bookingModal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden'; // Prevent background scroll
        }
    }

    function closeModal() {
        if (bookingModal) {
            bookingModal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            if (bookingForm) bookingForm.reset(); // Optional: reset form on close
        }
    }

    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeModal);
    }

    if (bookingModal) {
        bookingModal.addEventListener('click', (event) => {
            if (event.target === bookingModal) { // Click on overlay itself
                closeModal();
            }
        });
    }

    bookSlotButtons.forEach(button => {
        button.addEventListener('click', () => {
            const eventCard = button.closest('.event-card');
            const eventName = eventCard.dataset.eventName;
            const slotsAvailable = parseInt(eventCard.querySelector('.slots-available').textContent, 10);
            if (slotsAvailable > 0) {
                openModal(eventName);
            } else {
                alert("Sorry, all slots for this event are booked!");
            }
        });
    });
    
    // --- Slots Tracker (Update visual from data attributes) ---
    document.querySelectorAll('.event-card').forEach(card => {
        const totalSlots = parseInt(card.dataset.eventSlotsTotal, 10);
        const bookedSlots = parseInt(card.dataset.eventSlotsBooked, 10);
        const availableSlots = totalSlots - bookedSlots;
        const barFilled = card.querySelector('.slots-bar-filled');
        const slotsAvailableSpan = card.querySelector('.slots-available');

        if (slotsAvailableSpan) slotsAvailableSpan.textContent = availableSlots;
        if (barFilled) {
            const percentageBooked = (bookedSlots / totalSlots) * 100;
            barFilled.style.width = `${percentageBooked}%`;
        }
        if (availableSlots <= 0) {
            const bookButton = card.querySelector('.book-slot-btn');
            if (bookButton) {
                bookButton.disabled = true;
                bookButton.textContent = "Fully Booked";
                bookButton.style.backgroundColor = 'var(--pixel-grey)';
            }
        }
    });

    // --- Smooth Scroll for "Reserve for Event Pickup" buttons ---
    const reserveButtons = document.querySelectorAll('.reserve-physical-btn');
    const eventsSection = document.getElementById('events');

    reserveButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            if (eventsSection) {
                eventsSection.scrollIntoView({ behavior: 'smooth' });
                
                const card = button.closest('.edition-card');
                const bookingModalSelect = document.getElementById('book-choice');
                if (bookingModalSelect) {
                   if (card.classList.contains('standard')) {
                       bookingModalSelect.value = "Standard Edition - $25";
                   } else if (card.classList.contains('deluxe')) {
                       bookingModalSelect.value = "Deluxe [Worse] Edition - $50";
                   }
                }
            }
        });
    });
    
    // --- Lightbox for Photo Sampler (Kept from original but not actively used by new HTML) ---
    const photoItems = document.querySelectorAll('.photo-item'); // This class is not in the new HTML directly.
    const lightbox = document.getElementById('photo-lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    const lightboxCloseBtn = lightbox ? lightbox.querySelector('.lightbox-close-btn') : null;

    if (lightbox && lightboxImage && lightboxCloseBtn) {
        photoItems.forEach(item => {
            item.addEventListener('click', () => {
                const fullImageSrc = item.dataset.full;
                if (fullImageSrc) {
                    lightboxImage.src = fullImageSrc;
                    lightbox.setAttribute('aria-hidden', 'false');
                    document.body.style.overflow = 'hidden';
                }
            });
        });

        function closeLightbox() {
            if (lightbox) {
                lightbox.setAttribute('aria-hidden', 'true');
                if (lightboxImage) lightboxImage.src = "";
                document.body.style.overflow = '';
            }
        }

        if (lightboxCloseBtn) lightboxCloseBtn.addEventListener('click', closeLightbox);
        
        if (lightbox) {
            lightbox.addEventListener('click', (event) => {
                if (event.target === lightbox) closeLightbox();
            });
        }
        
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && lightbox && lightbox.getAttribute('aria-hidden') === 'false') {
                closeLightbox();
            }
        });
    }

    // --- <details> dropdown accessibility (CSS handles arrow, this is just for record) ---
    // Native <details> is generally accessible.

    // --- Digital Purchase Link Placeholder Check ---
    const digitalBuyButton = document.querySelector('.buy-digital-btn');
    if (digitalBuyButton) {
        // Replace the placeholder link with a functioning modal trigger
        digitalBuyButton.setAttribute('href', '#');
        digitalBuyButton.addEventListener('click', (e) => {
            e.preventDefault();
            openDigitalPurchaseModal();
        });
    }

    // --- Digital Purchase Modal Logic ---
    const digitalPurchaseModal = document.getElementById('digital-purchase-modal');
    const digitalModalCloseBtn = digitalPurchaseModal ? digitalPurchaseModal.querySelector('.modal-close-btn') : null;
    const promoCodeInput = document.getElementById('promo-code');
    const applyPromoBtn = document.getElementById('apply-promo-btn');
    const paidConfirmationBtn = document.getElementById('paid-confirmation-btn');
    const downloadSection = document.getElementById('download-section');
    
    // --- Delivery Modal Logic ---
    const orderDeliveryBtn = document.querySelector('.order-delivery-btn');
    const deliveryModal = document.getElementById('delivery-modal');
    const deliveryModalCloseBtn = deliveryModal ? deliveryModal.querySelector('.modal-close-btn') : null;
    const deliveryForm = document.getElementById('delivery-form');
    const orderSuccessDiv = document.getElementById('order-success');
    
    // Promo code that gives free access
    const validPromoCodes = ['456'];

    function openDigitalPurchaseModal() {
        if (digitalPurchaseModal) {
            digitalPurchaseModal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden'; // Prevent background scroll
            
            // Reset the modal state
            if (downloadSection) downloadSection.style.display = 'none';
            if (promoCodeInput) promoCodeInput.value = '';
        }
    }

    function closeDigitalPurchaseModal() {
        if (digitalPurchaseModal) {
            digitalPurchaseModal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }
    }

    if (digitalModalCloseBtn) {
        digitalModalCloseBtn.addEventListener('click', closeDigitalPurchaseModal);
    }

    if (digitalPurchaseModal) {
        digitalPurchaseModal.addEventListener('click', (event) => {
            if (event.target === digitalPurchaseModal) { // Click on overlay itself
                closeDigitalPurchaseModal();
            }
        });
    }

    // Handle promo code
    if (applyPromoBtn && promoCodeInput) {
        applyPromoBtn.addEventListener('click', () => {
            const code = promoCodeInput.value.trim();
            if (validPromoCodes.includes(code)) {
                // Valid promo code - show download
                if (downloadSection) {
                    downloadSection.style.display = 'block';
                    // Hide the payment sections
                    document.querySelector('.honor-system').style.display = 'none';
                    document.querySelector('.promo-area').style.display = 'none';
                }
            } else {
                // Invalid promo code
                alert('Invalid promo code. Please try again or proceed with payment.');
            }
        });
    }

    // Handle "I Swear I Paid" button
    if (paidConfirmationBtn) {
        paidConfirmationBtn.addEventListener('click', () => {
            if (downloadSection) {
                downloadSection.style.display = 'block';
                // Hide the payment sections
                document.querySelector('.honor-system').style.display = 'none';
                document.querySelector('.promo-area').style.display = 'none';
                
                // Update the download link to the Google Drive URL
                const downloadBtn = downloadSection.querySelector('.download-btn');
                if (downloadBtn) {
                    downloadBtn.href = 'https://drive.google.com/file/d/10boEgUUNLs96TlAIJUo1b_UqRFqnkahN/view?usp=sharing';
                    downloadBtn.target = '_blank'; // Open in new tab
                    downloadBtn.textContent = 'Access Digital Book';
                }
            }
        });
    }

    // --- NEW: Interactive GIF Logic ---
    const interactiveGif = document.getElementById('interactive-gif');
    const frameMessage = document.getElementById('frame-message');
    const clickMessage = document.getElementById('click-message');
    
    if (interactiveGif && frameMessage) {
        let isPlaying = false;
        let gameEnded = false;
        let frameCount = 12;
        let startTime;
        let frameDuration = 500;
        
        // Frame image URLs - updated to use image_lottery folder
        const frameImages = {
            1: "image_lottery/frame1.png",
            2: "image_lottery/frame2.png",
            3: "image_lottery/frame3.png",
            4: "image_lottery/frame4.png",
            5: "image_lottery/frame5.png",
            6: "image_lottery/frame6.png",
            7: "image_lottery/frame7.png",
            8: "image_lottery/frame8.png",
            9: "image_lottery/frame9.png",
            10: "image_lottery/frame10.png",
            11: "image_lottery/frame11.png",
            12: "image_lottery/frame12.png"
        };
        
        const frameMessages = {
            1: "Diego Sanchez's Page [Meditations]",
            2: "Untitled Photo [Don't play water]",
            3: "λ = NotMYdog [HFIλ]",
            4: "Untitled Photo [Don't play water]",
            5: "why? GOD. [odds & ends pt.17]",
            6: "Untitled Photo ROAD KILL]",
            7: "Untitled Photo [ROAD KILL]",
            8: "5G [Video Screenshots of America]",
            9: "λ = inverted [HFIλ]",
            10: "Untitled Photo DOUBLE UP!!]",
            11: "Elvis's Jet [Video Screenshots of America]",
            12: "Untitled Photo [DOUBLE UP!!]"
        };

        // Store the original animated and static sources
        const animatedSrc = interactiveGif.dataset.animatedSrc;
        const staticSrc = interactiveGif.dataset.staticSrc;

        // Start with static image
        interactiveGif.src = staticSrc;
        
        // Make sure the cursor shows this is clickable
        interactiveGif.style.cursor = 'pointer';

        // Handle both click and touch events
        ['click', 'touchend'].forEach(eventType => {
            interactiveGif.addEventListener(eventType, (e) => {
                e.preventDefault();

                if (gameEnded) {
                    return; // Do nothing if game has ended
                }

                if (!isPlaying) {
                    // First click - start playing
                    interactiveGif.src = animatedSrc;
                    startTime = Date.now();
                    isPlaying = true;
                    
                    // Show click message
                    if (clickMessage) {
                        clickMessage.textContent = "Click again to stop!";
                        clickMessage.classList.add('visible');
                    }
                } else {
                    // Second click - stop and show specific frame
                    const timeElapsed = Date.now() - startTime;
                    const currentFrame = Math.floor((timeElapsed % (frameCount * frameDuration)) / frameDuration) + 1;
                    
                    // Use the specific frame image instead of trying to capture from GIF
                    interactiveGif.src = frameImages[currentFrame];
                    
                    // Hide click message and show frame message
                    if (clickMessage) {
                        clickMessage.textContent = "";
                        clickMessage.classList.remove('visible');
                    }
                    
                    // Show the frame message
                    frameMessage.textContent = frameMessages[currentFrame] || "You caught an interesting moment!";
                    frameMessage.classList.add('visible');

                    isPlaying = false;
                    gameEnded = true; // End the game
                    interactiveGif.style.cursor = 'default'; // Remove pointer cursor
                }
            });
        });

        // Prevent default touch behavior
        interactiveGif.addEventListener('touchstart', (e) => {
            e.preventDefault();
        }, { passive: false });
    }

    // --- Edition cards info behavior ---
    const editionsGrid = document.querySelector('.editions-grid');
    const modalOverlay = document.querySelector('.modal-overlay');
    let isMobile = window.innerWidth <= 768; // Fixed readonly property issue
    
    // Handle window resize
    window.addEventListener('resize', () => {
        isMobile = window.innerWidth <= 768;
    });
    
    // Info button click handler
    document.querySelectorAll('.info-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default action
            const card = btn.closest('.edition-card');
            
            // First hide all other cards
            document.querySelectorAll('.edition-card').forEach(otherCard => {
                if (otherCard !== card) {
                    otherCard.classList.add('hide');
                }
            });
            
            // Then expand this card and add class to grid
            card.classList.add('expanded');
            editionsGrid.classList.add('has-expanded-card');
        });
    });
    
    // Close button click handler
    document.querySelectorAll('.close-info-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove expanded class from current card
            const card = btn.closest('.edition-card');
            card.classList.remove('expanded');
            
            // Remove class from grid
            editionsGrid.classList.remove('has-expanded-card');
            
            // Show all cards again
            document.querySelectorAll('.edition-card').forEach(card => {
                card.classList.remove('hide');
            });
        });
    });

    // Also close when clicking on overlay
    if (modalOverlay) {
        modalOverlay.addEventListener('click', () => {
            // First check if there are any expanded edition cards
            const expandedCard = document.querySelector('.edition-card.expanded');
            if (expandedCard) {
                const closeBtn = expandedCard.querySelector('.close-info-btn');
                if (closeBtn) {
                    closeBtn.click();
                }
            }
        });
    }

    // Order delivery functionality
    if (orderDeliveryBtn) {
        orderDeliveryBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openDeliveryModal();
        });
    }

    function openDeliveryModal() {
        if (deliveryModal) {
            deliveryModal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden'; // Prevent background scroll
            
            // Reset the form
            if (deliveryForm) deliveryForm.reset();
            if (orderSuccessDiv) orderSuccessDiv.style.display = 'none';
        }
    }

    function closeDeliveryModal() {
        if (deliveryModal) {
            deliveryModal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }
    }

    if (deliveryModalCloseBtn) {
        deliveryModalCloseBtn.addEventListener('click', closeDeliveryModal);
    }

    if (deliveryModal) {
        deliveryModal.addEventListener('click', (event) => {
            if (event.target === deliveryModal) { // Click on overlay itself
                closeDeliveryModal();
            }
        });
    }

    // Handle delivery form submission
    if (deliveryForm) {
        deliveryForm.addEventListener('submit', async function(e) {
            e.preventDefault(); // Prevent form submission
            
            // Check if payment confirmation checkbox is checked
            const paymentConfirmed = document.getElementById('payment-confirmation').checked;
            if (!paymentConfirmed) {
                e.preventDefault();
                alert("Please confirm you've completed the payment before submitting.");
                return false;
            }
            
            // Get form data
            const fullName = document.getElementById('full-name').value;
            const email = document.getElementById('delivery-email').value;
            const phone = document.getElementById('delivery-phone').value;
            const address = document.getElementById('delivery-address').value;
            const city = document.getElementById('delivery-city').value;
            const state = document.getElementById('delivery-state').value;
            const zipCode = document.getElementById('delivery-zip').value;
            
            try {
                // Add to Firebase if available
                let docRef = null;
                if (window.db) {
                    console.log("Saving delivery order to Firebase...");
                    docRef = await window.db.collection("deliveryOrders").add({
                        full_name: fullName,
                        email: email,
                        phone: phone,
                        shipping_address: address,
                        city: city,
                        state: state,
                        zip_code: zipCode,
                        payment_confirmed: true,
                        timestamp: new Date()
                    });
                    console.log("Delivery order saved to Firebase with ID:", docRef.id);
                }
                
                // Send confirmation email via EmailJS
                try {
                    console.log("Sending confirmation email via EmailJS...");
                    
                    // EmailJS parameters 
                    const serviceId = "service_hubj58x";
                    const templateId = "template_da4g2be";
                    
                    // Prepare data for EmailJS
                    const emailData = {
                        subscriber_email: email,
                        event_name: "Book Delivery Order",
                        book_edition: "Deluxe Edition - Shipped",
                        confirmation_link: docRef ? `https://456solutions.com/confirm?id=${docRef.id}` : "",
                        to_email: email,
                        username: fullName,
                        email: email,
                        from_name: "THEY SAID YOU CAN'T - Book Order",
                        reply_to: "books@456solutions.com",
                        shipping_address: `${address}, ${city}, ${state} ${zipCode}`
                    };
                    
                    console.log("Sending email with data:", emailData);
                    
                    const emailResult = await emailjs.send(
                        serviceId,
                        templateId,
                        emailData,
                        "8c7vCsoyTAZuZfMap" // PublicKey
                    );
                    
                    console.log("Email sent successfully:", emailResult);
                } catch (emailError) {
                    console.error("Error sending confirmation email:", emailError);
                    console.error("Error details:", JSON.stringify(emailError));
                }
                
                // Show thank you message after form submission
                const formParent = this.parentElement;
                this.style.display = 'none';
                
                const thankYouMessage = document.createElement('div');
                thankYouMessage.className = 'form-success-message';
                thankYouMessage.innerHTML = `
                    <h4>Thank You!</h4>
                    <p>Your order has been submitted successfully.</p>
                    <p>A confirmation email has been sent to your email address.</p>
                    <p>We'll ship your book within 5-7 business days.</p>
                `;
                formParent.appendChild(thankYouMessage);
                
            } catch (error) {
                console.error("Error processing order:", error);
                alert("There was an error processing your order. Please try again or contact support.");
            }
        });
    }

    // --- Handle Zelle payment buttons ---
    const zelleDigitalBtn = document.getElementById('zelle-digital-btn');
    const zelleDigitalInfo = document.getElementById('zelle-digital-info');
    const zelleDeliveryBtn = document.getElementById('zelle-delivery-btn');
    const zelleDeliveryInfo = document.getElementById('zelle-delivery-info');
    
    if (zelleDigitalBtn && zelleDigitalInfo) {
        zelleDigitalBtn.addEventListener('click', () => {
            zelleDigitalInfo.style.display = zelleDigitalInfo.style.display === 'none' ? 'block' : 'none';
        });
    }
    
    if (zelleDeliveryBtn && zelleDeliveryInfo) {
        zelleDeliveryBtn.addEventListener('click', () => {
            zelleDeliveryInfo.style.display = zelleDeliveryInfo.style.display === 'none' ? 'block' : 'none';
        });
    }

});