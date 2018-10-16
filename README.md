# poc3
In order to start getting UBI a user first needs to show a proof he has a social account.
We integrate with blockstack dapp platform and direct the user to create and login with a blockstack account and then to create the social network proof.
Once the our webapp detects a valid social proof the same validation is done on our server which then whitelists the user in the GoodDollar UBI smart contract.
We also use blockstack dapp private key as the ether wallet of the user, without using metamask.

##Tech Stack
MeteorJS
ReactJS
blockstack
