import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import contractABI from "./context/MyContract.json";

const contractAddress = "0xf5fb750c7e61e6e6efa3499b4f0ce9cf2f2b1e2d";

export default function App() {
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [items, setItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [transferAddresses, setTransferAddresses] = useState({});
  const [activeTab, setActiveTab] = useState("marketplace");

  // Load wallet & contract
  useEffect(() => {
    const loadBlockchain = async () => {
      try {
        if (window.ethereum) {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          await window.ethereum.request({ method: "eth_requestAccounts" });
          const signer = provider.getSigner();
          const address = await signer.getAddress();
          setAccount(address);

          const instance = new ethers.Contract(contractAddress, contractABI, signer);
          setContract(instance);
          await fetchOwnedItems(instance, address);
          await fetchAllItems(instance);
          setLoading(false);
        } else {
          alert("Please install MetaMask to use this DApp!");
          setLoading(false);
        }
      } catch (err) {
        console.error("Error loading blockchain:", err);
        setLoading(false);
      }
    };

    loadBlockchain();
  }, []);

  const fetchOwnedItems = async (instance, user) => {
    try {
      const ids = await instance.getItemsByOwner(user);
      const itemsFetched = [];
      for (let id of ids) {
        const item = await instance.items(id);
        itemsFetched.push(item);
      }
      setItems(itemsFetched);
    } catch (error) {
      console.error("Error fetching owned items:", error);
    }
  };

  const fetchAllItems = async (instance) => {
    try {
      const count = await instance.ItemCount();
      const itemsFetched = [];
      for (let id = 1; id <= count; id++) {
        const item = await instance.items(id);
        itemsFetched.push({...item, id});
      }
      setAllItems(itemsFetched);
    } catch (error) {
      console.error("Error fetching all items:", error);
    }
  };

  const handleListItem = async () => {
    if (!name || !price) {
      alert("Please enter both name and price");
      return;
    }
    
    try {
      setLoading(true);
      const tx = await contract.listItems(name, ethers.utils.parseEther(price));
      await tx.wait();
      setName("");
      setPrice("");
      await fetchOwnedItems(contract, account);
      await fetchAllItems(contract);
      alert("Item listed successfully!");
    } catch (error) {
      console.error("Error listing item:", error);
      alert("Failed to list item. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleBuyItem = async (id, itemPrice) => {
    try {
      setLoading(true);
      const tx = await contract.buy(id, { value: itemPrice });
      await tx.wait();
      await fetchOwnedItems(contract, account);
      await fetchAllItems(contract);
      alert("Item purchased successfully!");
    } catch (error) {
      console.error("Error buying item:", error);
      alert("Failed to buy item. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

 const handleTransfer = async (itemId) => {
    const toAddress = transferAddresses[itemId];

    if (!toAddress || !ethers.utils.isAddress(toAddress)) {
        alert("Please enter a valid Ethereum address");
        return;
    }

    try {
        setLoading(true);
        const tx = await contract.transferWithoutMoney(itemId, toAddress);
        await tx.wait();

        // Reset the transfer address for this item
        setTransferAddresses((prev) => ({
            ...prev,
            [itemId]: "",
        }));

        await fetchOwnedItems(contract, account);
        await fetchAllItems(contract);
        alert("Ownership transferred successfully!");
    } catch (error) {
        console.error("Error transferring ownership:", error);
        alert("Failed to transfer ownership. Check console for details.");
    } finally {
        setLoading(false);
    }
};


  // Helper function to truncate address
  const truncateAddress = (address) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50">
      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <p className="text-lg font-medium">Processing transaction...</p>
            <div className="mt-4 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="animate-pulse h-full bg-indigo-600 rounded-full"></div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold text-indigo-800 mb-2">
              NFT Marketplace
            </h1>
            <p className="text-gray-600">Buy, sell, and transfer digital assets securely</p>
          </div>
          
          <div className="mt-4 md:mt-0 bg-white px-6 py-3 rounded-xl shadow-md flex items-center space-x-2">
            <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
            <p className="font-medium">
              {account ? (
                <span className="flex items-center">
                  Connected: <span className="ml-2 text-indigo-600">{truncateAddress(account)}</span>
                </span>
              ) : (
                "Not Connected"
              )}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8 flex border-b border-gray-200">
          <button
            className={`py-3 px-6 font-medium transition-colors ${
              activeTab === "marketplace"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-500 hover:text-indigo-500"
            }`}
            onClick={() => setActiveTab("marketplace")}
          >
            Marketplace
          </button>
          <button
            className={`py-3 px-6 font-medium transition-colors ${
              activeTab === "myitems"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-500 hover:text-indigo-500"
            }`}
            onClick={() => setActiveTab("myitems")}
          >
            My Items
          </button>
          <button
            className={`py-3 px-6 font-medium transition-colors ${
              activeTab === "create"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-500 hover:text-indigo-500"
            }`}
            onClick={() => setActiveTab("create")}
          >
            Create Listing
          </button>
        </div>

        {/* Create Listing Section */}
        {activeTab === "create" && (
          <div className="bg-white p-8 rounded-xl shadow-md mb-12 transform transition-all">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Create a New Listing</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="block">
                  <span className="text-gray-700 font-medium">Item Name</span>
                  <input
                    type="text"
                    value={name}
                    placeholder="Enter item name"
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50 p-3 border"
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="text-gray-700 font-medium">Price (ETH)</span>
                  <input
                    type="text"
                    value={price}
                    placeholder="0.01"
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50 p-3 border"
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </label>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleListItem}
                  className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 shadow-lg"
                >
                  List Item
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Marketplace Tab */}
        {activeTab === "marketplace" && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
              <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
              </svg>
              Available Items
            </h2>
            
            {allItems.length === 0 ? (
              <div className="bg-white p-8 rounded-xl shadow-md text-center">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
                </svg>
                <p className="text-gray-500 text-lg">No items listed in the marketplace yet.</p>
                <button
                  onClick={() => setActiveTab("create")}
                  className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-6 rounded-lg transition-colors"
                >
                  Create the first listing
                </button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {allItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-xl shadow-md overflow-hidden transform transition-all hover:shadow-lg hover:-translate-y-1"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-semibold text-indigo-700">{item.name}</h3>
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full">
                          ID: {item.id.toString()}
                        </span>
                      </div>
                      
                      <div className="space-y-2 mb-6">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Price:</span>
                          <span className="font-medium text-gray-900">{ethers.utils.formatEther(item.price)} ETH</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className={`font-medium ${item.isSold ? "text-red-500" : "text-green-500"}`}>
                            {item.isSold ? "Sold" : "Available"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Owner:</span>
                          <span className="font-medium text-gray-900">{truncateAddress(item.owner)}</span>
                        </div>
                      </div>
                      
                      {!item.isSold && item.owner !== account && (
                        <button
                          onClick={() => handleBuyItem(item.id, item.price)}
                          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-3 rounded-lg font-medium transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                        >
                          Buy for {ethers.utils.formatEther(item.price)} ETH
                        </button>
                      )}
                      
                      {item.isSold && (
                        <div className="w-full py-3 text-center text-gray-500 border border-gray-200 rounded-lg bg-gray-50">
                          Item no longer available
                        </div>
                      )}
                      
                      {!item.isSold && item.owner === account && (
                        <div className="w-full py-3 text-center text-indigo-600 border border-indigo-200 rounded-lg bg-indigo-50 font-medium">
                          You own this item
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Items Tab */}
        {activeTab === "myitems" && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
              <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path>
              </svg>
              Your Collection
            </h2>
            
            {items.length === 0 ? (
              <div className="bg-white p-8 rounded-xl shadow-md text-center">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                </svg>
                <p className="text-gray-500 text-lg">You don't own any items yet.</p>
                <div className="mt-4 flex justify-center space-x-4">
                  <button
                    onClick={() => setActiveTab("marketplace")}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-6 rounded-lg transition-colors"
                  >
                    Browse Marketplace
                  </button>
                  <button
                    onClick={() => setActiveTab("create")}
                    className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-lg transition-colors"
                  >
                    Create New Item
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-xl shadow-md overflow-hidden transform transition-all hover:shadow-lg hover:-translate-y-1"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-semibold text-indigo-700">{item.name}</h3>
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full">
                          ID: {item.id.toString()}
                        </span>
                      </div>
                      
                      <div className="space-y-2 mb-6">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Price:</span>
                          <span className="font-medium text-gray-900">
                            {ethers.utils.formatEther(item.price)} ETH
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className={`font-medium ${item.isSold ? "text-red-500" : "text-green-500"}`}>
                            {item.isSold ? "Sold" : "Available"}
                          </span>
                        </div>
                      </div>

                      {/* Transfer Ownership Section */}
                      <div className="space-y-3 mt-4">
                        <input
                          type="text"
                          placeholder="Recipient address (0x...)"
                          value={transferAddresses[item.id] || ""}
                          onChange={(e) =>
                            setTransferAddresses(prev => ({
                              ...prev,
                              [item.id]: e.target.value
                            }))
                          }
                          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <button
                          onClick={() => handleTransfer(item.id)}
                          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-2 px-4 rounded-lg transition-all flex items-center justify-center"
                          disabled={item.isSold}
                        >
                          <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                            />
                          </svg>
                          Transfer Ownership
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
