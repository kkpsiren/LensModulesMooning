import { defaultAbiCoder } from 'ethers/lib/utils';
import { task } from 'hardhat/config';
import {
  LensHub__factory,
  IncrementingFeeCollectModule__factory,
  Currency__factory,
} from '../typechain-types';
import { CreateProfileDataStruct, PostDataStruct } from '../typechain-types/LensHub';
import { BigNumberish } from 'ethers';
import {
  deployContract,
  getAddrs,
  initEnv,
  ProtocolState,
  waitForTx,
  ZERO_ADDRESS,
} from './helpers/utils';

const counter = 1;
task('test-module-increment', 'tests the Increment Fee Collect').setAction(async ({}, hre) => {
  const [governance, , user, user2] = await initEnv(hre);
  const addrs = getAddrs();
  const lensHub = LensHub__factory.connect(addrs['lensHub proxy'], governance);

  await waitForTx(lensHub.setState(ProtocolState.Unpaused));
  await waitForTx(lensHub.whitelistProfileCreator(user.address, true));
  await waitForTx(lensHub.whitelistProfileCreator(user2.address, true));

  const currency = Currency__factory.connect(addrs['currency'], governance);

  // give governance some erc20
  const mintAmount = 100;
  await waitForTx(currency.mint(user2.address, mintAmount));

  // payer setup
  await waitForTx(
    currency.connect(user2).approve(addrs['incrementing fee collect module'], mintAmount)
  );
  console.log('erc20 approval DONE');

  const inputStruct: CreateProfileDataStruct = {
    to: user.address,
    handle: `zer0dotone12${counter}`,
    imageURI:
      'https://ipfs.fleek.co/ipfs/ghostplantghostplantghostplantghostplantghostplantghostplan',
    followModule: ZERO_ADDRESS,
    followModuleInitData: [],
    followNFTURI:
      'https://ipfs.fleek.co/ipfs/ghostplantghostplantghostplantghostplantghostplantghostplan',
  };

  const inputStruct2: CreateProfileDataStruct = {
    to: user.address,
    handle: `zer0dottwo12${counter}`,
    imageURI:
      'https://ipfs.fleek.co/ipfs/ghostplantghostplantghostplantghostplantghostplantghostplan',
    followModule: ZERO_ADDRESS,
    followModuleInitData: [],
    followNFTURI:
      'https://ipfs.fleek.co/ipfs/ghostplantghostplantghostplantghostplantghostplantghostplan',
  };

  await waitForTx(lensHub.connect(user).createProfile(inputStruct));
  await waitForTx(lensHub.connect(user2).createProfile(inputStruct2));

  const incrementingFeeCollectModule = IncrementingFeeCollectModule__factory.connect(
    addrs['incrementing fee collect module'],
    governance
  );

  await waitForTx(lensHub.whitelistCollectModule(addrs['incrementing fee collect module'], true));

  const amount = 10;
  const increasingAmount = 1;
  const followerOnly = false; // need to follow them maybe to collect?
  const referralFee = 1;
  const currencyAddress = addrs['currency'];

  const data = defaultAbiCoder.encode(
    ['uint256', 'uint256', 'address', 'address', 'uint16', 'bool'],
    [amount, increasingAmount, currencyAddress, user.address, referralFee, followerOnly]
  );
  const postData: PostDataStruct = {
    profileId: 1,
    contentURI: 'https://ipfs.io/ipfs/Qmby8QocUU2sPZL46rZeMctAuF5nrCc7eR1PPkooCztWPz',
    collectModule: addrs['incrementing fee collect module'],
    collectModuleInitData: data,
    referenceModule: ZERO_ADDRESS,
    referenceModuleInitData: [],
  };

  await waitForTx(lensHub.connect(user).post(postData));
  console.log('posted');

  const profileId = 0x01;
  const pubId = 0x01;
  const collectData1 = defaultAbiCoder.encode(['address', 'uint256'], [addrs['currency'], amount]);

  await waitForTx(lensHub.connect(user2).collect(profileId, pubId, collectData1));
  console.log('first collect done');
  const collectData2 = defaultAbiCoder.encode(
    ['address', 'uint256'],
    [addrs['currency'], amount + increasingAmount]
  );
  await waitForTx(lensHub.connect(user2).collect(profileId, pubId, collectData2));
  console.log('second collect done');
});
