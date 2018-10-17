# poc3
- In order to start getting UBI a user first needs to show a proof he has a social account.
- We integrate with blockstack dapp platform and direct the user to create and login with a blockstack account and then to create the social network proof.
- Once the our webapp detects a valid social proof the same validation is done on our server which then whitelists the user in the GoodDollar UBI smart contract.
- We also use blockstack dapp private key as the ether wallet of the user, without using metamask.

## Getting Started
These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites
Install Meteor.js:
https://www.meteor.com/install


### Deployment of the contracts:
This installation will also deploy your contracts to the network you choose (Ganache, Ropsten, etc.). 
1. Get POC2 project from: https://github.com/GoodDollar/poc2

Choose Step 2 or step 3 according to the chosen network:
2. To use with Ropsten / Hosted Blockchain:

⋅⋅⋅2.1.	Create “secrets.json” file similar to “secrets-example.json”, use your mnemonic & ropsten API.
⋅⋅⋅2.2. Install:
```
npm install
```

⋅⋅⋅2.3. Deploy the contracts:
```
truffle migrate --network ropsteninfura
```
3. To use with Ganache:
⋅⋅⋅3.1	Verify Ganache is up and running.
⋅⋅⋅3.2.	In “truffle.js”, Modify “from” key under “development” and “test” networks according to your first address ganache UI.
⋅⋅⋅3.3. Install:
```
npm install
```

⋅⋅⋅3.4. Deploy the contracts:
```
truffle migrate --network development
```

### POC3 Installation
This installation assumes your contracts were deployed to the network you chose on the previous steps.
1. From POC2 project, ,copy all json files under /build/contracts/ to /imports/contracts/.
2.	Create “secrets.json” file similar to “secrets-example.json”, use your mnemonic & ropsten API.
  ⋅⋅⋅2.a.	“Addr” should be the same address that deployed the contracts
  ⋅⋅⋅2.b.	“pkey”: the above account private key (Verify your key has “0x” prefix, otherwise please add it)
3.	Modify settings.json set “network_id” as follows:
  ⋅⋅⋅a.	6000 (ganache), or  
  ⋅⋅⋅b.	3 (ropsten) // or any other hosted blockchain provider id
4.	Install:
```
npm install
```
### POC3 - Running the project
```
Npm run start
```
Browse: http://localhost:3000/

## Tech Stack
- MeteorJS
- ReactJS
- blockstack
