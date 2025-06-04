// Customer Dashboard Loyalty Program Logic
document.addEventListener('DOMContentLoaded', () => {
    const loyaltyProgram = new window.LoyaltyProgram(); // Assuming LoyaltyProgram is on window
    const biddingSystem = new window.BiddingSystem(); // Added for quotes/proposals
    const db = firebase.firestore();
    const auth = firebase.auth();

    let currentUserId = null;

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUserId = user.uid;
            console.log("User authenticated for customer dashboard JS:", currentUserId);
            await loadLoyaltyData(currentUserId);
            await loadReferralHistory(currentUserId);
            await loadCustomerQuotesProposals(currentUserId); // Added call
            setupReferralForm(currentUserId);
        } else {
            console.log("User not authenticated for customer dashboard JS.");
            // Clear all customer-specific data
            document.getElementById('customerLoyaltyPoints').textContent = 'N/A';
            document.getElementById('customerLoyaltyTier').textContent = 'N/A';
            document.getElementById('loyaltyPointsHistory').innerHTML = '<p>Please log in.</p>';
            document.getElementById('referralHistoryBody').innerHTML = '<tr><td colspan="4">Please log in.</td></tr>';
            document.getElementById('myQuotesBody').innerHTML = '<tr><td colspan="5">Please log in.</td></tr>'; // Clear quotes table
        }
    });

    async function loadLoyaltyData(userId) {
        if (!loyaltyProgram) {
            console.error("LoyaltyProgram instance not available.");
            return;
        }
        try {
            const account = await loyaltyProgram.getLoyaltyAccount(userId);
            if (account) {
                document.getElementById('customerLoyaltyPoints').textContent = account.points || 0;
                document.getElementById('customerLoyaltyTier').textContent = account.tier || 'bronze';
                
                const historyContainer = document.getElementById('loyaltyPointsHistory');
                if (account.history && account.history.length > 0) {
                    historyContainer.innerHTML = account.history.slice().reverse().map(entry => { // Use slice() to avoid mutating original
                        const date = entry.date.toDate ? entry.date.toDate().toLocaleDateString() : new Date(entry.date).toLocaleDateString();
                        return `<p>${date}: ${entry.type === 'earned' ? '+' : '-'}${entry.points} points (${entry.reason})</p>`;
                    }).join('');
                } else {
                    historyContainer.innerHTML = '<p>No points history yet.</p>';
                }
            } else {
                document.getElementById('customerLoyaltyPoints').textContent = '0';
                document.getElementById('customerLoyaltyTier').textContent = 'bronze';
                document.getElementById('loyaltyPointsHistory').innerHTML = '<p>No loyalty account found. It will be created with your first eligible activity.</p>';
            }
        } catch (error) {
            console.error("Error loading loyalty data:", error);
            document.getElementById('customerLoyaltyPoints').textContent = 'Error';
            document.getElementById('customerLoyaltyTier').textContent = 'Error';
            document.getElementById('loyaltyPointsHistory').innerHTML = '<p>Error loading loyalty history.</p>';
        }
    }

    function setupReferralForm(userId) {
        const referralForm = document.getElementById('referralForm');
        if (referralForm) {
            referralForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const referredEmailInput = document.getElementById('referredEmail');
                const referredEmail = referredEmailInput.value;
                if (!referredEmail) {
                    alert("Please enter your friend's email address.");
                    return;
                }
                if (!loyaltyProgram) {
                    console.error("LoyaltyProgram instance not available for referral.");
                    alert("Referral system is currently unavailable. Please try again later.");
                    return;
                }

                try {
                    const submitButton = referralForm.querySelector('button[type="submit"]');
                    submitButton.disabled = true;
                    submitButton.textContent = 'Sending...';

                    const result = await loyaltyProgram.addReferral(userId, referredEmail);
                    if (result.success) {
                        alert("Referral submitted successfully! Your friend will be notified. You'll get bonus points if they become a customer.");
                        referredEmailInput.value = '';
                        await loadReferralHistory(userId);
                    } else {
                        alert(result.error || "Failed to submit referral. Please try again.");
                    }
                    submitButton.disabled = false;
                    submitButton.textContent = 'Send Referral';
                } catch (error) {
                    console.error("Error submitting referral:", error);
                    alert("An error occurred while submitting your referral.");
                    const submitButton = referralForm.querySelector('button[type="submit"]');
                    submitButton.disabled = false;
                    submitButton.textContent = 'Send Referral';
                }
            });
        }
    }

    async function loadReferralHistory(userId) {
        const referralHistoryBody = document.getElementById('referralHistoryBody');
        if (!referralHistoryBody) return;
        referralHistoryBody.innerHTML = '<tr><td colspan="4">Loading referral history...</td></tr>';
        
        if (!loyaltyProgram) {
            console.error("LoyaltyProgram instance not available for referral history.");
            referralHistoryBody.innerHTML = '<tr><td colspan="4">Could not load referral history.</td></tr>';
            return;
        }

        try {
            const referrals = await loyaltyProgram.getCustomerReferrals(userId);
            if (referrals && referrals.length > 0) {
                referralHistoryBody.innerHTML = referrals.map(ref => {
                    const date = ref.createdAt.toDate ? ref.createdAt.toDate().toLocaleDateString() : new Date(ref.createdAt).toLocaleDateString();
                    return `
                        <tr>
                            <td>${ref.referredCustomerEmail}</td>
                            <td><span class="status-badge status-${ref.status}">${ref.status}</span></td>
                            <td>${date}</td>
                            <td>${ref.referralCode || 'N/A'}</td>
                        </tr>
                    `;
                }).join('');
            } else {
                referralHistoryBody.innerHTML = '<tr><td colspan="4">You haven't referred anyone yet.</td></tr>';
            }
        } catch (error) {
            console.error("Error loading referral history:", error);
            referralHistoryBody.innerHTML = '<tr><td colspan="4">Error loading referral history.</td></tr>';
        }
    }

    // Added function to load customer's quotes/proposals
    async function loadCustomerQuotesProposals(userId) {
        const quotesBody = document.getElementById('myQuotesBody');
        if (!quotesBody) {
            console.log("Customer quotes table body not found."); return;
        }
        quotesBody.innerHTML = '<tr><td colspan="5">Loading your quotes and proposals...</td></tr>';

        if (!biddingSystem) {
            console.error("BiddingSystem instance not available.");
            quotesBody.innerHTML = '<tr><td colspan="5">Could not load quotes. System unavailable.</td></tr>';
            return;
        }

        try {
            // Fetch bids that are relevant to the customer (e.g., sent, accepted, proposal_generated)
            // You might want to fetch all and then filter, or have more specific query options in BiddingSystem
            const bids = await biddingSystem.listBids({ customerId: userId });
            const relevantBids = bids.filter(bid => 
                ['sent', 'accepted', 'proposal_generated', 'draft'].includes(bid.status) // Include 'draft' if customer should see them
            );

            if (relevantBids.length > 0) {
                quotesBody.innerHTML = relevantBids.map(bid => {
                    const date = bid.createdAt.toDate ? bid.createdAt.toDate().toLocaleDateString() : new Date(bid.createdAt).toLocaleDateString();
                    let actionsHtml = '<button class="btn-modern btn-small" onclick="viewQuoteDetailClient(\''+bid.id+'\')">View Details</button>';
                    if (bid.status === 'sent' || bid.status === 'proposal_generated') {
                         // Later: Add Accept/Reject buttons that call BiddingSystem.updateBid(bid.id, {status: 'accepted'})
                         actionsHtml += ' <button class="btn-modern btn-small btn-accept" data-bid-id="'+bid.id+'">Accept</button>';
                         actionsHtml += ' <button class="btn-modern btn-small btn-reject" data-bid-id="'+bid.id+'">Reject</button>';
                    }
                    return `
                        <tr>
                            <td>${date}</td>
                            <td>${bid.bidNumber || 'N/A'}</td>
                            <td>$${bid.estimatedTotal ? bid.estimatedTotal.toFixed(2) : 'N/A'}</td>
                            <td><span class="status-badge status-${bid.status}">${bid.status}</span></td>
                            <td>${actionsHtml}</td>
                        </tr>
                    `;
                }).join('');
                
                // Add event listeners for accept/reject buttons
                document.querySelectorAll('.btn-accept').forEach(button => {
                    button.addEventListener('click', async (e) => handleQuoteAction(e.target.dataset.bidId, 'accepted'));
                });
                document.querySelectorAll('.btn-reject').forEach(button => {
                    button.addEventListener('click', async (e) => handleQuoteAction(e.target.dataset.bidId, 'rejected'));
                });

            } else {
                quotesBody.innerHTML = '<tr><td colspan="5">You have no quotes or proposals at this time.</td></tr>';
            }
        } catch (error) {
            console.error("Error loading customer quotes/proposals:", error);
            quotesBody.innerHTML = '<tr><td colspan="5">Error loading your quotes.</td></tr>';
        }
    }
    
    // Placeholder for viewing quote details client-side (could be a modal)
    window.viewQuoteDetailClient = async function(bidId) {
        if (!biddingSystem) return;
        const bid = await biddingSystem.getBidById(bidId);
        if (bid) {
            // For now, simple alert. Ideally, show this in a modal.
            let details = `Proposal #: ${bid.bidNumber}\nDate: ${new Date(bid.createdAt.toDate()).toLocaleDateString()}\nTotal: $${bid.estimatedTotal.toFixed(2)}\nStatus: ${bid.status}\n\nServices:\n`;
            bid.services.forEach(s => {
                details += `- ${s.serviceType}: $${s.total.toFixed(2)}\n`;
                if (s.notes) details += `  Notes: ${s.notes}\n`;
            });
            if (bid.proposalId) {
                // If a formal proposal text was saved, try to fetch and show it
                const proposalDoc = await db.collection('proposals').doc(bid.proposalId).get();
                if (proposalDoc.exists) {
                    details += "\n--- Proposal Details ---\n" + proposalDoc.data().proposalText;
                }
            }
            alert(details);
        } else {
            alert("Could not fetch quote details.");
        }
    }

    async function handleQuoteAction(bidId, newStatus) {
        if (!biddingSystem || !currentUserId) return;
        const confirmationText = newStatus === 'accepted' ? "Are you sure you want to accept this quote?" : "Are you sure you want to reject this quote?";
        if (confirm(confirmationText)) {
            // Potentially add a loader here
            const success = await biddingSystem.updateBid(bidId, { status: newStatus });
            if (success) {
                alert(`Quote successfully ${newStatus}.`);
                await loadCustomerQuotesProposals(currentUserId); // Refresh the list
            } else {
                alert(`Failed to ${newStatus} the quote. Please try again or contact support.`);
            }
        }
    }
}); 