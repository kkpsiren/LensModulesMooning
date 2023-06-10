import { defaultAbiCoder } from 'ethers/lib/utils';
import { task } from 'hardhat/config';
import {
  FollowNFT__factory,
  LensHub__factory,
  IncrementingFeeCollectModule__factory,
} from '../typechain-types';
import { CreateProfileDataStruct } from '../typechain-types/LensHub';
import {
  deployContract,
  getAddrs,
  initEnv,
  ProtocolState,
  waitForTx,
  ZERO_ADDRESS,
} from './helpers/utils';

task('test-module', 'tests the Increment Fee Collect').setAction(async ({}, hre) => {
  const [governance, , user, user2] = await initEnv(hre);
  const addrs = getAddrs();
  const lensHub = LensHub__factory.connect(addrs['lensHub proxy'], governance);

  await waitForTx(lensHub.setState(ProtocolState.Unpaused));
  await waitForTx(lensHub.whitelistProfileCreator(user.address, true));

  const inputStruct: CreateProfileDataStruct = {
    to: user.address,
    handle: 'zer0dot',
    imageURI:
      'https://ipfs.fleek.co/ipfs/ghostplantghostplantghostplantghostplantghostplantghostplan',
    followModule: ZERO_ADDRESS,
    followModuleInitData: [],
    followNFTURI:
      'https://ipfs.fleek.co/ipfs/ghostplantghostplantghostplantghostplantghostplantghostplan',
  };
  await waitForTx(lensHub.connect(user).createProfile(inputStruct));
  await waitForTx(lensHub.connect(user2).createProfile(inputStruct));

  const incrementingFee = LensHub__factory.connect(
    addrs['incrementing fee collect module'],
    governance
  );

  await waitForTx(lensHub.whitelistFollowModule(incrementingFee.address, true));

  //await waitForTx(lensHub.connect(user).setFollowModule(1, secretCodeFollowModule.address, data));
  //const badData = defaultAbiCoder.encode(['uint256'], ['1337']);
  //const data = defaultAbiCoder.encode(['uint256'], ['42069']);
  //
  //await waitForTx(lensHub.connect(user).follow([1], [badData]));
  //  //try {
  //  //} catch (e) {
  //
  //  //  console.log(`Expected failure occurred! Error: ${e}`);
  //  //}
  //  //await waitForTx(lensHub.connect(user).follow([1], [data]));
  //
  //  //const followNFTAddr = await lensHub.getFollowNFT(1);
  //  //const followNFT = FollowNFT__factory.connect(followNFTAddr, user);
  //
  //  //const totalSupply = await followNFT.totalSupply();
  //  //const ownerOf = await followNFT.ownerOf(1);
  //
  //  console.log(`Follow NFT total supply (should be 1): ${totalSupply}`);
  //  console.log(
  //    `Follow NFT owner of ID 1: ${ownerOf}, user address (should be the same): ${user.address}`
  //  );
});
