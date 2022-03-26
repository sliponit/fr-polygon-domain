import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import contractAbi from './utils/contractABI.json';
import polygonLogo from './assets/polygonlogo.png';
import ethLogo from './assets/ethlogo.png';
import { networks } from './utils/networks';


// Constants
const tld = '.fr';
const CONTRACT_ADDRESS = '0x19A7e5C936578eD1BA6E06CD2BE9ccc55ba5Cc47';
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const App = () => {
	const [currentAccount, setCurrentAccount] = useState('');
  const [domain, setDomain] = useState('');
  const [record, setRecord] = useState('');
  const [network, setNetwork] = useState('');

  const connectWallet = async () => {
		try {
			const { ethereum } = window;

			if (!ethereum) {
				alert("Get MetaMask -> https://metamask.io/");
				return;
			}

			// Fancy method to request access to account.
			const accounts = await ethereum.request({ method: "eth_requestAccounts" });
		
			// Boom! This should print out public address once we authorize Metamask.
			console.log("Connected", accounts[0]);
			setCurrentAccount(accounts[0]);
		} catch (error) {
			console.log(error)
		}
	}
	
	const checkIfWalletIsConnected = async () => {
		const { ethereum } = window;

		if (!ethereum) {
			console.log('Make sure you have metamask!');
			return;
		} else {
			console.log('We have the ethereum object', ethereum);
		}

		// Check if we're authorized to access the user's wallet
		const accounts = await ethereum.request({ method: 'eth_accounts' });

		// Users can have multiple authorized accounts, we grab the first one if its there!
		if (accounts.length !== 0) {
			const account = accounts[0];
			console.log('Found an authorized account:', account);
			setCurrentAccount(account);
		} else {
			console.log('No authorized account found');
		}

    // This is the new part, we check the user's network chain ID
		const chainId = await ethereum.request({ method: 'eth_chainId' });
		setNetwork(networks[chainId]);

		ethereum.on('chainChanged', handleChainChanged);
		
		// Reload the page when they change networks
		function handleChainChanged(_chainId) {
			window.location.reload();
		}
	};

  const mintDomain = async () => {
  	// Don't run if the domain is empty
  	if (!domain) { return }
  	// Alert the user if the domain is too short
  	if (domain.length < 3) {
  		alert('Domain must be at least 3 characters long');
  		return;
  	}
  	// Calculate price based on length of domain (change this to match your contract)	
  	// 3 chars = 0.5 MATIC, 4 chars = 0.3 MATIC, 5 or more = 0.1 MATIC
  	const price = domain.length === 3 ? '0.5' : domain.length === 4 ? '0.3' : '0.1';
  	console.log("Minting domain", domain, "with price", price);
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi, signer);
  
  			console.log("Going to pop wallet now to pay gas...")
        let tx = await contract.register(domain, {value: ethers.utils.parseEther(price)});
        // Wait for the transaction to be mined
  			const receipt = await tx.wait();
  
  			// Check if the transaction was successfully completed
  			if (receipt.status === 1) {
  				console.log("Domain minted! https://mumbai.polygonscan.com/tx/"+tx.hash);
  				
  				// Set the record for the domain
  				tx = await contract.setRecord(domain, record);
  				await tx.wait();
  
  				console.log("Record set! https://mumbai.polygonscan.com/tx/"+tx.hash);
  				
  				setRecord('');
  				setDomain('');
  			}
  			else {
  				alert("Transaction failed! Please try again");
  			}
      }
    }
    catch(error){
      console.log(error);
    }
  }

  // Form to enter domain name and data
	const renderInputForm = () =>{
    // If not on Polygon Mumbai Testnet, render "Please connect to Polygon Mumbai Testnet"
  	if (network !== 'Polygon Mumbai Testnet') {
  		return (
  			<div className="connect-wallet-container">
  				<p>Please connect to the Polygon Mumbai Testnet</p>
  			</div>
  		);
  	}

    // The rest of the function remains the same
		return (
			<div className="form-container">
				<div className="first-row">
					<input
						type="text"
						value={domain}
						placeholder='domain'
						onChange={e => setDomain(e.target.value)}
					/>
					<p className='tld'> {tld} </p>
				</div>

				<input
					type="text"
					value={record}
					placeholder='french?'
					onChange={e => setRecord(e.target.value)}
				/>

				<div className="button-container">
					<button className='cta-button mint-button' onClick={mintDomain}>
						Mint
					</button>  
					<button className='cta-button mint-button' disabled={null} onClick={null}>
						Set data
					</button>  
				</div>

			</div>
		);
	}

	// Create a function to render if wallet is not connected yet
	const renderNotConnectedContainer = () => (
		<div className="connect-wallet-container">
			<img src="https://media.giphy.com/media/dWxFpBeot1S8MabzLA/giphy.gif" />
			<button onClick={connectWallet} className="cta-button connect-wallet-button">
				Connect Wallet
			</button>
		</div>
  	);

	// This runs our function when the page loads.
	useEffect(() => {
		checkIfWalletIsConnected();
	}, [])

	return (
		<div className="App">
			<div className="container">
				<div className="header-container">
					<header>
						<div className="left">
						  <p className="title">🐱‍👤 FR Name Service</p>
						  <p className="subtitle">Your FR API on the blockchain!</p>
						</div>
            <div className="right">
        			<img alt="Network logo" className="logo" src={ network.includes("Polygon") ? polygonLogo : ethLogo} />
        			{ currentAccount ? <p> Wallet: {currentAccount.slice(0, 6)}...{currentAccount.slice(-4)} </p> : <p> Not connected </p> }
        		</div>
					</header>
				</div>

				{/* Hide the connect button if currentAccount isn't empty*/}
				{!currentAccount && renderNotConnectedContainer()}
        {/* Render the input form if an account is connected */}
				{currentAccount && renderInputForm()}

				<div className="footer-container">
					<img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
					<a className="footer-text" 
						href={TWITTER_LINK} 
						target="_blank"
						rel="noreferrer">
							{`built with @${TWITTER_HANDLE}`}
					</a>
				</div>
			</div>
		</div>
	);
};

export default App;