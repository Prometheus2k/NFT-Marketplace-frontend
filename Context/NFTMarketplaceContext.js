import React, { useState, useEffect, useContext } from "react";
import Web3Modal from "web3modal";
import { ethers } from "ethers";
import Router from "next/router";
import axios from "axios";
import { create, create as ipfsHttpClient } from "ipfs-http-client";

// INTERNAL IMPORT
import { NFTMarketplaceAddress, NFTMarketplaceABI } from "./constants";

// ----- FETCHING SMART CONTRACTS -----
const client = ipfsHttpClient("https://ipfs.infura.io:5001/api/v0");

const fetchContract = async (signerOrProvider) =>
  new ethers.Contract(
    NFTMarketplaceAddress,
    NFTMarketplaceABI,
    signerOrProvider,
  );

// ----- CONNECTING WITH SMART CONTRACTS -----

const connectingWithSmartContract = async () => {
  try {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.BrowserProvider(connection);
    const signer = provider.getSigner();
    const contract = await fetchContract(signer);
    return contract;
  } catch (error) {
    console.log("Something went wrong connecting with smart contract: ", error);
  }
};

export const NFTMarketplaceContext = React.createContext();

export const NFTMarketplaceProvider = ({ children }) => {
  const titleData = "Discover, collect, and sell NFTs";

  // ----- USESTATE -----
  const [currentAccount, setCurrentAccount] = useState("");

  // ------ CHECK IF WALLET IS CONNECTED ------
  const checkifWalletIsConnected = async () => {
    try {
      if (!window.ethereum) {
        console.log("Install metamask!");
      }
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });
      if (accounts.length > 0) {
        setCurrentAccount(accounts[0]);
      } else {
        console.log("No Account Found");
      }
      // console.log("Connected Account: ", currentAccount);
    } catch (error) {
      console.log("Something went wrong whle connecting to wallet : ", error);
    }
  };

  // useState(() => {
  //   checkifWalletIsConnected();
  // }, []);

  // ----- CONNECT WALLET FUNCTION -----

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        console.log("Install metamask!");
      }
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setCurrentAccount(accounts[0]);
      window.location.reload();
    } catch (error) {
      console.log("Something went wrong while connecting wallet: ", error);
    }
  };

  //  ----- --UPLOAD TO IPFS FUNCTION -------
  const uploadToIPFS = async (file) => {
    try {
      const added = await client.add({ content: file });
      const url = `https://ipfs.infura.io/ipfs/${added.path}`;
      return url;
    } catch (error) {
      console.log("Something went wrong while uploading to IPFS: ", error);
    }
  };

  // ------- CREATE NFT FUNCTION ------
  const createNFT = async (formInput, fileUrl, router) => {
    const { name, description, price } = formInput;
    if (!name || !description || !price || !fileUrl)
      return console.log("Dara is missing");
    const data = JSON.stringify({
      name,
      description,
      image: fileUrl,
    });

    try {
      const added = await client.add(data);
      const url = `https://ipfs.infura.io/ipfs/${added.path}`;
      return url;
      await createSale(url, price);
    } catch (error) {
      console.log("Something went wrong while creating NFT: ", error);
    }
  };

  // ----- CREATE SALE FUNCTION ------
  const createSale = async (url, formInputPrice, isReselling, id) => {
    try {
      const price = ethers.parseUnits(formInputPrice, "ether");
      const contract = await connectingWithSmartContract();
      const listingPrice = await contract.getListingPrice();

      const transaction = !isReselling
        ? await contract.createToken(url, price, {
            value: listingPrice.toString(),
          })
        : await contract.reSellToken(url, price, {
            value: listingPrice.toString(),
          });

      await transaction.wait();
    } catch (error) {
      console.log("Something went wrong while creating sale: ", error);
    }
  };

  // ----- FETCH NFTS FUNCTION ------
  const fetchNFTs = async () => {
    try {
      const provider = ethers.JsonRpcProvider();
      const contract = fetchContract(provider);
      const data = await contract.fetchMarketItem();

      // console.log(data);

      const items = await Promise.all(
        data.map(
          async ({ tokenId, seller, owner, price: unformattedPrice }) => {
            const tokenURI = await contract.tokenURI(tokenId);

            const {
              data: { image, name, description },
            } = await axios.get(tokenURI);
            const price = ethers.formatUnits(
              unformattedPrice.toString(),
              "ether",
            );

            return {
              price,
              tokenId: tokenId.toNumber(),
              seller,
              owner,
              image,
              name,
              description,
              tokenURI,
            };
          },
        ),
      );
      return items;
    } catch (error) {
      console.log("Something went wrong while fetching NFTs: ", error);
    }
  };

  // ------- FETCHING MY NFT OR LISTED NFTs ------
  const fetchMyNFTsOrListedNFTs = async (type) => {
    try {
      const contract = await connectingWithSmartContract();
      const data =
        type == "fetchItemsListed"
          ? await contract.fetchItemsListed()
          : await contract.fetchMyNFT();

      const items = await Promise.all(
        data.map(
          async ({ tokenId, seller, owner, price: unformattedPrice }) => {
            const tokenURI = await contract.tokenURI(tokenId);
            const {
              data: { image, name, description },
            } = await axios.get(tokenURI);

            const price = ethers.formatUnits(
              unformattedPrice.toString(),
              "ether",
            );

            return {
              price,
              tokenId: tokenId.toNumber(),
              seller,
              owner,
              image,
              name,
              description,
              tokenURI,
            };
          },
        ),
      );
      return items;
    } catch (error) {
      console.log("Something went wrong while fetching NFTs: ", error);
    }
  };

  // ------ BUY NFT ------
  const buyNFT = async (nft) => {
    try {
      const contract = await connectingWithSmartContract();
      const price = ethers.parseUnits(nft.price.toString(), "ether");
      const transaction = await contract.createMarketSale(nft.tokenId, {
        value: price,
      });
      await transaction.wait();
    } catch (error) {
      console.log("Something went wrong while buying NFT: ", error);
    }
  };

  return (
    <NFTMarketplaceContext.Provider
      value={{
        checkifWalletIsConnected,
        connectWallet,
        uploadToIPFS,
        createNFT,
        fetchNFTs,
        fetchMyNFTsOrListedNFTs,
        buyNFT,
        currentAccount,
        titleData,
      }}
    >
      {children}
    </NFTMarketplaceContext.Provider>
  );
};
