import Head from "next/head";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import styles from "../styles/Home.module.css";
import { providers, Contract, utils } from "ethers";
import Web3Modal from "web3modal";
import { NFT_CONTRACT_ABI, NFT_CONTRACT_ADDRESS } from "../constants";

export default function Home() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [presaleStarted, setPresaleStarted] = useState(false);
  const [presaleEnded, setPresaleEnded] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [numTokenMinted, setNumTokenMinted] = useState("");
  const web3ModalRef = useRef();

  const getNumMintedTokens = async () => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        provider
      );
      const tokenIds = await nftContract.tokenIds();
      setNumTokenMinted(tokenIds.toString());
    } catch (error) {
      console.log(error);
    }
  };

  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (error) {
      console.log(error);
    }
  };

  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // tell user to switch to rinkeny network if they are not
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 5) {
      window.alert("Please connect to a Goerli network");
      throw new Error("Incorrect network");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }

    return web3Provider;
  };

  const getOwner = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      // console.log(signer, "the signer===");
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        signer
      );

      const owner = await nftContract.owner();

      const userAddress = await signer.getAddress();

      if (owner.toLowerCase() === userAddress.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (error) {}
  };

  const checkIfPresaleEnded = async () => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        provider
      );

      // this will return a timestamp in seconds
      const presaleEndTime = await nftContract.presaleEnded();

      const currentTimeInSeconds = Date.now() / 1000;

      const hasPresaleEnded = presaleEndTime.lt(
        Math.floor(currentTimeInSeconds)
      );
      setPresaleEnded(hasPresaleEnded);
    } catch (error) {
      console.log(error);
    }
  };

  const checkIfPresaleStarted = async () => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        provider
      );

      const isPresaleStarted = await nftContract.presaleStarted();
      console.log(isPresaleStarted, "is preale satrted");
      setPresaleStarted(isPresaleStarted);
      return isPresaleStarted;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const startPresale = async () => {
    setLoading(true);
    try {
      const signer = await getProviderOrSigner(true);
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        signer
      );

      const txn = await nftContract.startPresale();
      await txn.wait();

      setPresaleStarted(true);
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  const presaleMint = async () => {
    setLoading(true);
    try {
      const signer = await getProviderOrSigner(true);
      // console.log(signer, "the signer===");
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        signer
      );

      const txn = await nftContract.presaleMint({
        value: utils.parseEther("0.01"),
      });

      await txn.wait();
      window.alert("Congrats you've minted");
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  const publicMint = async () => {
    setLoading(true);
    try {
      const signer = await getProviderOrSigner(true);
      // console.log(signer, "the signer===");
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        signer
      );

      const txn = await nftContract.mint({
        value: utils.parseEther("0.01"),
      });

      await txn.wait();
      window.alert("Congrats you've minted");
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  const onPageLoad = async () => {
    await connectWallet();
    await getOwner();
    const presaleStarted = await checkIfPresaleStarted();

    if (presaleStarted) {
      await checkIfPresaleEnded();
    }

    await getNumMintedTokens();

    // track in real time number of nft minted
    setInterval(async () => {
      await getNumMintedTokens();
    }, 5000);

    // track realtime status of mint
    setInterval(async () => {
      const presaleStarted = await checkIfPresaleStarted();
      if (presaleStarted) {
        await checkIfPresaleEnded();
      }
    }, 5000);
  };

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      });

      onPageLoad();
    }
  }, []);

  const renderBody = () => {
    if (!walletConnected) {
      return (
        <button className={styles.button} onClick={connectWallet}>
          Connect Wallet
        </button>
      );
    }

    if (loading) {
      return <span className={styles.description}>Loading...</span>;
    }

    if (isOwner && !presaleStarted) {
      return (
        <button className={styles.button} onClick={startPresale}>
          Start Presale
        </button>
      );
    }

    if (!presaleStarted) {
      return (
        <div className={styles.description}>
          <span>Presale has not started yet come back later</span>
        </div>
      );
    }

    if (presaleStarted && !presaleEnded) {
      // allow users to mint in presale
      return (
        <div className={styles.description}>
          Presale has started!!! If your address is whitelisted, Mint a Crypto
          Dev 🥳
          <button onClick={presaleMint} className={styles.button}>
            Presale Mint 🚀
          </button>
        </div>
      );
    }

    if (presaleEnded) {
      return (
        <div className={styles.description}>
          Presale has ended!!! Mint in public sale if any remains 🥳
          <button onClick={publicMint} className={styles.button}>
            Public Mint 🚀
          </button>
        </div>
      );
    }
  };

  return (
    <div>
      <Head>
        <title>Crypto Devs NFT</title>
      </Head>

      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to CryptoDevs NFT</h1>
          <div className={styles.description}>
            CryptoDevs NFT is a collection for developer in web3
          </div>
          <div className={styles.description}>
            {numTokenMinted}/20 has been minted already
          </div>
          <di>{renderBody()}</di>
        </div>
        <div>
          <img className={styles.image} src="/cryptodevs/0.svg" />
        </div>
      </div>
      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  );
}
