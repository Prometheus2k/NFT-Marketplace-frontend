import React, { useState, useEffect, useContext } from "react";
import Web3Modal from "web3modal";
import { ethers } from "ethers";
import Router from "next/router";
import axios from "axios";
import { create as ipfsHttpClient } from "ipfs-http-client";

// INTERNAL IMPORT
import { NFTMarketplaceAddress, NFTMarketplaceABI } from "./constants";

// ----- FETCHING SMART CONTRACTS -----

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

  const checkContract = async () => {
    const contract = await connectingWithSmartContract();
    console.log("contract: ", contract);
  };
  return (
    <NFTMarketplaceContext.Provider value={{ checkContract, titleData }}>
      {children}
    </NFTMarketplaceContext.Provider>
  );
};
