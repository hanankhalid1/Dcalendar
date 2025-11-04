const dmailHelperABI = [
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "address",
                "name": "previousAdmin",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "newAdmin",
                "type": "address"
            }
        ],
        "name": "AdminChanged",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "beacon",
                "type": "address"
            }
        ],
        "name": "BeaconUpgraded",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "previousOwner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "OwnershipTransferred",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "implementation",
                "type": "address"
            }
        ],
        "name": "Upgraded",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_username",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_name",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_date",
                "type": "string"
            },
            {
                "components": [
                    {
                        "internalType": "string",
                        "name": "key",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "value",
                        "type": "string"
                    }
                ],
                "internalType": "struct HelperContract.SubAttribute[]",
                "name": "_labelProperties",
                "type": "tuple[]"
            }
        ],
        "name": "addLabel",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "username",
                "type": "string"
            },
            {
                "internalType": "string[]",
                "name": "emails",
                "type": "string[]"
            }
        ],
        "name": "addWeb2Emails",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "changeOwner",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "username",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "senderAddress",
                "type": "string"
            }
        ],
        "name": "commonHelperAuthentication",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "userName",
                "type": "string"
            },
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "id",
                        "type": "uint256"
                    },
                    {
                        "internalType": "string",
                        "name": "userName",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "userEmail",
                        "type": "string"
                    }
                ],
                "internalType": "struct HelperContract.QuickSend[]",
                "name": "quickBatch",
                "type": "tuple[]"
            }
        ],
        "name": "createBulkQuickSend",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_username",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_name",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_date",
                "type": "string"
            },
            {
                "components": [
                    {
                        "internalType": "string",
                        "name": "key",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "value",
                        "type": "string"
                    }
                ],
                "internalType": "struct HelperContract.SubAttribute[]",
                "name": "_folderProperties",
                "type": "tuple[]"
            }
        ],
        "name": "createFolder",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_str",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_substring",
                "type": "string"
            }
        ],
        "name": "customIncludeFunction",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "pure",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_user",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "_folderId",
                "type": "uint256"
            }
        ],
        "name": "deleteFolder",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "userName",
                "type": "string"
            }
        ],
        "name": "deleteFoldersByUserName",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "userName",
                "type": "string"
            }
        ],
        "name": "deleteQuickSendByUserName",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "userName",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "index",
                "type": "uint256"
            }
        ],
        "name": "deleteQuickSendEntry",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "name": "folderCount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "folders",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
            },
            {
                "internalType": "string",
                "name": "name",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "date",
                "type": "string"
            },
            {
                "internalType": "bool",
                "name": "status",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_user",
                "type": "string"
            }
        ],
        "name": "getAttributes",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "id",
                        "type": "uint256"
                    },
                    {
                        "internalType": "string",
                        "name": "attType",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "key",
                        "type": "string"
                    },
                    {
                        "internalType": "bool",
                        "name": "value",
                        "type": "bool"
                    }
                ],
                "internalType": "struct HelperContract.Attribute[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_user",
                "type": "string"
            }
        ],
        "name": "getFolders",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "id",
                        "type": "uint256"
                    },
                    {
                        "internalType": "string",
                        "name": "name",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "date",
                        "type": "string"
                    },
                    {
                        "internalType": "bool",
                        "name": "status",
                        "type": "bool"
                    },
                    {
                        "components": [
                            {
                                "internalType": "string",
                                "name": "key",
                                "type": "string"
                            },
                            {
                                "internalType": "string",
                                "name": "value",
                                "type": "string"
                            }
                        ],
                        "internalType": "struct HelperContract.SubAttribute[]",
                        "name": "folderProperties",
                        "type": "tuple[]"
                    }
                ],
                "internalType": "struct HelperContract.FolderStruct[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_user",
                "type": "string"
            }
        ],
        "name": "getLabels",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "id",
                        "type": "uint256"
                    },
                    {
                        "internalType": "string",
                        "name": "name",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "date",
                        "type": "string"
                    },
                    {
                        "internalType": "bool",
                        "name": "status",
                        "type": "bool"
                    },
                    {
                        "components": [
                            {
                                "internalType": "string",
                                "name": "key",
                                "type": "string"
                            },
                            {
                                "internalType": "string",
                                "name": "value",
                                "type": "string"
                            }
                        ],
                        "internalType": "struct HelperContract.SubAttribute[]",
                        "name": "labelProperties",
                        "type": "tuple[]"
                    }
                ],
                "internalType": "struct HelperContract.Label[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_user",
                "type": "string"
            }
        ],
        "name": "getSettings",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "string",
                        "name": "key",
                        "type": "string"
                    },
                    {
                        "components": [
                            {
                                "internalType": "string",
                                "name": "key",
                                "type": "string"
                            },
                            {
                                "internalType": "string",
                                "name": "value",
                                "type": "string"
                            }
                        ],
                        "internalType": "struct HelperContract.SubAttribute[]",
                        "name": "options",
                        "type": "tuple[]"
                    }
                ],
                "internalType": "struct HelperContract.Settings[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_user",
                "type": "string"
            }
        ],
        "name": "getUsersQuickSend",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "id",
                        "type": "uint256"
                    },
                    {
                        "internalType": "string",
                        "name": "userName",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "userEmail",
                        "type": "string"
                    }
                ],
                "internalType": "struct HelperContract.QuickSend[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "username",
                "type": "string"
            }
        ],
        "name": "getWeb2Emails",
        "outputs": [
            {
                "internalType": "string[]",
                "name": "",
                "type": "string[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "initialize",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_username",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_name",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_date",
                "type": "string"
            },
            {
                "components": [
                    {
                        "internalType": "string",
                        "name": "key",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "value",
                        "type": "string"
                    }
                ],
                "internalType": "struct HelperContract.SubAttribute[]",
                "name": "_folderProperties",
                "type": "tuple[]"
            },
            {
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
            }
        ],
        "name": "migrateFolders",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "proxiableUUID",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "renounceOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "userName",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "quickAccessUserEmail",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "quickAccessUserName",
                "type": "string"
            }
        ],
        "name": "saveQuickSend",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_user",
                "type": "string"
            },
            {
                "internalType": "uint256[]",
                "name": "_id",
                "type": "uint256[]"
            },
            {
                "internalType": "string",
                "name": "_attType",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_key",
                "type": "string"
            },
            {
                "internalType": "bool",
                "name": "_value",
                "type": "bool"
            }
        ],
        "name": "setAttribute",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "userRegistryAddress",
                "type": "address"
            }
        ],
        "name": "setUserAddress",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "settings",
        "outputs": [
            {
                "internalType": "string",
                "name": "key",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "transferOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_username",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "_labelId",
                "type": "uint256"
            },
            {
                "internalType": "string",
                "name": "_newName",
                "type": "string"
            }
        ],
        "name": "updateLabelName",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_username",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "_labelId",
                "type": "uint256"
            },
            {
                "components": [
                    {
                        "internalType": "string",
                        "name": "key",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "value",
                        "type": "string"
                    }
                ],
                "internalType": "struct HelperContract.SubAttribute[]",
                "name": "_newLabelProperties",
                "type": "tuple[]"
            }
        ],
        "name": "updateLabelProperties",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_username",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "_labelId",
                "type": "uint256"
            },
            {
                "internalType": "bool",
                "name": "_newStatus",
                "type": "bool"
            }
        ],
        "name": "updateLabelStatus",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_username",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_key",
                "type": "string"
            },
            {
                "components": [
                    {
                        "internalType": "string",
                        "name": "key",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "value",
                        "type": "string"
                    }
                ],
                "internalType": "struct HelperContract.SubAttribute[]",
                "name": "_options",
                "type": "tuple[]"
            }
        ],
        "name": "updateSettings",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "newImplementation",
                "type": "address"
            }
        ],
        "name": "upgradeTo",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "newImplementation",
                "type": "address"
            },
            {
                "internalType": "bytes",
                "name": "data",
                "type": "bytes"
            }
        ],
        "name": "upgradeToAndCall",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "userFolders",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
            },
            {
                "internalType": "string",
                "name": "name",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "date",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "filterType",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "filterValue",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "userLabels",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
            },
            {
                "internalType": "string",
                "name": "name",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "date",
                "type": "string"
            },
            {
                "internalType": "bool",
                "name": "status",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "userRegistry",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
]

export default dmailHelperABI;