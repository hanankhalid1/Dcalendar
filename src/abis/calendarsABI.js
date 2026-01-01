const calendarsABI = [
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
				"indexed": false,
				"internalType": "string",
				"name": "username",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "uid",
				"type": "string"
			}
		],
		"name": "EventAddedOrEdited",
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
		"inputs": [],
		"name": "MAX_EVENTS_PER_USER",
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
				"internalType": "string[]",
				"name": "eventindex",
				"type": "string[]"
			},
			{
				"components": [
					{
						"internalType": "string",
						"name": "uid",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "title",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "description",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "fromTime",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "toTime",
						"type": "string"
					},
					{
						"internalType": "bool",
						"name": "done",
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
						"internalType": "struct CalendarManager.Sublist[]",
						"name": "list",
						"type": "tuple[]"
					}
				],
				"internalType": "struct CalendarManager.MergedEvent",
				"name": "mergedEvent",
				"type": "tuple"
			},
			{
				"internalType": "string",
				"name": "username",
				"type": "string"
			},
			{
				"components": [
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
						"internalType": "struct CalendarManager.Sublist[]",
						"name": "contact",
						"type": "tuple[]"
					}
				],
				"internalType": "struct CalendarManager.Contacts",
				"name": "inputContacts",
				"type": "tuple"
			}
		],
		"name": "addEvent",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"components": [
					{
						"internalType": "string",
						"name": "uid",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "title",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "description",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "fromTime",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "toTime",
						"type": "string"
					},
					{
						"internalType": "bool",
						"name": "done",
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
						"internalType": "struct CalendarManager.Sublist[]",
						"name": "list",
						"type": "tuple[]"
					}
				],
				"internalType": "struct CalendarManager.MergedEvent[]",
				"name": "mergedEvent",
				"type": "tuple[]"
			},
			{
				"internalType": "string",
				"name": "username",
				"type": "string"
			}
		],
		"name": "addEvents",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "name",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "username",
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
				"internalType": "struct CalendarManager.Sublist[]",
				"name": "labelList",
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
				"name": "name",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "encryptedkey",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "senderAddress",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "creationDate",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "domain",
				"type": "string"
			}
		],
		"name": "createAccount",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "eventIndex",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "username",
				"type": "string"
			}
		],
		"name": "deleteEvent",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string[]",
				"name": "eventIndex",
				"type": "string[]"
			},
			{
				"components": [
					{
						"internalType": "string",
						"name": "uid",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "title",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "description",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "fromTime",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "toTime",
						"type": "string"
					},
					{
						"internalType": "bool",
						"name": "done",
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
						"internalType": "struct CalendarManager.Sublist[]",
						"name": "list",
						"type": "tuple[]"
					}
				],
				"internalType": "struct CalendarManager.EditEventParams",
				"name": "params",
				"type": "tuple"
			},
			{
				"internalType": "string",
				"name": "username",
				"type": "string"
			}
		],
		"name": "editEvent",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "eventIndex",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "newTitle",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "username",
				"type": "string"
			}
		],
		"name": "editEventChangeTitle",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "eventIndex",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "username",
				"type": "string"
			}
		],
		"name": "editEventMarkAsDone",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "eventIndex",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "username",
				"type": "string"
			}
		],
		"name": "editEventMarkAsNotDone",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "labelIndex",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "name",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "username",
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
				"internalType": "struct CalendarManager.Sublist[]",
				"name": "labelList",
				"type": "tuple[]"
			}
		],
		"name": "editLabel",
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
			}
		],
		"name": "getAllEvents",
		"outputs": [
			{
				"components": [
					{
						"internalType": "string",
						"name": "uid",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "title",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "description",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "fromTime",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "toTime",
						"type": "string"
					},
					{
						"internalType": "bool",
						"name": "done",
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
						"internalType": "struct CalendarManager.Sublist[]",
						"name": "list",
						"type": "tuple[]"
					}
				],
				"internalType": "struct CalendarManager.MergedEvent[]",
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
		"name": "getContacts",
		"outputs": [
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
				"internalType": "struct CalendarManager.Sublist[]",
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
			},
			{
				"internalType": "string",
				"name": "edit",
				"type": "string"
			}
		],
		"name": "getEvents",
		"outputs": [
			{
				"components": [
					{
						"internalType": "string",
						"name": "uid",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "title",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "description",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "fromTime",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "toTime",
						"type": "string"
					},
					{
						"internalType": "bool",
						"name": "done",
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
						"internalType": "struct CalendarManager.Sublist[]",
						"name": "list",
						"type": "tuple[]"
					}
				],
				"internalType": "struct CalendarManager.MergedEvent",
				"name": "",
				"type": "tuple"
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
		"name": "getLabel",
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
						"name": "labelName",
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
						"internalType": "struct CalendarManager.Sublist[]",
						"name": "labelList",
						"type": "tuple[]"
					}
				],
				"internalType": "struct CalendarManager.label[]",
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
		"name": "getPublicKeyOfUser",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
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
				"name": "username",
				"type": "string"
			}
		],
		"name": "getSettings",
		"outputs": [
			{
				"components": [
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
						"internalType": "struct CalendarManager.Sublist[]",
						"name": "contact",
						"type": "tuple[]"
					}
				],
				"internalType": "struct CalendarManager.Setting[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "idCounter",
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
		"inputs": [],
		"name": "initialize",
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
				"name": "username",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "labelIndex",
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
				"internalType": "struct CalendarManager.Sublist[]",
				"name": "labelList",
				"type": "tuple[]"
			}
		],
		"name": "updateLabelAttributes",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string[]",
				"name": "uid",
				"type": "string[]"
			},
			{
				"internalType": "string",
				"name": "username",
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
				"internalType": "struct CalendarManager.Sublist[]",
				"name": "attributes",
				"type": "tuple[]"
			}
		],
		"name": "updateListAttributes",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
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
				"internalType": "struct CalendarManager.Sublist[]",
				"name": "newSublist",
				"type": "tuple[]"
			},
			{
				"internalType": "string",
				"name": "username",
				"type": "string"
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
];

export default calendarsABI;
